const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { AsyncLocalStorage } = require('async_hooks');
const PORT = process.env.PORT || 3000;
const RESEND_API_URL = String(process.env.RESEND_API_URL || 'https://api.resend.com/emails').trim();
const RESEND_REQUEST_TIMEOUT_MS = Number(process.env.RESEND_REQUEST_TIMEOUT_MS || 12000);
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  || process.env.DATA_DIR
  || path.join(process.cwd(), 'data');
const DATA_PATH = process.env.DATA_PATH || path.join(DATA_DIR, 'credistart-data.json');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BODY_SIZE = 1e6;
const VERIFICATION_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;
const AUDIT_LOG_LIMIT = 5000;
const DEV_MODE = process.env.NODE_ENV !== 'production';
const TEMP_BYPASS_TOKEN = '-1';
const MAX_LOGIN_FAILURES = 8;
const MAX_VERIFICATION_ATTEMPTS = 6;
const MAX_RESET_ATTEMPTS = 6;
const VERIFICATION_SEND_COOLDOWN_STEPS_MS = [0, 0, 60 * 1000, 3 * 60 * 1000, 6 * 60 * 1000, 10 * 60 * 1000];
const MAX_RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_RULES = {
  register_start: { windowMs: 10 * 60 * 1000, max: 6, message: 'Too many signup attempts. Please wait a few minutes and try again.' },
  register_resend: { windowMs: 10 * 60 * 1000, max: 5, message: 'Too many resend requests. Please wait a few minutes before requesting another code.' },
  register_verify: { windowMs: 10 * 60 * 1000, max: 12, message: 'Too many verification attempts. Please wait a few minutes and try again.' },
  login: { windowMs: 10 * 60 * 1000, max: 10, message: 'Too many login attempts. Please wait a few minutes and try again.' },
  password_reset_request: { windowMs: 15 * 60 * 1000, max: 5, message: 'Too many password reset requests. Please wait before trying again.' },
  password_reset_confirm: { windowMs: 15 * 60 * 1000, max: 10, message: 'Too many password reset attempts. Please wait before trying again.' },
  class_join: { windowMs: 10 * 60 * 1000, max: 8, message: 'Too many class join attempts. Please wait a few minutes before trying again.' }
};
const LOGIN_FAILURE_RESET_MS = 2 * 60 * 60 * 1000;
const LOGIN_FAILURE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const SYSADMIN_EMAIL = 'sys.admin@credistart.com';
const SYSADMIN_NAME = 'SYSADMIN';
const SYSADMIN_PASSWORD_KEY = 73;
const SYSADMIN_PASSWORD_OBFUSCATED = [25,63,127,31,120,121,103,17,120,6];

const ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS || process.env.INITIAL_ADMIN_EMAIL || '')
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
);
const MODERATOR_EMAILS = new Set(
  String(process.env.MODERATOR_EMAILS || '')
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
);

const auditContextStorage = new AsyncLocalStorage();

function buildAuditContextFromRequest(req) {
  const userAgent = sanitizeMetaValue(req.headers['user-agent'] || '', 240);
  const referrer = sanitizeMetaValue(req.headers['referer'] || req.headers['referrer'] || '', 240);
  return {
    ip: sanitizeMetaValue(getRequestIp(req) || '', 120),
    deviceType: userAgent.includes('Mobile') ? 'mobile' : userAgent.includes('Tablet') ? 'tablet' : 'desktop',
    userAgent,
    referrer
  };
}

function createEmptyStore() {
  return {
    nextUserId: 1,
    users: [],
    progress: [],
    sessions: {},
    pendingVerifications: {},
    passwordResets: {},
    loginSecurity: {},
    rateLimits: {},
    auditLog: []
  };
}

let store = createEmptyStore();

function createDefaultAnalytics() {
  return {
    total_active_ms: 0,
    page_time_ms: {},
    page_views: {},
    link_clicks: {},
    last_seen_at: null,
    last_page: null,
    logins: 0,
    sessions: 0,
    most_recent_events: []
  };
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function copyIfMissing(fromPath, toPath, defaultValue) {
  if (fs.existsSync(toPath)) return;
  if (fromPath && path.resolve(fromPath) !== path.resolve(toPath) && fs.existsSync(fromPath)) {
    fs.copyFileSync(fromPath, toPath);
    console.log(`Migrated ${fromPath} -> ${toPath}`);
    return;
  }
  atomicWriteJson(toPath, defaultValue);
  console.log(`Created new data file: ${toPath}`);
}

function bootstrapPersistentFiles() {
  ensureDataDir();
  const legacyCandidates = [
    path.join(process.cwd(), 'credistart-data.json'),
    path.join(__dirname, 'credistart-data.json'),
    path.join(process.cwd(), 'data', 'credistart-data.json')
  ];
  const legacyPath = legacyCandidates.find(candidate => path.resolve(candidate) !== path.resolve(DATA_PATH) && fs.existsSync(candidate));
  copyIfMissing(legacyPath || null, DATA_PATH, createEmptyStore());
}

function atomicWriteJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

function normalizeRole(role) {
  return ['student', 'moderator', 'admin', 'teacher', 'class_assistant'].includes(role) ? role : 'student';
}

function sanitizePlainText(value, maxLength = 160, options = {}) {
  const allowNewlines = Boolean(options.allowNewlines);
  const preserveCase = Boolean(options.preserveCase);
  const fallback = options.fallback || '';
  let output = String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, ' ');
  output = allowNewlines
    ? output.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ')
    : output.replace(/\s+/g, ' ');
  output = output.trim();
  if (!preserveCase) output = output.replace(/\s+/g, ' ');
  if (maxLength > 0) output = output.slice(0, maxLength);
  return output || fallback;
}

function sanitizeName(value) {
  return sanitizePlainText(value, 80, { preserveCase: true })
    .replace(/[^\p{L}\p{N}' .\-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function sanitizeReason(value, maxLength = 240) {
  return sanitizePlainText(value, maxLength, { preserveCase: true });
}

function sanitizeJoinCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
}

function sanitizeMetaValue(value, maxLength = 160) {
  return sanitizePlainText(value, maxLength, { preserveCase: true });
}

function getRequestIp(req) {
  return req.headers['x-forwarded-for']
    ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
    : (req.socket?.remoteAddress || '');
}

function getRateLimitKey(req, keyParts = []) {
  const ip = sanitizeMetaValue(getRequestIp(req) || 'unknown-ip', 120) || 'unknown-ip';
  const extras = (Array.isArray(keyParts) ? keyParts : [keyParts])
    .map(part => sanitizeMetaValue(String(part || '').toLowerCase(), 120))
    .filter(Boolean);
  return [ip, ...extras].join('|');
}

function consumeRateLimit(action, req, keyParts = []) {
  const rule = RATE_LIMIT_RULES[action];
  if (!rule) return { allowed: true, remaining: Infinity, retryAfterMs: 0 };
  cleanupExpiringRecords();
  store.rateLimits = store.rateLimits && typeof store.rateLimits === 'object' ? store.rateLimits : {};
  store.rateLimits[action] = store.rateLimits[action] && typeof store.rateLimits[action] === 'object' ? store.rateLimits[action] : {};
  const key = getRateLimitKey(req, keyParts);
  const now = Date.now();
  const existing = store.rateLimits[action][key] && typeof store.rateLimits[action][key] === 'object' ? store.rateLimits[action][key] : null;
  const windowStart = existing?.windowStartedAt ? new Date(existing.windowStartedAt).getTime() : 0;
  const withinWindow = windowStart && now - windowStart < rule.windowMs;
  const record = withinWindow ? existing : { count: 0, windowStartedAt: new Date(now).toISOString(), lastHitAt: new Date(now).toISOString() };
  record.count = Number(record.count || 0) + 1;
  record.lastHitAt = new Date(now).toISOString();
  store.rateLimits[action][key] = record;
  const retryAfterMs = Math.max(0, rule.windowMs - (now - new Date(record.windowStartedAt).getTime()));
  const allowed = record.count <= rule.max;
  if (!allowed) saveStore();
  return { allowed, remaining: Math.max(0, rule.max - record.count), retryAfterMs, rule, key, count: record.count };
}

function requireRateLimit(req, res, action, keyParts = []) {
  const result = consumeRateLimit(action, req, keyParts);
  if (!result.allowed) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
    sendJSON(req, res, 429, {
      error: result.rule.message,
      retryAfterSeconds: Math.max(1, Math.ceil(result.retryAfterMs / 1000))
    });
    return null;
  }
  return result;
}

function getTeacherByIdFromState(state, id) {
  return (state.users || []).find(user => user.id === Number(id) && user.role === 'teacher') || null;
}

function clearRelationshipFields(user, options = {}) {
  user.teacher_id = null;
  user.class_group_id = null;
  user.class_assistant_for = null;
  if (options.markLeft !== false) user.class_left_at = options.leftAt || user.class_left_at || new Date().toISOString();
  if (user.role === 'class_assistant') user.role = 'student';
}

function enforceRelationshipIntegrityOnStore(targetStore) {
  const state = targetStore && typeof targetStore === 'object' ? targetStore : store;
  if (!Array.isArray(state.users)) return;
  for (const user of state.users) {
    user.class_history = Array.isArray(user.class_history) ? user.class_history.slice(-50) : [];
    if (user.id && Number(user.teacher_id || 0) === Number(user.id)) clearRelationshipFields(user, { markLeft: false });
    if (['admin', 'moderator', 'teacher'].includes(user.role)) {
      user.teacher_id = null;
      user.class_group_id = null;
      user.class_assistant_for = null;
    }
    if (user.role === 'teacher') {
      user.class_assistant_for = null;
      user.teacher_id = null;
      user.class_group_id = null;
      continue;
    }
    const teacher = user.teacher_id ? getTeacherByIdFromState(state, user.teacher_id) : null;
    if (user.teacher_id && !teacher) clearRelationshipFields(user, { markLeft: false });
    const activeTeacher = user.teacher_id ? getTeacherByIdFromState(state, user.teacher_id) : null;
    if (user.class_group_id && (!activeTeacher || !Array.isArray(activeTeacher.classroom_groups) || !activeTeacher.classroom_groups.some(group => String(group.id || '') === String(user.class_group_id || '')))) {
      user.class_group_id = null;
    }
    if (user.role === 'class_assistant') {
      if (!activeTeacher) {
        clearRelationshipFields(user, { markLeft: false });
      } else {
        user.class_assistant_for = activeTeacher.id;
      }
    } else {
      user.class_assistant_for = null;
    }
  }
}

function validationFailure(message, details = {}) {
  const error = new Error(message);
  error.statusCode = 400;
  error.details = details;
  return error;
}

function normalizeAnalytics(raw) {
  const base = createDefaultAnalytics();
  const src = raw && typeof raw === 'object' ? raw : {};
  base.total_active_ms = Number.isFinite(src.total_active_ms) ? Math.max(0, Math.round(src.total_active_ms)) : 0;
  base.page_time_ms = src.page_time_ms && typeof src.page_time_ms === 'object' ? src.page_time_ms : {};
  base.page_views = src.page_views && typeof src.page_views === 'object' ? src.page_views : {};
  base.link_clicks = src.link_clicks && typeof src.link_clicks === 'object' ? src.link_clicks : {};
  base.last_seen_at = src.last_seen_at || null;
  base.last_page = src.last_page || null;
  base.logins = Number.isFinite(src.logins) ? src.logins : 0;
  base.sessions = Number.isFinite(src.sessions) ? src.sessions : 0;
  base.most_recent_events = Array.isArray(src.most_recent_events) ? src.most_recent_events.slice(-50) : [];
  return base;
}

function normalizeClassroomGroups(raw) {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set();
  return raw
    .map((group, index) => {
      const safe = group && typeof group === 'object' ? group : {};
      const id = String(safe.id || `group-${index + 1}`).trim();
      if (!id || seenIds.has(id)) return null;
      seenIds.add(id);
      const name = sanitizeClassroomLabel(safe.name || '', '');
      const code = sanitizeJoinCode(safe.code || '');
      return {
        id,
        name,
        code,
        created_at: safe.created_at || new Date().toISOString()
      };
    })
    .filter(group => group && group.name)
    .slice(0, 24);
}

function normalizeStore(data) {
  const base = createEmptyStore();
  const normalized = data && typeof data === 'object' ? data : {};

  base.nextUserId = Number.isInteger(normalized.nextUserId) && normalized.nextUserId > 0
    ? normalized.nextUserId
    : 1;

  base.users = Array.isArray(normalized.users)
    ? normalized.users.map(user => ({
        id: Number(user.id),
        email: String(user.email || '').toLowerCase().trim(),
        password_hash: String(user.password_hash || ''),
        salt: String(user.salt || ''),
        name: String(user.name || '').trim(),
        created_at: user.created_at || new Date().toISOString(),
        role: normalizeRole(user.role),
        email_verified: user.email_verified !== false,
        verified_at: user.verified_at || user.created_at || null,
        must_reset_password: Boolean(user.must_reset_password),
        force_reset_reason: String(user.force_reset_reason || ''),
        created_meta: user.created_meta && typeof user.created_meta === 'object' ? user.created_meta : {},
        teacher_id: Number.isInteger(Number(user.teacher_id)) && Number(user.teacher_id) > 0 ? Number(user.teacher_id) : null,
        teacher_code: String(user.teacher_code || '').trim(),
        class_name: String(user.class_name || '').trim(),
        classroom_groups: normalizeClassroomGroups(user.classroom_groups),
        class_group_id: String(user.class_group_id || '').trim() || null,
        class_assistant_for: Number.isInteger(Number(user.class_assistant_for)) && Number(user.class_assistant_for) > 0 ? Number(user.class_assistant_for) : null,
        class_joined_at: user.class_joined_at || null,
        class_left_at: user.class_left_at || null,
        class_history: Array.isArray(user.class_history) ? user.class_history.slice(-50) : [],
        last_login_at: user.last_login_at || null,
        analytics: normalizeAnalytics(user.analytics)
      }))
        .filter(user => user.id > 0 && user.email && user.password_hash && user.salt && user.name)
    : [];

  base.progress = Array.isArray(normalized.progress)
    ? normalized.progress.map(progress => ({
        user_id: Number(progress.user_id),
        completed_modules: Array.isArray(progress.completed_modules) ? progress.completed_modules.map(Number).filter(n => n >= 1 && n <= 6) : [],
        quiz_scores: progress.quiz_scores && typeof progress.quiz_scores === 'object' ? progress.quiz_scores : {},
        quiz_answers: progress.quiz_answers && typeof progress.quiz_answers === 'object' ? progress.quiz_answers : {},
        quiz_selections: progress.quiz_selections && typeof progress.quiz_selections === 'object' ? progress.quiz_selections : {},
        quiz_metrics: progress.quiz_metrics && typeof progress.quiz_metrics === 'object' ? progress.quiz_metrics : {},
        credit_scores: Array.isArray(progress.credit_scores) ? progress.credit_scores : [],
        updated_at: progress.updated_at || null
      })).filter(progress => progress.user_id > 0)
    : [];

  base.sessions = normalized.sessions && typeof normalized.sessions === 'object' ? normalized.sessions : {};
  base.pendingVerifications = normalized.pendingVerifications && typeof normalized.pendingVerifications === 'object' ? normalized.pendingVerifications : {};
  base.passwordResets = normalized.passwordResets && typeof normalized.passwordResets === 'object' ? normalized.passwordResets : {};
  base.loginSecurity = normalized.loginSecurity && typeof normalized.loginSecurity === 'object' ? normalized.loginSecurity : {};
  base.rateLimits = normalized.rateLimits && typeof normalized.rateLimits === 'object' ? normalized.rateLimits : {};
  base.auditLog = Array.isArray(normalized.auditLog) ? normalized.auditLog.slice(-AUDIT_LOG_LIMIT) : [];

  enforceRelationshipIntegrityOnStore(base);

  const maxUserId = base.users.reduce((max, user) => Math.max(max, user.id), 0);
  if (base.nextUserId <= maxUserId) base.nextUserId = maxUserId + 1;
  return base;
}

function loadStore() {
  ensureDataDir();
  if (!fs.existsSync(DATA_PATH)) {
    store = createEmptyStore();
    atomicWriteJson(DATA_PATH, store);
    return;
  }

  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    store = normalizeStore(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to read data store, creating a fresh one:', error.message);
    const backupPath = `${DATA_PATH}.corrupt-${Date.now()}`;
    try {
      fs.copyFileSync(DATA_PATH, backupPath);
      console.error(`Backed up unreadable data file to ${backupPath}`);
    } catch (_) {}
    store = createEmptyStore();
    atomicWriteJson(DATA_PATH, store);
  }
}

function saveStore() {
  ensureDataDir();
  enforceRelationshipIntegrityOnStore(store);
  atomicWriteJson(DATA_PATH, store);
}

function cleanupExpiredSessions() {
  const now = Date.now();
  let changed = false;
  for (const [sessionId, session] of Object.entries(store.sessions)) {
    if (!session || !session.expiresAt || session.expiresAt <= now) {
      delete store.sessions[sessionId];
      changed = true;
    }
  }
  if (changed) saveStore();
}

function cleanupExpiringRecords() {
  const now = Date.now();
  let changed = false;
  for (const [email, pending] of Object.entries(store.pendingVerifications)) {
    const expired = !pending || !pending.expires_at || new Date(pending.expires_at).getTime() <= now;
    const exceededAttempts = Number(pending?.attempts || 0) >= MAX_VERIFICATION_ATTEMPTS;
    const consumed = Boolean(pending?.used_at);
    if (expired || exceededAttempts || consumed) {
      delete store.pendingVerifications[email];
      changed = true;
    }
  }
  for (const [email, reset] of Object.entries(store.passwordResets)) {
    const expired = !reset || !reset.expires_at || new Date(reset.expires_at).getTime() <= now;
    const exceededAttempts = Number(reset?.attempts || 0) >= MAX_RESET_ATTEMPTS;
    const consumed = Boolean(reset?.used_at);
    if (expired || exceededAttempts || consumed) {
      delete store.passwordResets[email];
      changed = true;
    }
  }
  for (const [key, record] of Object.entries(store.loginSecurity || {})) {
    const lastTime = record?.lastFailedAt ? new Date(record.lastFailedAt).getTime() : 0;
    if (!record || (lastTime && now - lastTime > LOGIN_FAILURE_RETENTION_MS && !record.lockedAt)) {
      delete store.loginSecurity[key];
      changed = true;
    }
  }
  for (const [action, records] of Object.entries(store.rateLimits || {})) {
    if (!records || typeof records !== 'object') {
      delete store.rateLimits[action];
      changed = true;
      continue;
    }
    for (const [key, record] of Object.entries(records)) {
      const lastHitAt = record?.lastHitAt ? new Date(record.lastHitAt).getTime() : 0;
      if (!record || (lastHitAt && now - lastHitAt > MAX_RATE_LIMIT_RETENTION_MS)) {
        delete records[key];
        changed = true;
      }
    }
    if (!Object.keys(records).length) {
      delete store.rateLimits[action];
      changed = true;
    }
  }
  if (changed) saveStore();
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createSession(userId) {
  cleanupExpiredSessions();
  const sessionId = crypto.randomBytes(32).toString('hex');
  store.sessions[sessionId] = {
    userId,
    created: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  saveStore();
  return sessionId;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    const key = rawKey ? rawKey.trim() : '';
    if (!key) continue;
    cookies[key] = rest.join('=').trim();
  }
  return cookies;
}

function getSession(req) {
  cleanupExpiredSessions();
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.session;
  if (!sessionId) return null;
  const session = store.sessions[sessionId];
  if (!session) return null;
  return { sessionId, ...session };
}

function destroySession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.session;
  if (sessionId && store.sessions[sessionId]) {
    delete store.sessions[sessionId];
    saveStore();
  }
}

function isSecureRequest(req) {
  if (req.socket && req.socket.encrypted) return true;
  const forwardedProto = req.headers['x-forwarded-proto'];
  return typeof forwardedProto === 'string' && forwardedProto.split(',')[0].trim() === 'https';
}

function buildCookie(req, sessionId) {
  const parts = [
    `session=${sessionId}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

function clearCookie(req) {
  const parts = ['session=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isSecureRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

function getCorsHeaders(req) {
  const origin = req.headers.origin;
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin'
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });

    req.on('error', reject);
  });
}

function sendJSON(req, res, status, data, cookie) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...getCorsHeaders(req)
  };
  if (cookie) headers['Set-Cookie'] = cookie;
  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

function sendText(req, res, status, content, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    ...getCorsHeaders(req),
    ...extraHeaders
  });
  res.end(content);
}

function sendFile(req, res, filePath, contentType) {
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      ...getCorsHeaders(req)
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  const value = normalizeEmail(email);
  if (!value || value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function normalizeDateOfBirthInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
  const date = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  const check = date.toISOString().slice(0, 10);
  if (check !== raw) return '';
  const today = new Date();
  const todayIso = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString().slice(0, 10);
  if (raw > todayIso) return '';
  return raw;
}

function hasCommonWeakPasswordPattern(value) {
  const simplified = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!simplified) return false;
  const weakFragments = ['password', 'passw0rd', 'qwerty', 'letmein', 'welcome', 'admin', 'default', 'abc123', '123456', '1234567', '12345678', '111111', 'dragon', 'monkey', 'credistart'];
  if (weakFragments.some(fragment => simplified.includes(fragment))) return true;
  if (/(0123|1234|2345|3456|4567|5678|6789|7890|9876|8765|7654|6543|5432|4321)/.test(simplified)) return true;
  if (/([a-z0-9])\1{3,}/.test(simplified)) return true;
  return false;
}

function getPasswordPolicy(password, context = {}) {
  const value = String(password || '');
  const bypass = value === TEMP_BYPASS_TOKEN;
  const lowered = value.toLowerCase();
  const emailLocalPart = normalizeEmail(context.email || '').split('@')[0] || '';
  const normalizedName = String(context.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const nameParts = normalizedName ? normalizedName.split(/\s+/).filter(part => part.length >= 3) : [];
  const policy = {
    bypass,
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9\s]/.test(value),
    noSpaces: !/\s/.test(value),
    notEmailPart: emailLocalPart ? !lowered.includes(emailLocalPart.toLowerCase()) : true,
    notNamePart: nameParts.length ? !nameParts.some(part => lowered.includes(part)) : true,
    notCommon: !hasCommonWeakPasswordPattern(value)
  };
  policy.valid = bypass || (policy.length && policy.upper && policy.lower && policy.number && policy.symbol && policy.noSpaces && policy.notEmailPart && policy.notNamePart && policy.notCommon);
  return policy;
}

function isAllowedPassword(password, context = {}) {
  return getPasswordPolicy(password, context).valid;
}

function getPasswordValidationMessage(password, context = {}) {
  const policy = getPasswordPolicy(password, context);
  if (policy.valid) return 'Password accepted.';
  if (policy.bypass) return 'Password accepted.';
  if (!policy.length) return 'Password must be at least 8 characters long.';
  if (!policy.upper || !policy.lower || !policy.number || !policy.symbol) return 'Password must include an uppercase letter, a lowercase letter, a number, and a special character.';
  if (!policy.noSpaces) return 'Password cannot contain spaces.';
  if (!policy.notEmailPart || !policy.notNamePart) return 'Password cannot contain obvious parts of your name or email address.';
  if (!policy.notCommon) return 'Password is too easy to guess. Avoid words like password, simple number runs, or other common patterns.';
  return 'Password does not meet the server security requirements.';
}


function getVerificationSendCooldownMs(sendCount) {
  const index = Math.max(0, Math.min(VERIFICATION_SEND_COOLDOWN_STEPS_MS.length - 1, Number(sendCount || 0)));
  return VERIFICATION_SEND_COOLDOWN_STEPS_MS[index] || 0;
}

function getVerificationSendWindow(record) {
  const sentCount = Number(record?.send_count || 0);
  const lastSentAtMs = record?.last_sent_at ? new Date(record.last_sent_at).getTime() : 0;
  const cooldownMs = getVerificationSendCooldownMs(sentCount);
  const nextAllowedAtMs = lastSentAtMs && cooldownMs ? lastSentAtMs + cooldownMs : 0;
  return {
    sentCount,
    cooldownMs,
    lastSentAtMs,
    nextAllowedAtMs,
    remainingMs: nextAllowedAtMs ? Math.max(0, nextAllowedAtMs - Date.now()) : 0
  };
}

function requireVerificationSendWindow(req, res, record) {
  const windowInfo = getVerificationSendWindow(record);
  if (windowInfo.remainingMs > 0) {
    const retryAfterSeconds = Math.max(1, Math.ceil(windowInfo.remainingMs / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    sendJSON(req, res, 429, {
      error: `Please wait ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'} before requesting another code.`,
      retryAfterSeconds
    });
    return null;
  }
  return windowInfo;
}

function noteVerificationCodeIssued(record) {
  const nextCount = Number(record?.send_count || 0) + 1;
  record.send_count = nextCount;
  record.resend_count = Math.max(0, nextCount - 1);
  record.last_sent_at = new Date().toISOString();
}

function sanitizeProgressCollection(value, depth = 0) {
  if (depth > 3) return null;
  if (Array.isArray(value)) {
    return value.slice(0, 100).map(item => sanitizeProgressCollection(item, depth + 1)).filter(item => item !== null);
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [rawKey, rawVal] of Object.entries(value).slice(0, 100)) {
      const key = sanitizePlainText(rawKey, 80, { preserveCase: true });
      if (!key) continue;
      if (typeof rawVal === 'number') out[key] = Number.isFinite(rawVal) ? rawVal : 0;
      else if (typeof rawVal === 'boolean') out[key] = rawVal;
      else if (typeof rawVal === 'string') out[key] = sanitizePlainText(rawVal, 240, { preserveCase: true });
      else {
        const nested = sanitizeProgressCollection(rawVal, depth + 1);
        if (nested !== null) out[key] = nested;
      }
    }
    return out;
  }
  if (typeof value === 'string') return sanitizePlainText(value, 240, { preserveCase: true });
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean') return value;
  return null;
}

function sanitizeCreditScores(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 120).map(entry => {
    const safe = entry && typeof entry === 'object' ? entry : {};
    const scoreValue = Math.max(300, Math.min(850, Number.parseInt(safe.val, 10) || 0));
    const dateValue = normalizeDateOfBirthInput(String(safe.date || '').trim()) || '';
    return {
      val: scoreValue,
      date: dateValue,
      note: sanitizePlainText(safe.note || '', 160, { preserveCase: true })
    };
  }).filter(entry => entry.val && entry.date);
}

function getUserByEmail(email) {
  return store.users.find(user => user.email === normalizeEmail(email)) || null;
}

function getUserById(id) {
  return store.users.find(user => user.id === Number(id)) || null;
}

function getProgressByUserId(userId) {
  return store.progress.find(progress => progress.user_id === Number(userId)) || null;
}

function ensureProgress(userId) {
  let progress = getProgressByUserId(userId);
  if (!progress) {
    progress = {
      user_id: Number(userId),
      completed_modules: [],
      quiz_scores: {},
      quiz_answers: {},
      quiz_selections: {},
      quiz_metrics: {},
      credit_scores: [],
      updated_at: new Date().toISOString()
    };
    store.progress.push(progress);
    saveStore();
  }
  return progress;
}

function pickInitialRole(email) {
  const normalized = normalizeEmail(email);
  if (normalized === SYSADMIN_EMAIL) return 'admin';
  if (ADMIN_EMAILS.has(normalized)) return 'admin';
  if (MODERATOR_EMAILS.has(normalized)) return 'moderator';
  return 'student';
}

function decodeObfuscatedPassword(values, key) {
  return String.fromCharCode(...values.map(value => Number(value) ^ key));
}

function getSysadminPassword() {
  return decodeObfuscatedPassword(SYSADMIN_PASSWORD_OBFUSCATED, SYSADMIN_PASSWORD_KEY);
}

function isProtectedSystemAccount(user) {
  return Boolean(user) && normalizeEmail(user.email) === SYSADMIN_EMAIL;
}


function isClassCodeInUse(code) {
  const normalized = sanitizeJoinCode(code);
  if (!normalized) return false;
  return store.users.some(user => {
    if (String(user.teacher_code || '').toUpperCase() === normalized) return true;
    return Array.isArray(user.classroom_groups) && user.classroom_groups.some(group => String(group.code || '').toUpperCase() === normalized);
  });
}

function generateTeacherCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: 8 }, (_, idx) => (idx === 4 ? '-' : alphabet[Math.floor(Math.random() * alphabet.length)])).join('');
  } while (isClassCodeInUse(code));
  return code;
}

function getLastName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : 'Teacher';
}

function defaultClassNameForTeacher(user) {
  const lastName = getLastName(user?.name || '');
  return /s$/i.test(lastName) ? `${lastName}' Class` : `${lastName}'s Class`;
}

function getTeacherBaseClassName(user) {
  if (!user) return 'Class';
  const stored = String(user.class_name || '').trim();
  const legacyDefault = `${String(user.name || '').trim()} Class`.trim();
  if (!stored || stored === legacyDefault) return defaultClassNameForTeacher(user);
  return stored;
}

function findTeacherGroup(teacherUser, groupId) {
  if (!teacherUser || !groupId || !Array.isArray(teacherUser.classroom_groups)) return null;
  return teacherUser.classroom_groups.find(group => String(group.id || '') === String(groupId || '')) || null;
}

function getClassDisplayName(teacherUser, groupId = null) {
  if (!teacherUser) return 'Class';
  const baseName = getTeacherBaseClassName(teacherUser);
  const group = findTeacherGroup(teacherUser, groupId);
  return group?.name ? `${baseName} - ${group.name}` : baseName;
}

function getJoinTargetByCode(code) {
  const normalized = sanitizeJoinCode(code);
  if (!normalized) return null;
  for (const user of store.users) {
    if (user.role !== 'teacher') continue;
    if (String(user.teacher_code || '').toUpperCase() === normalized) {
      return { teacher: user, group: null };
    }
    const group = Array.isArray(user.classroom_groups)
      ? user.classroom_groups.find(item => String(item.code || '').toUpperCase() === normalized)
      : null;
    if (group) return { teacher: user, group };
  }
  return null;
}

function ensureTeacherFields(user) {
  if (!user) return;
  if (user.role === 'teacher') {
    if (!user.teacher_code) user.teacher_code = generateTeacherCode();
    user.class_name = getTeacherBaseClassName(user);
    user.classroom_groups = normalizeClassroomGroups(user.classroom_groups);
    user.classroom_groups = user.classroom_groups.map((group, index) => ({
      id: group.id || `group-${index + 1}`,
      name: String(group.name || `Group ${index + 1}`).trim().slice(0, 80),
      code: String(group.code || '').trim().toUpperCase() || generateTeacherCode(),
      created_at: group.created_at || new Date().toISOString()
    }));
    user.class_assistant_for = null;
  } else if (user.role !== 'class_assistant') {
    user.teacher_code = '';
    user.class_name = '';
    user.classroom_groups = [];
    user.class_assistant_for = null;
  } else {
    user.teacher_code = '';
    user.class_name = '';
    user.classroom_groups = [];
  }
  if (user.role !== 'teacher' && !user.teacher_id) user.class_group_id = null;
}

function getTeacherById(id) {

  return store.users.find(user => user.id === Number(id) && user.role === 'teacher') || null;
}

function getTeacherByCode(code) {
  return getJoinTargetByCode(code)?.teacher || null;
}

function unassignStudentsFromTeacher(teacherId, actorUser = null, reason = 'teacher_unassigned') {
  const teacher = getTeacherById(teacherId) || store.users.find(user => user.id === Number(teacherId)) || null;
  let changed = false;
  for (const user of store.users) {
    const linked = Number(user.teacher_id || 0) === Number(teacherId) || Number(user.class_assistant_for || 0) === Number(teacherId);
    if (!linked) continue;
    user.class_history = Array.isArray(user.class_history) ? user.class_history : [];
    user.class_history.push({
      at: new Date().toISOString(),
      action: 'unassigned',
      teacher_id: Number(teacherId),
      teacher_email: teacher?.email || '',
      teacher_name: teacher?.name || '',
      reason
    });
    user.teacher_id = null;
    user.class_group_id = null;
    user.class_assistant_for = null;
    user.class_left_at = new Date().toISOString();
    if (user.role === 'class_assistant') user.role = 'student';
    changed = true;
    recordAudit('class_unassign', actorUser, user.id, { teacherId: Number(teacherId), reason });
  }
  return changed;
}


function assignStudentToTeacher(studentUser, teacherUser, actorUser = null, source = 'join_code', options = {}) {
  if (!studentUser || !teacherUser || teacherUser.role !== 'teacher') return false;
  if (['admin', 'moderator', 'teacher'].includes(studentUser.role)) return false;
  if (Number(studentUser.id || 0) === Number(teacherUser.id || 0)) return false;
  if (studentUser.teacher_id && Number(studentUser.teacher_id) !== teacherUser.id && options.allowTransfer !== true) return false;
  const now = new Date().toISOString();
  const groupId = options.groupId && findTeacherGroup(teacherUser, options.groupId) ? String(options.groupId) : null;
  const group = findTeacherGroup(teacherUser, groupId);
  studentUser.class_history = Array.isArray(studentUser.class_history) ? studentUser.class_history : [];
  if (studentUser.teacher_id && Number(studentUser.teacher_id) !== teacherUser.id) {
    const priorTeacher = getTeacherById(studentUser.teacher_id);
    studentUser.class_history.push({
      at: now,
      action: 'left',
      teacher_id: Number(studentUser.teacher_id),
      teacher_email: priorTeacher?.email || '',
      teacher_name: priorTeacher?.name || '',
      class_name: priorTeacher ? getClassDisplayName(priorTeacher, studentUser.class_group_id || null) : '',
      group_id: studentUser.class_group_id || null,
      reason: 'reassigned'
    });
  }
  studentUser.teacher_id = teacherUser.id;
  studentUser.class_group_id = groupId;
  studentUser.class_assistant_for = studentUser.role === 'class_assistant' ? teacherUser.id : null;
  studentUser.class_joined_at = now;
  studentUser.class_left_at = null;
  studentUser.class_history.push({
    at: now,
    action: 'joined',
    teacher_id: teacherUser.id,
    teacher_email: teacherUser.email,
    teacher_name: teacherUser.name,
    class_name: getClassDisplayName(teacherUser, groupId),
    group_id: groupId,
    group_name: group?.name || '',
    join_code: sanitizeJoinCode(options.joinCode || ''),
    source
  });
  recordAudit('class_join', actorUser, studentUser.id, { teacherId: teacherUser.id, source, groupId });
  return true;
}



function leaveTeacherClass(user, actorUser = null, reason = 'left_class') {
  if (!user || !user.teacher_id) return false;
  const previousTeacherId = Number(user.teacher_id || 0);
  const teacher = getTeacherById(previousTeacherId);
  const previousGroupId = user.class_group_id || null;
  user.class_history = Array.isArray(user.class_history) ? user.class_history : [];
  user.class_history.push({
    at: new Date().toISOString(),
    action: 'left',
    teacher_id: previousTeacherId,
    teacher_email: teacher?.email || '',
    teacher_name: teacher?.name || '',
    class_name: teacher ? getClassDisplayName(teacher, previousGroupId) : '',
    group_id: previousGroupId,
    reason
  });
  user.teacher_id = null;
  user.class_group_id = null;
  user.class_assistant_for = null;
  user.class_left_at = new Date().toISOString();
  if (user.role === 'class_assistant') user.role = 'student';
  recordAudit('class_leave', actorUser, user.id, { reason, teacherId: previousTeacherId, groupId: previousGroupId });
  return true;
}


function getStudentsForTeacher(teacherId) {
  return store.users.filter(user => Number(user.teacher_id || 0) === Number(teacherId));
}


function getTeacherRelationSummary(user) {
  const teacher = getTeacherById(user.teacher_id);
  const group = teacher ? findTeacherGroup(teacher, user.class_group_id || null) : null;
  return {
    teacherId: user.teacher_id || null,
    teacherName: teacher?.name || '',
    teacherEmail: teacher?.email || '',
    teacherCode: teacher?.teacher_code || '',
    classCode: group?.code || teacher?.teacher_code || '',
    baseClassName: teacher ? getTeacherBaseClassName(teacher) : '',
    className: teacher ? getClassDisplayName(teacher, user.class_group_id || null) : '',
    groupId: user.class_group_id || null,
    groupName: group?.name || '',
    joinedAt: user.class_joined_at || null,
    leftAt: user.class_left_at || null,
    history: Array.isArray(user.class_history) ? user.class_history.slice(-20) : []
  };
}

function sanitizeClassroomLabel(value, fallback = '') {
  const cleaned = sanitizePlainText(value, 80, { preserveCase: true });
  return cleaned || fallback;
}

function getClassroomOwnerForUser(user) {
  if (!user) return null;
  if (user.role === 'teacher') return user;
  if (user.role === 'class_assistant' && user.class_assistant_for) return getTeacherById(user.class_assistant_for);
  return null;
}

function buildClassroomPayload(viewerUser, teacherUser) {
  ensureTeacherFields(teacherUser);
  const students = getStudentsForTeacher(teacherUser.id);
  const groups = (teacherUser.classroom_groups || []).map(group => ({
    id: group.id,
    name: group.name,
    code: group.code,
    className: getClassDisplayName(teacherUser, group.id),
    studentCount: students.filter(student => String(student.class_group_id || '') === String(group.id)).length,
    createdAt: group.created_at || null
  }));
  return {
    teacher: {
      id: teacherUser.id,
      name: teacherUser.name,
      email: teacherUser.email,
      className: getTeacherBaseClassName(teacherUser),
      teacherCode: teacherUser.teacher_code || ''
    },
    permissions: {
      canEditSettings: viewerUser.role === 'teacher' && viewerUser.id === teacherUser.id,
      canManageGroups: viewerUser.role === 'teacher' && viewerUser.id === teacherUser.id,
      canManageStudents: viewerUser.role === 'teacher' || viewerUser.role === 'class_assistant'
    },
    stats: {
      totalStudents: students.length,
      groupedStudents: students.filter(student => student.class_group_id).length,
      unassignedStudents: students.filter(student => !student.class_group_id).length,
      groupCount: groups.length
    },
    groups,
    students: students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      joinedAt: student.class_joined_at || null,
      groupId: student.class_group_id || null,
      groupName: findTeacherGroup(teacherUser, student.class_group_id || null)?.name || '',
      className: getClassDisplayName(teacherUser, student.class_group_id || null),
      currentStep: ensureProgress(student.id).completed_modules.length + 1
    })).sort((a, b) => {
      const groupA = a.groupName || 'zzzz';
      const groupB = b.groupName || 'zzzz';
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      return a.name.localeCompare(b.name);
    })
  };
}



function buildSeededMeta() {
  return {
    source: 'seeded_sysadmin',
    device_type: 'system',
    platform: 'system',
    timezone: 'UTC',
    locale: 'en-US',
    ip: '127.0.0.1',
    user_agent: 'CrediStart bootstrap',
    received_at: new Date().toISOString()
  };
}

function ensureSeedAdminAccount() {
  const email = SYSADMIN_EMAIL;
  const existing = getUserByEmail(email);
  if (existing) {
    let changed = false;
    if (existing.role !== 'admin') { existing.role = 'admin'; changed = true; }
    if (existing.email_verified !== true) { existing.email_verified = true; changed = true; }
    if (!existing.verified_at) { existing.verified_at = new Date().toISOString(); changed = true; }
    if (!existing.name) { existing.name = SYSADMIN_NAME; changed = true; }
    existing.created_meta = existing.created_meta && typeof existing.created_meta === 'object' ? existing.created_meta : {};
    if (!existing.created_meta.source) { existing.created_meta.source = 'seeded_sysadmin'; changed = true; }
    return changed;
  }
  const seedPassword = getSysadminPassword();
  const salt = crypto.randomBytes(16).toString('hex');
  const nowIso = new Date().toISOString();
  const user = {
    id: store.nextUserId++,
    email,
    password_hash: hashPassword(seedPassword, salt),
    salt,
    name: SYSADMIN_NAME,
    created_at: nowIso,
    role: 'admin',
    email_verified: true,
    verified_at: nowIso,
    must_reset_password: false,
    force_reset_reason: '',
    created_meta: buildSeededMeta(),
    teacher_id: null,
    teacher_code: '',
    class_name: '',
    classroom_groups: [],
    class_group_id: null,
    class_assistant_for: null,
    class_joined_at: null,
    class_left_at: null,
    class_history: [],
    last_login_at: null,
    analytics: createDefaultAnalytics()
  };
  store.users.push(user);
  ensureProgress(user.id);
  recordAudit('seed_sysadmin_account', null, user.id, { email });
  return true;
}

function loginSecurityKey(email, meta = {}) {
  const ip = String(meta.ip || 'unknown-ip').trim() || 'unknown-ip';
  const device = String(meta.device_type || meta.platform || 'unknown-device').trim() || 'unknown-device';
  return [normalizeEmail(email), ip, device].join('|');
}

function clearLoginSecurity(email) {
  const normalized = normalizeEmail(email);
  let changed = false;
  for (const key of Object.keys(store.loginSecurity || {})) {
    if (key.startsWith(`${normalized}|`)) {
      delete store.loginSecurity[key];
      changed = true;
    }
  }
  return changed;
}

function getLoginSecuritySummary(email) {
  const normalized = normalizeEmail(email);
  const records = Object.entries(store.loginSecurity || {})
    .filter(([key]) => key.startsWith(`${normalized}|`))
    .map(([key, value]) => ({ key, ...(value || {}) }));
  const mostRecent = records.slice().sort((a, b) => new Date(b.lastFailedAt || 0).getTime() - new Date(a.lastFailedAt || 0).getTime())[0] || null;
  return {
    locked: records.some(record => Boolean(record.lockedAt)),
    failedAttempts: records.reduce((sum, record) => sum + Number(record.count || 0), 0),
    lastFailedAt: mostRecent?.lastFailedAt || null,
    source: mostRecent ? { ip: mostRecent.ip || '', deviceType: mostRecent.deviceType || '' } : null
  };
}

function registerFailedLogin(user, meta = {}) {
  const key = loginSecurityKey(user.email, meta);
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const existing = store.loginSecurity[key] && typeof store.loginSecurity[key] === 'object' ? store.loginSecurity[key] : null;
  const record = existing || {
    email: user.email,
    ip: String(meta.ip || ''),
    deviceType: String(meta.device_type || meta.platform || ''),
    count: 0,
    firstFailedAt: nowIso,
    lastFailedAt: nowIso,
    lockedAt: null
  };
  if (record.lastFailedAt && now - new Date(record.lastFailedAt).getTime() > LOGIN_FAILURE_RESET_MS) {
    record.count = 0;
    record.firstFailedAt = nowIso;
    record.lockedAt = null;
  }
  record.count = Number(record.count || 0) + 1;
  record.ip = String(meta.ip || record.ip || '');
  record.deviceType = String(meta.device_type || meta.platform || record.deviceType || '');
  record.lastFailedAt = nowIso;
  if (!record.firstFailedAt) record.firstFailedAt = nowIso;
  if (record.count >= MAX_LOGIN_FAILURES) record.lockedAt = nowIso;
  store.loginSecurity[key] = record;
  return record;
}


function roleRank(role) {
  return ({ student: 1, class_assistant: 2, teacher: 3, moderator: 4, admin: 5 })[normalizeRole(role)] || 0;
}

function getManageRestriction(actorUser, targetUser, action = '') {
  if (!actorUser || !targetUser) return { allowed: false, reason: 'User not found.' };
  const actorRole = normalizeRole(actorUser.role);
  const targetRole = normalizeRole(targetUser.role);
  if (actorRole === 'admin') return { allowed: true, reason: '' };

  if (actorRole === 'moderator') {
    if (actorUser.id === targetUser.id) return { allowed: false, reason: 'Moderators cannot modify their own account from the admin console.' };
    if (roleRank(targetRole) >= roleRank(actorRole)) return { allowed: false, reason: 'Moderators can only modify student accounts below their own role.' };
    return { allowed: true, reason: '' };
  }

  if (actorRole === 'teacher') {
    if (actorUser.id === targetUser.id) return { allowed: false, reason: 'Teachers cannot modify their own account from Teacher Hub.' };
    const inClass = Number(targetUser.teacher_id || 0) === Number(actorUser.id) || Number(targetUser.class_assistant_for || 0) === Number(actorUser.id);
    if (!inClass) return { allowed: false, reason: 'Teachers can only manage users attached to their own class.' };
    if (['delete', 'force-password-reset', 'batch-delete', 'batch-force-password-reset'].includes(action)) {
      return { allowed: false, reason: 'Teachers cannot delete accounts or force password resets.' };
    }
    if (targetRole === 'teacher' || targetRole === 'moderator' || targetRole === 'admin') {
      return { allowed: false, reason: 'Teachers cannot manage site-wide elevated roles.' };
    }
    return { allowed: true, reason: '' };
  }

  if (actorRole === 'class_assistant') {
    if (actorUser.id === targetUser.id) return { allowed: false, reason: 'Assistant teachers cannot modify their own account here.' };
    const inClass = Number(targetUser.teacher_id || 0) === Number(actorUser.class_assistant_for || 0);
    if (!inClass || targetRole !== 'student') return { allowed: false, reason: 'Assistant teachers can only manage student accounts inside their assigned class.' };
    if (!['progress', 'reset-progress', 'analysis', 'assign-group', 'remove-student', 'classroom-view'].includes(action)) {
      return { allowed: false, reason: 'Assistant teachers can view the classroom roster, move students between groups, remove students, and adjust student progress only.' };
    }
    return { allowed: true, reason: '' };
  }

  return { allowed: false, reason: 'You do not have permission to manage this user.' };
}

function requireManageTarget(req, res, authUser, targetUser, action = '') {
  const restriction = getManageRestriction(authUser, targetUser, action);
  if (!restriction.allowed) {
    sendJSON(req, res, 403, { error: restriction.reason, restriction });
    return null;
  }
  return restriction;
}

function syncConfiguredRoles() {
  let changed = false;
  for (const user of store.users) {
    const desiredRole = pickInitialRole(user.email);
    if (desiredRole !== 'student' && user.role !== desiredRole) {
      if (user.role === 'teacher' && desiredRole !== 'teacher') {
        if (unassignStudentsFromTeacher(user.id, null, 'role_sync')) changed = true;
      }
      user.role = desiredRole;
      changed = true;
    }
    const beforeCode = user.teacher_code;
    const beforeClass = user.class_name;
    ensureTeacherFields(user);
    if (beforeCode !== user.teacher_code || beforeClass !== user.class_name) changed = true;
  }
  if (changed) saveStore();
}

function getClientMeta(req, providedMeta = {}) {
  const ip = sanitizeMetaValue(getRequestIp(req), 120);
  return {
    ip,
    forwarded_for: sanitizeMetaValue(String(req.headers['x-forwarded-for'] || ''), 255),
    country: sanitizeMetaValue(String(req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || ''), 32),
    region: sanitizeMetaValue(String(req.headers['x-vercel-ip-country-region'] || ''), 64),
    city: sanitizeMetaValue(String(req.headers['x-vercel-ip-city'] || ''), 64),
    user_agent: sanitizeMetaValue(String(req.headers['user-agent'] || ''), 255),
    accept_language: sanitizeMetaValue(String(req.headers['accept-language'] || ''), 120),
    railway_edge: sanitizeMetaValue(String(req.headers['x-railway-edge'] || ''), 64),
    timezone: sanitizeMetaValue(String(providedMeta.timezone || ''), 64),
    locale: sanitizeMetaValue(String(providedMeta.locale || ''), 64),
    screen: sanitizeMetaValue(String(providedMeta.screen || ''), 64),
    platform: sanitizeMetaValue(String(providedMeta.platform || ''), 64),
    device_type: sanitizeMetaValue(String(providedMeta.deviceType || ''), 64),
    date_of_birth: normalizeDateOfBirthInput(providedMeta.dateOfBirth || providedMeta.dob || ''),
    referrer: sanitizeMetaValue(String(providedMeta.referrer || req.headers.referer || ''), 255),
    created_at_local: sanitizeMetaValue(String(providedMeta.createdAtLocal || ''), 64),
    source_page: sanitizeMetaValue(String(providedMeta.sourcePage || ''), 120),
    received_at: new Date().toISOString()
  };
}

function ensureUserAnalytics(user) {
  if (!user.analytics || typeof user.analytics !== 'object') {
    user.analytics = createDefaultAnalytics();
  }
  user.analytics = normalizeAnalytics(user.analytics);
  return user.analytics;
}

function pushRecentEvent(user, event) {
  const analytics = ensureUserAnalytics(user);
  analytics.most_recent_events.push(event);
  analytics.most_recent_events = analytics.most_recent_events.slice(-50);
}

function recordAudit(action, actorUser, targetUserId, details = {}) {
  const ctx = auditContextStorage.getStore() || {};
  const detailSource = details && typeof details === 'object' ? { ...details } : {};
  const before = detailSource.before && typeof detailSource.before === 'object' ? detailSource.before : null;
  const after = detailSource.after && typeof detailSource.after === 'object' ? detailSource.after : null;
  delete detailSource.before;
  delete detailSource.after;
  const ip = sanitizeMetaValue(detailSource.ip || ctx.ip || '', 120);
  const deviceType = sanitizeMetaValue(detailSource.deviceType || detailSource.device_type || ctx.deviceType || '', 120);
  const userAgent = sanitizeMetaValue(detailSource.userAgent || detailSource.user_agent || ctx.userAgent || '', 240);
  const referrer = sanitizeMetaValue(detailSource.referrer || ctx.referrer || '', 240);
  delete detailSource.ip;
  delete detailSource.deviceType;
  delete detailSource.device_type;
  delete detailSource.userAgent;
  delete detailSource.user_agent;
  delete detailSource.referrer;
  store.auditLog.push({
    id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    action,
    actor_user_id: actorUser ? actorUser.id : null,
    actor_email: actorUser ? actorUser.email : 'system',
    actor_role: actorUser ? actorUser.role : 'system',
    target_user_id: targetUserId || null,
    ip,
    device_type: deviceType,
    user_agent: userAgent,
    referrer,
    before,
    after,
    details: detailSource
  });
  store.auditLog = store.auditLog.slice(-AUDIT_LOG_LIMIT);
}

function parseAuditDateInput(value, fallbackEnd = false) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const asDate = new Date(raw);
  if (!Number.isNaN(asDate.getTime())) return asDate;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T${fallbackEnd ? '23:59:59.999' : '00:00:00.000'}Z`);
  }
  return null;
}

function getAuditScopeForUser(user) {
  const role = normalizeRole(user?.role);
  if (role === 'admin' || role === 'moderator') {
    return { type: 'global', teacherId: null, allowedUserIds: null, studentUserIds: null };
  }
  if (role === 'teacher') {
    const teacherId = Number(user.id || 0);
    const allowed = new Set(store.users.filter(item => item.id === teacherId || Number(item.teacher_id || 0) === teacherId || Number(item.class_assistant_for || 0) === teacherId).map(item => Number(item.id)));
    const studentUsers = store.users.filter(item => Number(item.teacher_id || 0) === teacherId);
    const studentUserIds = new Set(studentUsers.map(item => Number(item.id)));
    const studentJoinTimes = new Map(studentUsers.map(item => [Number(item.id), item.class_joined_at ? new Date(item.class_joined_at).getTime() : 0]));
    return { type: 'classroom', teacherId, allowedUserIds: allowed, studentUserIds, studentJoinTimes };
  }
  if (role === 'class_assistant') {
    const teacherId = Number(user.class_assistant_for || 0);
    const allowed = new Set(store.users.filter(item => item.id === user.id || item.id === teacherId || Number(item.teacher_id || 0) === teacherId || Number(item.class_assistant_for || 0) === teacherId).map(item => Number(item.id)));
    const studentUsers = store.users.filter(item => Number(item.teacher_id || 0) === teacherId);
    const studentUserIds = new Set(studentUsers.map(item => Number(item.id)));
    const studentJoinTimes = new Map(studentUsers.map(item => [Number(item.id), item.class_joined_at ? new Date(item.class_joined_at).getTime() : 0]));
    return { type: 'classroom', teacherId, allowedUserIds: allowed, studentUserIds, studentJoinTimes };
  }
  return { type: 'none', teacherId: null, allowedUserIds: new Set(), studentUserIds: new Set() };
}

function collectAuditScopeMatches(value, bucket, depth = 0) {
  if (!value || depth > 4) return;
  if (Array.isArray(value)) {
    value.forEach(item => collectAuditScopeMatches(item, bucket, depth + 1));
    return;
  }
  if (typeof value !== 'object') return;
  for (const [rawKey, rawVal] of Object.entries(value)) {
    const key = String(rawKey || '');
    const val = rawVal;
    const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val.trim()))) {
      const numeric = Number(val || 0);
      if (!numeric) {
        if (typeof val === 'object') collectAuditScopeMatches(val, bucket, depth + 1);
        continue;
      }
      if (/teacherid|teacher|classassistantfor|classroomownerid/.test(normalized)) bucket.teacherIds.add(numeric);
      if (/userid|targetuserid|targetuserid|studentid|actoruserid|actorid|memberid|assistantid/.test(normalized)) bucket.userIds.add(numeric);
      if (/groupid/.test(normalized)) bucket.groupIds.add(numeric);
    }
    if (val && typeof val === 'object') collectAuditScopeMatches(val, bucket, depth + 1);
  }
}

function auditEntryMatchesScope(entry, scope) {
  if (!scope || scope.type === 'global') return true;
  if (scope.type === 'none') return false;
  const actorId = Number(entry?.actor_user_id || 0);
  const targetId = Number(entry?.target_user_id || 0);
  const action = String(entry?.action || '').toLowerCase();
  const actorRole = normalizeRole(entry?.actor_role || '');
  const matches = { teacherIds: new Set(), userIds: new Set(), groupIds: new Set() };
  if (actorId) matches.userIds.add(actorId);
  if (targetId) matches.userIds.add(targetId);
  [entry?.details, entry?.before, entry?.after].filter(Boolean).forEach(source => collectAuditScopeMatches(source, matches));

  const touchedStudentIds = Array.from(matches.userIds).map(value => Number(value || 0)).filter(value => scope.studentUserIds?.has(value));
  const touchesTeacher = matches.teacherIds.has(Number(scope.teacherId || 0)) || actorId === Number(scope.teacherId || 0) || targetId === Number(scope.teacherId || 0);
  const touchesAllowedUser = Array.from(matches.userIds).some(value => scope.allowedUserIds?.has(Number(value || 0)));
  const touchesStudent = touchedStudentIds.length > 0;
  const touchesAssistantOrTeacher = scope.allowedUserIds?.has(actorId) || scope.allowedUserIds?.has(targetId);
  const isClassAction = /(class|classroom|group|student|teacher|assistant|attach|assign|unassign|move|remove|code|roster|join|leave)/.test(action);
  const isStudentSecurityAction = /(login|logout|password|verify|reset|register|progress|score|quiz|analysis|profile)/.test(action);
  const isAdminOnlyAction = actorRole === 'admin' || actorRole === 'moderator' || /^admin/.test(action) || /^system/.test(action);
  const entryAt = new Date(entry?.at || 0).getTime();
  const withinStudentJoinWindow = touchedStudentIds.some(id => {
    const joinedAt = Number(scope.studentJoinTimes?.get(id) || 0);
    if (!joinedAt) return true;
    if (!entryAt) return false;
    return entryAt >= joinedAt;
  });
  const isClassImpactingAdminAction = isAdminOnlyAction && isClassAction && (
    touchesTeacher ||
    (touchesStudent && withinStudentJoinWindow) ||
    matches.teacherIds.has(Number(scope.teacherId || 0))
  );

  if (isAdminOnlyAction && !isClassImpactingAdminAction) return false;
  if (touchesStudent && withinStudentJoinWindow && (isClassAction || isStudentSecurityAction)) return true;
  if (touchesTeacher && isClassAction) return true;
  if (isClassAction && touchesAllowedUser && (touchesTeacher || touchesStudent)) return true;
  if (touchesAssistantOrTeacher && isClassAction) return true;
  if (isClassImpactingAdminAction) return true;
  return false;
}

function getScopedAuditEntries(user, options = {}) {
  const scope = getAuditScopeForUser(user);
  const from = parseAuditDateInput(options.from, false);
  const to = parseAuditDateInput(options.to, true);
  let entries = (store.auditLog || []).filter(entry => auditEntryMatchesScope(entry, scope));
  if (from) entries = entries.filter(entry => new Date(entry.at || 0).getTime() >= from.getTime());
  if (to) entries = entries.filter(entry => new Date(entry.at || 0).getTime() <= to.getTime());
  return entries.sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime());
}


function getAuditActionCategory(action) {
  const value = String(action || '').toLowerCase();
  if (!value) return 'system';
  if (/(login|logout|register|verify|password|reset|lockout|auth)/.test(value)) return 'security';
  if (/(class|classroom|group|teacher|assistant|student|attach|assign|unassign|roster|join|leave|code)/.test(value)) return 'classroom';
  if (/(progress|quiz|score|analysis)/.test(value)) return 'progress';
  if (/^admin|delete|role|force|batch|override|user/.test(value)) return 'user_management';
  return 'system';
}

function getAuditActionSeverity(action) {
  const value = String(action || '').toLowerCase();
  if (/(delete|lockout|force_password_reset|set_role|batch_delete|override_clear_teacher|override_attach_teacher)/.test(value)) return 'high';
  if (/(failed|regenerated|updated|reset|attach|clear_teacher|set_progress)/.test(value)) return 'medium';
  return 'low';
}

function getAuditActionStatus(action) {
  const value = String(action || '').toLowerCase();
  if (/failed|lockout/.test(value)) return 'failed';
  if (/warning|blocked|denied/.test(value)) return 'warning';
  return 'success';
}

function getAuditDisplayUser(userId, fallbackEmail = '') {
  const id = Number(userId || 0);
  const user = id ? getUserById(id) : null;
  return {
    id: id || null,
    email: user?.email || fallbackEmail || '',
    name: user?.name || '',
    role: user?.role || ''
  };
}

function normalizeAuditEntryForClient(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const actor = getAuditDisplayUser(entry.actor_user_id, entry.actor_email || '');
  const target = getAuditDisplayUser(entry.target_user_id, '');
  const category = getAuditActionCategory(entry.action || '');
  const severity = getAuditActionSeverity(entry.action || '');
  const status = getAuditActionStatus(entry.action || '');
  return {
    ...entry,
    id: String(entry.id || `${entry.at || 'audit'}-${entry.action || 'entry'}-${entry.actor_user_id || '0'}-${entry.target_user_id || '0'}`),
    category,
    severity,
    status,
    actor_name: actor.name || '',
    actor_role: actor.role || entry.actor_role || '',
    actor_email: actor.email || entry.actor_email || 'system',
    target_name: target.name || '',
    target_email: target.email || '',
    target_role: target.role || '',
    summary: String(entry.action || '').replace(/_/g, ' ')
  };
}

function filterAuditEntries(entries, filters = {}) {
  let list = Array.isArray(entries) ? entries.slice() : [];
  const query = String(filters.query || '').trim().toLowerCase();
  const action = String(filters.action || '').trim().toLowerCase();
  const category = String(filters.category || '').trim().toLowerCase();
  const actorRole = String(filters.actorRole || '').trim().toLowerCase();
  const deviceType = String(filters.deviceType || '').trim().toLowerCase();
  const status = String(filters.status || '').trim().toLowerCase();
  const severity = String(filters.severity || '').trim().toLowerCase();
  if (action && action !== 'all') list = list.filter(entry => String(entry.action || '').toLowerCase() === action);
  if (category && category !== 'all') list = list.filter(entry => String(entry.category || '').toLowerCase() === category);
  if (actorRole && actorRole !== 'all') list = list.filter(entry => String(entry.actor_role || '').toLowerCase() === actorRole);
  if (deviceType && deviceType !== 'all') list = list.filter(entry => String(entry.device_type || '').toLowerCase() === deviceType);
  if (status && status !== 'all') list = list.filter(entry => String(entry.status || '').toLowerCase() === status);
  if (severity && severity !== 'all') list = list.filter(entry => String(entry.severity || '').toLowerCase() === severity);
  if (query) list = list.filter(entry => [entry.action, entry.summary, entry.actor_email, entry.actor_name, entry.target_email, entry.target_name, entry.target_role, entry.target_user_id, entry.ip, entry.device_type, entry.referrer, entry.user_agent, entry.category, JSON.stringify(entry.before || {}), JSON.stringify(entry.after || {}), JSON.stringify(entry.details || {})].some(value => String(value || '').toLowerCase().includes(query)));
  return list;
}

function buildAuditSummary(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const summary = { total: list.length, security: 0, classroom: 0, user_management: 0, progress: 0, failed: 0, high: 0 };
  for (const entry of list) {
    const category = String(entry.category || 'system');
    if (summary[category] != null) summary[category] += 1;
    if (entry.status === 'failed') summary.failed += 1;
    if (entry.severity === 'high') summary.high += 1;
  }
  return summary;
}

function buildAuditFilterOptions(entries) {
  const unique = key => Array.from(new Set(entries.map(entry => String(entry[key] || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  return { actions: unique('action'), actorRoles: unique('actor_role'), deviceTypes: unique('device_type') };
}

function buildAuditCsv(entries) {
  const escapeCsv = value => {
    const stringValue = String(value == null ? '' : value);
    if (/[",\n]/.test(stringValue)) return `"${stringValue.replace(/"/g, '""')}"`;
    return stringValue;
  };
  const rows = [[
    'time', 'action', 'actor_email', 'actor_role', 'target_user_id', 'ip', 'device_type', 'user_agent', 'referrer', 'before', 'after', 'details'
  ]];
  for (const entry of entries) {
    rows.push([
      entry.at || '',
      entry.action || '',
      entry.actor_email || '',
      entry.actor_role || '',
      entry.target_user_id || '',
      entry.ip || '',
      entry.device_type || '',
      entry.user_agent || '',
      entry.referrer || '',
      entry.before ? JSON.stringify(entry.before) : '',
      entry.after ? JSON.stringify(entry.after) : '',
      entry.details ? JSON.stringify(entry.details) : ''
    ]);
  }
  return rows.map(row => row.map(escapeCsv).join(',')).join('\n');
}

function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) {
    sendJSON(req, res, 401, { error: 'Not logged in.' });
    return null;
  }
  const user = getUserById(session.userId);
  if (!user) {
    sendJSON(req, res, 401, { error: 'User not found.' }, clearCookie(req));
    return null;
  }
  return { session, user };
}

function requireRole(req, res, allowedRoles) {
  const auth = requireAuth(req, res);
  if (!auth) return null;
  if (!allowedRoles.includes(auth.user.role)) {
    sendJSON(req, res, 403, { error: 'You do not have access to this area.' });
    return null;
  }
  return auth;
}

function summarizeProgress(progress) {
  const completedModules = Array.isArray(progress.completed_modules) ? progress.completed_modules : [];
  const currentStep = completedModules.length >= 6 ? 7 : completedModules.length + 1;
  return {
    completedModules,
    quizScores: progress.quiz_scores || {},
    quizAnswers: progress.quiz_answers || {},
    quizSelections: progress.quiz_selections || {},
    quizMetrics: progress.quiz_metrics || {},
    creditScores: progress.credit_scores || [],
    currentStep,
    updatedAt: progress.updated_at || null
  };
}

function topEntries(map, limit = 5) {
  return Object.entries(map || {})
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, limit)
    .map(([key, value]) => ({ key, value }));
}

function getAdminUserSummary(user) {
  const progress = ensureProgress(user.id);
  const analytics = ensureUserAnalytics(user);
  const security = getLoginSecuritySummary(user.email);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.email_verified !== false,
    createdAt: user.created_at,
    verifiedAt: user.verified_at || null,
    lastLoginAt: user.last_login_at || null,
    mustResetPassword: Boolean(user.must_reset_password),
    forceResetReason: user.force_reset_reason || '',
    createdMeta: user.created_meta || {},
    security,
    manageableByModerator: getManageRestriction({ id: -1, role: 'moderator' }, user).allowed,
    manageRestrictionReason: getManageRestriction({ id: -1, role: 'moderator' }, user).reason,
    protectedSystemAccount: isProtectedSystemAccount(user),
    protectedSystemReason: isProtectedSystemAccount(user) ? 'This built-in system account is protected. Its role, deletion, and forced password reset controls are locked.' : '',
    teacherRelation: getTeacherRelationSummary(user),
    teacherCode: user.teacher_code || '',
    className: user.role === 'teacher' ? getTeacherBaseClassName(user) : user.class_name || '',
    classroomGroups: Array.isArray(user.classroom_groups) ? user.classroom_groups : [],
    classGroupId: user.class_group_id || null,
    classAssistantFor: user.class_assistant_for || null,
    analytics: {
      totalActiveMs: analytics.total_active_ms || 0,
      pageViews: analytics.page_views || {},
      pageTimeMs: analytics.page_time_ms || {},
      linkClicks: analytics.link_clicks || {},
      topPages: topEntries(analytics.page_time_ms || {}),
      topClicks: topEntries(analytics.link_clicks || {}),
      lastSeenAt: analytics.last_seen_at || null,
      lastPage: analytics.last_page || null,
      loginCount: analytics.logins || 0,
      sessionCount: analytics.sessions || 0,
      recentEvents: analytics.most_recent_events || []
    },
    progress: summarizeProgress(progress)
  };
}


function buildAdminExportUser(user) {
  const summary = getAdminUserSummary(user);
  return {
    id: summary.id,
    name: summary.name,
    email: summary.email,
    role: summary.role,
    emailVerified: summary.emailVerified,
    createdAt: summary.createdAt,
    verifiedAt: summary.verifiedAt,
    lastLoginAt: summary.lastLoginAt,
    mustResetPassword: summary.mustResetPassword,
    forceResetReason: summary.forceResetReason,
    createdMeta: summary.createdMeta,
    security: summary.security,
    protectedSystemAccount: summary.protectedSystemAccount,
    protectedSystemReason: summary.protectedSystemReason,
    analytics: summary.analytics,
    progress: summary.progress
  };
}

function formatDuration(ms) {
  const totalSeconds = Math.round((ms || 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getEmailBrandSvg() {
  return `<svg width="78" height="78" viewBox="0 0 78 78" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CrediStart">
    <defs>
      <linearGradient id="cardGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#7DD3FC"/>
        <stop offset="55%" stop-color="#60A5FA"/>
        <stop offset="100%" stop-color="#8B5CF6"/>
      </linearGradient>
      <linearGradient id="brandAccent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FF8A3D"/>
        <stop offset="100%" stop-color="#F4A828"/>
      </linearGradient>
    </defs>
    <rect x="5" y="7" width="68" height="50" rx="10" fill="url(#cardGlow)" opacity="0.98"/>
    <rect x="5" y="7" width="68" height="18" rx="10" fill="#9CE7FF" opacity="0.92"/>
    <rect x="16" y="31" width="32" height="8" rx="4" fill="#E8F7FF" opacity="0.95"/>
    <rect x="16" y="43" width="26" height="6" rx="3" fill="#D4EEFF" opacity="0.95"/>
    <rect x="52" y="37" width="10" height="10" rx="3" fill="url(#brandAccent)"/>
    <rect x="56" y="15" width="10" height="5" rx="2.5" fill="#E8F7FF" opacity="0.85"/>
  </svg>`;
}

function buildEmailTemplate({ preheader, title, subtitle, code, detailsHtml, footerNote }) {
  const brandSvg = getEmailBrandSvg();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#193764;font-family:'Segoe UI',Arial,sans-serif;color:#0A2240;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || subtitle || '')}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:radial-gradient(circle at top,#27487D 0%,#193764 46%,#122C54 100%);padding:34px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:650px;">
          <tr>
            <td align="center" style="padding:6px 12px 20px;">
              <div style="display:inline-block;">${brandSvg}</div>
              <div style="font-size:46px;font-weight:900;line-height:1;letter-spacing:-1.8px;color:#FFFFFF;margin-top:10px;">Credi<span style="color:#F4A828;">Start</span></div>
              <div style="font-size:14px;color:#9EE7FF;margin-top:12px;font-weight:600;">Your credit glow-up starts here.</div>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:26px;overflow:hidden;box-shadow:0 20px 50px rgba(7,18,38,0.28);">
                <tr>
                  <td style="padding:30px 32px 10px;">
                    <div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#5FAEE3;margin-bottom:10px;">Secure Account Access</div>
                    <h1 style="margin:0;font-size:29px;line-height:1.2;color:#0A2240;">${escapeHtml(title)}</h1>
                    <p style="margin:12px 0 0;font-size:16px;line-height:1.65;color:#617084;">${escapeHtml(subtitle)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 32px 10px;">
                    <div style="border-radius:22px;background:#F4F7FF;border:1px solid #E1E8F3;padding:22px 20px;text-align:center;">
                      <div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#617084;">Verification code</div>
                      <div style="font-size:40px;letter-spacing:11px;font-weight:900;color:#7C5CFF;margin-top:12px;">${escapeHtml(code)}</div>
                      <div style="font-size:14px;color:#617084;margin-top:12px;">This code expires in 15–20 minutes and should only be used by you.</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 32px 6px;">
                    <div style="background:#FFFFFF;border:1px solid #E8EEF4;border-radius:18px;padding:18px 20px;">
                      <div style="font-size:14px;font-weight:800;color:#0A2240;margin-bottom:10px;">Sign-in details captured for your security</div>
                      ${detailsHtml}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 32px 6px;">
                    <div style="font-size:14px;line-height:1.7;color:#617084;">If you did not request this code, you can safely ignore this email. No changes will be made unless the correct code is entered.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 32px 30px;">
                    <div style="border-top:1px solid #E8EEF4;padding-top:16px;font-size:12px;line-height:1.7;color:#7A8698;">
                      ${escapeHtml(footerNote || 'CrediStart account security email')}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildSecurityDetailsHtml(meta) {
  const rows = [
    ['Time:', meta.created_at_local || meta.received_at || 'Unknown'],
    ['Timezone:', meta.timezone || 'Unknown'],
    ['Locale:', meta.locale || meta.accept_language || 'Unknown'],
    ['Approx. IP:', meta.ip || 'Unknown'],
    ['Browser / device:', [meta.user_agent, meta.device_type || meta.platform].filter(Boolean).join(' · ') || 'Unknown'],
    ['Referrer:', meta.referrer || 'Direct visit']
  ];
  return rows.map(([label, value]) => `
    <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #F0F4FF;">
      <span style="font-size:13px;font-weight:700;color:#5A6472;">${escapeHtml(label)}</span>
      <span style="font-size:13px;color:#0A2240;text-align:right;">${escapeHtml(value)}</span>
    </div>`).join('');
}

function getResendConfig() {
  const apiKey = String(
    process.env.RESEND_API_KEY ||
    ((String(process.env.SMTP_HOST || '').trim().toLowerCase() === 'smtp.resend.com' && String(process.env.SMTP_USER || '').trim() === 'resend')
      ? process.env.SMTP_PASS || ''
      : '')
  ).trim();
  const from = String(process.env.RESEND_FROM || process.env.SMTP_FROM || '').trim();
  if (!apiKey || !from) return null;
  return {
    apiKey,
    from,
    apiUrl: RESEND_API_URL
  };
}

function withTimeoutFactory(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Resend API request timed out after ${timeoutMs}ms`)), timeoutMs);
  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timer);
    }
  };
}

async function sendEmail({ to, subject, html, text }) {
  const config = getResendConfig();
  if (!config) {
    console.warn(`Email transport not configured. Intended recipient: ${to}. Subject: ${subject}`);
    return false;
  }

  console.log('Resend API config', {
    apiUrl: config.apiUrl,
    from: config.from,
    to,
    subject
  });

  const timeout = withTimeoutFactory(RESEND_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: config.from,
        to: [to],
        subject,
        html,
        text
      }),
      signal: timeout.signal
    });

    const rawText = await response.text();
    let payload = null;
    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch (_) {
      payload = { raw: rawText };
    }

    console.log('Resend API response', {
      status: response.status,
      ok: response.ok,
      body: payload
    });

    if (!response.ok) {
      const message = payload && (payload.message || payload.error || payload.name) ? (payload.message || payload.error || payload.name) : `Resend API request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    console.log('Resend send success', {
      id: payload && payload.id ? payload.id : null,
      to,
      subject
    });
    return true;
  } catch (err) {
    console.error('Resend send failed:', {
      message: err && err.message ? err.message : String(err),
      name: err && err.name ? err.name : null,
      status: err && err.status ? err.status : null,
      payload: err && err.payload ? err.payload : null,
      cause: err && err.cause ? String(err.cause) : null
    });
    console.error('Resend send failed raw:', err);
    console.error('Resend send failed stack:', err && err.stack ? err.stack : null);
    throw err;
  } finally {
    timeout.clear();
  }
}

async function sendVerificationEmail(email, code, meta) {
  const html = buildEmailTemplate({
    preheader: 'Your CrediStart verification code is ready.',
    title: 'Verify your CrediStart account',
    subtitle: 'Enter this code in the site to finish creating your account and keep your learning progress secure.',
    code,
    detailsHtml: buildSecurityDetailsHtml(meta),
    footerNote: 'CrediStart LLC · Verification email'
  });
  const text = `CrediStart verification code: ${code}\n\nTime: ${meta.created_at_local || meta.received_at}\nTimezone: ${meta.timezone || 'Unknown'}\nIP: ${meta.ip || 'Unknown'}`;
  return sendEmail({ to: email, subject: 'Your CrediStart verification code', html, text });
}

async function sendPasswordResetEmail(email, code, meta, reason) {
  const html = buildEmailTemplate({
    preheader: 'Your CrediStart password reset code is ready.',
    title: 'Reset your CrediStart password',
    subtitle: reason
      ? `An administrator requested a password reset for your account. Use this code to set a new password and regain access.`
      : 'Use this code to securely create a new password for your CrediStart account.',
    code,
    detailsHtml: buildSecurityDetailsHtml(meta),
    footerNote: reason ? `Admin note: ${reason}` : 'CrediStart LLC · Password reset email'
  });
  const text = `CrediStart password reset code: ${code}`;
  return sendEmail({ to: email, subject: 'Your CrediStart password reset code', html, text });
}

function buildDebugCodeResponse(code) {
  return DEV_MODE ? { debugCode: code } : {};
}

function incrementMap(map, key, amount) {
  const safeKey = String(key || '').slice(0, 120);
  if (!safeKey) return;
  map[safeKey] = Number(map[safeKey] || 0) + amount;
}

function updateAnalyticsFromItems(user, items) {
  const analytics = ensureUserAnalytics(user);
  let changed = false;
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const type = String(item.type || '');
    const page = String(item.page || '').slice(0, 80);
    const target = String(item.target || '').slice(0, 120);
    if (type === 'page_view' && page) {
      incrementMap(analytics.page_views, page, 1);
      analytics.last_page = page;
      analytics.last_seen_at = new Date().toISOString();
      pushRecentEvent(user, { type, page, at: analytics.last_seen_at });
      changed = true;
    } else if (type === 'page_time' && page) {
      const durationMs = Math.max(0, Math.min(10 * 60 * 1000, Number(item.durationMs || 0)));
      if (durationMs > 0) {
        incrementMap(analytics.page_time_ms, page, durationMs);
        analytics.total_active_ms = Number(analytics.total_active_ms || 0) + durationMs;
        analytics.last_page = page;
        analytics.last_seen_at = new Date().toISOString();
        pushRecentEvent(user, { type, page, durationMs, at: analytics.last_seen_at });
        changed = true;
      }
    } else if (type === 'click' && target) {
      incrementMap(analytics.link_clicks, target, 1);
      analytics.last_page = page || analytics.last_page || null;
      analytics.last_seen_at = new Date().toISOString();
      pushRecentEvent(user, { type, target, page: page || null, at: analytics.last_seen_at });
      changed = true;
    }
  }
  return changed;
}

function userResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.email_verified !== false,
    mustResetPassword: Boolean(user.must_reset_password),
    teacherCode: user.teacher_code || '',
    className: user.role === 'teacher' ? getTeacherBaseClassName(user) : user.class_name || '',
    classroomGroups: Array.isArray(user.classroom_groups) ? user.classroom_groups : [],
    teacherId: user.teacher_id || null,
    classGroupId: user.class_group_id || null,
    classAssistantFor: user.class_assistant_for || null
  };
}

function deleteUserData(userId) {
  const existing = getUserById(userId);
  if (existing && existing.role === 'teacher') {
    unassignStudentsFromTeacher(existing.id, null, 'teacher_deleted');
  }
  store.users = store.users.filter(user => user.id !== Number(userId));
  store.progress = store.progress.filter(progress => progress.user_id !== Number(userId));
  for (const [sessionId, session] of Object.entries(store.sessions)) {
    if (session && session.userId === Number(userId)) delete store.sessions[sessionId];
  }
}

function routeMatch(pathname, pattern) {
  const match = pathname.match(pattern);
  return match ? match.slice(1) : null;
}

async function handleRequest(req, res) {
  cleanupExpiredSessions();
  cleanupExpiringRecords();
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...getCorsHeaders(req)
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/enhancements.js') {
    return sendFile(req, res, path.join(__dirname, 'public', 'enhancements.js'), 'application/javascript; charset=utf-8');
  }

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    return sendFile(req, res, path.join(__dirname, 'public', 'index.html'), 'text/html; charset=utf-8');
  }

  if (req.method === 'POST' && pathname === '/api/register/check-email') {
    try {
      const { email } = await parseBody(req);
      const emailLower = normalizeEmail(email);
      if (!emailLower) {
        return sendJSON(req, res, 200, { valid: false, exists: false, pending: false, available: false, message: 'Enter an email address.' });
      }
      if (!isValidEmail(emailLower)) {
        return sendJSON(req, res, 200, { valid: false, exists: false, pending: false, available: false, message: 'Please enter a valid email address.' });
      }
      const exists = Boolean(getUserByEmail(emailLower));
      const pending = Boolean(store.pendingVerifications[emailLower]);
      return sendJSON(req, res, 200, {
        valid: true,
        exists,
        pending,
        available: !exists,
        message: exists
          ? 'An account with this email already exists. Log in instead.'
          : pending
            ? 'A signup for this email is already waiting for verification. You can continue and refresh the code.'
            : 'This email looks good and is available.'
      });
    } catch (error) {
      console.error('Register email check error:', error.message);
      return sendJSON(req, res, 500, { error: 'Server error while checking that email.' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/register/start') {
    try {
      const { email, password, name, dob, clientMeta } = await parseBody(req);
      const emailLower = normalizeEmail(email);
      const trimmedName = sanitizeName(name);
      const normalizedDob = normalizeDateOfBirthInput(dob);
      const passwordValue = String(password || '');
      const rateLimit = requireRateLimit(req, res, 'register_start', [emailLower || 'anonymous']);
      if (!rateLimit) return;

      if (!trimmedName || !emailLower || !passwordValue || !normalizedDob) {
        return sendJSON(req, res, 400, { error: 'Name, email, date of birth, and password are required.' });
      }
      if (!isValidEmail(emailLower)) {
        return sendJSON(req, res, 400, { error: 'Please enter a valid email address.' });
      }
      if (!isAllowedPassword(passwordValue, { email: emailLower, name: trimmedName })) {
        return sendJSON(req, res, 400, { error: getPasswordValidationMessage(passwordValue, { email: emailLower, name: trimmedName }) });
      }
      if (getUserByEmail(emailLower)) {
        return sendJSON(req, res, 409, { error: 'An account with this email already exists. Log in instead.' });
      }

      const existingPending = store.pendingVerifications[emailLower];
      if (existingPending && !existingPending.used_at && new Date(existingPending.expires_at || 0).getTime() > Date.now()) {
        const sendWindow = requireVerificationSendWindow(req, res, existingPending);
        if (!sendWindow) return;
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(passwordValue, salt);
      const code = generateCode();
      const safeClientMeta = clientMeta && typeof clientMeta === 'object' ? clientMeta : {};
      const meta = getClientMeta(req, { ...safeClientMeta, dob: normalizedDob, dateOfBirth: normalizedDob });
      const nowIso = new Date().toISOString();
      const pendingRecord = {
        email: emailLower,
        name: trimmedName,
        password_hash: passwordHash,
        salt,
        code_hash: hashCode(code),
        attempts: 0,
        resend_count: Number(existingPending?.resend_count || 0),
        send_count: Number(existingPending?.send_count || 0),
        last_attempt_at: null,
        last_sent_at: existingPending?.last_sent_at || null,
        created_at: nowIso,
        expires_at: new Date(Date.now() + VERIFICATION_TTL_MS).toISOString(),
        used_at: null,
        created_meta: meta
      };
      noteVerificationCodeIssued(pendingRecord);
      store.pendingVerifications[emailLower] = pendingRecord;
      recordAudit('register_start', null, null, { email: emailLower });
      saveStore();

      let emailSent = false;
      try {
        emailSent = await sendVerificationEmail(emailLower, code, meta);
      } catch (error) {
        console.error('Verification email send failed:', error.message);
      }

      const response = {
        success: true,
        message: emailSent
          ? 'Verification code sent. Check your email to finish creating your account.'
          : 'Verification code generated, but email delivery could not be confirmed. Please try resending the code in a moment.',
        email: emailLower,
        emailDeliveryConfigured: emailSent
      };
      return sendJSON(req, res, 200, { ...response, ...buildDebugCodeResponse(code) });
    } catch (error) {
      console.error('Register start error:', error.message);
      const statusCode = Number(error.statusCode || 500);
      return sendJSON(req, res, statusCode, { error: statusCode === 500 ? 'Server error while starting registration.' : error.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/register/resend') {
    try {
      const { email } = await parseBody(req);
      const emailLower = normalizeEmail(email);
      const rateLimit = requireRateLimit(req, res, 'register_resend', [emailLower || 'anonymous']);
      if (!rateLimit) return;
      const pending = store.pendingVerifications[emailLower];
      if (!pending || pending.used_at || Number(pending.attempts || 0) >= MAX_VERIFICATION_ATTEMPTS || new Date(pending.expires_at || 0).getTime() <= Date.now()) {
        if (pending) {
          delete store.pendingVerifications[emailLower];
          saveStore();
        }
        return sendJSON(req, res, 404, { error: 'No pending signup was found for that email.' });
      }
      const sendWindow = requireVerificationSendWindow(req, res, pending);
      if (!sendWindow) return;
      const code = generateCode();
      pending.code_hash = hashCode(code);
      pending.expires_at = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
      pending.created_at = new Date().toISOString();
      pending.attempts = 0;
      pending.last_attempt_at = null;
      noteVerificationCodeIssued(pending);
      saveStore();

      let emailSent = false;
      try {
        emailSent = await sendVerificationEmail(emailLower, code, pending.created_meta || {});
      } catch (error) {
        console.error('Verification resend failed:', error.message);
      }

      recordAudit('register_resend', null, null, { email: emailLower, delivered: emailSent });
      return sendJSON(req, res, 200, {
        success: true,
        message: emailSent ? 'A new verification code has been sent.' : 'A new verification code was generated, but email delivery could not be confirmed.',
        ...buildDebugCodeResponse(code)
      });
    } catch (error) {
      console.error('Register resend error:', error.message);
      const statusCode = Number(error.statusCode || 500);
      return sendJSON(req, res, statusCode, { error: statusCode === 500 ? 'Server error while resending the verification code.' : error.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/register/verify') {
    try {
      const { email, code } = await parseBody(req);
      const emailLower = normalizeEmail(email);
      const rateLimit = requireRateLimit(req, res, 'register_verify', [emailLower || 'anonymous']);
      if (!rateLimit) return;
      const pending = store.pendingVerifications[emailLower];
      if (!pending || pending.used_at || new Date(pending.expires_at || 0).getTime() <= Date.now()) {
        if (pending) {
          delete store.pendingVerifications[emailLower];
          saveStore();
        }
        return sendJSON(req, res, 404, { error: 'Verification request expired. Please sign up again.' });
      }
      if (Number(pending.attempts || 0) >= MAX_VERIFICATION_ATTEMPTS) {
        delete store.pendingVerifications[emailLower];
        saveStore();
        return sendJSON(req, res, 400, { error: 'Too many incorrect verification attempts. Please sign up again.' });
      }
      if (getUserByEmail(emailLower)) {
        delete store.pendingVerifications[emailLower];
        saveStore();
        return sendJSON(req, res, 409, { error: 'This account already exists. Log in instead.' });
      }
      const normalizedCode = String(code || '').trim();
      const bypassCodeUsed = normalizedCode === TEMP_BYPASS_TOKEN;
      if (!normalizedCode || (!bypassCodeUsed && hashCode(normalizedCode) !== pending.code_hash)) {
        pending.attempts = Number(pending.attempts || 0) + 1;
        pending.last_attempt_at = new Date().toISOString();
        const tooManyAttempts = Number(pending.attempts || 0) >= MAX_VERIFICATION_ATTEMPTS;
        if (tooManyAttempts) {
          delete store.pendingVerifications[emailLower];
          recordAudit('register_verify_locked', null, null, { email: emailLower });
          saveStore();
          return sendJSON(req, res, 400, { error: 'Too many incorrect verification attempts. Please sign up again.' });
        }
        recordAudit('register_verify_failed', null, null, { email: emailLower, attempts: pending.attempts });
        saveStore();
        return sendJSON(req, res, 400, { error: 'Invalid verification code. Please try again.' });
      }

      const nowIso = new Date().toISOString();
      const newUser = {
        id: store.nextUserId++,
        email: emailLower,
        password_hash: pending.password_hash,
        salt: pending.salt,
        name: pending.name,
        created_at: nowIso,
        role: pickInitialRole(emailLower),
        email_verified: true,
        verified_at: nowIso,
        must_reset_password: false,
        force_reset_reason: '',
        created_meta: pending.created_meta || {},
        teacher_id: null,
        teacher_code: '',
        class_name: '',
        class_assistant_for: null,
        class_joined_at: null,
        class_left_at: null,
        class_history: [],
        last_login_at: nowIso,
        analytics: createDefaultAnalytics()
      };
      ensureTeacherFields(newUser);
      ensureUserAnalytics(newUser).logins = 1;
      ensureUserAnalytics(newUser).sessions = 1;
      store.users.push(newUser);
      ensureProgress(newUser.id);
      pending.used_at = nowIso;
      delete store.pendingVerifications[emailLower];
      recordAudit('register_verified', newUser, newUser.id, { role: newUser.role, usedBypassCode: bypassCodeUsed });
      saveStore();

      const sessionId = createSession(newUser.id);
      return sendJSON(req, res, 201, {
        success: true,
        user: userResponse(newUser)
      }, buildCookie(req, sessionId));
    } catch (error) {
      console.error('Register verify error:', error.message);
      const statusCode = Number(error.statusCode || 500);
      return sendJSON(req, res, statusCode, { error: statusCode === 500 ? 'Server error while verifying your code.' : error.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/login') {
    try {
      const { email, password, clientMeta } = await parseBody(req);
      if (!email || !password) {
        return sendJSON(req, res, 400, { error: 'Email and password are required.' });
      }

      const user = getUserByEmail(email);
      if (!user) {
        recordAudit('login_attempt_failed', null, null, { email: normalizeEmail(email), reason: 'no_account' });
        return sendJSON(req, res, 401, { error: 'No account found with that email.' });
      }
      if (user.email_verified === false) {
        return sendJSON(req, res, 403, { error: 'Please verify your email before logging in.' });
      }

      const loginMeta = getClientMeta(req, clientMeta || {});
      const security = getLoginSecuritySummary(user.email);
      if (user.must_reset_password || security.locked) {
        user.must_reset_password = true;
        if (!user.force_reset_reason) user.force_reset_reason = 'Too many incorrect password attempts. Reset your password to unlock the account.';
        saveStore();
        return sendJSON(req, res, 403, {
          error: 'Too many incorrect password attempts. Reset your password to unlock this account.',
          requirePasswordReset: true,
          forgotPasswordPath: '/forgot-password'
        });
      }

      const hash = hashPassword(password, user.salt);
      if (hash !== user.password_hash) {
        const record = registerFailedLogin(user, loginMeta);
        if (record.lockedAt || Number(record.count || 0) >= MAX_LOGIN_FAILURES) {
          user.must_reset_password = true;
          user.force_reset_reason = 'Too many incorrect password attempts. Reset your password to unlock the account.';
          recordAudit('login_lockout', user, user.id, { ip: loginMeta.ip || '', deviceType: loginMeta.device_type || loginMeta.platform || '' });
          saveStore();
          return sendJSON(req, res, 403, {
            error: 'Too many incorrect password attempts. Reset your password to unlock this account.',
            requirePasswordReset: true,
            forgotPasswordPath: '/forgot-password'
          });
        }
        const remaining = Math.max(0, MAX_LOGIN_FAILURES - Number(record.count || 0));
        recordAudit('login_attempt_failed', user, user.id, { reason: 'incorrect_password', remainingAttempts: remaining });
        saveStore();
        return sendJSON(req, res, 401, { error: `Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before a reset is required.` });
      }

      clearLoginSecurity(user.email);
      const analytics = ensureUserAnalytics(user);
      analytics.logins = Number(analytics.logins || 0) + 1;
      analytics.sessions = Number(analytics.sessions || 0) + 1;
      user.last_login_at = new Date().toISOString();
      recordAudit('login', user, user.id, {});
      saveStore();

      const sessionId = createSession(user.id);
      return sendJSON(req, res, 200, { success: true, user: userResponse(user) }, buildCookie(req, sessionId));
    } catch (error) {
      console.error('Login error:', error.message);
      return sendJSON(req, res, 500, { error: 'Server error. Please try again.' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/password-reset/request') {
    try {
      const { email } = await parseBody(req);
      const emailLower = normalizeEmail(email);
      const rateLimit = requireRateLimit(req, res, 'password_reset_request', [emailLower || 'anonymous']);
      if (!rateLimit) return;
      const user = getUserByEmail(emailLower);
      if (!user) {
        return sendJSON(req, res, 200, { success: true, message: 'If that email exists, a reset code has been sent.' });
      }
      const code = generateCode();
      const meta = getClientMeta(req, {});
      store.passwordResets[emailLower] = {
        code_hash: hashCode(code),
        expires_at: new Date(Date.now() + RESET_TTL_MS).toISOString(),
        requested_at: new Date().toISOString(),
        requested_by: 'self',
        reason: '',
        attempts: 0,
        last_attempt_at: null,
        used_at: null,
        meta
      };
      recordAudit('password_reset_requested', user, user.id, { requestedBy: 'self', before: { mustResetPassword: Boolean(user.must_reset_password) } });
      saveStore();

      let emailSent = false;
      try {
        emailSent = await sendPasswordResetEmail(emailLower, code, meta, '');
      } catch (error) {
        console.error('Password reset email failed:', error.message);
      }

      return sendJSON(req, res, 200, {
        success: true,
        message: emailSent ? 'A reset code has been sent to your email.' : 'A reset code was generated for testing.',
        ...buildDebugCodeResponse(code)
      });
    } catch (error) {
      console.error('Password reset request error:', error.message);
      const statusCode = Number(error.statusCode || 500);
      return sendJSON(req, res, statusCode, { error: statusCode === 500 ? 'Server error while requesting a reset code.' : error.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/password-reset/confirm') {
    try {
      const { email, code, newPassword } = await parseBody(req);
      const emailLower = normalizeEmail(email);
      const normalizedCode = String(code || '').trim();
      const passwordValue = String(newPassword || '');
      const rateLimit = requireRateLimit(req, res, 'password_reset_confirm', [emailLower || 'anonymous']);
      if (!rateLimit) return;
      const reset = store.passwordResets[emailLower];
      const user = getUserByEmail(emailLower);
      if (!user || !reset || reset.used_at || new Date(reset.expires_at || 0).getTime() <= Date.now()) {
        if (reset) {
          delete store.passwordResets[emailLower];
          saveStore();
        }
        return sendJSON(req, res, 400, { error: 'That reset code is invalid or expired.' });
      }
      if (Number(reset.attempts || 0) >= MAX_RESET_ATTEMPTS) {
        delete store.passwordResets[emailLower];
        recordAudit('password_reset_failed', user || null, user ? user.id : null, { reason: 'invalid_or_expired_code' });
        recordAudit('password_reset_failed', user, user.id, { reason: 'incorrect_code', attempts: reset.attempts });
        saveStore();
        return sendJSON(req, res, 400, { error: 'That reset code is invalid or expired.' });
      }
      if (!passwordValue || !isAllowedPassword(passwordValue, { email: emailLower, name: user.name })) {
        return sendJSON(req, res, 400, { error: getPasswordValidationMessage(passwordValue, { email: emailLower, name: user.name }) });
      }
      const bypassResetCodeUsed = normalizedCode === TEMP_BYPASS_TOKEN;
      if (!normalizedCode || (!bypassResetCodeUsed && hashCode(normalizedCode) !== reset.code_hash)) {
        reset.attempts = Number(reset.attempts || 0) + 1;
        reset.last_attempt_at = new Date().toISOString();
        if (Number(reset.attempts || 0) >= MAX_RESET_ATTEMPTS) {
          delete store.passwordResets[emailLower];
        }
        saveStore();
        return sendJSON(req, res, 400, { error: 'That reset code is invalid or expired.' });
      }
      const newSalt = crypto.randomBytes(16).toString('hex');
      user.salt = newSalt;
      user.password_hash = hashPassword(passwordValue, newSalt);
      user.must_reset_password = false;
      user.force_reset_reason = '';
      clearLoginSecurity(emailLower);
      reset.used_at = new Date().toISOString();
      delete store.passwordResets[emailLower];
      recordAudit('password_reset_completed', user, user.id, { before: { mustResetPassword: true }, after: { mustResetPassword: false } });
      saveStore();
      return sendJSON(req, res, 200, { success: true, message: 'Password updated. You can log in now.' });
    } catch (error) {
      console.error('Password reset confirm error:', error.message);
      const statusCode = Number(error.statusCode || 500);
      return sendJSON(req, res, statusCode, { error: statusCode === 500 ? 'Server error while resetting password.' : error.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/logout') {
    destroySession(req);
    return sendJSON(req, res, 200, { success: true }, clearCookie(req));
  }

  if (req.method === 'GET' && pathname === '/api/me') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    return sendJSON(req, res, 200, { user: userResponse(auth.user) });
  }

  
if (req.method === 'GET' && pathname === '/api/profile') {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const joinInfo = getTeacherRelationSummary(auth.user);
  return sendJSON(req, res, 200, {
    profile: {
      id: auth.user.id,
      name: auth.user.name,
      email: auth.user.email,
      role: auth.user.role,
      className: auth.user.role === 'teacher' ? getTeacherBaseClassName(auth.user) : joinInfo.className,
      teacherCode: auth.user.teacher_code || '',
      teacherId: auth.user.teacher_id || null,
      classGroupId: auth.user.class_group_id || null,
      classAssistantFor: auth.user.class_assistant_for || null,
      classroomGroups: Array.isArray(auth.user.classroom_groups) ? auth.user.classroom_groups : [],
      joinInfo: {
        teacherName: joinInfo.teacherName || '',
        teacherEmail: joinInfo.teacherEmail || '',
        teacherCode: joinInfo.teacherCode || '',
        classCode: joinInfo.classCode || '',
        className: joinInfo.className || '',
        baseClassName: joinInfo.baseClassName || '',
        groupId: joinInfo.groupId || null,
        groupName: joinInfo.groupName || '',
        joinedAt: joinInfo.joinedAt || null
      }
    }
  });
}

if (req.method === 'POST' && pathname === '/api/profile') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    return sendJSON(req, res, 400, { error: 'Name and email are locked to the original signup details in this build.' });
  }

  
if (req.method === 'POST' && pathname === '/api/profile/join-class') {
  const auth = requireRole(req, res, ['student', 'class_assistant']);
  if (!auth) return;
  const body = await parseBody(req);
  const code = sanitizeJoinCode(body.teacherCode || body.classCode || '');
  const rateLimit = requireRateLimit(req, res, 'class_join', [String(auth.user.id || ''), code || 'empty']);
  if (!rateLimit) return;
  if (!code) return sendJSON(req, res, 400, { error: 'Enter a class code first.' });
  const joinTarget = getJoinTargetByCode(code);
  const teacher = joinTarget?.teacher || null;
  const group = joinTarget?.group || null;
  if (!teacher) return sendJSON(req, res, 404, { error: 'That class code was not found.' });
  if (auth.user.role === 'class_assistant' && auth.user.class_assistant_for && auth.user.class_assistant_for !== teacher.id) {
    return sendJSON(req, res, 400, { error: 'This assistant account is already attached to another teacher.' });
  }
  if (auth.user.teacher_id && Number(auth.user.teacher_id) !== teacher.id) {
    return sendJSON(req, res, 400, { error: 'This account is already attached to another teacher. Leave that class before joining a new one.' });
  }
  const joined = assignStudentToTeacher(auth.user, teacher, auth.user, 'profile_join', { groupId: group?.id || null, joinCode: code });
  if (!joined) return sendJSON(req, res, 400, { error: 'This account cannot join that classroom right now.' });
  saveStore();
  return sendJSON(req, res, 200, {
    success: true,
    teacher: {
      id: teacher.id,
      name: teacher.name,
      teacherCode: teacher.teacher_code,
      classCode: group?.code || teacher.teacher_code,
      className: getClassDisplayName(teacher, group?.id || null),
      groupName: group?.name || ''
    }
  });
}


if (req.method === 'POST' && pathname === '/api/profile/leave-class') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    if (!auth.user.teacher_id) return sendJSON(req, res, 400, { error: 'This account is not currently attached to a teacher.' });
    leaveTeacherClass(auth.user, auth.user, 'profile_leave');
    saveStore();
    return sendJSON(req, res, 200, { success: true });
  }

  if (req.method === 'GET' && pathname === '/api/classroom') {
    const auth = requireRole(req, res, ['teacher', 'class_assistant']);
    if (!auth) return;
    const teacher = getClassroomOwnerForUser(auth.user);
    if (!teacher) return sendJSON(req, res, 404, { error: 'No classroom is attached to this account.' });
    return sendJSON(req, res, 200, { classroom: buildClassroomPayload(auth.user, teacher) });
  }

  if (req.method === 'POST' && pathname === '/api/classroom/settings') {
    const auth = requireRole(req, res, ['teacher']);
    if (!auth) return;
    const body = await parseBody(req);
    const previousClassName = auth.user.class_name || defaultClassNameForTeacher(auth.user);
    auth.user.class_name = sanitizeClassroomLabel(body.className || '', defaultClassNameForTeacher(auth.user));
    ensureTeacherFields(auth.user);
    recordAudit('classroom_settings_updated', auth.user, auth.user.id, { before: { className: previousClassName }, after: { className: auth.user.class_name } });
    saveStore();
    return sendJSON(req, res, 200, { success: true, classroom: buildClassroomPayload(auth.user, auth.user) });
  }

  if (req.method === 'POST' && pathname === '/api/classroom/groups') {
    const auth = requireRole(req, res, ['teacher']);
    if (!auth) return;
    const body = await parseBody(req);
    const name = sanitizeClassroomLabel(body.name || '', '');
    if (!name) return sendJSON(req, res, 400, { error: 'Enter a group name first.' });
    ensureTeacherFields(auth.user);
    auth.user.classroom_groups = Array.isArray(auth.user.classroom_groups) ? auth.user.classroom_groups : [];
    auth.user.classroom_groups.push({
      id: `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      code: generateTeacherCode(),
      created_at: new Date().toISOString()
    });
    recordAudit('classroom_group_created', auth.user, auth.user.id, { name });
    saveStore();
    return sendJSON(req, res, 200, { success: true, classroom: buildClassroomPayload(auth.user, auth.user) });
  }

  const classroomGroupMatch = routeMatch(pathname, /^\/api\/classroom\/groups\/([^/]+)$/);
  if (req.method === 'POST' && classroomGroupMatch) {
    const auth = requireRole(req, res, ['teacher']);
    if (!auth) return;
    ensureTeacherFields(auth.user);
    const group = findTeacherGroup(auth.user, decodeURIComponent(classroomGroupMatch[0]));
    if (!group) return sendJSON(req, res, 404, { error: 'Group not found.' });
    const body = await parseBody(req);
    const previousName = group.name || '';
    const name = sanitizeClassroomLabel(body.name || '', group.name || '');
    if (!name) return sendJSON(req, res, 400, { error: 'Enter a valid group name.' });
    group.name = name;
    recordAudit('classroom_group_updated', auth.user, auth.user.id, { groupId: group.id, before: { name: previousName }, after: { name } });
    saveStore();
    return sendJSON(req, res, 200, { success: true, classroom: buildClassroomPayload(auth.user, auth.user) });
  }

  const classroomGroupRegenMatch = routeMatch(pathname, /^\/api\/classroom\/groups\/([^/]+)\/regenerate-code$/);
  if (req.method === 'POST' && classroomGroupRegenMatch) {
    const auth = requireRole(req, res, ['teacher']);
    if (!auth) return;
    ensureTeacherFields(auth.user);
    const group = findTeacherGroup(auth.user, decodeURIComponent(classroomGroupRegenMatch[0]));
    if (!group) return sendJSON(req, res, 404, { error: 'Group not found.' });
    const previousCode = group.code || '';
    group.code = generateTeacherCode();
    recordAudit('classroom_group_code_regenerated', auth.user, auth.user.id, { groupId: group.id, before: { code: previousCode }, after: { code: group.code } });
    saveStore();
    return sendJSON(req, res, 200, { success: true, classroom: buildClassroomPayload(auth.user, auth.user) });
  }

  if (req.method === 'DELETE' && classroomGroupMatch) {
    const auth = requireRole(req, res, ['teacher']);
    if (!auth) return;
    ensureTeacherFields(auth.user);
    const groupId = decodeURIComponent(classroomGroupMatch[0]);
    const beforeCount = Array.isArray(auth.user.classroom_groups) ? auth.user.classroom_groups.length : 0;
    auth.user.classroom_groups = (auth.user.classroom_groups || []).filter(group => String(group.id) !== String(groupId));
    if (auth.user.classroom_groups.length === beforeCount) return sendJSON(req, res, 404, { error: 'Group not found.' });
    for (const student of getStudentsForTeacher(auth.user.id)) {
      if (String(student.class_group_id || '') === String(groupId)) student.class_group_id = null;
    }
    recordAudit('classroom_group_deleted', auth.user, auth.user.id, { groupId });
    saveStore();
    return sendJSON(req, res, 200, { success: true, classroom: buildClassroomPayload(auth.user, auth.user) });
  }

  const classroomStudentGroupMatch = routeMatch(pathname, /^\/api\/classroom\/students\/(\d+)\/group$/);
  if (req.method === 'POST' && classroomStudentGroupMatch) {
    const auth = requireRole(req, res, ['teacher', 'class_assistant']);
    if (!auth) return;
    const targetUser = getUserById(classroomStudentGroupMatch[0]);
    if (!targetUser) return sendJSON(req, res, 404, { error: 'Student not found.' });
    if (!requireManageTarget(req, res, auth.user, targetUser, 'assign-group')) return;
    const teacher = getClassroomOwnerForUser(auth.user);
    if (!teacher) return sendJSON(req, res, 404, { error: 'No classroom is attached to this account.' });
    const body = await parseBody(req);
    const requestedGroupId = sanitizePlainText(body.groupId || '', 64, { preserveCase: true });
    const group = requestedGroupId ? findTeacherGroup(teacher, requestedGroupId) : null;
    if (requestedGroupId && !group) return sendJSON(req, res, 404, { error: 'That group does not exist.' });
    targetUser.class_group_id = group ? group.id : null;
    recordAudit('classroom_student_group_updated', auth.user, targetUser.id, { teacherId: teacher.id, groupId: targetUser.class_group_id || null });
    saveStore();
    return sendJSON(req, res, 200, { success: true, classroom: buildClassroomPayload(auth.user, teacher) });
  }


  if (req.method === 'GET' && pathname === '/api/progress') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const progress = ensureProgress(auth.user.id);
    return sendJSON(req, res, 200, summarizeProgress(progress));
  }

  if (req.method === 'POST' && pathname === '/api/progress') {
    try {
      const auth = requireAuth(req, res);
      if (!auth) return;

      const data = await parseBody(req);
      const progress = ensureProgress(auth.user.id);
      progress.completed_modules = Array.isArray(data.completedModules) ? data.completedModules.map(Number).filter(n => n >= 1 && n <= 6) : [];
      progress.quiz_scores = sanitizeProgressCollection(data.quizScores || {}, 0) || {};
      progress.quiz_answers = sanitizeProgressCollection(data.quizAnswers || {}, 0) || {};
      progress.quiz_selections = sanitizeProgressCollection(data.quizSelections || {}, 0) || {};
      progress.quiz_metrics = sanitizeProgressCollection(data.quizMetrics || {}, 0) || {};
      progress.credit_scores = sanitizeCreditScores(data.creditScores || []);
      progress.updated_at = new Date().toISOString();
      saveStore();

      return sendJSON(req, res, 200, { success: true });
    } catch (error) {
      console.error('Progress save error:', error.message);
      return sendJSON(req, res, 500, { error: 'Server error. Please try again.' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/analytics') {
    try {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const body = await parseBody(req);
      const items = Array.isArray(body.items) ? body.items : [];
      if (updateAnalyticsFromItems(auth.user, items)) saveStore();
      return sendJSON(req, res, 200, { success: true });
    } catch (error) {
      console.error('Analytics save error:', error.message);
      return sendJSON(req, res, 500, { error: 'Could not save analytics.' });
    }
  }

  if (req.method === 'GET' && pathname === '/api/admin/users') {
    const auth = requireRole(req, res, ['admin', 'moderator', 'teacher', 'class_assistant']);
    if (!auth) return;
    let visibleUsers = store.users.slice();
    if (auth.user.role === 'teacher') {
      visibleUsers = store.users.filter(user => user.id === auth.user.id || Number(user.teacher_id || 0) === auth.user.id || Number(user.class_assistant_for || 0) === auth.user.id);
    } else if (auth.user.role === 'class_assistant') {
      const teacherId = auth.user.class_assistant_for || 0;
      visibleUsers = store.users.filter(user => user.id === auth.user.id || user.id === teacherId || Number(user.teacher_id || 0) === teacherId);
    }
    const users = visibleUsers.map(getAdminUserSummary).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const overview = {
      totalUsers: users.length,
      verifiedUsers: users.filter(u => u.emailVerified).length,
      admins: users.filter(u => u.role === 'admin').length,
      moderators: users.filter(u => u.role === 'moderator').length,
      teachers: users.filter(u => u.role === 'teacher').length,
      assistants: users.filter(u => u.role === 'class_assistant').length,
      students: users.filter(u => u.role === 'student').length,
      lockedUsers: users.filter(u => u.mustResetPassword || (u.security && u.security.locked)).length,
      totalTrackedTimeMs: users.reduce((sum, u) => sum + Number(u.analytics.totalActiveMs || 0), 0)
    };
    return sendJSON(req, res, 200, {
      currentUser: userResponse(auth.user),
      capabilities: {
        canDeleteUsers: auth.user.role === 'admin',
        canManageRoles: auth.user.role === 'admin' || auth.user.role === 'teacher',
        canForcePasswordReset: auth.user.role === 'admin',
        canEditProgress: ['admin', 'moderator', 'teacher', 'class_assistant'].includes(auth.user.role),
        canExport: true,
        canViewClassroom: ['teacher', 'class_assistant'].includes(auth.user.role),
        canEditClassroomSettings: auth.user.role === 'teacher',
        canManageClassroomStudents: ['teacher', 'class_assistant'].includes(auth.user.role),
        isModerator: auth.user.role === 'moderator',
        isAdmin: auth.user.role === 'admin',
        isTeacher: auth.user.role === 'teacher',
        isClassAssistant: auth.user.role === 'class_assistant'
      },
      overview: { ...overview, totalTrackedTimeLabel: formatDuration(overview.totalTrackedTimeMs) },
      users,
    });
  }

  const removeStudentMatch = routeMatch(pathname, /^\/api\/teacher\/students\/(\d+)\/remove$/);
  if (req.method === 'POST' && removeStudentMatch) {
    const auth = requireRole(req, res, ['teacher', 'class_assistant', 'admin', 'moderator']);
    if (!auth) return;
    const targetUser = getUserById(removeStudentMatch[0]);
    if (!targetUser) return sendJSON(req, res, 404, { error: 'User not found.' });
    if (auth.user.role === 'teacher' || auth.user.role === 'class_assistant') {
      const restriction = requireManageTarget(req, res, auth.user, targetUser, 'remove-student');
      if (!restriction) return;
    }
    if (!targetUser.teacher_id) return sendJSON(req, res, 400, { error: 'That user is not attached to a teacher.' });
    leaveTeacherClass(targetUser, auth.user, 'teacher_removed');
    saveStore();
    return sendJSON(req, res, 200, { success: true, user: getAdminUserSummary(targetUser) });
  }

  if (req.method === 'GET' && pathname === '/api/admin/export/users') {
    const auth = requireRole(req, res, ['admin', 'moderator', 'teacher']);
    if (!auth) return;
    const requestedIds = String(parsed.query.ids || '')
      .split(',')
      .map(value => Number(value))
      .filter(value => Number.isInteger(value) && value > 0);
    const uniqueIds = Array.from(new Set(requestedIds));
    const users = uniqueIds.length
      ? uniqueIds.map(id => getUserById(id)).filter(Boolean)
      : store.users.slice();
    return sendJSON(req, res, 200, {
      exportedAt: new Date().toISOString(),
      count: users.length,
      users: users.map(buildAdminExportUser),
    });
  }


  if (req.method === 'GET' && pathname === '/api/admin/audit') {
    const auth = requireRole(req, res, ['admin', 'moderator', 'teacher', 'class_assistant']);
    if (!auth) return;
    const page = Math.max(1, Number(parsed.query.page || 1));
    const pageSize = Math.max(10, Math.min(100, Number(parsed.query.pageSize || 25)));
    const scoped = getScopedAuditEntries(auth.user, { from: parsed.query.from || '', to: parsed.query.to || '' }).map(normalizeAuditEntryForClient).filter(Boolean);
    const filtered = filterAuditEntries(scoped, {
      query: parsed.query.query || '',
      action: parsed.query.action || '',
      category: parsed.query.category || '',
      actorRole: parsed.query.actorRole || '',
      deviceType: parsed.query.deviceType || '',
      status: parsed.query.status || '',
      severity: parsed.query.severity || ''
    });
    const start = (page - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);
    return sendJSON(req, res, 200, {
      rows,
      page,
      pageSize,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      summary: buildAuditSummary(filtered),
      filterOptions: buildAuditFilterOptions(scoped)
    });
  }

  if (req.method === 'GET' && pathname === '/api/admin/export/audit') {
    const auth = requireRole(req, res, ['admin', 'moderator', 'teacher', 'class_assistant']);
    if (!auth) return;
    const format = String(parsed.query.format || 'json').toLowerCase() === 'csv' ? 'csv' : 'json';
    const from = String(parsed.query.from || '').trim();
    const to = String(parsed.query.to || '').trim();
    const scoped = getScopedAuditEntries(auth.user, { from, to }).map(normalizeAuditEntryForClient).filter(Boolean);
    const entries = filterAuditEntries(scoped, {
      query: parsed.query.query || '',
      action: parsed.query.action || '',
      category: parsed.query.category || '',
      actorRole: parsed.query.actorRole || '',
      deviceType: parsed.query.deviceType || '',
      status: parsed.query.status || '',
      severity: parsed.query.severity || ''
    });
    if (format === 'csv') {
      return sendText(req, res, 200, buildAuditCsv(entries), 'text/csv; charset=utf-8');
    }
    return sendText(req, res, 200, JSON.stringify({ exportedAt: new Date().toISOString(), from, to, count: entries.length, entries }, null, 2), 'application/json; charset=utf-8');
  }

  if (req.method === 'POST' && pathname === '/api/admin/users/batch') {
    const auth = requireRole(req, res, ['admin', 'moderator', 'teacher', 'class_assistant']);
    if (!auth) return;
    const body = await parseBody(req);
    const action = sanitizePlainText(body.action || '', 40, { preserveCase: false }).toLowerCase();
    const ids = Array.from(new Set((Array.isArray(body.userIds) ? body.userIds : [])
      .map(value => Number(value))
      .filter(value => Number.isInteger(value) && value > 0)));
    const reason = sanitizeReason(body.reason || '');
    const requestedRole = normalizeRole(sanitizePlainText(body.role || '', 40, { preserveCase: false }).toLowerCase());
    const teacherId = Number(body.teacherId || 0);
    const teacher = teacherId ? getTeacherById(teacherId) : null;
    if (!ids.length) return sendJSON(req, res, 400, { error: 'Select at least one user first.' });
    if (!['reset-progress', 'force-password-reset', 'delete', 'set-role', 'attach-teacher', 'clear-teacher'].includes(action)) {
      return sendJSON(req, res, 400, { error: 'Unsupported batch action.' });
    }
    if ((action === 'force-password-reset' || action === 'delete') && auth.user.role !== 'admin') {
      return sendJSON(req, res, 403, { error: 'Only admins can run that batch action.' });
    }
    if ((action === 'attach-teacher' || action === 'clear-teacher') && !['admin', 'moderator'].includes(auth.user.role)) {
      return sendJSON(req, res, 403, { error: 'Only admins or moderators can run teacher attachment overrides.' });
    }
    if (auth.user.role === 'class_assistant' && action !== 'reset-progress') {
      return sendJSON(req, res, 403, { error: 'Assistant teachers can only batch reset progress for their class students.' });
    }
    if (action === 'set-role' && !['student', 'class_assistant', 'teacher', 'moderator', 'admin'].includes(requestedRole)) {
      return sendJSON(req, res, 400, { error: 'Select a valid role first.' });
    }
    if (action === 'attach-teacher' && !teacher) {
      return sendJSON(req, res, 404, { error: 'Teacher not found.' });
    }

    const results = [];
    let changed = false;
    for (const userId of ids) {
      const targetUser = getUserById(userId);
      if (!targetUser) {
        results.push({ userId, success: false, error: 'User not found.' });
        continue;
      }
      const restrictionAction = action === 'set-role' ? 'role' : action === 'attach-teacher' || action === 'clear-teacher' ? 'teacher-override' : action;
      const restriction = getManageRestriction(auth.user, targetUser, restrictionAction);
      if (!restriction.allowed) {
        results.push({ userId, success: false, error: restriction.reason, email: targetUser.email, name: targetUser.name });
        continue;
      }
      if (action === 'reset-progress') {
        const progress = ensureProgress(targetUser.id);
        progress.completed_modules = [];
        progress.quiz_scores = {};
        progress.quiz_answers = {};
        progress.quiz_selections = {};
        progress.quiz_metrics = {};
        progress.credit_scores = [];
        progress.updated_at = new Date().toISOString();
        recordAudit('admin_batch_reset_progress', auth.user, targetUser.id, {});
        results.push({ userId, success: true, email: targetUser.email, name: targetUser.name });
        changed = true;
        continue;
      }
      if (action === 'force-password-reset') {
        if (isProtectedSystemAccount(targetUser)) {
          results.push({ userId, success: false, error: 'The built-in system admin account cannot receive a forced password reset.', email: targetUser.email, name: targetUser.name });
          continue;
        }
        const code = generateCode();
        const meta = {
          timezone: targetUser.created_meta?.timezone || '',
          locale: targetUser.created_meta?.locale || '',
          ip: targetUser.created_meta?.ip || '',
          user_agent: targetUser.created_meta?.user_agent || '',
          created_at_local: new Date().toISOString(),
          received_at: new Date().toISOString(),
          referrer: 'Admin batch password reset'
        };
        store.passwordResets[targetUser.email] = {
          code_hash: hashCode(code),
          expires_at: new Date(Date.now() + RESET_TTL_MS).toISOString(),
          requested_at: new Date().toISOString(),
          requested_by: auth.user.email,
          reason,
          attempts: 0,
          last_attempt_at: null,
          used_at: null,
          meta
        };
        clearLoginSecurity(targetUser.email);
        targetUser.must_reset_password = true;
        targetUser.force_reset_reason = reason;
        try {
          await sendPasswordResetEmail(targetUser.email, code, meta, reason || 'An administrator initiated a security reset for your account.');
        } catch (error) {
          console.error('Batch password reset email failed:', error.message);
        }
        recordAudit('admin_batch_force_password_reset', auth.user, targetUser.id, { reason });
        results.push({ userId, success: true, email: targetUser.email, name: targetUser.name });
        changed = true;
        continue;
      }
      if (action === 'delete') {
        if (isProtectedSystemAccount(targetUser)) {
          results.push({ userId, success: false, error: 'The built-in system admin account cannot be deleted.', email: targetUser.email, name: targetUser.name });
          continue;
        }
        if (targetUser.id === auth.user.id) {
          results.push({ userId, success: false, error: 'You cannot delete your own admin account from here.', email: targetUser.email, name: targetUser.name });
          continue;
        }
        recordAudit('admin_batch_delete_user', auth.user, targetUser.id, { email: targetUser.email, teacherId: Number(targetUser.teacher_id || targetUser.class_assistant_for || 0) || null });
        deleteUserData(targetUser.id);
        results.push({ userId, success: true, email: targetUser.email, name: targetUser.name });
        changed = true;
        continue;
      }
      if (action === 'set-role') {
        if (isProtectedSystemAccount(targetUser)) {
          results.push({ userId, success: false, error: 'The built-in system admin account is protected and its role cannot be changed.', email: targetUser.email, name: targetUser.name });
          continue;
        }
        const previousRole = targetUser.role;
        if (Number(auth.user.id || 0) === Number(targetUser.id || 0) && requestedRole !== targetUser.role) {
          results.push({ userId, success: false, error: 'You cannot change your own privilege level here.', email: targetUser.email, name: targetUser.name });
          continue;
        }
        if (auth.user.role === 'teacher') {
          if (!['student', 'class_assistant'].includes(requestedRole)) {
            results.push({ userId, success: false, error: 'Teachers can only assign Student or Assistant Teacher inside their class.', email: targetUser.email, name: targetUser.name });
            continue;
          }
          const joinedToTeacher = Number(targetUser.teacher_id || 0) === Number(auth.user.id);
          const alreadyAssistantForTeacher = Number(targetUser.class_assistant_for || 0) === Number(auth.user.id);
          if (!joinedToTeacher && !alreadyAssistantForTeacher) {
            results.push({ userId, success: false, error: 'That user must already be joined to your class before you can manage assistant-teacher status.', email: targetUser.email, name: targetUser.name });
            continue;
          }
          if (requestedRole === 'class_assistant' && !joinedToTeacher) {
            results.push({ userId, success: false, error: 'Only students already joined to your class can be promoted to assistant teacher.', email: targetUser.email, name: targetUser.name });
            continue;
          }
          targetUser.class_assistant_for = requestedRole === 'class_assistant' ? auth.user.id : null;
          targetUser.role = requestedRole;
        } else {
          if (auth.user.role === 'moderator' && requestedRole !== 'student') {
            results.push({ userId, success: false, error: 'Moderators can only keep managed users as students.', email: targetUser.email, name: targetUser.name });
            continue;
          }
          if (targetUser.role === 'teacher' && requestedRole !== 'teacher') {
            unassignStudentsFromTeacher(targetUser.id, auth.user, 'teacher_downgraded');
          }
          if (requestedRole === 'class_assistant' && !targetUser.teacher_id) {
            results.push({ userId, success: false, error: 'Assistant teachers must already be attached to a classroom.', email: targetUser.email, name: targetUser.name });
            continue;
          }
          if (['admin', 'moderator', 'teacher'].includes(requestedRole)) {
            if (targetUser.teacher_id) leaveTeacherClass(targetUser, auth.user, 'role_elevated');
            targetUser.teacher_id = null;
            targetUser.class_group_id = null;
            targetUser.class_assistant_for = null;
          }
          if (requestedRole !== 'class_assistant') targetUser.class_assistant_for = null;
          targetUser.role = requestedRole;
          ensureTeacherFields(targetUser);
        }
        recordAudit('admin_batch_set_role', auth.user, targetUser.id, { before: { role: previousRole }, after: { role: requestedRole } });
        results.push({ userId, success: true, email: targetUser.email, name: targetUser.name });
        changed = true;
        continue;
      }
      if (action === 'attach-teacher') {
        if (!['student', 'class_assistant'].includes(targetUser.role)) {
          results.push({ userId, success: false, error: 'Only students or assistant teachers can be attached to a classroom here.', email: targetUser.email, name: targetUser.name });
          continue;
        }
        const attached = assignStudentToTeacher(targetUser, teacher, auth.user, 'admin_batch_attach', { allowTransfer: true, groupId: null });
        if (!attached) {
          results.push({ userId, success: false, error: 'That user cannot be attached to the selected teacher.', email: targetUser.email, name: targetUser.name });
          continue;
        }
        recordAudit('admin_batch_attach_teacher', auth.user, targetUser.id, { teacherId: teacher.id, teacherEmail: teacher.email });
        results.push({ userId, success: true, email: targetUser.email, name: targetUser.name });
        changed = true;
        continue;
      }
      if (action === 'clear-teacher') {
        if (!targetUser.teacher_id) {
          results.push({ userId, success: false, error: 'That user is not attached to a teacher right now.', email: targetUser.email, name: targetUser.name });
          continue;
        }
        leaveTeacherClass(targetUser, auth.user, 'admin_batch_detach');
        recordAudit('admin_batch_clear_teacher', auth.user, targetUser.id, { teacherId: Number(targetUser.teacher_id || targetUser.class_assistant_for || 0) || null });
        results.push({ userId, success: true, email: targetUser.email, name: targetUser.name });
        changed = true;
        continue;
      }
    }
    if (changed) saveStore();
    return sendJSON(req, res, 200, {
      success: true,
      action,
      results,
      users: store.users.map(getAdminUserSummary).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    });
  }

  const progressMatch = routeMatch(pathname, /^\/api\/admin\/users\/(\d+)\/progress$/);
  if (req.method === 'POST' && progressMatch) {
    const auth = requireRole(req, res, ['admin', 'moderator', 'teacher', 'class_assistant']);
    if (!auth) return;
    const targetUser = getUserById(progressMatch[0]);
    if (!targetUser) return sendJSON(req, res, 404, { error: 'User not found.' });
    if (!requireManageTarget(req, res, auth.user, targetUser, 'progress')) return;
    const body = await parseBody(req);
    const step = Math.max(1, Math.min(7, Number(body.step || 1)));
    const progress = ensureProgress(targetUser.id);
    progress.completed_modules = Array.from({ length: Math.max(0, step - 1) }, (_, idx) => idx + 1);
    if (step <= 6) {
      for (let i = step; i <= 6; i += 1) {
        delete progress.quiz_scores[i];
        delete progress.quiz_answers[i];
        delete progress.quiz_selections[i];
      }
    }
    progress.updated_at = new Date().toISOString();
    recordAudit('admin_set_progress', auth.user, targetUser.id, { step });
    saveStore();
    return sendJSON(req, res, 200, { success: true, user: getAdminUserSummary(targetUser) });
  }

  const resetProgressMatch = routeMatch(pathname, /^\/api\/admin\/users\/(\d+)\/reset-progress$/);
  if (req.method === 'POST' && resetProgressMatch) {
    const auth = requireRole(req, res, ['admin', 'moderator', 'teacher', 'class_assistant']);
    if (!auth) return;
    const targetUser = getUserById(resetProgressMatch[0]);
    if (!targetUser) return sendJSON(req, res, 404, { error: 'User not found.' });
    if (!requireManageTarget(req, res, auth.user, targetUser, 'reset-progress')) return;
    const progress = ensureProgress(targetUser.id);
    progress.completed_modules = [];
    progress.quiz_scores = {};
    progress.quiz_answers = {};
    progress.quiz_selections = {};
    progress.quiz_metrics = {};
    progress.credit_scores = [];
    progress.updated_at = new Date().toISOString();
    recordAudit('admin_reset_progress', auth.user, targetUser.id, {});
    saveStore();
    return sendJSON(req, res, 200, { success: true, user: getAdminUserSummary(targetUser) });
  }

  const teacherOverrideMatch = routeMatch(pathname, /^\/api\/admin\/users\/(\d+)\/teacher-override$/);
  if (teacherOverrideMatch) {
    const auth = requireRole(req, res, ['admin', 'moderator']);
    if (!auth) return;
    const targetUser = getUserById(teacherOverrideMatch[0]);
    if (!targetUser) return sendJSON(req, res, 404, { error: 'User not found.' });
    const restriction = getManageRestriction(auth.user, targetUser, 'teacher-override');
    if (!restriction.allowed) return sendJSON(req, res, 403, { error: restriction.reason });
    if (!['student', 'class_assistant'].includes(targetUser.role)) return sendJSON(req, res, 400, { error: 'Only students or assistant teachers can be attached to a classroom here.' });

    if (req.method === 'DELETE') {
      if (!targetUser.teacher_id) return sendJSON(req, res, 400, { error: 'That user is not attached to a teacher right now.' });
      const previousTeacherId = Number(targetUser.teacher_id || targetUser.class_assistant_for || 0) || null;
      leaveTeacherClass(targetUser, auth.user, 'admin_override_detach');
      recordAudit('admin_override_clear_teacher', auth.user, targetUser.id, { teacherId: previousTeacherId });
      saveStore();
      return sendJSON(req, res, 200, { success: true, user: getAdminUserSummary(targetUser) });
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const teacherId = Number(body.teacherId || 0);
      const teacher = getTeacherById(teacherId);
      if (!teacher) return sendJSON(req, res, 404, { error: 'Teacher not found.' });
      const requestedGroupId = sanitizePlainText(body.groupId || '', 64, { preserveCase: true });
      const group = requestedGroupId ? findTeacherGroup(teacher, requestedGroupId) : null;
      const attached = assignStudentToTeacher(targetUser, teacher, auth.user, 'admin_override_attach', { allowTransfer: true, groupId: group ? group.id : null });
      if (!attached) return sendJSON(req, res, 400, { error: 'That user cannot be attached to the selected teacher.' });
      recordAudit('admin_override_attach_teacher', auth.user, targetUser.id, { teacherId: teacher.id, teacherEmail: teacher.email, groupId: group ? group.id : null });
      saveStore();
      return sendJSON(req, res, 200, { success: true, user: getAdminUserSummary(targetUser) });
    }
  }

  const roleMatch = routeMatch(pathname, /^\/api\/admin\/users\/(\d+)\/role$/);
  if (req.method === 'POST' && roleMatch) {
    const auth = requireRole(req, res, ['admin', 'moderator', 'teacher']);
    if (!auth) return;
    const targetUser = getUserById(roleMatch[0]);
    if (!targetUser) return sendJSON(req, res, 404, { error: 'User not found.' });
    if (isProtectedSystemAccount(targetUser)) {
      return sendJSON(req, res, 403, { error: 'The built-in system admin account is protected and its role cannot be changed.' });
    }
    const body = await parseBody(req);
    const requestedRoleRaw = sanitizePlainText(body.role || '', 40, { preserveCase: false }).toLowerCase();
    if (!['student', 'class_assistant', 'teacher', 'moderator', 'admin'].includes(requestedRoleRaw)) {
      return sendJSON(req, res, 400, { error: 'Unsupported role value.' });
    }
    const role = normalizeRole(requestedRoleRaw);
    const previousRole = targetUser.role;
    if (Number(auth.user.id || 0) === Number(targetUser.id || 0) && role !== targetUser.role) {
      return sendJSON(req, res, 403, { error: 'You cannot change your own privilege level here.' });
    }
    if (auth.user.role === 'teacher') {
      const restriction = requireManageTarget(req, res, auth.user, targetUser, 'role');
      if (!restriction) return;
      if (!['student', 'class_assistant'].includes(role)) return sendJSON(req, res, 403, { error: 'Teachers can only assign Student or Assistant Teacher inside their class.' });
      const joinedToTeacher = Number(targetUser.teacher_id || 0) === Number(auth.user.id);
      const alreadyAssistantForTeacher = Number(targetUser.class_assistant_for || 0) === Number(auth.user.id);
      if (!joinedToTeacher && !alreadyAssistantForTeacher) {
        return sendJSON(req, res, 403, { error: 'That user must already be joined to your class before you can manage assistant-teacher status.' });
      }
      if (role === 'class_assistant' && !joinedToTeacher) {
        return sendJSON(req, res, 403, { error: 'Only students already joined to your class can be promoted to assistant teacher.' });
      }
      targetUser.class_assistant_for = role === 'class_assistant' ? auth.user.id : null;
      targetUser.role = role;
    } else {
      const restriction = getManageRestriction(auth.user, targetUser, 'role');
      if (!restriction.allowed) return sendJSON(req, res, 403, { error: restriction.reason });
      if (auth.user.role === 'moderator' && role !== 'student') {
        return sendJSON(req, res, 403, { error: 'Moderators can only keep managed users as students.' });
      }
      if (targetUser.role === 'teacher' && role !== 'teacher') {
        unassignStudentsFromTeacher(targetUser.id, auth.user, 'teacher_downgraded');
      }
      if (role === 'class_assistant' && !targetUser.teacher_id) {
        return sendJSON(req, res, 400, { error: 'Assistant teachers must already be attached to a classroom.' });
      }
      if (['admin', 'moderator', 'teacher'].includes(role)) {
        if (targetUser.teacher_id) leaveTeacherClass(targetUser, auth.user, 'role_elevated');
        targetUser.teacher_id = null;
        targetUser.class_group_id = null;
        targetUser.class_assistant_for = null;
      }
      if (role !== 'class_assistant') targetUser.class_assistant_for = null;
      targetUser.role = role;
      ensureTeacherFields(targetUser);
    }
    recordAudit('admin_set_role', auth.user, targetUser.id, { before: { role: previousRole }, after: { role } });
    saveStore();
    return sendJSON(req, res, 200, { success: true, user: getAdminUserSummary(targetUser) });
  }

  const forceResetMatch = routeMatch(pathname, /^\/api\/admin\/users\/(\d+)\/force-password-reset$/);
  if (req.method === 'POST' && forceResetMatch) {
    const auth = requireRole(req, res, ['admin']);
    if (!auth) return;
    const targetUser = getUserById(forceResetMatch[0]);
    if (!targetUser) return sendJSON(req, res, 404, { error: 'User not found.' });
    if (isProtectedSystemAccount(targetUser)) {
      return sendJSON(req, res, 403, { error: 'The built-in system admin account cannot receive a forced password reset from the admin console.' });
    }
    const body = await parseBody(req);
    const reason = sanitizeReason(body.reason || '');
    const code = generateCode();
    const meta = {
      timezone: targetUser.created_meta?.timezone || '',
      locale: targetUser.created_meta?.locale || '',
      ip: targetUser.created_meta?.ip || '',
      user_agent: targetUser.created_meta?.user_agent || '',
      created_at_local: new Date().toISOString(),
      received_at: new Date().toISOString(),
      referrer: 'Admin initiated password reset'
    };
    store.passwordResets[targetUser.email] = {
      code_hash: hashCode(code),
      expires_at: new Date(Date.now() + RESET_TTL_MS).toISOString(),
      requested_at: new Date().toISOString(),
      requested_by: auth.user.email,
      reason,
      attempts: 0,
      last_attempt_at: null,
      used_at: null,
      meta
    };
    clearLoginSecurity(targetUser.email);
    targetUser.must_reset_password = true;
    targetUser.force_reset_reason = reason;
    recordAudit('admin_force_password_reset', auth.user, targetUser.id, { reason });
    saveStore();

    let emailSent = false;
    try {
      emailSent = await sendPasswordResetEmail(targetUser.email, code, meta, reason || 'An administrator initiated a security reset for your account.');
    } catch (error) {
      console.error('Admin password reset email failed:', error.message);
    }

    return sendJSON(req, res, 200, {
      success: true,
      message: emailSent ? 'Password reset email sent.' : 'Password reset code generated for testing.',
      user: getAdminUserSummary(targetUser),
      ...buildDebugCodeResponse(code)
    });
  }

  const deleteMatch = routeMatch(pathname, /^\/api\/admin\/users\/(\d+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    const auth = requireRole(req, res, ['admin']);
    if (!auth) return;
    const targetUser = getUserById(deleteMatch[0]);
    if (!targetUser) return sendJSON(req, res, 404, { error: 'User not found.' });
    if (isProtectedSystemAccount(targetUser)) {
      return sendJSON(req, res, 403, { error: 'The built-in system admin account cannot be deleted from the admin console.' });
    }
    if (targetUser.id === auth.user.id) {
      return sendJSON(req, res, 400, { error: 'You cannot delete your own admin account from here.' });
    }
    recordAudit('admin_delete_user', auth.user, targetUser.id, { email: targetUser.email, teacherId: Number(targetUser.teacher_id || targetUser.class_assistant_for || 0) || null });
    deleteUserData(targetUser.id);
    saveStore();
    return sendJSON(req, res, 200, { success: true });
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

bootstrapPersistentFiles();
loadStore();
const seededSysadmin = ensureSeedAdminAccount();
syncConfiguredRoles();
cleanupExpiredSessions();
cleanupExpiringRecords();
if (seededSysadmin) saveStore();

const server = http.createServer((req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  auditContextStorage.run(auditContext, () => {
    handleRequest(req, res).catch(error => {
      console.error('Unhandled server error:', error);
      if (!res.headersSent) {
        sendJSON(req, res, 500, { error: 'Server error. Please try again.' });
      } else {
        res.end();
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ╔═══════════════════════════════════════════╗`);
  console.log(`  ║   CrediStart Server Running!              ║`);
  console.log(`  ║   Port: ${PORT}                              ║`);
  console.log(`  ║   Data Dir: ${DATA_DIR} ║`);
  console.log(`  ║   Data File: ${DATA_PATH} ║`);
  console.log(`  ║   Email: ${getResendConfig() ? 'Resend API configured' : 'console/dev fallback'}                     ║`);
  if (getResendConfig()) {
    console.log(`Resend API: ${process.env.RESEND_API_URL || 'https://api.resend.com/emails'} | from: ${process.env.RESEND_FROM || process.env.SMTP_FROM || 'unknown'}`);
  }
  console.log(`  ╚═══════════════════════════════════════════╝\n`);
});
