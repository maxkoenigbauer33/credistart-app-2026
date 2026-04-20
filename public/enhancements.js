(function(){
  const extraStyle = document.createElement('style');
  extraStyle.textContent = `
    .auth-hint { font-size:.8rem; color:var(--lteal); margin-top:10px; line-height:1.5; }
    .auth-note { font-size:.82rem; color:#E2E8F0; margin-top:12px; line-height:1.55; }
    .auth-code-box { margin-top:10px; background:rgba(255,255,255,.12); border:1px dashed rgba(255,255,255,.28); padding:12px 14px; border-radius:12px; color:#fff; font-size:.9rem; }
    .auth-mini-link { color:var(--gold); text-decoration:underline; cursor:pointer; font-weight:700; }
    .auth-mini-link:hover { color:#fff; }
    .helper-row { display:flex; justify-content:space-between; gap:12px; align-items:center; margin-top:14px; flex-wrap:wrap; }
    .helper-row .auth-toggle { margin-top:0; }
    .muted-copy { font-size:.78rem; color:rgba(255,255,255,.72); }
    .field-status { margin-top:8px; font-size:.8rem; line-height:1.45; min-height:18px; }
    .field-status.neutral { color:rgba(255,255,255,.72); }
    .field-status.info { color:#90E0EF; }
    .field-status.success { color:#86EFAC; }
    .field-status.error { color:#FECACA; }
    .dob-reveal-wrap {
      display:none; margin:4px 0 14px; padding:0; opacity:0; transform:translateY(12px) scale(.98);
      transition:opacity .35s ease, transform .35s ease;
    }
    .dob-reveal-wrap.revealed {
      display:block; opacity:1; transform:translateY(0) scale(1);
      animation:pop .38s ease-out;
    }
    .dob-reveal-card {
      background:linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.08));
      border:1px solid rgba(255,255,255,.14); border-radius:16px; padding:14px 14px 12px;
      box-shadow:0 8px 24px rgba(10,34,64,.14);
    }
    .dob-reveal-head { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .dob-reveal-icon {
      width:36px; height:36px; border-radius:12px; display:flex; align-items:center; justify-content:center;
      background:linear-gradient(135deg, rgba(0,180,216,.22), rgba(139,92,246,.24)); font-size:1.1rem;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);
    }
    .dob-reveal-title { font-size:.92rem; font-weight:800; color:#fff; }
    .dob-reveal-sub { font-size:.76rem; color:rgba(255,255,255,.7); margin-top:2px; line-height:1.45; }
    .dob-date-input {
      display:block; width:100% !important; max-width:100% !important; min-width:0; box-sizing:border-box; margin:0; padding:14px 18px; padding-right:18px;
      border-radius:12px; border:2px solid rgba(255,255,255,.15); background:rgba(255,255,255,.08); color:#fff; font-size:1.02rem;
      outline:none; transition:all .3s; appearance:none; -webkit-appearance:none; background-clip:padding-box;
    }
    .dob-date-input:focus { border-color:var(--pink); background:rgba(255,255,255,.12); box-shadow:0 0 0 4px rgba(255,107,157,.12); }
    .dob-date-input::-webkit-calendar-picker-indicator { cursor:pointer; filter:invert(1) brightness(1.2); opacity:.9; }
    .dob-reveal-wrap, .dob-reveal-card, .dob-reveal-card .input-group { width:100%; max-width:100%; min-width:0; box-sizing:border-box; }
    .dob-reveal-card { overflow:hidden; }
    .tiny-btn, .secondary-btn {
      display:inline-flex; align-items:center; gap:8px; justify-content:center;
      border:none; border-radius:10px; cursor:pointer; font-weight:800; transition:all .2s;
    }
    .secondary-btn { padding:12px 16px; background:#fff; color:var(--navy); border:2px solid var(--lgray); position:relative; overflow:hidden; box-shadow:0 8px 18px rgba(10,34,64,.08); }
    .secondary-btn:hover { border-color:var(--teal); color:var(--teal); transform:translateY(-1px) scale(1.01); }
    .tiny-btn { padding:8px 12px; font-size:.8rem; background:var(--gradient1); color:#fff; position:relative; overflow:hidden; box-shadow:0 8px 18px rgba(10,34,64,.12); }
    .tiny-btn::after, .secondary-btn::after {
      content:''; position:absolute; inset:-20% auto -20% -45%; width:38%; transform:skewX(-20deg) translateX(-140%);
      background:linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.28), rgba(255,255,255,0)); pointer-events:none;
      transition:transform .42s ease;
    }
    .tiny-btn:hover::after, .secondary-btn:hover::after { transform:skewX(-20deg) translateX(420%); }
    .tiny-btn:hover { transform:translateY(-1px) scale(1.02); }
    .tiny-btn:active, .secondary-btn:active { transform:translateY(0) scale(.985); }
    .tiny-btn.danger { background:linear-gradient(135deg,#EF4444,#F97316); }
    .tiny-btn.gold { background:var(--gradient2); }
    .tiny-btn.ghost { background:transparent; border:1px solid var(--lgray); color:var(--navy); box-shadow:none; }
    .tiny-btn:disabled, .secondary-btn:disabled { opacity:.65; cursor:not-allowed; transform:none; }
    .admin-grid { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr); gap:18px; }
    .admin-toolbar { display:grid; gap:12px; align-items:stretch; margin-bottom:16px; }
    .admin-toolbar-row { display:grid; grid-template-columns:minmax(260px,.9fr) minmax(210px,.8fr) minmax(210px,.8fr) auto; gap:12px; align-items:center; }
    .admin-batch-shell { display:grid; grid-template-columns:minmax(220px,.9fr) minmax(0,1.1fr) auto auto; gap:12px; align-items:center; width:100%; }
    .admin-batch-shell.compact { grid-template-columns:minmax(0,1fr); }
    .admin-batch-shell.compact .admin-batch-controls { grid-template-columns:1fr; }
    .admin-batch-controls { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; min-width:0; }
    .admin-batch-summary { font-size:.78rem; color:var(--gray); line-height:1.5; }
    .admin-toolbar input, .admin-toolbar select,
    .admin-input, .admin-select, .admin-textarea {
      width:100%; padding:12px 14px; border:2px solid var(--lgray); border-radius:12px; background:#fff; font-size:.9rem; color:var(--navy);
    }
    .admin-textarea { min-height:92px; resize:vertical; }
    .admin-toolbar input { max-width:none; }
    .admin-table-wrap { overflow:auto; border:1px solid var(--lgray); border-radius:16px; min-width:0; }
    .admin-table { width:100%; border-collapse:collapse; background:#fff; min-width:780px; }
    .admin-table th, .admin-table td { padding:14px 12px; text-align:left; border-bottom:1px solid var(--lgray); font-size:.85rem; vertical-align:top; }
    .admin-table th { font-size:.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--gray); background:#F8FBFF; position:sticky; top:0; }
    .admin-table tr { cursor:pointer; transition:background .18s ease, box-shadow .18s ease; }
    .admin-table tr:hover { background:#F8FBFF; }
    .admin-table tr.selected { background:#D7EEFF; }
    .admin-table tr.focused { background:#EAF4FF; }
    .admin-table tr.selected.focused { background:#C3E3FF; box-shadow:inset 3px 0 0 var(--teal); }
    .admin-pill { display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:4px 10px; font-size:.75rem; font-weight:800; }
    .admin-pill.admin { background:#EDE9FE; color:#6D28D9; }
    .admin-pill.moderator { background:#DBEAFE; color:#1D4ED8; }
    .admin-pill.student { background:#E8EEF4; color:#475569; }
    .admin-pill.verified { background:#DCFCE7; color:#15803D; }
    .admin-pill.reset { background:#FEF3C7; color:#B45309; }
    .admin-detail-card { background:#fff; border-radius:18px; padding:22px; box-shadow:0 2px 12px rgba(10,34,64,.06); }
    .admin-section-title { font-size:.92rem; font-weight:900; color:var(--navy); margin-bottom:12px; display:flex; align-items:center; gap:8px; }
    .admin-metrics { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px; }
    .admin-metric { background:var(--bg); border-radius:14px; padding:14px; }
    .admin-metric .label { font-size:.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--gray); font-weight:700; }
    .admin-metric .value { font-size:1.12rem; font-weight:900; color:var(--navy); margin-top:4px; }
    .admin-meta-list { display:grid; gap:10px; }
    .admin-meta-row { display:flex; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid var(--lgray); }
    .admin-meta-row .key { font-size:.8rem; color:var(--gray); font-weight:700; }
    .admin-meta-row .val { font-size:.83rem; color:var(--navy); text-align:right; word-break:break-word; }
    .admin-actions { display:grid; gap:12px; }
    .admin-inline { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .admin-inline > * { flex:1; }
    .admin-list-block { display:grid; gap:8px; }
    .admin-list-item { background:var(--bg); border-radius:12px; padding:10px 12px; display:flex; justify-content:space-between; gap:12px; font-size:.83rem; }
    .audit-log { display:grid; gap:10px; }
    .audit-item { background:#fff; border-radius:14px; padding:14px 16px; border:1px solid var(--lgray); }
    .audit-item .title { font-size:.85rem; font-weight:800; color:var(--navy); margin-bottom:4px; }
    .audit-item .meta { font-size:.77rem; color:var(--gray); line-height:1.55; }
    .audit-log-footer { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:14px; flex-wrap:wrap; }
    .audit-log-page-copy { font-size:.78rem; color:var(--gray); }
    .audit-log-pagination { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .audit-log-pagination .secondary-btn, .audit-log-pagination .tiny-btn { min-width:42px; }
    .audit-log-pagination .is-active { background:var(--gradient1); color:#fff; border-color:transparent; }
    .audit-toolbar { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; margin-bottom:12px; flex-wrap:wrap; }
    .audit-toolbar-left, .audit-toolbar-right { display:flex; align-items:flex-end; gap:10px; flex-wrap:wrap; }
    .audit-toolbar label { display:block; font-size:.74rem; color:var(--gray); font-weight:700; margin-bottom:4px; }
    .audit-toolbar input[type="date"], .audit-toolbar select { min-height:42px; padding:10px 12px; border-radius:12px; border:1px solid var(--lgray); background:#fff; color:var(--navy); font:inherit; }
    .audit-toolbar .tiny-btn, .audit-toolbar .secondary-btn { white-space:nowrap; }
    .audit-summary-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:18px; }
    .audit-summary-card { background:#fff; border:1px solid var(--lgray); border-radius:16px; padding:14px 16px; }
    .audit-summary-card .kicker { font-size:.72rem; text-transform:uppercase; color:var(--gray); font-weight:800; letter-spacing:.08em; }
    .audit-summary-card .value { font-size:1.5rem; font-weight:900; color:var(--navy); margin-top:6px; }
    .audit-filter-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:12px; margin-bottom:14px; }
    .audit-filter-grid input, .audit-filter-grid select { min-height:42px; padding:10px 12px; border-radius:12px; border:1px solid var(--lgray); width:100%; }
    .audit-chip-row { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 14px; }
    .audit-chip { border:1px solid var(--lgray); background:#fff; color:var(--navy); border-radius:999px; padding:8px 12px; font-weight:700; cursor:pointer; }
    .audit-chip.active { background:var(--gradient1); color:#fff; border-color:transparent; }
    .audit-table-wrap { overflow:auto; border:1px solid var(--lgray); border-radius:18px; background:#fff; }
    .audit-table { width:100%; border-collapse:collapse; min-width:980px; }
    .audit-table th, .audit-table td { padding:12px 14px; border-bottom:1px solid #edf1f6; text-align:left; vertical-align:top; font-size:.83rem; color:var(--navy); }
    .audit-table th { background:#f7faff; font-size:.72rem; text-transform:uppercase; letter-spacing:.08em; color:var(--gray); }
    .audit-table tr:last-child td { border-bottom:none; }
    .audit-badge { display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:5px 10px; font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
    .audit-badge.category { background:#eef4ff; color:#35517a; }
    .audit-badge.status-success { background:#ecfdf3; color:#146c43; }
    .audit-badge.status-failed { background:#fff1f2; color:#b42318; }
    .audit-badge.status-warning { background:#fff7e6; color:#ad6800; }
    .audit-badge.severity-low { background:#f4f6f8; color:#52606d; }
    .audit-badge.severity-medium { background:#eef2ff; color:#4338ca; }
    .audit-badge.severity-high { background:#fff1f2; color:#b42318; }
    .audit-identity { display:grid; gap:3px; }
    .audit-identity .primary { font-weight:800; }
    .audit-identity .secondary, .secondary { color:var(--gray); font-size:.77rem; }
    .audit-row-summary { font-weight:700; text-transform:capitalize; }
    .audit-detail-panel { background:#f8fbff; border:1px solid #e3ebf5; border-radius:16px; padding:14px; margin-top:10px; }
    .audit-detail-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:12px; }
    .audit-detail-block .label { font-size:.7rem; text-transform:uppercase; color:var(--gray); font-weight:800; margin-bottom:6px; }
    .audit-json { white-space:pre-wrap; word-break:break-word; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.73rem; background:#fff; border:1px solid #e3ebf5; border-radius:12px; padding:10px 12px; color:#243b53; }
    .admin-empty { background:var(--bg); border-radius:16px; padding:30px 20px; text-align:center; color:var(--gray); }
    @media (max-width: 980px) { .admin-grid { grid-template-columns:1fr; } }

    .password-compact-copy { font-size:.76rem; color:rgba(255,255,255,.84); margin-top:6px; }
    .password-rule-list { list-style:none; margin:8px 0 0; padding:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .password-rule-list li { display:flex; align-items:center; gap:8px; font-size:.76rem; padding:7px 9px; border-radius:10px; background:rgba(255,255,255,.06); }
    .password-rule-list li.good { color:#86EFAC; border:1px solid rgba(134,239,172,.28); }
    .password-rule-list li.bad { color:#FDE68A; border:1px solid rgba(253,230,138,.18); }
    .password-rule-list .rule-icon { width:16px; display:inline-flex; justify-content:center; font-weight:900; }
    .dob-reveal-card.helper-collapsed .dob-reveal-head { display:none; }
    .admin-manage-note { margin-top:14px; padding:12px 14px; border-radius:14px; background:#FFF7ED; color:#9A3412; border:1px solid #FED7AA; font-size:.82rem; line-height:1.5; }
    .admin-quiz-grid { display:grid; grid-template-columns:1.15fr .85fr; gap:18px; }
    .admin-quiz-card { background:#fff; border-radius:18px; padding:18px; border:1px solid var(--lgray); box-shadow:0 3px 10px rgba(10,34,64,.04); }
    .admin-quiz-table { width:100%; border-collapse:collapse; }
    .admin-quiz-table th, .admin-quiz-table td { padding:11px 10px; text-align:left; border-bottom:1px solid var(--lgray); font-size:.82rem; }
    .admin-quiz-table th { font-size:.74rem; text-transform:uppercase; letter-spacing:1px; color:var(--gray); }
    .admin-shell { width:100%; max-width:none; margin:0 auto; display:grid; gap:18px; min-width:0; }
    #page-admin { padding-bottom:40px; }
    .admin-top-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
    .admin-top-card { background:#fff; border-radius:22px; padding:18px 20px; box-shadow:0 10px 28px rgba(10,34,64,.08); border:1px solid rgba(10,34,64,.05); }
    .admin-top-card .stat-label { font-size:.74rem; text-transform:uppercase; letter-spacing:1.1px; color:var(--gray); font-weight:800; }
    .admin-top-card .stat-val { font-size:1.7rem; font-weight:900; color:var(--navy); margin-top:8px; }
    .admin-top-card .stat-sub { font-size:.82rem; color:var(--gray); margin-top:6px; }
    .admin-tab-row { display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
    .admin-tabs { display:flex; gap:10px; flex-wrap:wrap; }
    .admin-tab-btn { border:none; border-radius:999px; padding:12px 18px; font-weight:900; cursor:pointer; background:#fff; color:var(--navy); box-shadow:0 6px 16px rgba(10,34,64,.06); }
    .admin-tab-btn.active { background:var(--gradient1); color:#fff; }
    .admin-panel { background:linear-gradient(180deg,#ffffff, #f8fbff); border-radius:24px; padding:22px; box-shadow:0 14px 38px rgba(10,34,64,.08); border:1px solid rgba(10,34,64,.05); }
    .admin-panel.hidden { display:none; }
    .admin-analysis-grid { display:grid; grid-template-columns:1.15fr .85fr; gap:18px; }
    .admin-chart-card, .admin-filter-card, .admin-table-card { background:#fff; border-radius:18px; padding:18px; border:1px solid var(--lgray); box-shadow:0 3px 10px rgba(10,34,64,.04); }
    .admin-chart-title { font-size:.92rem; font-weight:900; color:var(--navy); margin-bottom:14px; }
    .admin-filter-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .admin-chart-bars { display:grid; gap:10px; }
    .admin-bar-row { display:grid; grid-template-columns:minmax(120px,.8fr) minmax(0,1.6fr) auto; gap:12px; align-items:center; }
    .admin-bar-label { font-size:.82rem; color:var(--navy); font-weight:700; }
    .admin-bar-track { position:relative; width:100%; height:12px; border-radius:999px; background:#e8eef4; overflow:hidden; }
    .admin-bar-fill { position:absolute; inset:0 auto 0 0; border-radius:999px; background:linear-gradient(90deg,#00B4D8,#8B5CF6); }
    .admin-bar-value { font-size:.78rem; color:var(--gray); font-weight:800; }
    .admin-mini-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .admin-mini-card { background:var(--bg); border-radius:14px; padding:14px; }
    .admin-mini-card .mini-label { font-size:.72rem; text-transform:uppercase; color:var(--gray); font-weight:800; }
    .admin-mini-card .mini-value { margin-top:6px; font-size:1.12rem; color:var(--navy); font-weight:900; }
    .admin-export-row { display:flex; gap:10px; flex-wrap:wrap; }
    .admin-auto-refresh-chip { display:none; }
    .profile-grid { display:grid; grid-template-columns:1.02fr .98fr; gap:20px; }
    .profile-card { background:linear-gradient(180deg,#ffffff,#fbfdff); border-radius:24px; padding:24px; box-shadow:0 14px 34px rgba(10,34,64,.08); border:1px solid rgba(10,34,64,.06); }
    .profile-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; }
    .profile-heading h3 { font-size:1.05rem; font-weight:900; color:var(--navy); }
    .profile-subtle { font-size:.78rem; color:var(--gray); }
    .profile-identity-grid { display:grid; gap:14px; }
    .profile-identity-card { background:linear-gradient(135deg,#F8FBFF,#F5F7FF); border:1px solid var(--lgray); border-radius:18px; padding:16px 18px; }
    .profile-identity-label { font-size:.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--gray); font-weight:800; }
    .profile-identity-value { margin-top:7px; font-size:1.02rem; font-weight:900; color:var(--navy); word-break:break-word; }
    .profile-pill-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
    .profile-lock-pill { display:inline-flex; align-items:center; gap:6px; padding:7px 10px; border-radius:999px; background:#EEF7FF; color:#0A2240; border:1px solid rgba(0,180,216,.18); font-size:.74rem; font-weight:800; }
    .profile-cta-card { margin-top:18px; background:linear-gradient(135deg,#0A2240,#16345f); color:#fff; border-radius:20px; padding:18px; box-shadow:0 12px 26px rgba(10,34,64,.14); }
    .profile-cta-title { font-size:1rem; font-weight:900; }
    .profile-cta-copy { font-size:.82rem; line-height:1.5; color:#D8F4FF; margin-top:6px; margin-bottom:14px; }
    .profile-cta-card .btn-start { margin-top:0; }
    .standout-code { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:18px 20px; border-radius:20px; background:linear-gradient(135deg,#0A2240,#16345f); color:#fff; box-shadow:0 14px 30px rgba(10,34,64,.16); }
    .standout-code .code-top { font-size:.75rem; letter-spacing:1px; text-transform:uppercase; color:#90E0EF; font-weight:800; }
    .standout-code strong { display:block; font-size:1.55rem; letter-spacing:2.5px; margin-top:6px; }
    .standout-code .code-caption { margin-top:8px; font-size:.8rem; color:#D8F4FF; line-height:1.45; max-width:460px; }
    .class-join-card { background:linear-gradient(135deg,#EEF7FF,#F7F0FF); border:1px solid rgba(0,180,216,.16); border-radius:20px; padding:18px; box-shadow:inset 0 1px 0 rgba(255,255,255,.65); }
    .class-join-title { font-size:1rem; font-weight:900; color:var(--navy); }
    .class-join-sub { margin-top:6px; font-size:.82rem; line-height:1.45; color:var(--gray); }
    .class-code-shell { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; margin-top:16px; align-items:center; }
    .code-input-wrap { position:relative; }
    .code-input-wrap::before { content:'CLASS CODE'; position:absolute; left:14px; top:10px; font-size:.66rem; letter-spacing:1px; color:var(--gray); font-weight:800; }
    .class-code-shell input { width:100%; padding:28px 16px 13px; border-radius:16px; border:2px solid rgba(0,180,216,.18); background:#fff; color:var(--navy); font-size:1rem; font-weight:800; letter-spacing:1.6px; text-transform:uppercase; box-shadow:0 8px 20px rgba(10,34,64,.05); }
    .class-code-shell input:focus { outline:none; border-color:var(--teal); box-shadow:0 0 0 4px rgba(0,180,216,.12); }
    .class-code-shell .secondary-btn { min-width:160px; padding:16px 18px; border-radius:16px; }
    .class-status-card { margin-top:16px; background:#fff; border:1px solid var(--lgray); border-radius:18px; padding:14px 16px; display:grid; gap:10px; }
    .class-status-card .row { display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px solid var(--lgray); }
    .class-status-card .row:last-child { border-bottom:none; }
    .class-status-card .key { font-size:.77rem; color:var(--gray); font-weight:800; }
    .class-status-card .val { font-size:.83rem; color:var(--navy); font-weight:800; text-align:right; word-break:break-word; }
    .helper-hide { opacity:0; max-height:0; overflow:hidden; margin:0; padding:0; transition:all .25s ease; }
    @media (max-width: 980px) { .profile-grid { grid-template-columns:1fr; } .class-code-shell { grid-template-columns:1fr; } }
    .admin-auto-refresh-dot { width:9px; height:9px; border-radius:999px; background:#22C55E; box-shadow:0 0 0 0 rgba(34,197,94,.4); animation:adminPulse 2s infinite; }
    html, body { overflow-y:auto !important; }
    #welcome-screen { padding:28px 18px 56px; }
    .site-toast-stack { position:fixed; top:22px; left:50%; transform:translateX(-50%); display:grid; gap:12px; z-index:1400; pointer-events:none; width:min(92vw, 460px); }
    .site-toast { pointer-events:auto; background:rgba(255,255,255,.98); color:var(--navy); border-radius:18px; border:1px solid rgba(10,34,64,.08); box-shadow:0 22px 42px rgba(10,34,64,.18); padding:14px 16px; display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:start; animation:toastDrop .28s ease; }
    .site-toast.success { border-color:rgba(34,197,94,.28); }
    .site-toast.error { border-color:rgba(239,68,68,.28); }
    .site-toast.info { border-color:rgba(0,180,216,.25); }
    .site-toast-icon { width:36px; height:36px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:900; color:#fff; background:var(--gradient1); }
    .site-toast.success .site-toast-icon { background:linear-gradient(135deg,#22C55E,#00B4D8); }
    .site-toast.error .site-toast-icon { background:linear-gradient(135deg,#EF4444,#F97316); }
    .site-toast-title { font-size:.88rem; font-weight:900; color:var(--navy); }
    .site-toast-copy { margin-top:2px; font-size:.8rem; color:var(--gray); line-height:1.45; }
    .site-toast-close { border:none; background:transparent; color:var(--gray); font-weight:900; cursor:pointer; font-size:1rem; }
    .site-confirm-overlay { position:fixed; inset:0; background:rgba(10,34,64,.48); backdrop-filter:blur(4px); display:none; align-items:center; justify-content:center; z-index:1450; padding:22px; }
    .site-confirm-overlay.visible { display:flex; animation:fadeIn .2s ease; }
    .site-confirm-modal { width:min(92vw, 430px); background:#fff; border-radius:24px; padding:24px; box-shadow:0 26px 54px rgba(10,34,64,.24); border:1px solid rgba(10,34,64,.08); animation:pop .24s ease; }
    .site-confirm-kicker { font-size:.73rem; text-transform:uppercase; letter-spacing:1.2px; color:var(--purple); font-weight:900; }
    .site-confirm-title { margin-top:8px; font-size:1.2rem; font-weight:900; color:var(--navy); }
    .site-confirm-copy { margin-top:8px; color:var(--gray); line-height:1.55; font-size:.88rem; }
    .site-confirm-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:18px; }
    @keyframes toastDrop { from { opacity:0; transform:translateY(-12px) scale(.96); } to { opacity:1; transform:translateY(0) scale(1); } }
    .profile-shell { display:grid; gap:22px; }
    .profile-hero-card { background:linear-gradient(145deg,#ffffff,#f8fbff); border-radius:28px; border:1px solid rgba(10,34,64,.06); box-shadow:0 18px 42px rgba(10,34,64,.08); padding:24px; }
    .profile-hero-top { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
    .profile-hero-title { display:flex; gap:14px; align-items:center; }
    .profile-avatar { width:54px; height:54px; border-radius:18px; background:linear-gradient(135deg,#0A2240,#8B5CF6); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.4rem; box-shadow:0 14px 28px rgba(10,34,64,.18); }
    .profile-hero-title h3 { font-size:1.2rem; font-weight:900; color:var(--navy); }
    .profile-hero-title p { margin-top:4px; color:var(--gray); font-size:.85rem; }
    .profile-role-badge { display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; background:#eef7ff; color:var(--navy); border:1px solid rgba(0,180,216,.16); font-size:.78rem; font-weight:900; }
    .profile-info-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-top:22px; }
    .profile-info-tile { background:linear-gradient(145deg,#f9fbff,#f3f7ff); border-radius:22px; border:1px solid var(--lgray); padding:18px 18px 16px; }
    .profile-info-label { font-size:.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--gray); font-weight:900; }
    .profile-info-value { margin-top:10px; font-size:1.05rem; font-weight:900; color:var(--navy); word-break:break-word; }
    .profile-action-band { margin-top:20px; display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:space-between; background:linear-gradient(135deg,#0A2240,#153A66); color:#fff; border-radius:22px; padding:18px; }
    .profile-action-band strong { display:block; font-size:1rem; }
    .profile-action-band span { display:block; color:#d8f4ff; font-size:.82rem; margin-top:4px; }
    .profile-block-card { background:linear-gradient(145deg,#ffffff,#fbfdff); border-radius:28px; border:1px solid rgba(10,34,64,.06); box-shadow:0 18px 42px rgba(10,34,64,.08); padding:24px; }
    .profile-block-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
    .profile-block-head h3 { font-size:1.08rem; font-weight:900; color:var(--navy); }
    .profile-block-head p { margin-top:4px; color:var(--gray); font-size:.82rem; }
    .class-join-panel { background:linear-gradient(145deg,#eef7ff,#f5f0ff); border-radius:24px; border:1px solid rgba(0,180,216,.15); padding:18px; box-shadow:inset 0 1px 0 rgba(255,255,255,.8); }
    .class-join-kicker { font-size:.72rem; text-transform:uppercase; letter-spacing:1.1px; color:var(--purple); font-weight:900; }
    .class-join-main { margin-top:8px; font-size:1.12rem; font-weight:900; color:var(--navy); }
    .class-code-entry { margin-top:16px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; }
    .class-code-entry input { width:100%; padding:17px 18px; border-radius:18px; border:2px solid rgba(0,180,216,.16); background:#fff; font-size:1rem; font-weight:900; letter-spacing:2px; text-transform:uppercase; color:var(--navy); box-shadow:0 10px 24px rgba(10,34,64,.06); }
    .class-code-entry input:focus { outline:none; border-color:var(--teal); box-shadow:0 0 0 4px rgba(0,180,216,.11); }
    .class-code-entry .btn-start { margin-top:0; min-width:160px; border-radius:18px; padding:0 18px; }
    .profile-class-stats { display:grid; gap:10px; margin-top:16px; }
    .profile-class-row { display:flex; justify-content:space-between; gap:16px; padding:14px 16px; border-radius:18px; background:#f8fbff; border:1px solid var(--lgray); }
    .profile-class-row .k { font-size:.78rem; font-weight:900; color:var(--gray); text-transform:uppercase; letter-spacing:1px; }
    .profile-class-row .v { font-size:.86rem; font-weight:900; color:var(--navy); text-align:right; word-break:break-word; }
    .profile-code-hero { background:linear-gradient(135deg,#0A2240,#8B5CF6); color:#fff; border-radius:24px; padding:20px; box-shadow:0 18px 34px rgba(10,34,64,.18); }
    .profile-code-hero .eyebrow { font-size:.72rem; text-transform:uppercase; letter-spacing:1.1px; color:#90E0EF; font-weight:900; }
    .profile-code-hero .code { margin-top:10px; font-size:2rem; font-weight:900; letter-spacing:3px; }
    .profile-code-hero .meta { margin-top:8px; color:#D8F4FF; font-size:.82rem; }
    .profile-code-hero .actions { margin-top:16px; display:flex; gap:10px; flex-wrap:wrap; }
    .profile-code-hero .tiny-btn.ghost { border-color:rgba(255,255,255,.2); color:#fff; }
    .reset-shell { max-width:520px; }
    .reset-step-badge { display:inline-flex; align-items:center; padding:8px 12px; border-radius:999px; background:rgba(255,255,255,.08); color:#90E0EF; font-size:.73rem; font-weight:900; letter-spacing:.4px; }
    .reset-hero { margin-top:16px; margin-bottom:14px; }
    .reset-title { font-size:1.55rem; font-weight:900; color:#fff; }
    .reset-copy { margin-top:8px; font-size:.88rem; line-height:1.5; color:rgba(255,255,255,.75); }
    .reset-highlight { margin:14px 0; padding:14px 16px; border-radius:18px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); }
    .reset-highlight .label { font-size:.7rem; text-transform:uppercase; letter-spacing:1px; color:#90E0EF; font-weight:900; }
    .reset-highlight .value { margin-top:6px; font-size:1rem; font-weight:800; color:#fff; word-break:break-word; }
    .reset-grid, .reset-split { display:grid; gap:14px; }
    .reset-split { grid-template-columns:repeat(2,minmax(0,1fr)); }
    @media (max-width:980px) { .profile-info-grid, .reset-split, .class-code-entry { grid-template-columns:1fr; } }


    .audit-expand { display:block; width:100%; }
    .audit-expand summary { list-style:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px; }
    .audit-expand summary::-webkit-details-marker { display:none; }
    .audit-expand[open] summary { margin-bottom:10px; }
    .audit-expand summary::after { content:'▾'; font-size:.82rem; color:var(--gray); transition:transform .2s ease; }
    .audit-expand[open] summary::after { transform:rotate(180deg); }
    .audit-detail-block { min-width:0; }
    .audit-detail-block > div:last-child { overflow-wrap:anywhere; }
    .audit-detail-panel { margin-top:0; }
    .audit-detail-panel .audit-json { max-height:240px; overflow:auto; }
    .admin-toolbar, .admin-toolbar-row, .admin-batch-shell, .audit-filter-grid, .admin-filter-grid, .admin-export-row, .admin-export-toggle-grid, .admin-top-grid, .admin-kpi-grid, .admin-mini-grid, .admin-analysis-grid, .admin-quiz-grid, .admin-user-layout, .classroom-grid, .classroom-stat-grid { min-width:0; }
    .admin-tab-row { display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; }
    .admin-tabs { display:flex; gap:10px; flex-wrap:wrap; min-width:0; }
    .admin-tab-btn { border:none; background:#fff; color:var(--navy); padding:11px 14px; border-radius:14px; font-weight:800; cursor:pointer; box-shadow:0 2px 10px rgba(10,34,64,.06); border:1px solid var(--lgray); }
    .admin-tab-btn.active { background:linear-gradient(135deg,#0A2240,#16345f); color:#fff; border-color:transparent; box-shadow:0 12px 26px rgba(10,34,64,.16); }
    .admin-chart-title, .section-title { overflow-wrap:anywhere; }
    .admin-table td, .admin-analysis-table td, .admin-quiz-table td, .audit-table td { overflow-wrap:anywhere; }
    .admin-detail-card, .admin-panel, .admin-chart-card, .admin-table-card, .admin-quiz-card, .classroom-card { min-width:0; }
    .admin-meta-row { align-items:flex-start; }
    .admin-meta-row .val { min-width:0; }
    @media (max-width: 1100px) {
      .admin-tab-row { align-items:stretch; }
      .admin-export-row { width:100%; }
      .admin-export-row > * { flex:1 1 180px; }
      .classroom-roster-head { align-items:stretch; }
      .classroom-roster-head .admin-select { width:100%; }
    }
    @media (max-width: 900px) {
      .page-header h1 { font-size:1.5rem; }
      .page-header .subtitle { font-size:.88rem; }
      .admin-top-card .stat-val, .admin-mini-card .mini-value { font-size:1.15rem; }
      .admin-user-layout, .admin-analysis-grid, .admin-quiz-grid, .classroom-grid { grid-template-columns:1fr; }
      .admin-tabs { overflow:auto; flex-wrap:nowrap; padding-bottom:4px; -webkit-overflow-scrolling:touch; }
      .admin-tab-btn { white-space:nowrap; }
      .admin-table, .admin-analysis-table, .admin-quiz-table, .audit-table { min-width:0; }
      .admin-table thead, .admin-analysis-table thead, .admin-quiz-table thead, .audit-table thead { display:none; }
      .admin-table, .admin-analysis-table, .admin-quiz-table, .audit-table,
      .admin-table tbody, .admin-analysis-table tbody, .admin-quiz-table tbody, .audit-table tbody,
      .admin-table tr, .admin-analysis-table tr, .admin-quiz-table tr, .audit-table tr,
      .admin-table td, .admin-analysis-table td, .admin-quiz-table td, .audit-table td { display:block; width:100%; }
      .admin-table tr, .admin-analysis-table tr, .admin-quiz-table tr, .audit-table tr {
        padding:14px 16px; border-bottom:1px solid var(--lgray); background:#fff;
      }
      .admin-table td, .admin-analysis-table td, .admin-quiz-table td, .audit-table td {
        padding:8px 0; border:none; display:grid; grid-template-columns:minmax(108px, 34%) minmax(0,1fr); gap:12px; align-items:start;
      }
      .admin-table td[data-label]::before, .admin-analysis-table td[data-label]::before, .admin-quiz-table td[data-label]::before, .audit-table td[data-label]::before {
        content:attr(data-label); display:block; font-size:.71rem; text-transform:uppercase; letter-spacing:.08em; color:var(--gray); font-weight:900;
      }
      .admin-select-cell { display:flex !important; justify-content:flex-end; padding-top:0 !important; }
      .admin-select-cell::before { content:none !important; display:none !important; }
      .audit-table td:last-child { grid-template-columns:1fr; }
      .audit-expand { margin-top:4px; }
      .audit-expand summary { width:100%; justify-content:space-between; }
      .admin-meta-row { flex-direction:column; }
      .admin-meta-row .val { text-align:left; }
      .admin-metrics, .audit-detail-grid { grid-template-columns:1fr; }
      .audit-summary-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media (max-width: 620px) {
      .admin-panel, .admin-chart-card, .admin-table-card, .admin-quiz-card, .classroom-card { padding:14px; border-radius:18px; }
      .admin-table tr, .admin-analysis-table tr, .admin-quiz-table tr, .audit-table tr { padding:12px 14px; }
      .admin-table td, .admin-analysis-table td, .admin-quiz-table td, .audit-table td { grid-template-columns:1fr; gap:6px; }
      .audit-summary-grid, .classroom-stat-grid { grid-template-columns:1fr; }
      .classroom-group-actions, .classroom-input-row, .admin-inline, .site-confirm-actions { flex-direction:column; align-items:stretch; }
      .classroom-group-actions > *, .classroom-input-row > *, .admin-inline > *, .site-confirm-actions > * { width:100%; }
      .classroom-code-pill { justify-content:center; }
    }

    @keyframes adminPulse {
      0% { box-shadow:0 0 0 0 rgba(34,197,94,.38); }
      70% { box-shadow:0 0 0 10px rgba(34,197,94,0); }
      100% { box-shadow:0 0 0 0 rgba(34,197,94,0); }
    }
    .admin-analysis-table { width:100%; border-collapse:collapse; }
    .admin-analysis-table th, .admin-analysis-table td { padding:12px 10px; text-align:left; border-bottom:1px solid var(--lgray); font-size:.83rem; }
    .admin-analysis-table th { font-size:.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--gray); }
    .admin-chip { display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:6px 10px; background:#f4f7fb; font-size:.76rem; font-weight:800; color:var(--navy); }
    .admin-pill.locked { background:#FEE2E2; color:#B91C1C; }
    .admin-kpi-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .admin-user-layout { display:grid; grid-template-columns:minmax(0,1.18fr) minmax(380px,.82fr); gap:18px; min-width:0; align-items:start; }
    .admin-detail-card .admin-pill { margin-right:6px; margin-bottom:6px; }
    .admin-select-cell { width:44px; text-align:center; }
    .admin-checkbox { width:16px; height:16px; accent-color:var(--teal); cursor:pointer; }
    .admin-selection-chip { display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; background:#eef7ff; color:var(--navy); font-size:.8rem; font-weight:800; border:1px solid rgba(0,180,216,.18); }
    .admin-scope-banner { display:none; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; border-radius:16px; background:#EEF7FF; border:1px solid rgba(0,180,216,.18); color:var(--navy); font-size:.82rem; font-weight:700; margin-bottom:16px; }
    .admin-scope-banner.visible { display:flex; }
    .admin-export-toggle-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:12px; }
    .admin-toggle-pill { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; background:#F8FBFF; border:1px solid var(--lgray); color:var(--navy); font-size:.8rem; font-weight:700; }
    .admin-toggle-pill input { width:16px; height:16px; accent-color:var(--teal); }
    .admin-detail-action-row { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
    .admin-export-note { font-size:.76rem; color:var(--gray); line-height:1.45; margin-top:8px; }
    @media (max-width: 1240px) {
      .admin-top-grid, .admin-kpi-grid, .admin-filter-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .admin-analysis-grid, .admin-user-layout, .admin-quiz-grid { grid-template-columns:1fr; }
    }

.classroom-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.92fr); gap:18px; }
.classroom-card { background:#fff; border-radius:22px; border:1px solid var(--lgray); padding:20px; box-shadow:0 8px 24px rgba(10,34,64,.06); min-width:0; overflow:hidden; }
.classroom-card h3 { font-size:1rem; font-weight:900; color:var(--navy); }
.classroom-card p { color:var(--gray); font-size:.82rem; line-height:1.5; }
.classroom-stat-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:16px; }
.classroom-stat { background:#F8FBFF; border:1px solid var(--lgray); border-radius:18px; padding:14px; min-width:0; }
.classroom-stat .label { font-size:.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--gray); font-weight:800; }
.classroom-stat .value { margin-top:8px; font-size:1.3rem; font-weight:900; color:var(--navy); overflow-wrap:anywhere; }
.classroom-group-list, .classroom-code-list { display:grid; gap:12px; margin-top:16px; }
.classroom-group-item { background:#F8FBFF; border:1px solid var(--lgray); border-radius:18px; padding:14px 16px; min-width:0; }
.classroom-group-item strong { font-size:.94rem; color:var(--navy); overflow-wrap:anywhere; }
.classroom-group-item .meta { margin-top:5px; color:var(--gray); font-size:.8rem; overflow-wrap:anywhere; }
.classroom-group-actions { margin-top:12px; display:flex; gap:10px; flex-wrap:wrap; align-items:stretch; }
.classroom-group-actions > * { max-width:100%; }
.classroom-input-row { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
.classroom-input-row > * { flex:1; min-width:0; }
.classroom-code-pill { display:inline-flex; align-items:center; gap:8px; border-radius:999px; background:#EEF7FF; color:var(--navy); padding:9px 12px; font-size:.84rem; font-weight:900; border:1px solid rgba(0,180,216,.16); max-width:100%; overflow-wrap:anywhere; }
.classroom-roster-head { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
.classroom-roster-grid { display:grid; gap:10px; min-width:0; }
.classroom-student-row { display:grid; grid-template-columns:minmax(0,1fr) minmax(190px,220px); gap:14px; align-items:center; background:#F8FBFF; border:1px solid var(--lgray); border-radius:18px; padding:14px 16px; min-width:0; }
.classroom-student-main { min-width:0; display:grid; gap:5px; }
.classroom-student-main strong { display:block; color:var(--navy); font-size:.92rem; overflow-wrap:anywhere; word-break:break-word; }
.classroom-student-main span { display:block; color:var(--gray); font-size:.8rem; overflow-wrap:anywhere; word-break:break-word; }
.classroom-student-class { color:var(--navy); font-weight:800; }
.classroom-student-meta { display:flex; gap:10px 14px; flex-wrap:wrap; margin-top:2px; }
.classroom-student-meta span { color:var(--gray); font-size:.78rem; }
.classroom-student-actions { display:flex; flex-direction:column; gap:8px; align-items:stretch; justify-self:end; width:100%; min-width:0; }
.classroom-student-actions .admin-select, .classroom-student-actions .tiny-btn { width:100%; max-width:100%; }
.classroom-muted { color:var(--gray); font-size:.79rem; }
.classroom-empty { background:#F8FBFF; border:1px dashed var(--lgray); border-radius:18px; padding:22px; text-align:center; color:var(--gray); }
@media (max-width: 1180px) { .classroom-grid, .admin-user-layout { grid-template-columns:1fr; } .classroom-card, .profile-hero-card, .profile-block-card, .admin-panel { padding:18px; } .admin-toolbar-row, .admin-batch-shell { grid-template-columns:1fr; } }
@media (max-width: 980px) { .classroom-stat-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .profile-info-grid, .reset-split, .class-code-entry { grid-template-columns:1fr; } .admin-toolbar-row { grid-template-columns:1fr; } }
@media (max-width: 760px) { body { overflow-x:hidden; } .classroom-grid, .classroom-stat-grid, .classroom-student-row { grid-template-columns:1fr; } .classroom-student-actions { justify-self:stretch; } .classroom-group-actions > *, .classroom-input-row > *, .admin-toolbar input, .admin-toolbar select, .admin-toolbar button, .admin-batch-shell button { width:100%; max-width:none; } .admin-toolbar { align-items:stretch; } .admin-export-row { width:100%; flex-wrap:wrap; } .admin-export-row > * { width:100%; } .profile-action-band, .profile-class-row { flex-direction:column; align-items:flex-start; } .profile-class-row .v { text-align:left; } .admin-table-wrap { overflow:auto; -webkit-overflow-scrolling:touch; } .admin-batch-controls { grid-template-columns:1fr; } }
@media (max-width: 520px) { .classroom-group-actions > * { flex:1 1 100%; } .classroom-code-pill { justify-content:center; } .profile-code-hero .code { font-size:1.4rem; letter-spacing:2px; } }
    @media (max-width: 760px) {
      .admin-top-grid, .admin-kpi-grid, .admin-filter-grid, .admin-mini-grid { grid-template-columns:1fr; }
      .admin-panel { padding:16px; }
      .admin-bar-row { grid-template-columns:1fr; }
    }

    #sidebar {
      transition:transform .34s cubic-bezier(.22,1,.36,1), box-shadow .28s ease, border-radius .28s ease;
      will-change:transform;
    }
    #main {
      transition:margin-left .34s cubic-bezier(.22,1,.36,1), width .34s ease;
      min-width:0;
      width:calc(100% - var(--sidebar-w));
      display:block;
    }
    .page {
      width:100%;
      max-width:1560px;
      margin:0 auto;
      padding:32px clamp(18px, 2.3vw, 36px);
      min-width:0;
    }
    .page > * { min-width:0; }
    .admin-panel, .admin-table-card, .admin-chart-card, .admin-quiz-card, .page-header, .stat-row, .module-grid, .lesson-card { max-width:100%; }
    .sidebar-backdrop {
      position:fixed; inset:0; background:rgba(10,34,64,.34); backdrop-filter:blur(3px);
      opacity:0; pointer-events:none; transition:opacity .26s ease; z-index:185;
    }
    .sidebar-toggle-btn {
      position:fixed; top:16px; left:16px; z-index:230; border:none; cursor:pointer;
      display:flex; align-items:center; gap:10px; min-width:52px; height:52px; padding:0 16px;
      border-radius:18px; background:rgba(255,255,255,.96); color:var(--navy);
      box-shadow:0 16px 34px rgba(10,34,64,.16); border:1px solid rgba(10,34,64,.08);
      transition:left .34s cubic-bezier(.22,1,.36,1), transform .2s ease, box-shadow .2s ease, background .2s ease;
      -webkit-tap-highlight-color:transparent;
    }
    .sidebar-toggle-btn:hover { transform:translateY(-1px); box-shadow:0 18px 38px rgba(10,34,64,.2); }
    .sidebar-toggle-btn:active { transform:translateY(0) scale(.98); }
    .sidebar-toggle-btn:focus-visible { outline:3px solid rgba(0,180,216,.28); outline-offset:2px; }
    .sidebar-toggle-btn .sidebar-toggle-icon {
      width:20px; height:14px; display:grid; align-content:space-between; flex:0 0 auto;
    }
    .sidebar-toggle-btn .sidebar-toggle-icon span {
      display:block; height:2px; border-radius:999px; background:currentColor; transition:transform .28s ease, opacity .2s ease, width .28s ease;
    }
    .sidebar-toggle-btn .sidebar-toggle-icon span:nth-child(2) { width:72%; }
    .sidebar-toggle-btn .sidebar-toggle-label { font-size:.82rem; font-weight:900; letter-spacing:.2px; white-space:nowrap; }
    body:not(.mobile-sidebar-mode):not(.sidebar-collapsed) .sidebar-toggle-btn {
      left:calc(var(--sidebar-w) - 22px); border-radius:16px; padding:0 14px; min-width:48px;
    }
    body:not(.mobile-sidebar-mode):not(.sidebar-collapsed) .sidebar-toggle-btn .sidebar-toggle-label { display:none; }
    body.sidebar-collapsed #sidebar {
      transform:translateX(calc(-100% - 18px)); box-shadow:none;
    }
    body.sidebar-collapsed #main {
      margin-left:0 !important;
      width:100%;
    }
    body.sidebar-collapsed .sidebar-toggle-btn,
    body.mobile-sidebar-mode .sidebar-toggle-btn { left:16px; }
    body.sidebar-collapsed .sidebar-toggle-btn .sidebar-toggle-label { display:inline; }
    body.mobile-sidebar-mode {
      overflow-x:hidden;
    }
    body.mobile-sidebar-mode #sidebar {
      width:min(84vw, 320px); max-width:320px;
      z-index:210; border-top-right-radius:24px; border-bottom-right-radius:24px;
      box-shadow:0 28px 60px rgba(10,34,64,.24);
    }
    body.mobile-sidebar-mode #main {
      margin-left:0 !important; width:100%;
    }
    body.mobile-sidebar-mode .sidebar-backdrop {
      display:none !important;
    }
    body.mobile-sidebar-mode .sidebar-toggle-btn {
      top:14px; left:14px; min-width:54px; height:54px; padding:0 16px;
    }
    body.mobile-sidebar-mode:not(.sidebar-collapsed) .sidebar-toggle-btn {
      left:calc(min(84vw, 320px) - 22px); border-radius:16px; padding:0 14px; min-width:48px;
    }
    body.mobile-sidebar-mode:not(.sidebar-collapsed) .sidebar-toggle-btn .sidebar-toggle-label {
      display:none;
    }
    body.mobile-sidebar-mode:not(.sidebar-collapsed) .sidebar-toggle-btn {
      background:rgba(255,255,255,.96); color:var(--navy); box-shadow:0 16px 36px rgba(10,34,64,.24);
    }
    body.mobile-sidebar-mode .page {
      max-width:100%; padding:84px 18px 28px;
    }
    body.mobile-sidebar-mode .admin-tab-row {
      gap:10px;
    }
    body.mobile-sidebar-mode .admin-tabs {
      overflow:auto; flex-wrap:nowrap; padding-bottom:4px; -webkit-overflow-scrolling:touch;
    }
    body.mobile-sidebar-mode .admin-tabs::-webkit-scrollbar { height:6px; }
    body.mobile-sidebar-mode .admin-tabs::-webkit-scrollbar-thumb { background:rgba(10,34,64,.18); border-radius:999px; }
    body.mobile-sidebar-mode .admin-tab-btn { white-space:nowrap; }
    @media (max-width: 900px) {
      .sidebar-toggle-btn { top:14px; left:14px; }
      .page { max-width:100%; }
    }
    @media (max-width: 640px) {
      .sidebar-toggle-btn { border-radius:16px; min-width:50px; height:50px; padding:0 14px; }
      .sidebar-toggle-btn .sidebar-toggle-label { font-size:.78rem; }
      body.mobile-sidebar-mode #sidebar { width:min(88vw, 310px); }
      body.mobile-sidebar-mode:not(.sidebar-collapsed) .sidebar-toggle-btn { left:calc(min(88vw, 310px) - 20px); }
      body.mobile-sidebar-mode .page { padding:78px 14px 24px; }
      .admin-panel, .admin-table-card, .admin-chart-card, .admin-quiz-card, .audit-panel, .classroom-card, .profile-hero-card, .profile-block-card { overflow:hidden; }
      .admin-user-card, .audit-mobile-card, .classroom-group-item, .classroom-student-row, .admin-summary-card { min-width:0; max-width:100%; }
      .admin-user-card *, .audit-mobile-card *, .classroom-group-item *, .classroom-student-row *, .admin-summary-card * { overflow-wrap:anywhere; word-break:break-word; }
      .admin-tabs { gap:10px; }
      .admin-tab-btn { flex:0 0 auto; }
      .admin-toolbar, .admin-toolbar-row, .admin-batch-shell, .admin-export-row, .admin-user-actions, .audit-filter-grid { min-width:0; }
      .welcome-card { padding:24px 16px 20px; border-radius:18px; max-width:none; margin:12px 0 18px; }
      .welcome-card h2 { font-size:1.12rem; }
      .welcome-card p { margin-bottom:16px; }
      .welcome-card .input-group { margin-bottom:12px; }
      .auth-note { margin-top:10px; font-size:.8rem; line-height:1.5; }
      .dob-reveal-wrap { display:block !important; opacity:1 !important; transform:none !important; margin:0 0 12px; width:100%; }
      .dob-reveal-wrap.revealed { display:block !important; opacity:1 !important; transform:none !important; animation:none; }
      .dob-reveal-card { padding:0; border-radius:0; width:100%; max-width:none; min-width:0; background:transparent; border:none; box-shadow:none; }
      .dob-reveal-card .input-group { width:100%; max-width:none; }
      .dob-reveal-head { display:none; }
      .dob-date-input { display:block; width:100% !important; max-width:100% !important; min-width:0; box-sizing:border-box; margin:0; padding:14px 18px; padding-right:18px; font-size:16px; border-radius:12px; border:2px solid rgba(255,255,255,.15); background:rgba(255,255,255,.08); appearance:none; -webkit-appearance:none; }
      .welcome-card .input-group .dob-date-input { width:100% !important; max-width:100% !important; }
      .dob-reveal-card.helper-collapsed .dob-reveal-head { display:none; }
    }

    *, *::before, *::after { box-sizing:border-box; }
    img, video, canvas, svg { max-width:100%; height:auto; }
    .page, .page-header, .admin-panel, .admin-table-card, .admin-chart-card, .admin-quiz-card, .audit-panel, .classroom-card, .profile-hero-card, .profile-block-card, .admin-user-layout, .admin-grid, .admin-analysis-grid, .admin-quiz-grid, .classroom-grid, .admin-tab-row, .admin-tabs, .admin-toolbar, .admin-toolbar-row, .admin-batch-shell, .admin-filter-grid, .audit-filter-grid, .audit-summary-grid, .admin-top-grid, .admin-kpi-grid, .admin-mini-grid, .classroom-stat-grid, .classroom-roster-grid, .classroom-student-row, .classroom-group-item, .classroom-code-pill, .admin-selection-chip { min-width:0; max-width:100%; }
    .admin-tabs, .admin-tab-row, .admin-toolbar, .admin-toolbar-row, .admin-batch-shell, .admin-filter-grid, .audit-filter-grid, .admin-export-row, .classroom-group-actions, .classroom-input-row, .classroom-roster-head, .classroom-student-actions, .admin-detail-action-row, .audit-log-footer { overflow-x:hidden; }
    .admin-table-wrap, .audit-table-wrap { max-width:100%; }
    .admin-table, .admin-analysis-table, .admin-quiz-table, .audit-table { table-layout:fixed; }
    .admin-table td, .admin-analysis-table td, .admin-quiz-table td, .audit-table td, .admin-table th, .admin-analysis-table th, .admin-quiz-table th, .audit-table th { word-break:break-word; overflow-wrap:anywhere; }
    .admin-pill, .admin-chip, .audit-badge, .classroom-code-pill, .admin-selection-chip { max-width:100%; white-space:normal; }
    .admin-tab-btn, .secondary-btn, .tiny-btn, .btn-start { max-width:100%; }

    @media (max-width: 900px) {
      .page { padding-left:14px !important; padding-right:14px !important; }
      .admin-panel, .admin-table-card, .admin-chart-card, .admin-quiz-card, .audit-panel, .classroom-card, .profile-hero-card, .profile-block-card { padding:14px !important; border-radius:18px !important; }
      .admin-tab-row { display:grid; grid-template-columns:minmax(0,1fr); }
      .admin-tabs { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; overflow:visible; }
      .admin-tab-btn { width:100%; min-width:0; padding:12px 10px; white-space:normal; line-height:1.2; text-align:center; }
      .admin-toolbar-row, .admin-batch-shell, .admin-filter-grid, .audit-filter-grid, .admin-top-grid, .admin-kpi-grid, .admin-mini-grid, .classroom-stat-grid, .admin-export-toggle-grid { grid-template-columns:minmax(0,1fr) !important; }
      .admin-toolbar input, .admin-toolbar select, .admin-toolbar button, .admin-batch-shell button, .admin-input, .admin-select, .admin-textarea, .secondary-btn, .tiny-btn, .btn-start { width:100%; max-width:100%; min-width:0; }
      .classroom-roster-head, .classroom-group-actions, .classroom-input-row, .admin-inline, .admin-detail-action-row, .site-confirm-actions, .audit-log-footer, .audit-toolbar, .audit-toolbar-left, .audit-toolbar-right { display:grid; grid-template-columns:minmax(0,1fr); align-items:stretch; }
      .classroom-student-row { grid-template-columns:minmax(0,1fr) !important; }
      .classroom-student-actions { justify-self:stretch; }
      .admin-table-wrap, .audit-table-wrap { overflow:visible; border:none; background:transparent; }
      .admin-table, .admin-analysis-table, .admin-quiz-table, .audit-table { min-width:0 !important; width:100%; }
      .admin-table tr, .admin-analysis-table tr, .admin-quiz-table tr, .audit-table tr { margin:0 0 12px; border:1px solid var(--lgray); border-radius:16px; box-shadow:0 4px 10px rgba(10,34,64,.04); overflow:hidden; }
      .admin-table td, .admin-analysis-table td, .admin-quiz-table td, .audit-table td { grid-template-columns:minmax(92px, 34%) minmax(0,1fr) !important; }
      .admin-select-cell { justify-content:flex-start !important; }
    }

    @media (max-width: 640px) {
      .page { padding-left:12px !important; padding-right:12px !important; }
      body.mobile-sidebar-mode .page { padding-left:12px !important; padding-right:12px !important; }
      .admin-tabs { grid-template-columns:minmax(0,1fr); }
      .admin-table td, .admin-analysis-table td, .admin-quiz-table td, .audit-table td { grid-template-columns:minmax(0,1fr) !important; gap:4px; }
      .admin-table td[data-label]::before, .admin-analysis-table td[data-label]::before, .admin-quiz-table td[data-label]::before, .audit-table td[data-label]::before { margin-bottom:1px; }
      .admin-top-card, .admin-summary-card, .admin-mini-card, .classroom-stat, .audit-summary-card { padding:12px !important; }
      .classroom-code-pill, .admin-pill, .admin-chip, .audit-badge { justify-content:flex-start; }
      .admin-table tr, .admin-analysis-table tr, .admin-quiz-table tr, .audit-table tr { padding:10px 12px !important; }
    }



    @media (max-width: 900px) {
      .admin-toolbar-row, .admin-batch-shell, .admin-filter-grid, .audit-filter-grid, .admin-top-grid, .admin-kpi-grid, .admin-mini-grid, .classroom-stat-grid, .admin-export-toggle-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
      .admin-toolbar-row > :first-child, .admin-batch-shell > :first-child, .audit-filter-grid > :first-child, .admin-filter-grid > :first-child { grid-column:1 / -1; }
      .admin-export-row, .admin-detail-action-row, .admin-inline, .audit-toolbar-left, .audit-toolbar-right, .audit-log-footer, .classroom-group-actions, .classroom-input-row, .classroom-roster-head, .classroom-student-actions {
        display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; align-items:stretch;
      }
      .admin-export-row > *, .admin-detail-action-row > *, .admin-inline > *, .audit-toolbar-left > *, .audit-toolbar-right > *, .audit-log-footer > *, .classroom-group-actions > *, .classroom-input-row > *, .classroom-roster-head > *, .classroom-student-actions > * { min-width:0; width:100% !important; }
      .admin-toolbar input, .admin-toolbar select, .admin-toolbar button, .admin-batch-shell button, .admin-input, .admin-select, .admin-textarea, .secondary-btn, .tiny-btn, .btn-start { width:100%; max-width:100%; min-width:0; }
      .admin-meta-list, .admin-list-block, .audit-detail-grid, .classroom-group-list, .classroom-code-list, .classroom-roster-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .admin-meta-row, .admin-list-item { background:#F8FBFF; border:1px solid var(--lgray); border-radius:12px; padding:10px 12px; margin:0; }
      .admin-meta-row { display:grid; grid-template-columns:minmax(0,1fr); gap:4px; border-bottom:none; }
      .admin-meta-row .val { text-align:left; }
      .admin-table-wrap, .audit-table-wrap { overflow:visible; border:none; background:transparent; }
      .admin-table tbody, .admin-analysis-table tbody, .admin-quiz-table tbody, .audit-table tbody { display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
      .admin-table tr, .admin-analysis-table tr, .admin-quiz-table tr, .audit-table tr {
        display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin:0; padding:12px !important; border:1px solid var(--lgray); border-radius:16px; box-shadow:0 4px 10px rgba(10,34,64,.04); background:#fff; position:relative; align-content:start;
      }
      .admin-table td, .admin-analysis-table td, .admin-quiz-table td, .audit-table td {
        display:block !important; width:auto !important; padding:10px 11px !important; border:none; border-radius:12px; background:#F8FBFF; min-width:0;
      }
      .admin-table td[data-label]::before, .admin-analysis-table td[data-label]::before, .admin-quiz-table td[data-label]::before, .audit-table td[data-label]::before { content:attr(data-label); display:block; margin-bottom:4px; font-size:.66rem; text-transform:uppercase; letter-spacing:.08em; color:var(--gray); font-weight:900; }
      .admin-table td:nth-child(2), .admin-analysis-table td:nth-child(1), .admin-quiz-table td:nth-child(1), .audit-table td:nth-child(2) { grid-column:1 / -1; }
      .admin-table td.admin-select-cell { position:absolute; top:10px; right:10px; width:auto !important; padding:0 !important; background:transparent; }
      .admin-table td.admin-select-cell::before { content:none !important; }
      .admin-table td:nth-child(2) { padding-right:36px !important; }
      .audit-table td:last-child { grid-column:1 / -1; }
      .audit-expand summary { width:100%; justify-content:space-between; }
      .audit-summary-grid, .admin-top-grid, .admin-kpi-grid, .admin-mini-grid, .classroom-stat-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
      .admin-tabs { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }

    @media (max-width: 640px) {
      .admin-toolbar-row, .admin-batch-shell, .admin-filter-grid, .audit-filter-grid, .admin-top-grid, .admin-kpi-grid, .admin-mini-grid, .classroom-stat-grid, .admin-export-toggle-grid, .admin-meta-list, .admin-list-block, .audit-detail-grid, .classroom-group-list, .classroom-code-list, .classroom-roster-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
      .admin-tabs { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .admin-tab-btn { padding:10px 8px; font-size:.86rem; }
      .admin-table tbody, .admin-analysis-table tbody, .admin-quiz-table tbody, .audit-table tbody { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .admin-table tr, .admin-analysis-table tr, .admin-quiz-table tr, .audit-table tr { padding:10px !important; gap:6px; }
      .admin-table td, .admin-analysis-table td, .admin-quiz-table td, .audit-table td { padding:8px 9px !important; font-size:.77rem; }
      .secondary-btn, .tiny-btn { padding:10px 12px; font-size:.8rem; }
      .admin-pill, .admin-chip, .audit-badge, .classroom-code-pill, .admin-selection-chip { font-size:.7rem; padding:5px 9px; }
      .admin-top-card .stat-val, .audit-summary-card .value, .admin-mini-card .mini-value, .classroom-stat .value { font-size:1.02rem !important; }
    }

    @media (max-width: 480px) {
      .admin-toolbar-row, .admin-batch-shell, .admin-filter-grid, .audit-filter-grid, .admin-top-grid, .admin-kpi-grid, .admin-mini-grid, .classroom-stat-grid, .admin-export-toggle-grid, .admin-meta-list, .admin-list-block, .audit-detail-grid, .classroom-group-list, .classroom-code-list, .classroom-roster-grid, .admin-export-row, .admin-detail-action-row, .admin-inline, .audit-toolbar-left, .audit-toolbar-right, .audit-log-footer, .classroom-group-actions, .classroom-input-row, .classroom-roster-head, .classroom-student-actions, .admin-tabs { grid-template-columns:minmax(0,1fr) !important; }
      .admin-table tbody, .admin-analysis-table tbody, .admin-quiz-table tbody, .audit-table tbody { grid-template-columns:minmax(0,1fr) !important; }
      .admin-table tr, .admin-analysis-table tr, .admin-quiz-table tr, .audit-table tr { grid-template-columns:minmax(0,1fr) !important; }
      .admin-table td, .admin-analysis-table td, .admin-quiz-table td, .audit-table td, .admin-table td:nth-child(2), .admin-analysis-table td:nth-child(1), .admin-quiz-table td:nth-child(1), .audit-table td:nth-child(2), .audit-table td:last-child { grid-column:auto !important; }
      .admin-table td.admin-select-cell { position:static; padding:0 0 4px !important; }
      .admin-table td:nth-child(2) { padding-right:9px !important; }
    }

    @media (prefers-reduced-motion: reduce) {
      #sidebar, #main, .sidebar-toggle-btn, .sidebar-backdrop { transition:none !important; animation:none !important; }
    }
  `;
  document.head.appendChild(extraStyle);

  const originalInit = window.init;
  const originalShowPage = window.showPage;
  const originalHandleLogout = window.handleLogout;
  const stateRef = state;
  stateRef.currentUser = stateRef.currentUser || null;

  let pendingVerificationEmail = '';
  let selectedAdminUserId = null;
  let selectedAdminUserIds = new Set();
  let lastAdminSelectionAnchorId = null;
  let adminScopedUserIds = null;
  let adminUsersCache = [];
  let adminCapabilities = {};
  let adminBatchActionState = { action: 'analysis', role: 'student', teacherId: '', note: '' };
  let adminAuditEntries = [];
  let adminAuditPage = 1;
  const ADMIN_AUDIT_PAGE_SIZE = 25;
  let adminSelectedAuditDate = (() => { const now = new Date(); const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)); return local.toISOString().slice(0, 10); })();
  let adminAuditRangeStart = adminSelectedAuditDate;
  let adminAuditRangeEnd = adminSelectedAuditDate;
  let adminAuditSummary = { total: 0, security: 0, classroom: 0, user_management: 0, progress: 0, failed: 0, high: 0 };
  let adminAuditFilterOptions = { actions: [], actorRoles: [], deviceTypes: [] };
  let adminAuditFilters = { query: '', action: 'all', category: 'all', actorRole: 'all', deviceType: 'all', status: 'all', severity: 'all' };
  let selectedAdminTab = 'users';
  let adminDefaultTabResolved = false;
  let adminAnalysisFilters = { role: 'all', verified: 'all', device: 'all', cohort: 'all' };
  let adminExportToggles = { analysisSummary: true, filteredUsers: true, quizSummary: true, quizModuleRows: true, recentQuizActivity: true };
  let activeTrackedPage = 'dashboard';
  let pageStartMs = Date.now();
  let analyticsTimer = null;
  let activeToastTimerIds = new Set();
  let classroomCache = null;
  let classroomGroupFilter = 'all';
  let classroomEditingGroupId = null;
  let desktopSidebarCollapsed = false;
  let mobileSidebarOpen = false;
  let lastMobileSidebarMode = null;
  const SIDEBAR_PREF_KEY = 'credistart.sidebar.collapsed';
  const MOBILE_SIDEBAR_QUERY = window.matchMedia('(max-width: 1024px)');

  function ensureToastStack() {
    let stack = document.getElementById('site-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'site-toast-stack';
      stack.className = 'site-toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  function showToast(message, type = 'info', title = '') {
    const stack = ensureToastStack();
    const toast = document.createElement('div');
    toast.className = `site-toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '!' : 'i';
    toast.innerHTML = `<div class="site-toast-icon">${icon}</div><div><div class="site-toast-title">${title || (type === 'success' ? 'Done' : type === 'error' ? 'Something went wrong' : 'Notice')}</div><div class="site-toast-copy">${message}</div></div><button class="site-toast-close" aria-label="Close">×</button>`;
    const remove = () => {
      if (!toast.parentNode) return;
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-6px) scale(.98)';
      setTimeout(() => toast.remove(), 180);
    };
    toast.querySelector('.site-toast-close').addEventListener('click', remove);
    stack.appendChild(toast);
    const timer = setTimeout(remove, 3600);
    activeToastTimerIds.add(timer);
    return toast;
  }

  function ensureConfirmOverlay() {
    let overlay = document.getElementById('site-confirm-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'site-confirm-overlay';
      overlay.className = 'site-confirm-overlay';
      overlay.innerHTML = `<div class="site-confirm-modal"><div class="site-confirm-kicker" id="site-confirm-kicker">Confirm</div><div class="site-confirm-title" id="site-confirm-title"></div><div class="site-confirm-copy" id="site-confirm-copy"></div><div class="site-confirm-actions"><button class="secondary-btn" id="site-confirm-cancel">Cancel</button><button class="tiny-btn danger" id="site-confirm-ok">Continue</button></div></div>`;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function showConfirm(options) {
    const { title = 'Confirm action', message = '', confirmText = 'Continue', cancelText = 'Cancel', danger = false, kicker = 'Confirm' } = options || {};
    const overlay = ensureConfirmOverlay();
    overlay.querySelector('#site-confirm-kicker').textContent = kicker;
    overlay.querySelector('#site-confirm-title').textContent = title;
    overlay.querySelector('#site-confirm-copy').textContent = message;
    const cancel = overlay.querySelector('#site-confirm-cancel');
    cancel.textContent = cancelText || 'Cancel';
    cancel.style.display = cancelText ? '' : 'none';
    const ok = overlay.querySelector('#site-confirm-ok');
    ok.textContent = confirmText;
    ok.className = `tiny-btn ${danger ? 'danger' : ''}`.trim();
    overlay.classList.add('visible');
    return new Promise(resolve => {
      const close = (val) => {
        overlay.classList.remove('visible');
        ok.removeEventListener('click', onOk);
        cancel.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onBackdrop);
        resolve(val);
      };
      const onOk = () => close(true);
      const onCancel = () => close(false);
      const onBackdrop = (e) => { if (e.target === overlay) close(false); };
      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
      overlay.addEventListener('click', onBackdrop);
    });
  }

  function showAlertModal(options) {
    const { title = 'Notice', message = '', kicker = 'Notice', buttonText = 'OK' } = options || {};
    return showConfirm({
      title,
      message,
      kicker,
      confirmText: buttonText,
      cancelText: '',
      danger: false
    });
  }

  window.showSiteToast = showToast;
  window.showSiteConfirm = showConfirm;
  window.showSiteAlert = showAlertModal;

async function copyTextToClipboard(value) {
  const textValue = String(value || '');
  if (!textValue) throw new Error('Nothing to copy.');
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(textValue);
      return true;
    } catch (_) {}
  }
  const helper = document.createElement('textarea');
  helper.value = textValue;
  helper.setAttribute('readonly', 'readonly');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  helper.style.pointerEvents = 'none';
  helper.style.top = '-9999px';
  document.body.appendChild(helper);
  helper.focus();
  helper.select();
  helper.setSelectionRange(0, helper.value.length);
  const success = document.execCommand && document.execCommand('copy');
  helper.remove();
  if (!success) throw new Error('Copy failed.');
  return true;
}

function readSidebarPreference() {
  try {
    return window.localStorage.getItem(SIDEBAR_PREF_KEY) === '1';
  } catch (_) {
    return false;
  }
}

function saveSidebarPreference(collapsed) {
  try {
    window.localStorage.setItem(SIDEBAR_PREF_KEY, collapsed ? '1' : '0');
  } catch (_) {}
}

function isMobileSidebarMode() {
  return Boolean(MOBILE_SIDEBAR_QUERY.matches);
}

function ensureSidebarControls() {
  let toggle = document.getElementById('sidebar-toggle-btn');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.id = 'sidebar-toggle-btn';
    toggle.type = 'button';
    toggle.className = 'sidebar-toggle-btn';
    toggle.setAttribute('aria-controls', 'sidebar');
    toggle.innerHTML = '<span class="sidebar-toggle-icon" aria-hidden="true"><span></span><span></span><span></span></span><span class="sidebar-toggle-label">Menu</span>';
    toggle.addEventListener('click', () => toggleSidebar());
    document.body.appendChild(toggle);
  }
  let backdrop = document.getElementById('sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('button');
    backdrop.id = 'sidebar-backdrop';
    backdrop.type = 'button';
    backdrop.className = 'sidebar-backdrop';
    backdrop.setAttribute('aria-label', 'Close menu');
    backdrop.addEventListener('click', () => closeSidebar());
    document.body.appendChild(backdrop);
  }
  return { toggle, backdrop };
}

function syncSidebarState() {
  const { toggle } = ensureSidebarControls();
  const mobile = isMobileSidebarMode();
  const collapsed = mobile ? !mobileSidebarOpen : desktopSidebarCollapsed;
  document.body.classList.toggle('mobile-sidebar-mode', mobile);
  document.body.classList.remove('sidebar-open');
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  toggle.classList.toggle('is-open', !collapsed);
  toggle.setAttribute('aria-label', collapsed ? 'Show sidebar' : 'Hide sidebar');
  toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  const label = toggle.querySelector('.sidebar-toggle-label');
  if (label) label.textContent = collapsed ? 'Menu' : 'Hide';
}

function handleSidebarViewportChange() {
  const mobile = isMobileSidebarMode();
  if (mobile !== lastMobileSidebarMode) {
    if (mobile) mobileSidebarOpen = false;
    lastMobileSidebarMode = mobile;
  }
  syncSidebarState();
}

function openSidebar() {
  if (isMobileSidebarMode()) {
    mobileSidebarOpen = true;
  } else {
    desktopSidebarCollapsed = false;
    saveSidebarPreference(false);
  }
  syncSidebarState();
}

function closeSidebar() {
  if (isMobileSidebarMode()) {
    mobileSidebarOpen = false;
  } else {
    desktopSidebarCollapsed = true;
    saveSidebarPreference(true);
  }
  syncSidebarState();
}

function toggleSidebar() {
  if (isMobileSidebarMode()) {
    mobileSidebarOpen = !mobileSidebarOpen;
  } else {
    desktopSidebarCollapsed = !desktopSidebarCollapsed;
    saveSidebarPreference(desktopSidebarCollapsed);
  }
  syncSidebarState();
}

window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.openSidebar = openSidebar;


function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

  let analyticsQueue = [];
  let analyticsFlushInFlight = false;
  let dobFieldRevealed = false;
  let adminAutoRefreshTimer = null;
  let passwordHelperHideTimer = null;

  function getDeviceType() {
    const ua = String(navigator.userAgent || '').toLowerCase();
    if (/ipad|tablet/.test(ua)) return 'tablet';
    if (/mobi|android|iphone|ipod/.test(ua)) return 'mobile';
    return 'desktop';
  }

  function getClientMeta() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      locale: navigator.language || '',
      screen: `${window.innerWidth}x${window.innerHeight}`,
      platform: navigator.platform || '',
      deviceType: getDeviceType(),
      referrer: document.referrer || '',
      createdAtLocal: new Date().toLocaleString(),
      sourcePage: window.location.href
    };
  }

  function applyMobileDobDefault(force = false) {
    const dobInput = document.getElementById('reg-dob');
    if (!dobInput) return;
    const deviceType = getDeviceType();
    if (!['mobile', 'tablet'].includes(deviceType)) return;
    if (!force && String(dobInput.value || '').trim()) return;
    const today = getLocalDateInputValue();
    if (!today) return;
    dobInput.value = today;
  }

  function startAdminAutoRefresh() {
    stopAdminAutoRefresh();
    if (!stateRef.currentUser || !['admin', 'moderator', 'teacher', 'class_assistant'].includes(stateRef.currentUser.role)) return;
    if (activeTrackedPage !== 'admin') return;
    adminAutoRefreshTimer = setInterval(() => {
      if (document.hidden || activeTrackedPage !== 'admin') return;
      loadAdminData({ silent: true, source: 'auto' });
    }, 35000);
  }

  function stopAdminAutoRefresh() {
    if (adminAutoRefreshTimer) {
      clearInterval(adminAutoRefreshTimer);
      adminAutoRefreshTimer = null;
    }
  }

  function injectAuthEnhancements() {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    if (!registerForm || !loginForm) return;

    registerForm.innerHTML = `
      <h2>Create Your Account 🚀</h2>
      <p>Sign up to start your credit course. We verify every email so duplicate and mistyped accounts do not slip through.</p>
      <div id="register-error" class="auth-error"></div>
      <div id="register-success" class="auth-success"></div>
      <div class="input-group">
        <label>Full Name</label>
        <input type="text" id="reg-name" placeholder="Your full name" maxlength="50"/>
      </div>
      <div class="input-group">
        <label>Email Address</label>
        <input type="email" id="reg-email" placeholder="you@email.com" maxlength="100"/>
        <div id="reg-email-status" class="field-status neutral">Enter the email you want tied to this account.</div>
      </div>
      <div id="dob-reveal-wrap" class="dob-reveal-wrap" aria-live="polite">
        <div class="dob-reveal-card">
          <div class="dob-reveal-head">
            <div class="dob-reveal-icon">🎂</div>
            <div>
              <div class="dob-reveal-title">One more detail before you continue</div>
              <div class="dob-reveal-sub">Now that your name and email are in, add your date of birth. There is no age limit — we use this for account context and analytics later.</div>
            </div>
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label>Date of Birth</label>
            <input type="date" id="reg-dob" class="dob-date-input" max="9999-12-31" />
            <div id="reg-dob-status" class="field-status neutral">Enter your real date of birth. This box stays open once it appears until the page is refreshed.</div>
          </div>
        </div>
      </div>
      <div class="input-group">
        <label>Password</label>
        <input type="password" id="reg-password" placeholder="Create a password" maxlength="100"/>
        <div id="reg-password-status" class="field-status neutral">Basics only: 8+ characters, uppercase, lowercase, number, and special character. Avoid easy passwords.</div>
      </div>
      <div class="auth-note">We capture timezone, device/browser details, date of birth, page activity, and time spent so you can pick up where you left off and so admins can support account issues later.</div>
      <button class="btn-start" id="reg-btn" onclick="handleRegister()">CREATE ACCOUNT →</button>
      <div class="auth-toggle">Already have an account? <a onclick="showLogin()">Log in</a></div>
    `;

    applyMobileDobDefault(true);

    loginForm.innerHTML = `
      <h2>Welcome Back 👋</h2>
      <p>Log in to continue your CrediStart credit course right where you left off.</p>
      <div id="login-error" class="auth-error"></div>
      <div id="login-success" class="auth-success"></div>
      <div class="input-group">
        <label>Email Address</label>
        <input type="email" id="login-email" placeholder="you@email.com" maxlength="100"/>
      </div>
      <div class="input-group">
        <label>Password</label>
        <input type="password" id="login-password" placeholder="Your password" maxlength="100"/>
      </div>
      <button class="btn-start" id="login-btn" onclick="handleLogin()">LOG IN →</button>
      <div class="helper-row">
        <div class="auth-toggle">Need an account? <a onclick="showRegister()">Sign up</a></div>
        <div class="muted-copy"><span class="auth-mini-link" onclick="showForgotPassword()">Forgot password?</span></div>
      </div>
    `;

    if (!document.getElementById('verify-form')) {
      document.getElementById('welcome-screen').insertAdjacentHTML('beforeend', `
        <div class="welcome-card" id="verify-form" style="display:none">
          <h2>Check Your Email 📬</h2>
          <p>We sent a 6-digit verification code to <strong id="verify-email-label">your email</strong>. Enter it below to finish creating your account.</p>
          <div id="verify-error" class="auth-error"></div>
          <div id="verify-success" class="auth-success"></div>
          <div class="input-group">
            <label>Verification Code</label>
            <input type="text" id="verify-code" placeholder="123456" maxlength="12" inputmode="text"/>
            
          </div>
          <div id="verify-debug" class="auth-code-box" style="display:none"></div>
          <button class="btn-start" id="verify-btn" onclick="handleVerifyRegistration()">VERIFY & ENTER →</button>
          <div class="helper-row">
            <div class="auth-toggle"><a onclick="showRegister()">← Back to signup</a></div>
            <div class="muted-copy"><span class="auth-mini-link" onclick="resendVerificationCode()">Resend code</span></div>
          </div>
        </div>

        <div class="welcome-card reset-shell" id="reset-request-form" style="display:none">
          <div class="reset-step-badge">🔐 Step 1 of 2 · Verify your account</div>
          <div class="reset-hero">
            <div class="reset-title">Reset your password</div>
            <p class="reset-copy">Enter your account email to get a reset code.</p>
          </div>
          <div id="reset-request-error" class="auth-error"></div>
          <div id="reset-request-success" class="auth-success"></div>
          <div class="reset-highlight">
            <div class="label">Account email</div>
            <div class="value" id="reset-request-email-preview">Enter your email below</div>
          </div>
          <div class="reset-grid">
            <div class="input-group">
              <label>Email Address</label>
              <input type="email" id="reset-email" placeholder="you@email.com" maxlength="100"/>
            </div>
          </div>
          <button class="btn-start" id="reset-request-btn" onclick="handleRequestPasswordReset()">SEND RESET CODE →</button>
          <div class="helper-row">
            <div class="auth-toggle">Remembered it? <a onclick="showLogin()">Back to login</a></div>
            <div class="muted-copy">Next: code + new password.</div>
          </div>
        </div>

        <div class="welcome-card reset-shell" id="reset-confirm-form" style="display:none">
          <div class="reset-step-badge">✨ Step 2 of 2 · Choose a new password</div>
          <div class="reset-hero">
            <div class="reset-title">Create your new password</div>
            <p class="reset-copy">Use your reset code and choose a new password.</p>
          </div>
          <div id="reset-confirm-error" class="auth-error"></div>
          <div id="reset-confirm-success" class="auth-success"></div>
          <div class="reset-highlight">
            <div class="label">Resetting account</div>
            <div class="value" id="reset-confirm-email-preview">Your account email will appear here</div>
          </div>
          <div class="reset-split">
            <div class="input-group">
              <label>Email Address</label>
              <input type="email" id="reset-confirm-email" placeholder="you@email.com" maxlength="100"/>
            </div>
            <div class="input-group">
              <label>Reset Code</label>
              <input type="text" id="reset-code" placeholder="123456" maxlength="12" inputmode="text"/>
            </div>
          </div>
          <div class="input-group">
            <label>New Password</label>
            <input type="password" id="reset-new-password" placeholder="Choose a strong new password" maxlength="100"/>
            <div id="reset-password-status" class="field-status neutral">Basics only: 8+ characters, uppercase, lowercase, number, and special character. Avoid easy passwords.</div>
          </div>
          <div id="reset-debug" class="auth-code-box" style="display:none"></div>
          <button class="btn-start" id="reset-confirm-btn" onclick="handleConfirmPasswordReset()">SAVE NEW PASSWORD →</button>
          <div class="helper-row">
            <div class="auth-toggle">Need another code? <a onclick="showForgotPassword(document.getElementById('reset-confirm-email')?.value || '')">Start over</a></div>
            <div class="muted-copy">You’ll return to login after saving.</div>
          </div>
        </div>
      `);
    }
  }

  function injectAdminEnhancements() {
    const nav = document.querySelector('#sidebar nav');
    if (nav && !document.getElementById('nav-admin')) {
      const accountSection = nav.querySelector('.logout-btn');
      if (accountSection) {
        accountSection.insertAdjacentHTML('beforebegin', `<div class="nav-item" id="nav-profile" onclick="showPage('profile')"><span class="icon">👤</span> Profile</div><div class="nav-item" id="nav-admin" style="display:none" onclick="showPage('admin')"><span class="icon">🛠️</span> Admin Console</div>`);
      }
    }

    if (!document.getElementById('page-profile')) {
      document.getElementById('main').insertAdjacentHTML('beforeend', `
        <div class="page" id="page-profile">
          <div class="page-header">
            <h1>👤 Profile</h1>
            <p class="subtitle">Your account, password access, and class setup.</p>
          </div>
          <div class="profile-shell">
            <div class="profile-hero-card">
              <div class="profile-hero-top">
                <div class="profile-hero-title">
                  <div class="profile-avatar">👤</div>
                  <div>
                    <h3 id="profile-name">—</h3>
                    <p id="profile-email">—</p>
                  </div>
                </div>
                <div class="profile-role-badge" id="profile-role-pill">Account</div>
              </div>
              <div id="profile-status" class="auth-success" style="display:none"></div>
              <div id="profile-error" class="auth-error" style="display:none"></div>
              <div class="profile-info-grid">
                <div class="profile-info-tile">
                  <div class="profile-info-label">Name on account</div>
                  <div class="profile-info-value" id="profile-name-tile">—</div>
                </div>
                <div class="profile-info-tile">
                  <div class="profile-info-label">Email used to sign up</div>
                  <div class="profile-info-value" id="profile-email-tile">—</div>
                </div>
              </div>
              <div class="profile-action-band">
                <div>
                  <strong>Password reset</strong>
                  <span>Open a cleaner reset flow with your account email already filled in.</span>
                </div>
                <button class="btn-start" onclick="showForgotPassword()">Reset Password</button>
              </div>
            </div>
            <div class="profile-block-card">
              <div class="profile-block-head">
                <div>
                  <h3 id="profile-class-title">Class</h3>
                  <p id="profile-class-subtitle">Connect this account to a teacher or view your class details.</p>
                </div>
              </div>
              <div id="profile-class-wrap"></div>
            </div>
          </div>
        </div>`);
    }
    if (!document.getElementById('page-admin')) {
      document.getElementById('main').insertAdjacentHTML('beforeend', `
        <div class="page" id="page-admin">
          <div class="admin-shell">
            <div class="page-header" style="margin-bottom:0;">
              <h1 id="admin-page-title">🛠️ Admin Console</h1>
              <p class="subtitle" id="admin-page-subtitle">User management, security controls, and site-wide analysis in a layout that matches the public experience without changing it.</p>
            </div>
            <div class="admin-top-grid" id="admin-overview-cards">
              <div class="admin-top-card"><div class="stat-label">Users</div><div class="stat-val">—</div><div class="stat-sub">Loading…</div></div>
              <div class="admin-top-card"><div class="stat-label">Verified</div><div class="stat-val">—</div><div class="stat-sub">Loading…</div></div>
              <div class="admin-top-card"><div class="stat-label">Tracked Time</div><div class="stat-val">—</div><div class="stat-sub">Loading…</div></div>
              <div class="admin-top-card"><div class="stat-label">Locked</div><div class="stat-val">—</div><div class="stat-sub">Loading…</div></div>
            </div>
            <div class="admin-tab-row">
              <div class="admin-tabs">
                <button class="admin-tab-btn" id="admin-tab-classroom" style="display:none" onclick="switchAdminTab('classroom')">🏫 Classroom</button>
                <button class="admin-tab-btn active" id="admin-tab-users" onclick="switchAdminTab('users')">👥 User Management</button>
                <button class="admin-tab-btn" id="admin-tab-audit" onclick="switchAdminTab('audit')">🧾 Audit Logs</button>
                <button class="admin-tab-btn" id="admin-tab-analysis" onclick="switchAdminTab('analysis')">📊 Analysis</button>
                <button class="admin-tab-btn" id="admin-tab-quiz" onclick="switchAdminTab('quiz')">🧠 Quiz Insights</button>
              </div>
              <div class="admin-export-row">
                <button class="secondary-btn" onclick="loadAdminData()">Refresh Data</button>
              </div>
            </div>
            <div class="admin-panel" id="admin-section-users">
              <div class="section-title">👥 User Management</div>
              <div class="admin-toolbar">
                <div class="admin-toolbar-row">
                  <input type="text" id="admin-search" placeholder="Search by name, email, class, or group" oninput="renderAdminUsers()" />
                  <select class="admin-select" id="admin-group-filter" onchange="renderAdminUsers()">
                    <option value="all">All groups</option>
                  </select>
                  <select class="admin-select" id="admin-sort" onchange="renderAdminUsers()">
                    <option value="recent">Newest first</option>
                    <option value="name">Name A–Z</option>
                    <option value="group">Group A–Z</option>
                    <option value="class">Class A–Z</option>
                  </select>
                  <div class="admin-selection-chip" id="admin-selection-chip">0 selected</div>
                </div>
                <div class="admin-batch-shell" id="admin-user-toolbar-actions"></div>
              </div>
              <div class="admin-export-note">Select one or more users to scope analysis, export user-management data, or run batch actions. User-management exports are admin only.</div>
              <div class="admin-user-layout">
                <div class="admin-table-wrap">
                  <table class="admin-table">
                    <thead><tr><th class="admin-select-cell"><input type="checkbox" class="admin-checkbox" id="admin-select-all" onclick="event.stopPropagation();toggleSelectAllAdminUsers(this.checked)" /></th><th>User</th><th>Role</th><th>Classroom</th><th>Group</th><th>Step</th><th>Time Spent</th><th>Last Login</th></tr></thead>
                    <tbody id="admin-users-body"></tbody>
                  </table>
                </div>
                <div id="admin-user-detail" class="admin-detail-card">
                  <div class="admin-empty">Select a user to see account details, progress, analytics, and security status.</div>
                </div>
              </div>
              <div class="admin-chart-card" style="margin-top:18px;">
                <div class="admin-chart-title">🧾 Audit Logs</div>
                <div class="admin-empty" style="text-align:left;">Audit tracking has been moved into its own dedicated page so filters, exports, security reviews, and classroom-impacting events have more room.</div>
                <div class="admin-export-row" style="margin-top:14px;">
                  <button class="secondary-btn" onclick="switchAdminTab('audit')">Open Audit Logs</button>
                </div>
              </div>
            </div>
                        <div class="admin-panel hidden" id="admin-section-audit">
              <div class="section-title">🧾 Audit Logs</div>
              <div class="audit-summary-grid" id="admin-audit-summary-grid"></div>
              <div class="admin-chart-card" style="margin-bottom:18px;">
                <div class="admin-chart-title">Filters</div>
                <div class="audit-filter-grid">
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Search</label><input type="text" id="admin-audit-search" placeholder="Action, actor, target, IP, details" oninput="updateAdminAuditFilters()" /></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">From</label><input type="date" id="admin-audit-range-start" onchange="updateAdminAuditFilters()" /></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">To</label><input type="date" id="admin-audit-range-end" onchange="updateAdminAuditFilters()" /></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Action</label><select id="admin-audit-action" onchange="updateAdminAuditFilters()"><option value="all">All actions</option></select></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Category</label><select id="admin-audit-category" onchange="updateAdminAuditFilters()"><option value="all">All categories</option><option value="security">Security</option><option value="classroom">Classroom</option><option value="user_management">User Management</option><option value="progress">Progress / Quiz</option><option value="system">System</option></select></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Actor role</label><select id="admin-audit-actor-role" onchange="updateAdminAuditFilters()"><option value="all">All roles</option></select></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Device</label><select id="admin-audit-device" onchange="updateAdminAuditFilters()"><option value="all">All devices</option></select></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Status</label><select id="admin-audit-status" onchange="updateAdminAuditFilters()"><option value="all">All statuses</option><option value="success">Success</option><option value="failed">Failed</option><option value="warning">Warning</option></select></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Severity</label><select id="admin-audit-severity" onchange="updateAdminAuditFilters()"><option value="all">All severities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                </div>
                <div class="audit-chip-row" id="admin-audit-chip-row"></div>
                <div class="admin-export-row">
                  <button class="secondary-btn" onclick="loadAdminAuditData()">Refresh Audit Logs</button>
                  <button class="secondary-btn" onclick="clearAdminAuditFilters()">Clear Filters</button>
                  <button class="tiny-btn ghost" onclick="exportAuditLogRange('json')">Export JSON</button>
                  <button class="tiny-btn gold" onclick="exportAuditLogRange('csv')">Export CSV</button>
                </div>
              </div>
              <div id="admin-audit-log" class="audit-log"></div>
            </div>

<div class="admin-panel hidden" id="admin-section-analysis">
              <div class="section-title">📊 Analysis</div>
              <div class="admin-filter-card">
                <div class="admin-chart-title">Filters</div>
                <div class="admin-filter-grid">
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Role</label><select class="admin-select" id="analysis-filter-role" onchange="renderAdminAnalysis()"><option value="all">All roles</option><option value="student">Students</option><option value="class_assistant">Class Assistants</option><option value="teacher">Teachers</option><option value="moderator">Moderators</option><option value="admin">Admins</option></select></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Verification</label><select class="admin-select" id="analysis-filter-verified" onchange="renderAdminAnalysis()"><option value="all">All</option><option value="verified">Verified only</option><option value="unverified">Unverified only</option></select></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Device</label><select class="admin-select" id="analysis-filter-device" onchange="renderAdminAnalysis()"><option value="all">All devices</option></select></div>
                  <div><label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Cohort</label><select class="admin-select" id="analysis-filter-cohort" onchange="renderAdminAnalysis()"><option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div>
                </div>
              </div>
              <div class="admin-kpi-grid" id="admin-analysis-kpis" style="margin-top:18px;"></div>
              <div class="admin-analysis-grid" style="margin-top:18px;">
                <div class="admin-chart-card">
                  <div class="admin-chart-title">Role Distribution</div>
                  <div id="admin-role-chart" class="admin-chart-bars"></div>
                </div>
                <div class="admin-chart-card">
                  <div class="admin-chart-title">Device Types</div>
                  <div id="admin-device-chart" class="admin-chart-bars"></div>
                </div>
                <div class="admin-chart-card">
                  <div class="admin-chart-title">Top Pages by Time</div>
                  <div id="admin-page-chart" class="admin-chart-bars"></div>
                </div>
                <div class="admin-chart-card">
                  <div class="admin-chart-title">Top Click Targets</div>
                  <div id="admin-click-chart" class="admin-chart-bars"></div>
                </div>
              </div>
              <div class="admin-table-card" style="margin-top:18px;">
                <div class="admin-chart-title">Filtered User Rows</div>
                <div class="admin-table-wrap">
                  <table class="admin-analysis-table">
                    <thead><tr><th>User</th><th>Role</th><th>Device</th><th>Current Step</th><th>Teacher / Class</th><th>Total Time</th><th>Last Seen</th></tr></thead>
                    <tbody id="admin-analysis-table-body"></tbody>
                  </table>
                </div>
              </div>
              <div id="admin-analysis-scope-banner" class="admin-scope-banner"></div>
              <div class="admin-chart-card" style="margin-top:18px;">
                <div class="admin-chart-title">Export</div>
                <div class="admin-export-row">
                  <button class="secondary-btn" onclick="exportAdminJson()">Export JSON</button>
                  <button class="secondary-btn" onclick="exportAdminCsv()">Export CSV</button>
                  <button class="secondary-btn" onclick="exportAdminPdf()">Export PDF</button>
                  <button class="secondary-btn" onclick="exportAdminPng()">Save PNG</button>
                </div>
                <div class="admin-export-toggle-grid">
                  <label class="admin-toggle-pill"><input type="checkbox" id="export-toggle-analysisSummary" checked onchange="syncAdminExportToggles()" /> Analysis summary</label>
                  <label class="admin-toggle-pill"><input type="checkbox" id="export-toggle-filteredUsers" checked onchange="syncAdminExportToggles()" /> Filtered user rows</label>
                  <label class="admin-toggle-pill"><input type="checkbox" id="export-toggle-quizSummary" checked onchange="syncAdminExportToggles()" /> Quiz summary</label>
                  <label class="admin-toggle-pill"><input type="checkbox" id="export-toggle-quizModuleRows" checked onchange="syncAdminExportToggles()" /> Quiz module rows</label>
                  <label class="admin-toggle-pill"><input type="checkbox" id="export-toggle-recentQuizActivity" checked onchange="syncAdminExportToggles()" /> Recent quiz activity</label>
                </div>
              </div>
            </div>

            <div class="admin-panel hidden" id="admin-section-quiz">
              <div class="section-title">🧠 Quiz Insights</div>
              <div id="admin-quiz-scope-banner" class="admin-scope-banner"></div>
              <div class="admin-kpi-grid" id="admin-quiz-kpis"></div>
              <div class="admin-quiz-grid" style="margin-top:18px;">
                <div class="admin-quiz-card">
                  <div class="admin-chart-title">Module Completion & Accuracy</div>
                  <div id="admin-quiz-module-chart" class="admin-chart-bars"></div>
                </div>
                <div class="admin-quiz-card">
                  <div class="admin-chart-title">Timing Highlights</div>
                  <div id="admin-quiz-timing-chart" class="admin-chart-bars"></div>
                </div>
              </div>
              <div class="admin-quiz-card" style="margin-top:18px;">
                <div class="admin-chart-title">Per-Module Learning Table</div>
                <div class="admin-table-wrap">
                  <table class="admin-quiz-table">
                    <thead><tr><th>Module</th><th>Users Started</th><th>Users Passed</th><th>Avg Quiz %</th><th>Avg Read Time</th><th>Avg Answer Time</th><th>Avg Attempts</th><th>Latest Completion</th></tr></thead>
                    <tbody id="admin-quiz-table-body"></tbody>
                  </table>
                </div>
              </div>
              <div class="admin-quiz-card" style="margin-top:18px;">
                <div class="admin-chart-title">Recent Quiz Activity</div>
                <div class="admin-table-wrap">
                  <table class="admin-quiz-table">
                    <thead><tr><th>User</th><th>Module</th><th>Started</th><th>Completed</th><th>Latest Score</th><th>Total Attempts</th><th>Avg Question Time</th></tr></thead>
                    <tbody id="admin-quiz-activity-body"></tbody>
                  </table>
                </div>
              </div>
            </div>

<div class="admin-panel hidden" id="admin-section-classroom">
  <div class="section-title">🏫 Classroom</div>
  <div id="classroom-root"></div>
</div>
          </div>
        </div>
      `);
    }
  }

  function showAuthForm(id) {
    installAuthFieldValidation();
    ['register-form', 'login-form', 'verify-form', 'reset-request-form', 'reset-confirm-form'].forEach(formId => {
      const el = document.getElementById(formId);
      if (el) el.style.display = formId === id ? 'block' : 'none';
    });
    ['register-error', 'register-success', 'login-error', 'login-success', 'verify-error', 'verify-success', 'reset-request-error', 'reset-request-success', 'reset-confirm-error', 'reset-confirm-success'].forEach(msgId => {
      const el = document.getElementById(msgId);
      if (el) el.style.display = 'none';
    });
  }

  function makeLoginInsteadHtml(email) {
    const safeEmail = String(email || '').replace(/'/g, "\'");
    return `An account with this email already exists. <span class="auth-mini-link" onclick="jumpToLoginWithEmail('${safeEmail}')">Log in</span> instead.`;
  }

  window.jumpToLoginWithEmail = function jumpToLoginWithEmail(email) {
    showLogin();
    const input = document.getElementById('login-email');
    if (input && email) input.value = email;
  };

  function enhanceAuthMessage(text) {
    const value = String(text || '');
    if (!value) return '';
    if (value.includes('An account with this email already exists')) {
      const email = document.getElementById('reg-email')?.value.trim().toLowerCase() || '';
      return makeLoginInsteadHtml(email);
    }
    return value;
  }

  function setMessage(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = enhanceAuthMessage(text);
    el.style.display = text ? 'block' : 'none';
    if (type === 'success') {
      el.classList.remove('auth-error');
      el.classList.add('auth-success');
    } else if (type === 'error') {
      el.classList.remove('auth-success');
      el.classList.add('auth-error');
    }
  }

  function setLoading(buttonId, loadingText, isLoading) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.disabled = isLoading;
    if (isLoading) {
      btn.innerHTML = `<span class="loading-spinner"></span>${loadingText}`;
    } else {
      const defaults = {
        'reg-btn': 'CREATE ACCOUNT →',
        'verify-btn': 'VERIFY & ENTER →',
        'login-btn': 'LOG IN →',
        'reset-request-btn': 'SEND RESET CODE →',
        'reset-confirm-btn': 'SAVE NEW PASSWORD →'
      };
      btn.textContent = defaults[buttonId] || btn.textContent;
    }
  }

  function emailLooksValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim().toLowerCase());
  }

  function dobLooksValid(value) {
    const raw = String(value || '').trim();
    if (!raw) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
    const date = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  }

  function getPasswordPolicy(password) {
    const value = String(password || '');
    const bypass = value === '-1';
    const simplified = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const commonWeak = ['password', 'passw0rd', 'qwerty', 'letmein', 'welcome', 'admin', 'default', 'abc123', '123456', '1234567', '12345678', '111111', 'credistart'];
    const policy = {
      bypass,
      length: value.length >= 8,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      number: /\d/.test(value),
      symbol: /[^A-Za-z0-9\s]/.test(value),
      notCommon: !(commonWeak.some(fragment => simplified.includes(fragment)) || /(0123|1234|2345|3456|4567|5678|6789|7890|9876|8765|7654|6543|5432|4321)/.test(simplified))
    };
    policy.valid = bypass || (policy.length && policy.upper && policy.lower && policy.number && policy.symbol && policy.notCommon);
    return policy;
  }

  function passwordLooksValid(password) {
    return getPasswordPolicy(password).valid;
  }


  function queueCompactPasswordHelper(inputId, statusId) {
    clearTimeout(passwordHelperHideTimer);
    const input = document.getElementById(inputId);
    const status = document.getElementById(statusId);
    if (!input || !status) return;
    const info = describePassword(input.value || '');
    setFieldStatus(statusId, info.text, info.type);
    if (info.type === 'success') {
      passwordHelperHideTimer = setTimeout(() => status.classList.add('helper-hide'), 1300);
    } else {
      status.classList.remove('helper-hide');
    }
  }

  function revealAndScrollIntoView(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
  }

  function maybeRevealDobField() {
    if (dobFieldRevealed) return;
    const name = document.getElementById('reg-name')?.value.trim() || '';
    const email = document.getElementById('reg-email')?.value.trim() || '';
    if (!name || !email) return;
    dobFieldRevealed = true;
    const wrap = document.getElementById('dob-reveal-wrap');
    if (!wrap) return;
    wrap.style.display = 'block';
    requestAnimationFrame(() => wrap.classList.add('revealed'));
  }

  function setFieldStatus(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = text || '';
    el.className = `field-status ${type || 'neutral'}`;
  }

  function passwordRuleHtml(policy) {
    const rules = [
      { ok: policy.length, label: 'At least 8 characters' },
      { ok: policy.upper, label: 'One uppercase letter' },
      { ok: policy.lower, label: 'One lowercase letter' },
      { ok: policy.number, label: 'One number' },
      { ok: policy.symbol, label: 'One special character' },
      { ok: policy.notCommon, label: 'Not an easy/common password' }
    ];
    return `<div class="password-compact-copy">Use a stronger password with the basics below.</div><ul class="password-rule-list">${rules.map(rule => `<li class="${rule.ok ? 'good' : 'bad'}"><span class="rule-icon">${rule.ok ? '✓' : '•'}</span><span>${rule.label}</span></li>`).join('')}</ul>`;
  }

  function describePassword(password) {
    const policy = getPasswordPolicy(password);
    if (!password) {
      return { text: `${passwordRuleHtml(policy)}`, type: 'neutral' };
    }
    if (policy.bypass) {
      return { text: 'Password accepted.', type: 'success' };
    }
    return {
      text: `${policy.valid ? '<div class="password-compact-copy">Password looks strong enough.</div>' : '<div class="password-compact-copy">Keep going — these basics are still required.</div>'}${passwordRuleHtml(policy)}`,
      type: policy.valid ? 'success' : 'error'
    };
  }

  let registerEmailCheckTimer = null;
  let registerEmailCheckSeq = 0;

  async function checkRegisterEmailAvailability(email) {
    const seq = ++registerEmailCheckSeq;
    setFieldStatus('reg-email-status', 'Checking whether this email is available…', 'info');
    try {
      const res = await fetch('/api/register/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (seq !== registerEmailCheckSeq) return;
      if (!res.ok) throw new Error(data.error || 'Could not check that email right now.');
      if (data.exists) {
        setFieldStatus('reg-email-status', makeLoginInsteadHtml(email), 'error');
      } else {
        setFieldStatus('reg-email-status', data.message || 'Email checked.', data.available ? 'success' : (data.pending ? 'info' : 'error'));
      }
    } catch (error) {
      if (seq !== registerEmailCheckSeq) return;
      setFieldStatus('reg-email-status', error.message || 'Could not check that email right now.', 'error');
    }
  }

  function installAuthFieldValidation() {
    const regName = document.getElementById('reg-name');
    const regEmail = document.getElementById('reg-email');
    const regDob = document.getElementById('reg-dob');
    const regPassword = document.getElementById('reg-password');
    const resetPassword = document.getElementById('reset-new-password');

    if (regName && !regName.dataset.validationBound) {
      regName.dataset.validationBound = '1';
      regName.addEventListener('input', maybeRevealDobField);
    }

    if (regEmail && !regEmail.dataset.validationBound) {
      regEmail.dataset.validationBound = '1';
      regEmail.addEventListener('input', () => {
        maybeRevealDobField();
        const email = regEmail.value.trim().toLowerCase();
        clearTimeout(registerEmailCheckTimer);
        registerEmailCheckSeq += 1;
        if (!email) {
          setFieldStatus('reg-email-status', 'Enter the email you want tied to this account.', 'neutral');
          return;
        }
        if (!emailLooksValid(email)) {
          setFieldStatus('reg-email-status', 'Please enter a valid email address.', 'error');
          return;
        }
        setFieldStatus('reg-email-status', 'Valid email format so far…', 'success');
        registerEmailCheckTimer = setTimeout(() => checkRegisterEmailAvailability(email), 350);
      });
    }

    if (regDob && !regDob.dataset.validationBound) {
      regDob.dataset.validationBound = '1';
      regDob.addEventListener('input', () => {
        if (!regDob.value) {
          setFieldStatus('reg-dob-status', 'Enter your real date of birth. There is no age limit for signup.', 'neutral');
          document.getElementById('dob-reveal-wrap')?.querySelector('.dob-reveal-card')?.classList.remove('helper-collapsed');
          return;
        }
        if (!dobLooksValid(regDob.value)) {
          setFieldStatus('reg-dob-status', 'Please enter a real date of birth that is not in the future.', 'error');
          document.getElementById('dob-reveal-wrap')?.querySelector('.dob-reveal-card')?.classList.remove('helper-collapsed');
          return;
        }
        setFieldStatus('reg-dob-status', 'Date of birth saved for this signup.', 'success');
        document.getElementById('dob-reveal-wrap')?.querySelector('.dob-reveal-card')?.classList.add('helper-collapsed');
        revealAndScrollIntoView('reg-password');
      });
    }

    if (regPassword && !regPassword.dataset.validationBound) {
      regPassword.dataset.validationBound = '1';
      regPassword.addEventListener('input', () => {
        queueCompactPasswordHelper('reg-password', 'reg-password-status');
      });
    }

    if (resetPassword && !resetPassword.dataset.validationBound) {
      resetPassword.dataset.validationBound = '1';
      resetPassword.addEventListener('input', () => {
        queueCompactPasswordHelper('reset-new-password', 'reset-password-status');
      });
    }
  }

  window.showLogin = function showLogin() {
    showAuthForm('login-form');
  };

  window.showRegister = function showRegister() {
    showAuthForm('register-form');
    applyMobileDobDefault();
    const wrap = document.getElementById('dob-reveal-wrap');
    if (dobFieldRevealed && wrap) {
      wrap.style.display = 'block';
      wrap.classList.add('revealed');
      revealAndScrollIntoView('reg-dob');
    }
  };

  window.showForgotPassword = function showForgotPassword(prefillEmail) {
    const resolvedEmail = String(prefillEmail || stateRef.currentUser?.email || '').trim();
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.classList.remove('hidden');
    showAuthForm('reset-request-form');
    const emailInput = document.getElementById('reset-email');
    const preview = document.getElementById('reset-request-email-preview');
    if (emailInput) {
      emailInput.value = resolvedEmail;
      emailInput.readOnly = Boolean(resolvedEmail);
    }
    if (preview) preview.textContent = resolvedEmail || 'Enter your email below';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Password reset opened.', 'info', 'Password');
  };

  function showVerifyForm(email, debugCode, message) {
    pendingVerificationEmail = email;
    document.getElementById('verify-email-label').textContent = email;
    document.getElementById('verify-code').value = '';
    const debug = document.getElementById('verify-debug');
    if (debugCode) {
      debug.innerHTML = `<strong>Developer preview code:</strong> ${debugCode}`;
      debug.style.display = 'block';
    } else {
      debug.style.display = 'none';
    }
    if (message) setMessage('verify-success', message, 'success');
    showAuthForm('verify-form');
  }

  function showResetConfirmForm(email, debugCode, message) {
    const emailField = document.getElementById('reset-confirm-email');
    const preview = document.getElementById('reset-confirm-email-preview');
    if (emailField) {
      emailField.value = email || '';
      emailField.readOnly = Boolean(email);
    }
    if (preview) preview.textContent = email || 'Your account email will appear here';
    document.getElementById('reset-code').value = '';
    document.getElementById('reset-new-password').value = '';
    const debug = document.getElementById('reset-debug');
    if (debugCode) {
      debug.innerHTML = `<strong>Developer preview code:</strong> ${debugCode}`;
      debug.style.display = 'block';
    } else {
      debug.style.display = 'none';
    }
    if (message) setMessage('reset-confirm-success', message, 'success');
    showAuthForm('reset-confirm-form');
  }

  window.handleRegister = async function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const dob = document.getElementById('reg-dob')?.value || '';
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password || !dob) {
      return setMessage('register-error', 'Please fill in your name, email, date of birth, and password.', 'error');
    }
    if (!emailLooksValid(email)) {
      return setMessage('register-error', 'Please enter a valid email address.', 'error');
    }
    if (!dobLooksValid(dob)) {
      return setMessage('register-error', 'Please enter a real date of birth that is not in the future.', 'error');
    }
    if (!passwordLooksValid(password)) {
      return setMessage('register-error', 'Password must be at least 8 characters and include uppercase, lowercase, number, special character, and avoid easy/common patterns.', 'error');
    }

    setMessage('register-error', '', 'error');
    setMessage('register-success', '', 'success');
    setLoading('reg-btn', 'Creating account…', true);

    try {
      const res = await fetch('/api/register/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email, dob, password, clientMeta: getClientMeta() })
      });
      const data = await res.json();
      if (!res.ok) {
        return setMessage('register-error', data.error || 'Registration failed.', 'error');
      }
      showVerifyForm(data.email || email, data.debugCode, data.message || 'Verification code sent.');
    } catch (error) {
      setMessage('register-error', 'Connection error. Please try again.', 'error');
    } finally {
      setLoading('reg-btn', 'Creating account…', false);
    }
  };

  window.resendVerificationCode = async function resendVerificationCode() {
    if (!pendingVerificationEmail) return;
    setLoading('verify-btn', 'Sending…', true);
    try {
      const res = await fetch('/api/register/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: pendingVerificationEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        return setMessage('verify-error', data.error || 'Could not resend code.', 'error');
      }
      const debug = document.getElementById('verify-debug');
      if (data.debugCode) {
        debug.innerHTML = `<strong>Developer preview code:</strong> ${data.debugCode}`;
        debug.style.display = 'block';
      }
      setMessage('verify-success', data.message || 'A new verification code has been sent.', 'success');
    } catch (error) {
      setMessage('verify-error', 'Connection error. Please try again.', 'error');
    } finally {
      setLoading('verify-btn', 'Sending…', false);
    }
  };

  async function completeLogin(user) {
    stateRef.currentUser = user;
    stateRef.studentName = user.name;
    await window.loadFromServer();
    document.getElementById('welcome-screen').classList.add('hidden');
    window.init();
  }

  window.handleVerifyRegistration = async function handleVerifyRegistration() {
    const code = document.getElementById('verify-code').value.trim();
    if (!pendingVerificationEmail || !code) {
      return setMessage('verify-error', 'Enter the verification code we emailed you.', 'error');
    }
    setLoading('verify-btn', 'Verifying…', true);
    setMessage('verify-error', '', 'error');
    try {
      const res = await fetch('/api/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: pendingVerificationEmail, code })
      });
      const data = await res.json();
      if (!res.ok) {
        return setMessage('verify-error', data.error || 'Verification failed.', 'error');
      }
      await completeLogin(data.user);
    } catch (error) {
      setMessage('verify-error', 'Connection error. Please try again.', 'error');
    } finally {
      setLoading('verify-btn', 'Verifying…', false);
    }
  };

  window.handleLogin = async function handleLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
      return setMessage('login-error', 'Please enter your email and password.', 'error');
    }
    setLoading('login-btn', 'Logging in…', true);
    setMessage('login-error', '', 'error');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, clientMeta: getClientMeta() })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requirePasswordReset) {
          showForgotPassword(email);
          return setMessage('reset-request-success', 'Too many incorrect password attempts. Reset your password below to unlock the account.', 'success');
        }
        return setMessage('login-error', data.error || 'Login failed.', 'error');
      }
      await completeLogin(data.user);
    } catch (error) {
      setMessage('login-error', 'Connection error. Please try again.', 'error');
    } finally {
      setLoading('login-btn', 'Logging in…', false);
    }
  };

  window.handleRequestPasswordReset = async function handleRequestPasswordReset() {
    const email = document.getElementById('reset-email').value.trim().toLowerCase();
    if (!emailLooksValid(email)) {
      return setMessage('reset-request-error', 'Please enter a valid email address.', 'error');
    }
    setLoading('reset-request-btn', 'Sending code…', true);
    setMessage('reset-request-error', '', 'error');
    try {
      const res = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        return setMessage('reset-request-error', data.error || 'Could not send reset code.', 'error');
      }
      showResetConfirmForm(email, data.debugCode, data.message || 'Reset code sent.');
      showToast(data.message || 'Reset code sent.', 'success', 'Password');
    } catch (error) {
      setMessage('reset-request-error', 'Connection error. Please try again.', 'error');
    } finally {
      setLoading('reset-request-btn', 'Sending code…', false);
    }
  };

  window.handleConfirmPasswordReset = async function handleConfirmPasswordReset() {
    const email = document.getElementById('reset-confirm-email').value.trim().toLowerCase();
    const code = document.getElementById('reset-code').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;
    if (!emailLooksValid(email) || !code || !newPassword) {
      return setMessage('reset-confirm-error', 'Enter your email, the reset code, and a new password.', 'error');
    }
    if (!passwordLooksValid(newPassword)) {
      return setMessage('reset-confirm-error', 'New password must be at least 8 characters and include uppercase, lowercase, number, special character, and avoid easy/common patterns.', 'error');
    }
    setLoading('reset-confirm-btn', 'Saving password…', true);
    setMessage('reset-confirm-error', '', 'error');
    try {
      const res = await fetch('/api/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, code, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        return setMessage('reset-confirm-error', data.error || 'Could not reset password.', 'error');
      }
      showLogin();
      document.getElementById('login-email').value = email;
      setMessage('login-success', data.message || 'Password updated. You can log in now.', 'success');
      showToast(data.message || 'Password updated. You can log in now.', 'success', 'Password');
    } catch (error) {
      setMessage('reset-confirm-error', 'Connection error. Please try again.', 'error');
    } finally {
      setLoading('reset-confirm-btn', 'Saving password…', false);
    }
  };

  function updateNavActive(pageId) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const navMap = {
      dashboard: "#sidebar .nav-item:nth-of-type(1)",
      tracker: null,
      certificate: '#nav-cert',
      admin: '#nav-admin'
    };
    let el = navMap[pageId] ? document.querySelector(navMap[pageId]) : null;
    if (!el && /^module$/.test(pageId)) return;
    if (!el) {
      el = Array.from(document.querySelectorAll('#sidebar .nav-item')).find(node => {
        const text = node.textContent || '';
        return (pageId === 'tracker' && text.includes('Score Tracker')) || (pageId === 'dashboard' && text.includes('Dashboard'));
      });
    }
    if (el) el.classList.add('active');
  }

  function queueAnalytics(item) {
    if (!stateRef.currentUser) return;
    analyticsQueue.push(item);
    if (analyticsQueue.length >= 8) flushAnalytics();
  }

  async function flushAnalytics() {
    if (!stateRef.currentUser || analyticsFlushInFlight || !analyticsQueue.length) return;
    analyticsFlushInFlight = true;
    const items = analyticsQueue.splice(0, analyticsQueue.length);
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify({ items })
      });
    } catch (_) {
      analyticsQueue = items.concat(analyticsQueue).slice(-50);
    } finally {
      analyticsFlushInFlight = false;
    }
  }

  function flushTrackedPage(reason) {
    if (!stateRef.currentUser || !activeTrackedPage) return;
    const durationMs = Date.now() - pageStartMs;
    if (durationMs > 800) {
      queueAnalytics({ type: 'page_time', page: activeTrackedPage, durationMs, reason });
    }
    pageStartMs = Date.now();
  }

  function startAnalyticsTracking() {
    clearInterval(analyticsTimer);
    activeTrackedPage = document.querySelector('.page.active')?.id?.replace('page-', '') || 'dashboard';
    pageStartMs = Date.now();
    queueAnalytics({ type: 'page_view', page: activeTrackedPage });
    analyticsTimer = setInterval(() => {
      flushTrackedPage('heartbeat');
      flushAnalytics();
    }, 15000);
  }

  document.addEventListener('click', (event) => {
    const clickable = event.target.closest('button, a, .nav-item');
    if (!clickable || !stateRef.currentUser) return;
    const label = (clickable.dataset.track || clickable.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (label) queueAnalytics({ type: 'click', target: label, page: activeTrackedPage });
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (!stateRef.currentUser) return;
    if (document.hidden) {
      flushTrackedPage('hidden');
      flushAnalytics();
    } else {
      pageStartMs = Date.now();
    }
  });

  window.addEventListener('beforeunload', () => {
    if (!stateRef.currentUser) return;
    flushTrackedPage('beforeunload');
  });

  function toggleAdminNav() {
    const navAdmin = document.getElementById('nav-admin');
    if (!navAdmin) return;
    const role = stateRef.currentUser?.role || '';
    const canView = ['admin', 'moderator', 'teacher', 'class_assistant'].includes(role);
    navAdmin.style.display = canView ? 'flex' : 'none';
    navAdmin.innerHTML = `<span class="icon">🛠️</span> ${role === 'teacher' ? 'Teacher Hub' : role === 'class_assistant' ? 'Class Hub' : 'Admin Console'}`;
  }

  window.init = function initPatched() {
    if (stateRef.currentUser) {
      stateRef.studentName = stateRef.currentUser.name;
    }
    desktopSidebarCollapsed = readSidebarPreference();
    mobileSidebarOpen = false;
    lastMobileSidebarMode = isMobileSidebarMode();
    originalInit();
    syncSidebarState();
    toggleAdminNav();
    startAnalyticsTracking();
  };

  window.showPage = function showPagePatched(id) {
    flushTrackedPage('page_change');
    originalShowPage(id);
    activeTrackedPage = id;
    pageStartMs = Date.now();
    queueAnalytics({ type: 'page_view', page: id });
    updateNavActive(id);
    if (id === 'admin') {
      loadAdminData();
      startAdminAutoRefresh();
    } else {
      stopAdminAutoRefresh();
    }
    if (id === 'profile') loadProfilePage();
    if (isMobileSidebarMode()) closeSidebar();
  };

  window.handleLogout = async function handleLogoutPatched() {
    flushTrackedPage('logout');
    await flushAnalytics();
    stateRef.currentUser = null;
    await originalHandleLogout();
    toggleAdminNav();
    clearInterval(analyticsTimer);
    stopAdminAutoRefresh();
    showLogin();
  };

  async function refreshCurrentUser() {
    try {
      const res = await fetch('/api/me', { credentials: 'same-origin' });
      if (!res.ok) {
        stateRef.currentUser = null;
        toggleAdminNav();
        return;
      }
      const data = await res.json();
      stateRef.currentUser = data.user;
      stateRef.studentName = data.user.name;
      toggleAdminNav();
      if (document.getElementById('welcome-screen').classList.contains('hidden')) {
        window.init();
      }
    } catch (_) {}
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  function getLocalDateInputValue(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return local.toISOString().slice(0, 10);
  }

  function getAuditDateRange(value) {
    const raw = String(value || '').trim();
    if (!raw) return { from: '', to: '' };
    const start = new Date(`${raw}T00:00:00`);
    const end = new Date(`${raw}T23:59:59.999`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { from: '', to: '' };
    return { from: start.toISOString(), to: end.toISOString() };
  }

  function shiftAuditDate(days) {
    const base = new Date(`${adminSelectedAuditDate || getLocalDateInputValue()}T12:00:00`);
    if (Number.isNaN(base.getTime())) return;
    base.setDate(base.getDate() + Number(days || 0));
    adminSelectedAuditDate = getLocalDateInputValue(base);
  }

  function formatDurationLabel(ms) {
    const totalSeconds = Math.round((Number(ms) || 0) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  function rolePill(role) {
    return `<span class="admin-pill ${role}">${role}</span>`;
  }

  function getSelectedAdminUsers() {
    return adminUsersCache.filter(user => selectedAdminUserIds.has(user.id));
  }

  function updateAdminSelectionUi() {
    const selectedUsers = getSelectedAdminUsers();
    const chip = document.getElementById('admin-selection-chip');
    if (chip) chip.textContent = `${selectedUsers.length} selected`;
    const selectAll = document.getElementById('admin-select-all');
    if (selectAll) {
      const filtered = getFilteredAdminUsers();
      const allFilteredSelected = filtered.length && filtered.every(user => selectedAdminUserIds.has(user.id));
      selectAll.checked = !!allFilteredSelected;
      selectAll.indeterminate = !!filtered.length && !allFilteredSelected && filtered.some(user => selectedAdminUserIds.has(user.id));
    }
    renderAdminBatchActionPanel('admin-user-toolbar-actions', { compact: false });
  }

  function updateAdminScopeBanners() {
    const scopedUsers = adminScopedUserIds && adminScopedUserIds.size
      ? adminUsersCache.filter(user => adminScopedUserIds.has(user.id))
      : [];
    const text = scopedUsers.length ? `Scoped to ${scopedUsers.length} selected user${scopedUsers.length === 1 ? '' : 's'} for analysis and quiz views.` : '';
    ['admin-analysis-scope-banner', 'admin-quiz-scope-banner'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (text) {
        el.classList.add('visible');
        el.innerHTML = `<span>${text}</span><button class="tiny-btn ghost" onclick="clearAdminAnalysisScope()">Show all users again</button>`;
      } else {
        el.classList.remove('visible');
        el.innerHTML = '';
      }
    });
  }

  function getUserManagedGroupNames(user) {
    return Array.isArray(user?.classroomGroups)
      ? user.classroomGroups.map(group => String(group?.name || '').trim()).filter(Boolean)
      : [];
  }

  function getUserClassroomLabel(user) {
    if (user?.teacherRelation?.className) return String(user.teacherRelation.className);
    if (user?.role === 'teacher') return String(user.className || 'Teacher class');
    if (user?.role === 'class_assistant') {
      const teacher = adminUsersCache.find(entry => entry.id === Number(user.classAssistantFor || 0));
      return String(teacher?.className || user.className || 'Assigned classroom');
    }
    return '—';
  }

  function getUserGroupFilterValues(user) {
    const values = new Set();
    const relationGroup = String(user?.teacherRelation?.groupName || '').trim();
    if (relationGroup) values.add(relationGroup);
    getUserManagedGroupNames(user).forEach(name => values.add(name));
    return Array.from(values);
  }

  function getUserGroupLabel(user) {
    const groups = getUserGroupFilterValues(user);
    if (!groups.length) return '—';
    return groups.length <= 2 ? groups.join(', ') : `${groups.slice(0, 2).join(', ')} +${groups.length - 2}`;
  }

  function getUserSearchHaystacks(user) {
    return [
      user?.name,
      user?.email,
      user?.role,
      user?.className,
      user?.teacherRelation?.teacherName,
      user?.teacherRelation?.className,
      user?.teacherRelation?.groupName,
      user?.teacherRelation?.classCode,
      user?.teacherCode,
      getUserClassroomLabel(user),
      getUserGroupFilterValues(user).join(' '),
      getUserManagedGroupNames(user).join(' '),
      Array.isArray(user?.classroomGroups) ? user.classroomGroups.map(group => group?.code || '').join(' ') : ''
    ].map(value => String(value || '').toLowerCase());
  }

  function populateAdminGroupFilter() {
    const select = document.getElementById('admin-group-filter');
    if (!select) return;
    const current = select.value || 'all';
    const groups = Array.from(new Set(adminUsersCache
      .flatMap(user => getUserGroupFilterValues(user))
      .filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
    select.innerHTML = `<option value="all">All groups</option><option value="unassigned">Unassigned</option>${groups.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join('')}`;
    const allowed = ['all', 'unassigned', ...groups];
    select.value = allowed.includes(current) ? current : 'all';
  }

  function getFilteredAdminUsers() {
    const query = (document.getElementById('admin-search')?.value || '').trim().toLowerCase();
    const groupFilter = document.getElementById('admin-group-filter')?.value || 'all';
    const sortMode = document.getElementById('admin-sort')?.value || 'recent';
    const filtered = adminUsersCache.filter(user => {
      const matchesQuery = !query || getUserSearchHaystacks(user).some(value => value.includes(query));
      if (!matchesQuery) return false;
      const userGroups = getUserGroupFilterValues(user);
      if (groupFilter === 'unassigned' && userGroups.length) return false;
      if (groupFilter !== 'all' && groupFilter !== 'unassigned' && !userGroups.includes(groupFilter)) return false;
      return true;
    });
    filtered.sort((a, b) => {
      if (sortMode === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
      if (sortMode === 'group') {
        const aGroup = String(getUserGroupFilterValues(a)[0] || 'zzzz');
        const bGroup = String(getUserGroupFilterValues(b)[0] || 'zzzz');
        const cmp = aGroup.localeCompare(bGroup);
        return cmp || String(a.name || '').localeCompare(String(b.name || ''));
      }
      if (sortMode === 'class') {
        const aClass = String(getUserClassroomLabel(a) || 'zzzz');
        const bClass = String(getUserClassroomLabel(b) || 'zzzz');
        const cmp = aClass.localeCompare(bClass);
        return cmp || String(a.name || '').localeCompare(String(b.name || ''));
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return filtered;
  }

  function getAnalysisFilteredUsers() {
    const filters = {
      role: document.getElementById('analysis-filter-role')?.value || 'all',
      verified: document.getElementById('analysis-filter-verified')?.value || 'all',
      device: document.getElementById('analysis-filter-device')?.value || 'all',
      cohort: document.getElementById('analysis-filter-cohort')?.value || 'all'
    };
    adminAnalysisFilters = filters;
    const now = Date.now();
    const scopedIds = adminScopedUserIds && adminScopedUserIds.size ? adminScopedUserIds : null;
    return adminUsersCache.filter(user => {
      if (scopedIds && !scopedIds.has(user.id)) return false;
      if (filters.role !== 'all' && user.role !== filters.role) return false;
      if (filters.verified === 'verified' && !user.emailVerified) return false;
      if (filters.verified === 'unverified' && user.emailVerified) return false;
      const deviceType = user.createdMeta.device_type || user.createdMeta.platform || 'unknown';
      if (filters.device !== 'all' && deviceType !== filters.device) return false;
      if (filters.cohort !== 'all') {
        const cutoff = now - (Number(filters.cohort) * 24 * 60 * 60 * 1000);
        const createdAt = new Date(user.createdAt || 0).getTime();
        if (!createdAt || createdAt < cutoff) return false;
      }
      return true;
    });
  }

  function renderBarChart(containerId, items, valueFormatter) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const rows = (items || []).filter(item => Number(item.value || 0) > 0);
    if (!rows.length) {
      el.innerHTML = '<div class="admin-empty">No data for this view yet.</div>';
      return;
    }
    const max = Math.max(...rows.map(item => Number(item.value || 0)), 1);
    el.innerHTML = rows.map(item => {
      const width = Math.max(6, Math.round((Number(item.value || 0) / max) * 100));
      return `<div class="admin-bar-row"><div class="admin-bar-label">${item.label}</div><div class="admin-bar-track"><div class="admin-bar-fill" style="width:${width}%"></div></div><div class="admin-bar-value">${valueFormatter ? valueFormatter(item.value) : item.value}</div></div>`;
    }).join('');
  }

  function aggregateMap(users, picker) {
    const map = {};
    users.forEach(user => {
      const source = picker(user) || {};
      Object.entries(source).forEach(([key, value]) => {
        map[key] = Number(map[key] || 0) + Number(value || 0);
      });
    });
    return Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1]));
  }

  function buildAnalysisDataset(users) {
    const totalTrackedMs = users.reduce((sum, user) => sum + Number(user.analytics.totalActiveMs || 0), 0);
    const verifiedCount = users.filter(user => user.emailVerified).length;
    const lockedCount = users.filter(user => user.mustResetPassword || user.security?.locked).length;
    const avgStep = users.length ? (users.reduce((sum, user) => sum + Number(user.progress.currentStep || 1), 0) / users.length) : 0;
    const avgTimeMs = users.length ? Math.round(totalTrackedMs / users.length) : 0;
    const roleCounts = ['student', 'class_assistant', 'teacher', 'moderator', 'admin'].map(role => ({ label: role, value: users.filter(user => user.role === role).length }));
    const deviceMap = {};
    users.forEach(user => {
      const device = user.createdMeta.device_type || user.createdMeta.platform || 'unknown';
      deviceMap[device] = Number(deviceMap[device] || 0) + 1;
    });
    const deviceCounts = Object.entries(deviceMap).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const pageTime = aggregateMap(users, user => user.analytics.pageTimeMs).slice(0, 6).map(([label, value]) => ({ label, value }));
    const clickCounts = aggregateMap(users, user => user.analytics.linkClicks).slice(0, 6).map(([label, value]) => ({ label, value }));
    return {
      users,
      totalUsers: users.length,
      verifiedCount,
      lockedCount,
      totalTrackedMs,
      avgStep,
      avgTimeMs,
      roleCounts,
      deviceCounts,
      pageTime,
      clickCounts
    };
  }

  function adminOverviewCardsHtml(overview) {
    const role = stateRef.currentUser?.role;
    const teacherCode = stateRef.currentUser?.teacherCode || stateRef.currentUser?.joinInfo?.teacherCode || '';
    const isTeacherScope = role === 'teacher' || role === 'class_assistant';
    const userSub = isTeacherScope
      ? `${overview.assistants || 0} assistant teachers · ${overview.students || 0} students`
      : `${overview.admins || 0} admins · ${overview.moderators || 0} moderators · ${overview.teachers || 0} teachers · ${overview.students || 0} students`;
    const timeSub = isTeacherScope ? 'Class activity combined' : 'All user activity combined';
    const base = `
      <div class="admin-top-card"><div class="stat-label">Users</div><div class="stat-val">${overview.totalUsers}</div><div class="stat-sub">${userSub}</div></div>
      <div class="admin-top-card"><div class="stat-label">Verified</div><div class="stat-val">${overview.verifiedUsers}</div><div class="stat-sub">Validated accounts only</div></div>
      <div class="admin-top-card"><div class="stat-label">Tracked Time</div><div class="stat-val">${overview.totalTrackedTimeLabel}</div><div class="stat-sub">${timeSub}</div></div>
      <div class="admin-top-card"><div class="stat-label">Locked / Reset</div><div class="stat-val">${overview.lockedUsers || 0}</div><div class="stat-sub">Accounts currently blocked pending reset</div></div>`;
    if (isTeacherScope) {
      const label = role === 'teacher' ? 'Teacher Code' : 'Class Code';
      const code = teacherCode || '—';
      return base + `<div class="admin-top-card"><div class="stat-label">${label}</div><div class="stat-val" style="font-size:1.2rem;letter-spacing:2px;">${code}</div><div class="stat-sub">Ready to share with students.</div></div>`;
    }
    return base;
  }

  function formatAuditJson(value) {
    if (!value || (typeof value === 'object' && !Object.keys(value).length)) return '—';
    try { return JSON.stringify(value, null, 2); } catch (_) { return String(value); }
  }

  function populateAdminAuditFilterOptions() {
    const actionSelect = document.getElementById('admin-audit-action');
    const roleSelect = document.getElementById('admin-audit-actor-role');
    const deviceSelect = document.getElementById('admin-audit-device');
    const setOptions = (el, values, fallback) => {
      if (!el) return;
      const current = el.value || 'all';
      el.innerHTML = `<option value="all">${fallback}</option>${(values || []).map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}`;
      el.value = (values || []).includes(current) ? current : 'all';
    };
    setOptions(actionSelect, adminAuditFilterOptions.actions || [], 'All actions');
    setOptions(roleSelect, adminAuditFilterOptions.actorRoles || [], 'All roles');
    setOptions(deviceSelect, adminAuditFilterOptions.deviceTypes || [], 'All devices');
  }

  function renderAdminAuditSummary() {
    const container = document.getElementById('admin-audit-summary-grid');
    if (!container) return;
    const summary = adminAuditSummary || {};
    const cards = [['Events', summary.total || 0], ['Security', summary.security || 0], ['Classroom', summary.classroom || 0], ['User Mgmt', summary.user_management || 0], ['Failures', summary.failed || 0], ['High Risk', summary.high || 0]];
    container.innerHTML = cards.map(([label, value]) => `<div class="audit-summary-card"><div class="kicker">${label}</div><div class="value">${value}</div></div>`).join('');
  }

  function renderAdminAuditChips() {
    const container = document.getElementById('admin-audit-chip-row');
    if (!container) return;
    const current = adminAuditFilters.category || 'all';
    const chips = [['all', 'Everything'], ['security', 'Security'], ['classroom', 'Classroom'], ['user_management', 'User Mgmt'], ['progress', 'Progress / Quiz']];
    container.innerHTML = chips.map(([value, label]) => `<button class="audit-chip ${current === value ? 'active' : ''}" onclick="setAdminAuditCategory('${value}')">${label}</button>`).join('');
  }

  function renderAuditLog(entries) {
    const container = document.getElementById('admin-audit-log');
    if (!container) return;
    adminAuditEntries = Array.isArray(entries) ? entries.slice() : [];
    const totalRows = Number(container.dataset.total || adminAuditEntries.length || 0);
    const totalPages = Math.max(1, Number(container.dataset.totalPages || Math.ceil(totalRows / ADMIN_AUDIT_PAGE_SIZE) || 1));
    if (!adminAuditEntries.length) {
      container.innerHTML = '<div class="admin-empty">No audit events matched the current filters.</div>';
      return;
    }
    container.innerHTML = `
      <div class="audit-table-wrap">
        <table class="audit-table">
          <thead><tr><th>Time</th><th>Action</th><th>Category</th><th>Actor</th><th>Target</th><th>IP / Device</th><th>Severity</th><th>Status</th><th>More</th></tr></thead>
          <tbody>
            ${adminAuditEntries.map(entry => `
              <tr>
                <td data-label="Time">${escapeHtml(formatDate(entry.at))}</td>
                <td data-label="Action"><div class="audit-row-summary">${escapeHtml(entry.summary || String(entry.action || '').replace(/_/g, ' '))}</div><div class="secondary">${escapeHtml(entry.action || '')}</div></td>
                <td data-label="Category"><span class="audit-badge category">${escapeHtml(String(entry.category || 'system').replace(/_/g, ' '))}</span></td>
                <td data-label="Actor"><div class="audit-identity"><div class="primary">${escapeHtml(entry.actor_name || entry.actor_email || 'System')}</div><div class="secondary">${escapeHtml(entry.actor_email || 'system')} · ${escapeHtml(entry.actor_role || 'system')}</div></div></td>
                <td data-label="Target"><div class="audit-identity"><div class="primary">${escapeHtml(entry.target_name || entry.target_email || entry.target_user_id || '—')}</div><div class="secondary">${escapeHtml(entry.target_email || '')}${entry.target_role ? ` · ${escapeHtml(entry.target_role)}` : ''}${entry.target_user_id ? ` · ID ${escapeHtml(entry.target_user_id)}` : ''}</div></div></td>
                <td data-label="IP / Device">${escapeHtml(entry.ip || '—')}<div class="secondary">${escapeHtml(entry.device_type || 'Unknown device')}</div></td>
                <td data-label="Severity"><span class="audit-badge severity-${escapeHtml(entry.severity || 'low')}">${escapeHtml(entry.severity || 'low')}</span></td>
                <td data-label="Status"><span class="audit-badge status-${escapeHtml(entry.status || 'success')}">${escapeHtml(entry.status || 'success')}</span></td>
                <td data-label="More">
                  <details class="audit-expand">
                    <summary class="tiny-btn ghost">More details</summary>
                    <div class="audit-detail-panel">
                      <div class="audit-detail-grid">
                        <div class="audit-detail-block"><div class="label">Referrer</div><div>${escapeHtml(entry.referrer || '—')}</div></div>
                        <div class="audit-detail-block"><div class="label">User Agent</div><div>${escapeHtml(entry.user_agent || '—')}</div></div>
                        <div class="audit-detail-block"><div class="label">Entry ID</div><div>${escapeHtml(entry.id || '—')}</div></div>
                      </div>
                      <div class="audit-detail-grid">
                        <div class="audit-detail-block"><div class="label">Before</div><div class="audit-json">${escapeHtml(formatAuditJson(entry.before))}</div></div>
                        <div class="audit-detail-block"><div class="label">After</div><div class="audit-json">${escapeHtml(formatAuditJson(entry.after))}</div></div>
                        <div class="audit-detail-block"><div class="label">Details</div><div class="audit-json">${escapeHtml(formatAuditJson(entry.details))}</div></div>
                      </div>
                    </div>
                  </details>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="audit-log-footer"><div class="audit-log-page-copy">Showing page ${adminAuditPage} of ${totalPages} · ${totalRows} matching event${totalRows === 1 ? '' : 's'}</div><div class="audit-log-pagination"><button class="secondary-btn" ${adminAuditPage <= 1 ? 'disabled' : ''} onclick="setAdminAuditPage(1)">&laquo;</button><button class="secondary-btn" ${adminAuditPage <= 1 ? 'disabled' : ''} onclick="setAdminAuditPage(${adminAuditPage - 1})">&lt;</button><button class="secondary-btn" ${adminAuditPage >= totalPages ? 'disabled' : ''} onclick="setAdminAuditPage(${adminAuditPage + 1})">&gt;</button><button class="secondary-btn" ${adminAuditPage >= totalPages ? 'disabled' : ''} onclick="setAdminAuditPage(${totalPages})">&raquo;</button></div></div>`;
  }

  window.setAdminAuditPage = function setAdminAuditPage(page) {
    adminAuditPage = Math.max(1, Number(page || 1));
    loadAdminAuditData({ silent: true });
  };

  window.setAdminAuditCategory = function setAdminAuditCategory(value) {
    const select = document.getElementById('admin-audit-category');
    if (select) select.value = value || 'all';
    updateAdminAuditFilters();
  };

  window.updateAdminAuditFilters = function updateAdminAuditFilters() {
    adminAuditFilters = {
      query: document.getElementById('admin-audit-search')?.value || '',
      action: document.getElementById('admin-audit-action')?.value || 'all',
      category: document.getElementById('admin-audit-category')?.value || 'all',
      actorRole: document.getElementById('admin-audit-actor-role')?.value || 'all',
      deviceType: document.getElementById('admin-audit-device')?.value || 'all',
      status: document.getElementById('admin-audit-status')?.value || 'all',
      severity: document.getElementById('admin-audit-severity')?.value || 'all'
    };
    adminAuditPage = 1;
    loadAdminAuditData({ silent: true });
  };

  window.clearAdminAuditFilters = function clearAdminAuditFilters() {
    adminAuditFilters = { query: '', action: 'all', category: 'all', actorRole: 'all', deviceType: 'all', status: 'all', severity: 'all' };
    adminAuditPage = 1;
    const defaults = { 'admin-audit-search': '', 'admin-audit-action': 'all', 'admin-audit-category': 'all', 'admin-audit-actor-role': 'all', 'admin-audit-device': 'all', 'admin-audit-status': 'all', 'admin-audit-severity': 'all', 'admin-audit-range-start': adminSelectedAuditDate, 'admin-audit-range-end': adminSelectedAuditDate };
    Object.entries(defaults).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.value = value; });
    adminAuditRangeStart = adminSelectedAuditDate;
    adminAuditRangeEnd = adminSelectedAuditDate;
    loadAdminAuditData({ silent: true });
  };

  async function loadAdminAuditData(options = {}) {
    if (!stateRef.currentUser || !['admin', 'moderator', 'teacher', 'class_assistant'].includes(stateRef.currentUser.role)) return;
    const container = document.getElementById('admin-audit-log');
    if (container && !options.silent) container.innerHTML = '<div class="admin-empty">Loading audit logs…</div>';
    const startInput = document.getElementById('admin-audit-range-start');
    const endInput = document.getElementById('admin-audit-range-end');
    const startDate = String(startInput?.value || adminAuditRangeStart || adminSelectedAuditDate || '').trim();
    const endDate = String(endInput?.value || adminAuditRangeEnd || adminSelectedAuditDate || '').trim();
    adminAuditRangeStart = startDate || adminSelectedAuditDate;
    adminAuditRangeEnd = endDate || adminSelectedAuditDate;
    const fromRange = getAuditDateRange(adminAuditRangeStart);
    const toRange = getAuditDateRange(adminAuditRangeEnd);
    const params = new URLSearchParams({ page: String(adminAuditPage), pageSize: String(ADMIN_AUDIT_PAGE_SIZE) });
    if (fromRange.from) params.set('from', fromRange.from);
    if (toRange.to) params.set('to', toRange.to);
    Object.entries(adminAuditFilters || {}).forEach(([key, value]) => { if (value && value !== 'all') params.set(key, value); });
    try {
      const res = await fetch(`/api/admin/audit?${params.toString()}`, { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load audit logs.');
      adminAuditEntries = data.rows || [];
      adminAuditSummary = data.summary || {};
      adminAuditFilterOptions = data.filterOptions || { actions: [], actorRoles: [], deviceTypes: [] };
      if (container) {
        container.dataset.total = String(data.total || adminAuditEntries.length || 0);
        container.dataset.totalPages = String(data.totalPages || 1);
      }
      populateAdminAuditFilterOptions();
      renderAdminAuditSummary();
      renderAdminAuditChips();
      renderAuditLog(adminAuditEntries);
    } catch (error) {
      if (container) container.innerHTML = `<div class="admin-empty">${escapeHtml(error.message)}</div>`;
    }
  }
  window.loadAdminAuditData = loadAdminAuditData;

  window.exportAuditLogRange = async function exportAuditLogRange(format) {
    const startInput = document.getElementById('admin-audit-range-start');
    const endInput = document.getElementById('admin-audit-range-end');
    const startDate = String(startInput?.value || adminSelectedAuditDate || '').trim();
    const endDate = String(endInput?.value || adminSelectedAuditDate || '').trim();
    if (!startDate || !endDate) return showToast('Choose both a start and end date first.', 'error', 'Audit export');
    const fromRange = getAuditDateRange(startDate);
    const toRange = getAuditDateRange(endDate);
    if (!fromRange.from || !toRange.to) return showToast('Enter a valid audit export range.', 'error', 'Audit export');
    adminAuditRangeStart = startDate;
    adminAuditRangeEnd = endDate;
    try {
      const params = new URLSearchParams({ from: fromRange.from, to: toRange.to, format: format === 'csv' ? 'csv' : 'json' });
      Object.entries(adminAuditFilters || {}).forEach(([key, value]) => { if (value && value !== 'all') params.set(key, value); });
      const res = await fetch(`/api/admin/export/audit?${params.toString()}`, { credentials: 'same-origin' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not export the audit log.');
      }
      const extension = format === 'csv' ? 'csv' : 'json';
      const mime = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';
      const content = await res.text();
      downloadBlob(`credistart-audit-${startDate}-to-${endDate}.${extension}`, content, mime);
      showToast(`Audit ${format.toUpperCase()} exported for ${startDate} to ${endDate}.`, 'success', 'Audit export');
    } catch (error) {
      showToast(error.message, 'error', 'Audit export');
    }
  };
  function selectedUser() {
    return adminUsersCache.find(user => user.id === selectedAdminUserId) || null;
  }


  function isProtectedSystemAccount(user) {
    return !!user?.protectedSystemAccount || String(user?.email || '').toLowerCase() === 'sys.admin@credistart.com';
  }

  function canModifySelectedUser(user) {
    if (!user) return { allowed: false, reason: 'Select a user first.' };
    if (!adminCapabilities.isModerator) return { allowed: true, reason: '' };
    if (stateRef.currentUser && user.id === stateRef.currentUser.id) {
      return { allowed: false, reason: 'Moderators cannot modify their own account.' };
    }
    if (user.role === 'moderator' || user.role === 'admin') {
      return { allowed: false, reason: 'Moderators can only modify student accounts below their role.' };
    }
    return { allowed: true, reason: '' };
  }

  function getModuleTitleById(moduleId) {
    const module = (window.MODULES || []).find(item => Number(item.id) === Number(moduleId));
    return module ? `Module ${module.id} — ${module.title}` : `Module ${moduleId}`;
  }

  function buildQuizInsightDataset(users) {
    const moduleMap = new Map();
    (window.MODULES || []).forEach(item => {
      const id = Number(item?.id);
      if (!Number.isFinite(id)) return;
      moduleMap.set(id, { id, title: item?.title || `Module ${id}` });
    });
    (users || []).forEach(user => {
      const metricsMap = user?.progress?.quizMetrics || {};
      Object.keys(metricsMap).forEach(moduleKey => {
        const id = Number(moduleKey);
        if (!Number.isFinite(id)) return;
        if (!moduleMap.has(id)) moduleMap.set(id, { id, title: `Module ${id}` });
      });
    });
    const modules = Array.from(moduleMap.values()).sort((a, b) => a.id - b.id);
    const perModule = modules.map(item => ({
      moduleId: item.id,
      title: item.title,
      usersStarted: 0,
      usersPassed: 0,
      latestCompletion: null,
      latestCompletionTs: 0,
      scoreTotal: 0,
      scoreCount: 0,
      readMsTotal: 0,
      readMsCount: 0,
      answerMsTotal: 0,
      answerMsCount: 0,
      attemptsTotal: 0,
      attemptsCount: 0,
      firstAnswerLeadTotal: 0,
      firstAnswerLeadCount: 0
    }));
    const recentActivity = [];
    let overallReadMs = 0;
    let overallReadCount = 0;
    let overallAnswerMs = 0;
    let overallAnswerCount = 0;
    let overallAttemptCount = 0;
    let overallPassed = 0;
    let overallStarted = 0;
    let overallScores = [];

    users.forEach(user => {
      const metricsMap = user.progress?.quizMetrics || {};
      Object.entries(metricsMap).forEach(([moduleKey, rawMetric]) => {
        const moduleId = Number(moduleKey);
        const row = perModule.find(item => item.moduleId === moduleId);
        if (!row || !rawMetric || typeof rawMetric !== 'object') return;
        overallStarted += 1;
        row.usersStarted += 1;
        const attempts = Array.isArray(rawMetric.attempts) ? rawMetric.attempts : [];
        const readMs = Number(rawMetric.lessonReadMs || 0);
        if (readMs > 0) { row.readMsTotal += readMs; row.readMsCount += 1; overallReadMs += readMs; overallReadCount += 1; }
        const totalAnswerMs = Number(rawMetric.totalQuizAnswerMs || 0);
        if (totalAnswerMs > 0) { row.answerMsTotal += totalAnswerMs; row.answerMsCount += 1; overallAnswerMs += totalAnswerMs; overallAnswerCount += 1; }
        if (attempts.length) {
          row.attemptsTotal += attempts.length;
          row.attemptsCount += 1;
          overallAttemptCount += attempts.length;
          const latest = attempts[attempts.length - 1];
          if (typeof latest.score === 'number') {
            row.scoreTotal += latest.score;
            row.scoreCount += 1;
            overallScores.push(latest.score);
          }
          const passedAttempt = attempts.find(entry => entry.passed);
          if (passedAttempt) {
            row.usersPassed += 1;
            overallPassed += 1;
          }
          const latestCompletion = rawMetric.completedAt || (passedAttempt ? passedAttempt.submittedAt : '');
          const latestTs = latestCompletion ? new Date(latestCompletion).getTime() : 0;
          if (latestTs && latestTs > row.latestCompletionTs) {
            row.latestCompletionTs = latestTs;
            row.latestCompletion = latestCompletion;
          }
          const avgQ = attempts.map(entry => Number(entry.avgQuestionMs || 0)).filter(Boolean);
          if (avgQ.length) recentActivity.push({
            user: user.name,
            email: user.email,
            moduleId,
            startedAt: rawMetric.firstStartedAt || attempts[0]?.startedAt || null,
            completedAt: rawMetric.completedAt || null,
            latestScore: latest.score,
            totalAttempts: attempts.length,
            avgQuestionMs: Math.round(avgQ.reduce((s, v) => s + v, 0) / avgQ.length)
          });
        }
        const leadValues = Array.isArray(rawMetric.timeToFirstAnswerMs) ? rawMetric.timeToFirstAnswerMs : [];
        if (leadValues.length) {
          row.firstAnswerLeadTotal += leadValues.reduce((s, v) => s + Number(v || 0), 0);
          row.firstAnswerLeadCount += leadValues.length;
        }
      });
    });

    recentActivity.sort((a, b) => new Date(b.completedAt || b.startedAt || 0).getTime() - new Date(a.completedAt || a.startedAt || 0).getTime());
    const completionBars = perModule.map(row => ({ label: `M${row.moduleId}`, value: row.usersPassed, sub: row.usersStarted }));
    const timingBars = [
      { label: 'Avg read time', value: overallReadCount ? Math.round(overallReadMs / overallReadCount) : 0 },
      { label: 'Avg answer time', value: overallAnswerCount ? Math.round(overallAnswerMs / overallAnswerCount) : 0 },
      { label: 'Avg attempts', value: perModule.filter(item => item.attemptsCount).length ? Math.round((perModule.reduce((s, item) => s + (item.attemptsCount ? item.attemptsTotal / item.attemptsCount : 0), 0) / perModule.filter(item => item.attemptsCount).length) * 100) / 100 : 0 },
      { label: 'Pass rate', value: overallStarted ? Math.round((overallPassed / overallStarted) * 100) : 0 }
    ];
    return {
      perModule,
      recentActivity: recentActivity.slice(0, 20),
      avgScore: overallScores.length ? Math.round(overallScores.reduce((s, v) => s + v, 0) / overallScores.length) : 0,
      avgReadMs: overallReadCount ? Math.round(overallReadMs / overallReadCount) : 0,
      avgAnswerMs: overallAnswerCount ? Math.round(overallAnswerMs / overallAnswerCount) : 0,
      totalAttempts: overallAttemptCount,
      modulesStarted: overallStarted,
      modulesPassed: overallPassed,
      completionBars,
      timingBars
    };
  }

  function renderSimpleList(items, emptyLabel, formatter) {
    if (!items || !items.length) return `<div class="admin-empty">${emptyLabel}</div>`;
    return `<div class="admin-list-block">${items.map(formatter).join('')}</div>`;
  }


  function getAvailableAdminBatchActions() {
    const actions = [
      { value: 'analysis', label: 'View selected analysis' },
      { value: 'reset-progress', label: 'Batch reset progress' }
    ];
    if (adminCapabilities.canManageRoles) actions.push({ value: 'set-role', label: 'Batch set role' });
    if (adminCapabilities.isAdmin || adminCapabilities.isModerator) {
      actions.push({ value: 'attach-teacher', label: 'Batch attach to teacher' });
      actions.push({ value: 'clear-teacher', label: 'Batch clear teacher' });
    }
    if (adminCapabilities.canForcePasswordReset) actions.push({ value: 'force-password-reset', label: 'Email reset codes' });
    if (adminCapabilities.isAdmin) {
      actions.push({ value: 'export-json', label: 'Export user JSON' });
      actions.push({ value: 'export-csv', label: 'Export user CSV' });
      actions.push({ value: 'delete', label: 'Batch delete' });
    }
    return actions;
  }

  function ensureBatchActionStateIsAllowed() {
    const actions = getAvailableAdminBatchActions();
    if (!actions.some(item => item.value === adminBatchActionState.action)) {
      adminBatchActionState.action = actions[0]?.value || 'analysis';
    }
  }

  function getBatchRoleOptions() {
    if (adminCapabilities.isTeacher) return ['student', 'class_assistant'];
    if (adminCapabilities.isModerator) return ['student'];
    return ['student', 'class_assistant', 'teacher', 'moderator', 'admin'];
  }

  function getBatchTeacherOptionsMarkup(selectedTeacherId = '') {
    return adminUsersCache
      .filter(item => item.role === 'teacher')
      .map(teacher => `<option value="${teacher.id}" ${String(selectedTeacherId) === String(teacher.id) ? 'selected' : ''}>${escapeHtml(teacher.name)} · ${escapeHtml(teacher.email)}</option>`)
      .join('');
  }

  function renderAdminBatchControlsMarkup(context = 'toolbar') {
    ensureBatchActionStateIsAllowed();
    const action = adminBatchActionState.action;
    if (action === 'set-role') {
      const options = getBatchRoleOptions().map(role => `<option value="${role}" ${adminBatchActionState.role === role ? 'selected' : ''}>${role.replace(/_/g, ' ')}</option>`).join('');
      return `<div class="admin-batch-controls"><select class="admin-select" data-batch-context="${context}" data-batch-field="role">${options}</select></div>`;
    }
    if (action === 'attach-teacher') {
      return `<div class="admin-batch-controls"><select class="admin-select" data-batch-context="${context}" data-batch-field="teacherId"><option value="">Select teacher</option>${getBatchTeacherOptionsMarkup(adminBatchActionState.teacherId)}</select></div>`;
    }
    if (action === 'force-password-reset') {
      return `<div class="admin-batch-controls"><input class="admin-input" data-batch-context="${context}" data-batch-field="note" placeholder="Optional note to include in the reset email." value="${escapeHtml(adminBatchActionState.note || '')}" /></div>`;
    }
    return `<div class="admin-batch-summary">${action === 'analysis' ? 'Open combined analysis for the currently selected users.' : action === 'reset-progress' ? 'Reset progress for every selected user you are allowed to manage.' : action === 'clear-teacher' ? 'Detach selected students or assistants from their current teacher where permitted.' : action === 'export-json' ? 'Download the selected user data as JSON.' : action === 'export-csv' ? 'Download the selected user data as CSV.' : action === 'delete' ? 'Delete the selected users you are allowed to manage.' : 'Run the selected batch action.'}</div>`;
  }

  function renderAdminBatchActionPanel(containerId, options = {}) {
    const root = document.getElementById(containerId);
    if (!root) return;
    ensureBatchActionStateIsAllowed();
    const actions = getAvailableAdminBatchActions();
    const compact = !!options.compact;
    root.className = `admin-batch-shell${compact ? ' compact' : ''}`;
    root.innerHTML = `
      <select class="admin-select" data-batch-context="${containerId}" data-batch-field="action">
        ${actions.map(item => `<option value="${item.value}" ${adminBatchActionState.action === item.value ? 'selected' : ''}>${item.label}</option>`).join('')}
      </select>
      <div id="${containerId}-controls">${renderAdminBatchControlsMarkup(containerId)}</div>
      <button class="secondary-btn" onclick="runAdminBatchAction('${containerId}')">Run Action</button>
      <button class="secondary-btn" onclick="clearAdminSelection()">Clear Selection</button>
    `;
    root.querySelectorAll('[data-batch-field]').forEach(el => {
      el.addEventListener('change', event => updateAdminBatchActionState(event.target.dataset.batchField, event.target.value));
      if (el.tagName === 'INPUT') {
        el.addEventListener('input', event => updateAdminBatchActionState(event.target.dataset.batchField, event.target.value, { rerender: false }));
      }
    });
  }

  function updateAdminBatchActionState(field, value, options = {}) {
    adminBatchActionState[field] = value;
    if (field === 'action') ensureBatchActionStateIsAllowed();
    if (options.rerender !== false) {
      renderAdminBatchActionPanel('admin-user-toolbar-actions', { compact: false });
      if (document.getElementById('admin-selection-actions')) renderAdminBatchActionPanel('admin-selection-actions', { compact: true });
    }
  }

  function setAdminSelectionRange(userId, checked = true) {
    const users = getFilteredAdminUsers();
    const targetIndex = users.findIndex(user => user.id === Number(userId));
    const anchorIndex = users.findIndex(user => user.id === Number(lastAdminSelectionAnchorId || userId));
    if (targetIndex === -1) return;
    const start = Math.min(targetIndex, anchorIndex === -1 ? targetIndex : anchorIndex);
    const end = Math.max(targetIndex, anchorIndex === -1 ? targetIndex : anchorIndex);
    users.slice(start, end + 1).forEach(user => {
      if (checked) selectedAdminUserIds.add(user.id);
      else selectedAdminUserIds.delete(user.id);
    });
  }

  function buildSelectedUsersAggregate(users) {
    const dataset = buildAnalysisDataset(users);
    return {
      count: users.length,
      verifiedCount: users.filter(user => user.emailVerified).length,
      roles: users.reduce((acc, user) => { acc[user.role] = (acc[user.role] || 0) + 1; return acc; }, {}),
      avgStep: users.length ? (users.reduce((sum, user) => sum + Number(user.progress.currentStep || 1), 0) / users.length) : 0,
      completedModules: users.reduce((sum, user) => sum + Number(user.progress.completedModules.length || 0), 0),
      totalTrackedMs: users.reduce((sum, user) => sum + Number(user.analytics.totalActiveMs || 0), 0),
      loginCount: users.reduce((sum, user) => sum + Number(user.analytics.loginCount || 0), 0),
      pageHighlights: aggregateMap(users, user => user.analytics.pageTimeMs || {}).slice(0, 6),
      clickHighlights: aggregateMap(users, user => user.analytics.linkClicks || {}).slice(0, 6),
      classroomLabels: Array.from(new Set(users.map(user => getUserClassroomLabel(user)).filter(label => label && label !== '—'))),
      groupLabels: Array.from(new Set(users.flatMap(user => getUserGroupFilterValues(user)).filter(Boolean))),
      dataset
    };
  }

  function renderAdminSelectionDetail(users) {
    const detail = document.getElementById('admin-user-detail');
    if (!detail) return;
    const summary = buildSelectedUsersAggregate(users);
    const rolePills = Object.entries(summary.roles).map(([role, count]) => `<span class="admin-pill ${role}">${role.replace(/_/g, ' ')} · ${count}</span>`).join(' ');
    detail.innerHTML = `
      <div class="admin-section-title">🧑 Account Snapshot</div>
      <div style="margin-bottom:12px;">${rolePills || '<span class="admin-pill student">users selected</span>'} <span class="admin-pill verified">verified ${summary.verifiedCount}/${summary.count}</span></div>
      <div class="admin-metrics">
        <div class="admin-metric"><div class="label">Users selected</div><div class="value">${summary.count}</div></div>
        <div class="admin-metric"><div class="label">Avg current step</div><div class="value">${summary.avgStep.toFixed(1)}</div></div>
        <div class="admin-metric"><div class="label">Completed modules</div><div class="value">${summary.completedModules}</div></div>
        <div class="admin-metric"><div class="label">Login count</div><div class="value">${summary.loginCount}</div></div>
      </div>
      <div class="admin-detail-action-row">
        <button class="tiny-btn ghost" onclick="viewSelectedAdminAnalysis()">View Combined Analysis</button>
        <button class="tiny-btn ghost" onclick="clearAdminSelection()">Clear Selection</button>
      </div>
      <div class="admin-section-title" style="margin-top:18px;">📌 Selection Details</div>
      <div class="admin-meta-list">
        <div class="admin-meta-row"><span class="key">Users selected</span><span class="val">${summary.count}</span></div>
        <div class="admin-meta-row"><span class="key">Verified users</span><span class="val">${summary.verifiedCount}</span></div>
        <div class="admin-meta-row"><span class="key">Combined site time</span><span class="val">${formatDurationLabel(summary.totalTrackedMs)}</span></div>
        <div class="admin-meta-row"><span class="key">Classrooms</span><span class="val">${summary.classroomLabels.length ? escapeHtml(summary.classroomLabels.slice(0, 4).join(', ')) + (summary.classroomLabels.length > 4 ? ` +${summary.classroomLabels.length - 4}` : '') : '—'}</span></div>
        <div class="admin-meta-row"><span class="key">Groups</span><span class="val">${summary.groupLabels.length ? escapeHtml(summary.groupLabels.slice(0, 4).join(', ')) + (summary.groupLabels.length > 4 ? ` +${summary.groupLabels.length - 4}` : '') : '—'}</span></div>
      </div>
      <div class="admin-section-title" style="margin-top:18px;">📈 Analytics Highlights</div>
      ${renderSimpleList(summary.pageHighlights, 'No page-time analytics yet.', item => `<div class="admin-list-item"><span>${escapeHtml(item[0])}</span><strong>${formatDurationLabel(item[1])}</strong></div>`)}
      <div style="height:10px"></div>
      ${renderSimpleList(summary.clickHighlights, 'No tracked clicks yet.', item => `<div class="admin-list-item"><span>${escapeHtml(item[0])}</span><strong>${item[1]}</strong></div>`)}
      <div class="admin-section-title" style="margin-top:18px;">⚙️ Actions</div>
      <div id="admin-selection-actions"></div>
    `;
    renderAdminBatchActionPanel('admin-selection-actions', { compact: true });
  }

  window.renderAdminUsers = function renderAdminUsers() {
    const tbody = document.getElementById('admin-users-body');
    if (!tbody) return;
    const users = getFilteredAdminUsers();
    updateAdminSelectionUi();
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="admin-empty">No users match that search.</div></td></tr>';
      return;
    }
    tbody.innerHTML = users.map((user, index) => {
      const classroomLabel = getUserClassroomLabel(user);
      const groupLabel = getUserGroupLabel(user);
      const selected = selectedAdminUserIds.has(user.id);
      const focused = user.id === selectedAdminUserId;
      return `
      <tr class="${selected ? 'selected' : ''} ${focused ? 'focused' : ''}" onclick="handleAdminRowClick(${user.id}, event)">
        <td class="admin-select-cell"><input type="checkbox" class="admin-checkbox" data-admin-index="${index}" ${selected ? 'checked' : ''} onclick="event.stopPropagation();toggleAdminUserSelection(${user.id}, this.checked, event)" /></td>
        <td data-label="User"><strong>${escapeHtml(user.name)}</strong><br/><span style="color:var(--gray)">${escapeHtml(user.email)}</span></td>
        <td data-label="Role">${rolePill(user.role)} ${user.emailVerified ? '<span class="admin-pill verified">verified</span>' : ''} ${(user.mustResetPassword || user.security?.locked) ? '<span class="admin-pill locked">locked</span>' : ''}</td>
        <td data-label="Classroom">${escapeHtml(classroomLabel)}</td>
        <td data-label="Group">${escapeHtml(groupLabel)}</td>
        <td data-label="Step">Step ${user.progress.currentStep}</td>
        <td data-label="Time Spent">${formatDurationLabel(user.analytics.totalActiveMs)}</td>
        <td data-label="Last Login">${formatDate(user.lastLoginAt)}</td>
      </tr>
    `;
    }).join('');
    updateAdminSelectionUi();
  };

  window.handleAdminRowClick = function handleAdminRowClick(userId, event) {
    selectedAdminUserId = Number(userId);
    if (event?.shiftKey) {
      selectedAdminUserIds.add(Number(userId));
      setAdminSelectionRange(userId, true);
    }
    lastAdminSelectionAnchorId = Number(userId);
    renderAdminUsers();
    renderAdminUserDetail();
  };

  window.toggleAdminUserSelection = function toggleAdminUserSelection(userId, checked, event) {
    const numericId = Number(userId);
    if (event?.shiftKey && lastAdminSelectionAnchorId != null) {
      setAdminSelectionRange(numericId, checked);
    } else {
      if (checked) selectedAdminUserIds.add(numericId);
      else selectedAdminUserIds.delete(numericId);
    }
    selectedAdminUserId = numericId;
    lastAdminSelectionAnchorId = numericId;
    renderAdminUsers();
    renderAdminUserDetail();
  };

  window.toggleSelectAllAdminUsers = function toggleSelectAllAdminUsers(checked) {
    const users = getFilteredAdminUsers();
    users.forEach(user => {
      if (checked) selectedAdminUserIds.add(user.id);
      else selectedAdminUserIds.delete(user.id);
    });
    if (users.length) {
      selectedAdminUserId = users[0].id;
      lastAdminSelectionAnchorId = users[0].id;
    }
    renderAdminUsers();
    renderAdminUserDetail();
  };

  window.clearAdminSelection = function clearAdminSelection() {
    selectedAdminUserIds = new Set();
    renderAdminUsers();
    renderAdminUserDetail();
  };

  window.viewSpecificUserAnalysis = function viewSpecificUserAnalysis(userId) {
    adminScopedUserIds = new Set([Number(userId)]);
    updateAdminScopeBanners();
    switchAdminTab('analysis');
    showPage('admin');
    renderAdminAnalysis();
    renderAdminQuizInsights();
  };

  window.viewSelectedAdminAnalysis = function viewSelectedAdminAnalysis() {
    const selected = getSelectedAdminUsers();
    if (!selected.length) {
      if (selectedAdminUserId) return viewSpecificUserAnalysis(selectedAdminUserId);
      return showToast('Select one or more users first.', 'error', 'Selection');
    }
    adminScopedUserIds = new Set(selected.map(user => user.id));
    updateAdminScopeBanners();
    switchAdminTab('analysis');
    showPage('admin');
    renderAdminAnalysis();
    renderAdminQuizInsights();
  };

  window.clearAdminAnalysisScope = function clearAdminAnalysisScope() {
    adminScopedUserIds = null;
    updateAdminScopeBanners();
    renderAdminAnalysis();
    renderAdminQuizInsights();
  };

  window.selectAdminUser = function selectAdminUser(userId) {
    selectedAdminUserId = Number(userId);
    lastAdminSelectionAnchorId = Number(userId);
    renderAdminUsers();
    renderAdminUserDetail();
  };

  window.renderAdminUserDetail = function renderAdminUserDetail() {
    const detail = document.getElementById('admin-user-detail');
    if (!detail) return;
    const selectedUsers = getSelectedAdminUsers();
    if (selectedUsers.length > 1) {
      renderAdminSelectionDetail(selectedUsers);
      return;
    }
    const user = selectedUsers.length === 1 ? selectedUsers[0] : selectedUser();
    if (!user) {
      detail.innerHTML = '<div class="admin-empty">Select a user to see account details, progress, analytics, and security status.</div>';
      return;
    }
    const canManageRoles = !!adminCapabilities.canManageRoles;
    const canDeleteUsers = !!adminCapabilities.canDeleteUsers;
    const canForcePasswordReset = !!adminCapabilities.canForcePasswordReset;
    const manageAccess = canModifySelectedUser(user);
    const protectedSystem = isProtectedSystemAccount(user);
    const protectedReason = user.protectedSystemReason || 'This built-in system account is protected. Role changes, forced password resets, and deletion are disabled.';
    detail.innerHTML = `
      <div class="admin-section-title">🧑 Account Snapshot</div>
      <div style="margin-bottom:12px;">${rolePill(user.role)} ${user.emailVerified ? '<span class="admin-pill verified">verified</span>' : ''} ${(user.mustResetPassword || user.security?.locked) ? '<span class="admin-pill locked">password reset required</span>' : ''}</div>
      <div class="admin-metrics">
        <div class="admin-metric"><div class="label">Current step</div><div class="value">${user.progress.currentStep}</div></div>
        <div class="admin-metric"><div class="label">Completed modules</div><div class="value">${user.progress.completedModules.length}/6</div></div>
        <div class="admin-metric"><div class="label">Total site time</div><div class="value">${formatDurationLabel(user.analytics.totalActiveMs)}</div></div>
        <div class="admin-metric"><div class="label">Login count</div><div class="value">${user.analytics.loginCount}</div></div>
      </div>
      <div class="admin-detail-action-row">
        <button class="tiny-btn ghost" onclick="viewSpecificUserAnalysis(${user.id})">View All Analysis</button>
        <button class="tiny-btn ghost" onclick="toggleAdminUserSelection(${user.id}, !selectedAdminUserIds.has(${user.id}))">${selectedAdminUserIds.has(user.id) ? 'Remove From Selection' : 'Add To Selection'}</button>
      </div>
      <div class="admin-section-title" style="margin-top:18px;">📌 Account Details</div>
      <div class="admin-meta-list">
        <div class="admin-meta-row"><span class="key">Role:</span><span class="val">${user.role}</span></div>
        <div class="admin-meta-row"><span class="key">Created:</span><span class="val">${formatDate(user.createdAt)}</span></div>
        <div class="admin-meta-row"><span class="key">Verified:</span><span class="val">${user.emailVerified ? formatDate(user.verifiedAt) : 'No'}</span></div>
        <div class="admin-meta-row"><span class="key">Last login:</span><span class="val">${formatDate(user.lastLoginAt)}</span></div>
        <div class="admin-meta-row"><span class="key">Date of birth:</span><span class="val">${user.createdMeta.date_of_birth || '—'}</span></div>
        <div class="admin-meta-row"><span class="key">Timezone / locale:</span><span class="val">${user.createdMeta.timezone || '—'} / ${user.createdMeta.locale || '—'}</span></div>
        <div class="admin-meta-row"><span class="key">IP / country:</span><span class="val">${user.createdMeta.ip || '—'} ${user.createdMeta.country ? `(${user.createdMeta.country})` : ''}</span></div>
        <div class="admin-meta-row"><span class="key">Device type:</span><span class="val">${user.createdMeta.device_type || user.createdMeta.platform || '—'}</span></div>
        <div class="admin-meta-row"><span class="key">Teacher / class:</span><span class="val">${user.teacherRelation?.teacherName ? `${user.teacherRelation.teacherName} · ${user.teacherRelation.className || 'Class'}` : (user.role === 'teacher' ? `${getUserClassroomLabel(user)} · ${user.teacherCode || '—'}` : (user.role === 'class_assistant' ? getUserClassroomLabel(user) : 'Unassigned'))}</span></div>
        <div class="admin-meta-row"><span class="key">Classroom attachment:</span><span class="val">${getUserClassroomLabel(user)}</span></div>
        <div class="admin-meta-row"><span class="key">Group:</span><span class="val">${getUserGroupLabel(user) === '—' ? 'Unassigned' : getUserGroupLabel(user)}</span></div>
        <div class="admin-meta-row"><span class="key">Class code:</span><span class="val">${user.teacherRelation?.classCode || user.teacherCode || '—'}</span></div>
        <div class="admin-meta-row"><span class="key">Failed attempts:</span><span class="val">${user.security?.failedAttempts || 0}${user.security?.lastFailedAt ? ` · last ${formatDate(user.security.lastFailedAt)}` : ''}</span></div>
      </div>
      <div class="admin-section-title" style="margin-top:18px;">📈 Analytics Highlights</div>
      ${renderSimpleList(user.analytics.topPages, 'No page-time analytics yet.', item => `<div class="admin-list-item"><span>${escapeHtml(item.key)}</span><strong>${formatDurationLabel(item.value)}</strong></div>`)}
      <div style="height:10px"></div>
      ${renderSimpleList(user.analytics.topClicks, 'No tracked clicks yet.', item => `<div class="admin-list-item"><span>${escapeHtml(item.key)}</span><strong>${item.value}</strong></div>`)}
      <div class="admin-section-title" style="margin-top:18px;">⚙️ Actions</div>
      ${!manageAccess.allowed ? `<div class="admin-manage-note">${manageAccess.reason}</div>` : ''}${protectedSystem ? `<div class="admin-manage-note">${protectedReason}</div>` : ''}
      <div class="admin-actions">
        <div>
          <label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Set current step (1 = just starting, 7 = fully complete)</label>
          <div class="admin-inline">
            <input class="admin-input" type="number" id="admin-step-input" min="1" max="7" value="${user.progress.currentStep}" ${!manageAccess.allowed ? 'disabled' : ''}/>
            <button class="tiny-btn" onclick="adminSetStep(${user.id})" ${!manageAccess.allowed ? 'disabled' : ''}>Save Step</button>
            <button class="tiny-btn ghost" onclick="adminResetProgress(${user.id})" ${!manageAccess.allowed ? 'disabled' : ''}>Reset Progress</button>
          </div>
        </div>
        ${canManageRoles ? `
        <div>
          <label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Role</label>
          <div class="admin-inline">
            <select class="admin-select" id="admin-role-select" ${(!manageAccess.allowed || protectedSystem) ? 'disabled' : ''}>
              ${adminCapabilities.isTeacher ? `
                <option value="student" ${user.role === 'student' ? 'selected' : ''}>student</option>
                ${user.teacherRelation?.teacherId === stateRef.currentUser?.id || user.classAssistantFor === stateRef.currentUser?.id ? `<option value="class_assistant" ${user.role === 'class_assistant' ? 'selected' : ''}>assistant teacher</option>` : ''}
              ` : `
                <option value="student" ${user.role === 'student' ? 'selected' : ''}>student</option>
                <option value="class_assistant" ${user.role === 'class_assistant' ? 'selected' : ''}>assistant teacher</option>
                <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>teacher</option>
                <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>moderator</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
              `}
            </select>
            <button class="tiny-btn gold" onclick="adminSetRole(${user.id})" ${(!manageAccess.allowed || protectedSystem) ? 'disabled' : ''}>Update Role</button>
          </div>
        </div>` : ''}
        ${((adminCapabilities.isAdmin || adminCapabilities.isModerator) && ['student','class_assistant'].includes(user.role)) ? `
        <div>
          <label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Attach to teacher</label>
          <div class="admin-inline" style="flex-wrap:wrap;gap:10px;">
            <select class="admin-select" id="admin-teacher-attach-select" ${(!manageAccess.allowed || protectedSystem) ? 'disabled' : ''}>
              <option value="">Select teacher</option>
              ${adminUsersCache.filter(item => item.role === 'teacher').map(teacher => `<option value="${teacher.id}" ${user.teacherRelation?.teacherId === teacher.id ? 'selected' : ''}>${escapeHtml(teacher.name)} · ${escapeHtml(teacher.email)}</option>`).join('')}
            </select>
            <button class="tiny-btn gold" onclick="adminAttachTeacher(${user.id})" ${(!manageAccess.allowed || protectedSystem) ? 'disabled' : ''}>Attach / Move</button>
            <button class="tiny-btn ghost" onclick="adminDetachTeacher(${user.id})" ${(!manageAccess.allowed || protectedSystem) ? 'disabled' : ''}>Clear Teacher</button>
          </div>
        </div>` : ''}
        ${canForcePasswordReset ? `
        <div>
          <label class="muted-copy" style="display:block;color:var(--gray);margin-bottom:6px;">Force password reset note</label>
          <textarea class="admin-textarea" id="admin-reset-reason" placeholder="Optional note to include in the reset email." ${(!manageAccess.allowed || protectedSystem) ? 'disabled' : ''}></textarea>
          <div style="margin-top:10px;"><button class="tiny-btn gold" onclick="adminForcePasswordReset(${user.id})" ${(!manageAccess.allowed || protectedSystem) ? 'disabled' : ''}>Email Reset Code</button></div>
        </div>` : ''}
        ${((adminCapabilities.canManageClassroomStudents && user.role === 'student' && user.teacherRelation?.teacherId === (stateRef.currentUser?.role === 'teacher' ? stateRef.currentUser?.id : stateRef.currentUser?.classAssistantFor)) ? `<div><button class="tiny-btn danger" onclick="teacherRemoveStudent(${user.id})" ${(!manageAccess.allowed || protectedSystem) ? 'disabled' : ''}>Remove From Class</button></div>` : '')}
        ${canDeleteUsers ? `<div><button class="tiny-btn danger" onclick="adminDeleteUser(${user.id})" ${(!manageAccess.allowed || protectedSystem) ? 'disabled' : ''}>Delete User</button></div>` : ''}
      </div>
    `;
  };

  function populateDeviceFilter() {
    const select = document.getElementById('analysis-filter-device');
    if (!select) return;
    const current = select.value || 'all';
    const devices = Array.from(new Set(adminUsersCache.map(user => user.createdMeta.device_type || user.createdMeta.platform || 'unknown').filter(Boolean))).sort();
    select.innerHTML = `<option value="all">All devices</option>${devices.map(device => `<option value="${device}">${device}</option>`).join('')}`;
    select.value = devices.includes(current) ? current : 'all';
  }

  window.renderAdminAnalysis = function renderAdminAnalysis() {
    populateDeviceFilter();
    const users = getAnalysisFilteredUsers();
    const dataset = buildAnalysisDataset(users);
    const kpi = document.getElementById('admin-analysis-kpis');
    if (kpi) {
      kpi.innerHTML = `
        <div class="admin-mini-card"><div class="mini-label">Filtered Users</div><div class="mini-value">${dataset.totalUsers}</div></div>
        <div class="admin-mini-card"><div class="mini-label">Verified Rate</div><div class="mini-value">${dataset.totalUsers ? Math.round((dataset.verifiedCount / dataset.totalUsers) * 100) : 0}%</div></div>
        <div class="admin-mini-card"><div class="mini-label">Avg. Step</div><div class="mini-value">${dataset.totalUsers ? dataset.avgStep.toFixed(1) : '0.0'}</div></div>
        <div class="admin-mini-card"><div class="mini-label">Avg. Time</div><div class="mini-value">${formatDurationLabel(dataset.avgTimeMs)}</div></div>
      `;
    }
    renderBarChart('admin-role-chart', dataset.roleCounts, value => value);
    renderBarChart('admin-device-chart', dataset.deviceCounts, value => value);
    renderBarChart('admin-page-chart', dataset.pageTime, value => formatDurationLabel(value));
    renderBarChart('admin-click-chart', dataset.clickCounts, value => value);
    const tbody = document.getElementById('admin-analysis-table-body');
    if (tbody) {
      if (!dataset.users.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="admin-empty">No users match the active filters.</div></td></tr>';
      } else {
        tbody.innerHTML = dataset.users.map(user => `
          <tr>
            <td data-label="User"><strong>${user.name}</strong><br><span style="color:var(--gray)">${user.email}</span></td>
            <td data-label="Role">${user.role}</td>
            <td data-label="Device">${user.createdMeta.device_type || user.createdMeta.platform || '—'}</td>
            <td data-label="Current Step">${user.progress.currentStep}</td>
            <td data-label="Teacher / Class">${user.teacherRelation?.teacherName ? `${user.teacherRelation.teacherName} · ${user.teacherRelation.className || 'Class'}` : (user.role === 'teacher' ? getUserClassroomLabel(user) : (user.role === 'class_assistant' ? getUserClassroomLabel(user) : '—'))}</td>
            <td data-label="Total Time">${formatDurationLabel(user.analytics.totalActiveMs)}</td>
            <td data-label="Last Seen">${formatDate(user.analytics.lastSeenAt || user.lastLoginAt)}</td>
          </tr>
        `).join('');
      }
    }
  };


  window.renderAdminQuizInsights = function renderAdminQuizInsights() {
    const dataset = buildQuizInsightDataset(getAnalysisFilteredUsers());
    const kpi = document.getElementById('admin-quiz-kpis');
    if (kpi) {
      kpi.innerHTML = `
        <div class="admin-mini-card"><div class="mini-label">Modules Started</div><div class="mini-value">${dataset.modulesStarted}</div></div>
        <div class="admin-mini-card"><div class="mini-label">Modules Passed</div><div class="mini-value">${dataset.modulesPassed}</div></div>
        <div class="admin-mini-card"><div class="mini-label">Avg Quiz %</div><div class="mini-value">${dataset.avgScore}%</div></div>
        <div class="admin-mini-card"><div class="mini-label">Avg Attempts</div><div class="mini-value">${dataset.perModule.filter(item => item.attemptsCount).length ? (Math.round((dataset.perModule.reduce((s, item) => s + (item.attemptsCount ? item.attemptsTotal / item.attemptsCount : 0), 0) / dataset.perModule.filter(item => item.attemptsCount).length) * 100) / 100).toFixed(2) : '0.00'}</div></div>
      `;
    }
    renderBarChart('admin-quiz-module-chart', dataset.perModule.map(item => ({ label: `M${item.moduleId}`, value: item.usersPassed || 0, subValue: item.usersStarted || 0 })), value => `${value} passed`);
    renderBarChart('admin-quiz-timing-chart', [
      { label: 'Avg read time', value: dataset.avgReadMs },
      { label: 'Avg answer time', value: dataset.avgAnswerMs },
      { label: 'Total attempts', value: dataset.totalAttempts },
      { label: 'Pass rate %', value: dataset.modulesStarted ? Math.round((dataset.modulesPassed / dataset.modulesStarted) * 100) : 0 }
    ], (value, idx) => idx < 2 ? formatDurationLabel(value) : value);

    const tableBody = document.getElementById('admin-quiz-table-body');
    if (tableBody) {
      tableBody.innerHTML = dataset.perModule.map(item => {
        const avgScore = item.scoreCount ? Math.round(item.scoreTotal / item.scoreCount) : 0;
        const avgRead = item.readMsCount ? Math.round(item.readMsTotal / item.readMsCount) : 0;
        const avgAnswer = item.answerMsCount ? Math.round(item.answerMsTotal / item.answerMsCount) : 0;
        const avgAttempts = item.attemptsCount ? (item.attemptsTotal / item.attemptsCount) : 0;
        return `<tr>
          <td data-label="Module"><strong>Module ${item.moduleId}</strong><br><span style="color:var(--gray)">${item.title}</span></td>
          <td data-label="Users Started">${item.usersStarted}</td>
          <td data-label="Users Passed">${item.usersPassed}</td>
          <td data-label="Avg Quiz %">${avgScore}%</td>
          <td data-label="Avg Read Time">${formatDurationLabel(avgRead)}</td>
          <td data-label="Avg Answer Time">${formatDurationLabel(avgAnswer)}</td>
          <td data-label="Avg Attempts">${avgAttempts ? avgAttempts.toFixed(2) : '0.00'}</td>
          <td data-label="Latest Completion">${formatDate(item.latestCompletion)}</td>
        </tr>`;
      }).join('') || '<tr><td colspan="8"><div class="admin-empty">No quiz data has been recorded yet.</div></td></tr>';
    }

    const activityBody = document.getElementById('admin-quiz-activity-body');
    if (activityBody) {
      activityBody.innerHTML = dataset.recentActivity.map(item => `<tr>
        <td data-label="User"><strong>${item.user}</strong><br><span style="color:var(--gray)">${item.email}</span></td>
        <td data-label="Module">${getModuleTitleById(item.moduleId)}</td>
        <td data-label="Started">${formatDate(item.startedAt)}</td>
        <td data-label="Completed">${formatDate(item.completedAt)}</td>
        <td data-label="Latest Score">${typeof item.latestScore === 'number' ? `${item.latestScore}%` : '—'}</td>
        <td data-label="Total Attempts">${item.totalAttempts}</td>
        <td data-label="Avg Question Time">${formatDurationLabel(item.avgQuestionMs)}</td>
      </tr>`).join('') || '<tr><td colspan="7"><div class="admin-empty">No quiz activity yet.</div></td></tr>';
    }
  };

  

async function loadClassroomData() {
  if (!adminCapabilities.canViewClassroom) {
    classroomCache = null;
    renderClassroomTab();
    return;
  }
  try {
    const res = await fetch('/api/classroom', { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load classroom.');
    classroomCache = data.classroom || null;
    renderClassroomTab();
  } catch (error) {
    showToast(error.message, 'error', 'Classroom');
  }
}

async function postClassroom(url, body, options = {}) {
  const res = await fetch(url, {
    method: options.method || 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: options.method === 'DELETE' ? undefined : JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Classroom action failed.');
  classroomCache = data.classroom || classroomCache;
  renderClassroomTab();
  return data;
}

window.renderClassroomTab = function renderClassroomTab() {
  const root = document.getElementById('classroom-root');
  if (!root) return;
  if (!adminCapabilities.canViewClassroom) {
    root.innerHTML = '<div class="classroom-empty">Classroom tools are available for teacher and assistant accounts only.</div>';
    return;
  }
  if (!classroomCache) {
    root.innerHTML = '<div class="classroom-empty">Loading classroom…</div>';
    return;
  }
  const classroom = classroomCache;
  const groups = Array.isArray(classroom.groups) ? classroom.groups : [];
  const students = Array.isArray(classroom.students) ? classroom.students : [];
  const filteredStudents = classroomGroupFilter === 'all'
    ? students
    : classroomGroupFilter === 'unassigned'
      ? students.filter(student => !student.groupId)
      : students.filter(student => String(student.groupId || '') === classroomGroupFilter);
  const groupsMarkup = groups.map(group => {
    const editing = classroom.permissions?.canManageGroups && classroomEditingGroupId === group.id;
    const safeName = escapeHtml(group.name || '');
    return `
      <div class="classroom-group-item">
        ${editing ? `
          <div class="classroom-input-row">
            <input class="admin-input" id="classroom-rename-${group.id}" value="${safeName}" maxlength="80" />
            <button class="tiny-btn" onclick="renameClassroomGroup('${group.id}')">Save</button>
            <button class="tiny-btn ghost" onclick="cancelRenameClassroomGroup()">Cancel</button>
          </div>
        ` : `<strong>${safeName}</strong>`}
        <div class="meta">${escapeHtml(group.className || 'Class')} · ${group.studentCount} student(s)</div>
        <div class="classroom-group-actions">
          <span class="classroom-code-pill">${escapeHtml(group.code || '—')}</span>
          <button class="tiny-btn gold" onclick="copyClassroomCode('${escapeHtml(group.code || '')}')">Copy Code</button>
          ${classroom.permissions?.canManageGroups ? `<button class="tiny-btn ghost" onclick="startRenameClassroomGroup('${group.id}')">Rename</button><button class="tiny-btn ghost" onclick="regenerateClassroomGroupCode('${group.id}')">New Code</button><button class="tiny-btn danger" onclick="deleteClassroomGroup('${group.id}')">Delete</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  root.innerHTML = `
    <div class="classroom-card">
      <h3>${escapeHtml(classroom.teacher?.className || 'Classroom')}</h3>
      <div class="classroom-stat-grid">
        <div class="classroom-stat"><div class="label">Base code</div><div class="value">${escapeHtml(classroom.teacher?.teacherCode || '—')}</div></div>
        <div class="classroom-stat"><div class="label">Students</div><div class="value">${classroom.stats?.totalStudents || 0}</div></div>
        <div class="classroom-stat"><div class="label">Groups</div><div class="value">${classroom.stats?.groupCount || 0}</div></div>
        <div class="classroom-stat"><div class="label">Unassigned</div><div class="value">${classroom.stats?.unassignedStudents || 0}</div></div>
      </div>
    </div>
    <div class="classroom-grid" style="margin-top:18px;">
      <div class="classroom-card">
        <h3>Classroom</h3>
        <div class="classroom-input-row">
          <input class="admin-input" id="classroom-name-input" value="${escapeHtml(classroom.teacher?.className || '')}" ${classroom.permissions?.canEditSettings ? '' : 'disabled'} placeholder="Walton's Class" />
          ${classroom.permissions?.canEditSettings ? '<button class="tiny-btn" onclick="saveClassroomSettings()">Save</button>' : ''}
        </div>
        <div class="classroom-group-list">
          <div class="classroom-group-item">
            <strong>Default classroom</strong>
            <div class="meta">${escapeHtml(classroom.teacher?.className || 'Class')} · ${classroom.stats?.unassignedStudents || 0} student(s)</div>
            <div class="classroom-group-actions">
              <span class="classroom-code-pill">${escapeHtml(classroom.teacher?.teacherCode || '—')}</span>
              <button class="tiny-btn gold" onclick="copyClassroomCode('${escapeHtml(classroom.teacher?.teacherCode || '')}')">Copy Code</button>
            </div>
          </div>
          ${groupsMarkup || '<div class="classroom-empty">No groups yet.</div>'}
        </div>
        ${classroom.permissions?.canManageGroups ? `
          <div class="classroom-input-row">
            <input class="admin-input" id="classroom-new-group-input" placeholder="1st Hour or Group 1" />
            <button class="tiny-btn" onclick="addClassroomGroup()">Add Group</button>
          </div>
        ` : ''}
      </div>
      <div class="classroom-card">
        <div class="classroom-roster-head">
          <div>
            <h3>Students</h3>
          </div>
          <select class="admin-select" id="classroom-group-filter" onchange="setClassroomGroupFilter(this.value)">
            <option value="all">All students</option>
            <option value="unassigned" ${classroomGroupFilter === 'unassigned' ? 'selected' : ''}>Unassigned</option>
            ${groups.map(group => `<option value="${group.id}" ${classroomGroupFilter === group.id ? 'selected' : ''}>${escapeHtml(group.name)}</option>`).join('')}
          </select>
        </div>
        <div class="classroom-roster-grid">
          ${filteredStudents.map(student => `
            <div class="classroom-student-row">
              <div class="classroom-student-main">
                <strong>${escapeHtml(student.name || 'Student')}</strong>
                <span>${escapeHtml(student.email || '')}</span>
                <span class="classroom-student-class">${escapeHtml(student.className || 'Unassigned')}</span>
                <div class="classroom-student-meta">
                  <span>Joined ${student.joinedAt ? formatDate(student.joinedAt) : '—'}</span>
                  <span>Step ${student.currentStep || 1}</span>
                </div>
              </div>
              <div class="classroom-student-actions">
                <select class="admin-select" onchange="updateClassroomStudentGroup(${student.id}, this.value)">
                  <option value="">Unassigned</option>
                  ${groups.map(group => `<option value="${group.id}" ${student.groupId === group.id ? 'selected' : ''}>${escapeHtml(group.name)}</option>`).join('')}
                </select>
                <button class="tiny-btn danger" onclick="teacherRemoveStudent(${student.id})">Remove</button>
              </div>
            </div>
          `).join('') || '<div class="classroom-empty">No students match the current filter.</div>'}
        </div>
      </div>
    </div>
  `;
};

window.setClassroomGroupFilter = function setClassroomGroupFilter(value) {
  classroomGroupFilter = value || 'all';
  renderClassroomTab();
};

window.copyClassroomCode = async function copyClassroomCode(code) {
  try {
    await copyTextToClipboard(code);
    showToast('Class code copied.', 'success', 'Copied');
  } catch (_) {
    showToast('Could not copy the code on this device.', 'error', 'Copy failed');
  }
};

window.saveClassroomSettings = async function saveClassroomSettings() {
  const className = document.getElementById('classroom-name-input')?.value || '';
  try {
    await postClassroom('/api/classroom/settings', { className });
    await loadAdminData({ silent: true });
    showToast('Classroom name updated.', 'success', 'Classroom');
  } catch (error) {
    showToast(error.message, 'error', 'Classroom');
  }
};

window.addClassroomGroup = async function addClassroomGroup() {
  const name = document.getElementById('classroom-new-group-input')?.value || '';
  try {
    await postClassroom('/api/classroom/groups', { name });
    await loadAdminData({ silent: true });
    showToast('Group added.', 'success', 'Classroom');
  } catch (error) {
    showToast(error.message, 'error', 'Classroom');
  }
};

window.startRenameClassroomGroup = function startRenameClassroomGroup(groupId) {
  classroomEditingGroupId = groupId || null;
  renderClassroomTab();
};

window.cancelRenameClassroomGroup = function cancelRenameClassroomGroup() {
  classroomEditingGroupId = null;
  renderClassroomTab();
};

window.renameClassroomGroup = async function renameClassroomGroup(groupId) {
  const input = document.getElementById(`classroom-rename-${groupId}`);
  const name = input?.value || '';
  if (!name.trim()) {
    showToast('Enter a group name first.', 'error', 'Classroom');
    return;
  }
  try {
    await postClassroom(`/api/classroom/groups/${encodeURIComponent(groupId)}`, { name });
    classroomEditingGroupId = null;
    await loadAdminData({ silent: true });
    showToast('Group renamed.', 'success', 'Classroom');
  } catch (error) {
    showToast(error.message, 'error', 'Classroom');
  }
};

window.regenerateClassroomGroupCode = async function regenerateClassroomGroupCode(groupId) {
  if (!await showConfirm({ title:'Generate a new code?', message:'Students will need the new code to join this group going forward.', confirmText:'Generate Code', kicker:'Classroom' })) return;
  try {
    await postClassroom(`/api/classroom/groups/${encodeURIComponent(groupId)}/regenerate-code`, {});
    await loadAdminData({ silent: true });
    showToast('Group code updated.', 'success', 'Classroom');
  } catch (error) {
    showToast(error.message, 'error', 'Classroom');
  }
};

window.deleteClassroomGroup = async function deleteClassroomGroup(groupId) {
  if (!await showConfirm({ title:'Delete group?', message:'Students in this group will become unassigned.', confirmText:'Delete Group', danger:true, kicker:'Classroom' })) return;
  try {
    await postClassroom(`/api/classroom/groups/${encodeURIComponent(groupId)}`, {}, { method: 'DELETE' });
    await loadAdminData({ silent: true });
    showToast('Group deleted.', 'success', 'Classroom');
  } catch (error) {
    showToast(error.message, 'error', 'Classroom');
  }
};

window.updateClassroomStudentGroup = async function updateClassroomStudentGroup(userId, groupId) {
  try {
    await postClassroom(`/api/classroom/students/${userId}/group`, { groupId: groupId || '' });
    await loadAdminData({ silent: true });
    showToast('Student group updated.', 'success', 'Classroom');
  } catch (error) {
    showToast(error.message, 'error', 'Classroom');
  }
};

window.switchAdminTab = function switchAdminTab(tab) {
  if (tab === 'classroom' && !adminCapabilities.canViewClassroom) tab = 'users';
  selectedAdminTab = tab;
  adminDefaultTabResolved = true;
  document.getElementById('admin-tab-users')?.classList.toggle('active', tab === 'users');
  document.getElementById('admin-tab-audit')?.classList.toggle('active', tab === 'audit');
  document.getElementById('admin-tab-analysis')?.classList.toggle('active', tab === 'analysis');
  document.getElementById('admin-tab-quiz')?.classList.toggle('active', tab === 'quiz');
  document.getElementById('admin-tab-classroom')?.classList.toggle('active', tab === 'classroom');
  document.getElementById('admin-section-users')?.classList.toggle('hidden', tab !== 'users');
  document.getElementById('admin-section-audit')?.classList.toggle('hidden', tab !== 'audit');
  document.getElementById('admin-section-analysis')?.classList.toggle('hidden', tab !== 'analysis');
  document.getElementById('admin-section-quiz')?.classList.toggle('hidden', tab !== 'quiz');
  document.getElementById('admin-section-classroom')?.classList.toggle('hidden', tab !== 'classroom');
  updateAdminScopeBanners();
  if (tab === 'audit') loadAdminAuditData({ silent: true });
  if (tab === 'analysis') renderAdminAnalysis();
  if (tab === 'quiz') renderAdminQuizInsights();
  if (tab === 'classroom') renderClassroomTab();
};


  async function loadAdminData(options = {}) {
    if (!stateRef.currentUser || !['admin', 'moderator', 'teacher', 'class_assistant'].includes(stateRef.currentUser.role)) return;
    const cards = document.getElementById('admin-overview-cards');
    if (cards && !options.silent) cards.innerHTML = '<div class="admin-top-card"><div class="stat-label">Loading</div><div class="stat-val">…</div><div class="stat-sub">Fetching admin data</div></div>';
    try {
      const res = await fetch('/api/admin/users', { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load admin data.');
      adminUsersCache = data.users || [];
      adminCapabilities = data.capabilities || {};
      if (adminCapabilities.canViewClassroom && !adminDefaultTabResolved && (!selectedAdminTab || selectedAdminTab === 'users')) selectedAdminTab = 'classroom';
      const adminTitle = document.getElementById('admin-page-title');
      const adminSubtitle = document.getElementById('admin-page-subtitle');
      if (adminTitle) adminTitle.textContent = adminCapabilities.isTeacher ? '🧑‍🏫 Teacher Hub' : adminCapabilities.isClassAssistant ? '🧑‍🏫 Class Hub' : '🛠️ Admin Console';
      if (adminSubtitle) adminSubtitle.textContent = adminCapabilities.isTeacher ? 'Your student roster, classroom controls, and class analytics in one focused hub.' : adminCapabilities.isClassAssistant ? 'Class-scoped student progress, groups, and classroom visibility for your assigned teacher.' : 'User management, security controls, and site-wide analysis in a layout that matches the public experience without changing it.';
      const classroomTabBtn = document.getElementById('admin-tab-classroom');
      if (classroomTabBtn) classroomTabBtn.style.display = adminCapabilities.canViewClassroom ? '' : 'none';
      selectedAdminUserIds = new Set(Array.from(selectedAdminUserIds).filter(id => adminUsersCache.some(user => user.id === id)));
      if (adminScopedUserIds && adminScopedUserIds.size) {
        adminScopedUserIds = new Set(Array.from(adminScopedUserIds).filter(id => adminUsersCache.some(user => user.id === id)));
        if (!adminScopedUserIds.size) adminScopedUserIds = null;
      }
      document.getElementById('admin-overview-cards').innerHTML = adminOverviewCardsHtml(data.overview || { totalUsers: 0, admins: 0, moderators: 0, teachers: 0, assistants: 0, students: 0, verifiedUsers: 0, totalTrackedTimeLabel: '0s', lockedUsers: 0 });
      if (!adminAuditRangeStart) adminAuditRangeStart = adminSelectedAuditDate;
      if (!adminAuditRangeEnd) adminAuditRangeEnd = adminSelectedAuditDate;
      const auditStartInput = document.getElementById('admin-audit-range-start');
      const auditEndInput = document.getElementById('admin-audit-range-end');
      if (auditStartInput && !auditStartInput.value) auditStartInput.value = adminAuditRangeStart;
      if (auditEndInput && !auditEndInput.value) auditEndInput.value = adminAuditRangeEnd;
      populateAdminGroupFilter();
      if ((!selectedAdminUserId || !adminUsersCache.some(user => user.id === selectedAdminUserId)) && adminUsersCache.length) selectedAdminUserId = adminUsersCache[0].id;
      renderAdminUsers();
      if (selectedAdminUserId) renderAdminUserDetail();
      updateAdminScopeBanners();
      renderAdminAnalysis();
      renderAdminQuizInsights();
      if (adminCapabilities.canViewClassroom) await loadClassroomData(); else classroomCache = null;
      await loadAdminAuditData({ silent: true });
      switchAdminTab(selectedAdminTab);
      if (activeTrackedPage === 'admin') startAdminAutoRefresh();
    } catch (error) {
      if (cards) cards.innerHTML = `<div class="admin-top-card"><div class="stat-label">Error</div><div class="stat-val">!</div><div class="stat-sub">${error.message}</div></div>`;
    }
  }
  window.loadAdminData = loadAdminData;

  async function postAdmin(url, body, options = {}) {
    const res = await fetch(url, {
      method: options.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: options.method === 'DELETE' ? undefined : JSON.stringify(body || {})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Action failed.');
    return data;
  }

  function downloadBlob(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function getExportRows(sourceUsers) {
    return (sourceUsers || getAnalysisFilteredUsers()).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.emailVerified,
      deviceType: user.createdMeta.device_type || user.createdMeta.platform || '',
      dob: user.createdMeta.date_of_birth || '',
      currentStep: user.progress.currentStep,
      totalActiveMs: user.analytics.totalActiveMs || 0,
      totalActiveLabel: formatDurationLabel(user.analytics.totalActiveMs || 0),
      lastSeenAt: user.analytics.lastSeenAt || '',
      lastLoginAt: user.lastLoginAt || '',
      failedAttempts: user.security?.failedAttempts || 0,
      locked: Boolean(user.mustResetPassword || user.security?.locked),
      protectedSystemAccount: Boolean(user.protectedSystemAccount)
    }));
  }

  window.syncAdminExportToggles = function syncAdminExportToggles() {
    adminExportToggles = {
      analysisSummary: !!document.getElementById('export-toggle-analysisSummary')?.checked,
      filteredUsers: !!document.getElementById('export-toggle-filteredUsers')?.checked,
      quizSummary: !!document.getElementById('export-toggle-quizSummary')?.checked,
      quizModuleRows: !!document.getElementById('export-toggle-quizModuleRows')?.checked,
      recentQuizActivity: !!document.getElementById('export-toggle-recentQuizActivity')?.checked
    };
  };

  function buildAdminExportBundle(options = {}) {
    syncAdminExportToggles();
    const users = options.users || getAnalysisFilteredUsers();
    const analysis = buildAnalysisDataset(users);
    const quiz = buildQuizInsightDataset(users);
    const toggles = options.toggles || adminExportToggles;
    return {
      filters: { ...adminAnalysisFilters },
      exportScope: adminScopedUserIds && adminScopedUserIds.size ? 'selected-users' : 'all-filtered-users',
      scopedUserIds: adminScopedUserIds && adminScopedUserIds.size ? Array.from(adminScopedUserIds) : [],
      toggles: { ...toggles },
      exportedAt: new Date().toISOString(),
      analysisSummary: toggles.analysisSummary ? {
        totalUsers: analysis.totalUsers,
        verifiedCount: analysis.verifiedCount,
        lockedCount: analysis.lockedCount,
        totalTrackedMs: analysis.totalTrackedMs,
        totalTrackedLabel: formatDurationLabel(analysis.totalTrackedMs),
        avgStep: Number(analysis.avgStep.toFixed ? analysis.avgStep.toFixed(2) : analysis.avgStep || 0),
        avgTimeMs: analysis.avgTimeMs,
        avgTimeLabel: formatDurationLabel(analysis.avgTimeMs),
        roleCounts: analysis.roleCounts,
        deviceCounts: analysis.deviceCounts,
        pageTime: analysis.pageTime,
        clickCounts: analysis.clickCounts
      } : null,
      userRows: toggles.filteredUsers ? getExportRows(users) : [],
      quizSummary: toggles.quizSummary ? {
        modulesStarted: quiz.modulesStarted,
        modulesPassed: quiz.modulesPassed,
        avgScore: quiz.avgScore,
        avgReadMs: quiz.avgReadMs,
        avgReadLabel: formatDurationLabel(quiz.avgReadMs),
        avgAnswerMs: quiz.avgAnswerMs,
        avgAnswerLabel: formatDurationLabel(quiz.avgAnswerMs),
        totalAttempts: quiz.totalAttempts
      } : null,
      quizModuleRows: toggles.quizModuleRows ? quiz.perModule.map(item => ({
        moduleId: item.moduleId,
        title: item.title,
        usersStarted: item.usersStarted,
        usersPassed: item.usersPassed,
        avgQuizPercent: item.scoreCount ? Math.round(item.scoreTotal / item.scoreCount) : 0,
        avgReadMs: item.readMsCount ? Math.round(item.readMsTotal / item.readMsCount) : 0,
        avgReadLabel: formatDurationLabel(item.readMsCount ? Math.round(item.readMsTotal / item.readMsCount) : 0),
        avgAnswerMs: item.answerMsCount ? Math.round(item.answerMsTotal / item.answerMsCount) : 0,
        avgAnswerLabel: formatDurationLabel(item.answerMsCount ? Math.round(item.answerMsTotal / item.answerMsCount) : 0),
        avgAttempts: item.attemptsCount ? Number((item.attemptsTotal / item.attemptsCount).toFixed(2)) : 0,
        latestCompletion: item.latestCompletion || ''
      })) : [],
      recentQuizActivity: toggles.recentQuizActivity ? quiz.recentActivity.map(item => ({
        user: item.user,
        email: item.email,
        moduleId: item.moduleId,
        moduleTitle: getModuleTitleById(item.moduleId),
        startedAt: item.startedAt || '',
        completedAt: item.completedAt || '',
        latestScore: typeof item.latestScore === 'number' ? item.latestScore : '',
        totalAttempts: item.totalAttempts,
        avgQuestionMs: item.avgQuestionMs,
        avgQuestionLabel: formatDurationLabel(item.avgQuestionMs)
      })) : [],
      auditLogRows: adminAuditEntries.map(item => ({
        at: item.at || '',
        action: item.action || '',
        actorEmail: item.actor_email || '',
        actorRole: item.actor_role || '',
        targetUserId: item.target_user_id || '',
        ip: item.ip || '',
        deviceType: item.device_type || '',
        before: item.before ? JSON.stringify(item.before) : '',
        after: item.after ? JSON.stringify(item.after) : '',
        details: item.details ? JSON.stringify(item.details) : ''
      }))
    };
  }

  async function fetchUserManagementExport(ids) {
    const query = ids && ids.length ? `?ids=${ids.join(',')}` : '';
    const res = await fetch(`/api/admin/export/users${query}`, { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not export user management data.');
    return data;
  }

  function formatBatchFailureList(results) {
    return results.filter(item => !item.success).slice(0, 5).map(item => {
      const label = item.name || item.email || `User ${item.userId || '—'}`;
      return `${label}: ${item.error || 'Could not complete that change.'}`;
    });
  }

  async function showBatchResultFeedback(result, actionLabel) {
    const results = Array.isArray(result?.results) ? result.results : [];
    const successCount = results.filter(item => item.success).length;
    const failed = results.filter(item => !item.success);
    const failureLines = formatBatchFailureList(results);
    if (failed.length) {
      showToast(`${actionLabel} finished with ${successCount} success and ${failed.length} blocked or failed change(s).`, successCount ? 'info' : 'error', 'Batch action');
      await showAlertModal({
        title: `${actionLabel} finished`,
        kicker: 'Batch action',
        buttonText: 'Got it',
        message: failureLines.length
          ? `${successCount} succeeded and ${failed.length} failed.

${failureLines.join('\n')}${failed.length > failureLines.length ? `\n+${failed.length - failureLines.length} more` : ''}`
          : `${successCount} succeeded and ${failed.length} failed.`
      });
      return;
    }
    showToast(`${actionLabel} complete. ${successCount} user(s) updated.`, 'success', 'Batch action');
  }

  function buildUserManagementCsv(rows) {
    const parts = [];
    appendCsvSection(parts, 'User Management Export', rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      verifiedAt: user.verifiedAt,
      lastLoginAt: user.lastLoginAt,
      mustResetPassword: user.mustResetPassword,
      dateOfBirth: user.createdMeta?.date_of_birth || '',
      deviceType: user.createdMeta?.device_type || user.createdMeta?.platform || '',
      ip: user.createdMeta?.ip || '',
      timezone: user.createdMeta?.timezone || '',
      locale: user.createdMeta?.locale || '',
      currentStep: user.progress?.currentStep || '',
      completedModules: Array.isArray(user.progress?.completedModules) ? user.progress.completedModules.join('|') : '',
      totalActiveMs: user.analytics?.totalActiveMs || 0,
      loginCount: user.analytics?.loginCount || 0,
      sessionCount: user.analytics?.sessionCount || 0,
      failedAttempts: user.security?.failedAttempts || 0,
      locked: user.security?.locked || false,
      protectedSystemAccount: user.protectedSystemAccount || false
    })), { id:'', name:'', email:'', role:'', emailVerified:'', createdAt:'', verifiedAt:'', lastLoginAt:'', mustResetPassword:'', dateOfBirth:'', deviceType:'', ip:'', timezone:'', locale:'', currentStep:'', completedModules:'', totalActiveMs:'', loginCount:'', sessionCount:'', failedAttempts:'', locked:'', protectedSystemAccount:'' });
    return parts.join('\n');
  }


  window.runAdminBatchAction = async function runAdminBatchAction() {
    const ids = getSelectedAdminUsers().map(user => user.id);
    if (!ids.length) return showToast('Select one or more users first.', 'error', 'Selection');
    ensureBatchActionStateIsAllowed();
    const action = adminBatchActionState.action;
    if (action === 'analysis') return viewSelectedAdminAnalysis();
    if (action === 'export-json') return exportSelectedUsersJson();
    if (action === 'export-csv') return exportSelectedUsersCsv();
    if (action === 'reset-progress') return batchResetSelectedUsers();
    if (action === 'force-password-reset') return batchForceResetSelectedUsers();
    if (action === 'delete') return batchDeleteSelectedUsers();

    if (action === 'set-role') {
      const role = adminBatchActionState.role;
      if (!role) return showToast('Select a role first.', 'error', 'Batch action');
      if (!await showConfirm({ title:'Batch update role?', message:`Change ${ids.length} selected user(s) to ${role.replace(/_/g, ' ')} where permitted?`, confirmText:'Update Roles', kicker:'Batch action' })) return;
      try {
        const result = await postAdmin('/api/admin/users/batch', { action: 'set-role', userIds: ids, role });
        adminUsersCache = result.users || adminUsersCache;
        await showBatchResultFeedback(result, 'Batch role update');
        loadAdminData({ silent: true, source: 'batch' });
      } catch (error) {
        showToast(error.message, 'error', 'Batch action');
      }
      return;
    }

    if (action === 'attach-teacher') {
      const teacherId = Number(adminBatchActionState.teacherId || 0);
      if (!teacherId) return showToast('Select a teacher first.', 'error', 'Batch action');
      if (!await showConfirm({ title:'Batch attach to teacher?', message:`Attach ${ids.length} selected user(s) to the selected teacher where permitted?`, confirmText:'Attach Users', kicker:'Batch action' })) return;
      try {
        const result = await postAdmin('/api/admin/users/batch', { action: 'attach-teacher', userIds: ids, teacherId });
        adminUsersCache = result.users || adminUsersCache;
        await showBatchResultFeedback(result, 'Batch teacher attachment');
        loadAdminData({ silent: true, source: 'batch' });
      } catch (error) {
        showToast(error.message, 'error', 'Batch action');
      }
      return;
    }

    if (action === 'clear-teacher') {
      if (!await showConfirm({ title:'Batch clear teacher?', message:`Detach ${ids.length} selected user(s) from their current teacher where permitted?`, confirmText:'Clear Teacher', danger:true, kicker:'Batch action' })) return;
      try {
        const result = await postAdmin('/api/admin/users/batch', { action: 'clear-teacher', userIds: ids });
        adminUsersCache = result.users || adminUsersCache;
        await showBatchResultFeedback(result, 'Batch teacher clear');
        loadAdminData({ silent: true, source: 'batch' });
      } catch (error) {
        showToast(error.message, 'error', 'Batch action');
      }
    }
  };

  window.exportSelectedUsersJson = async function exportSelectedUsersJson() {
    if (!adminCapabilities.isAdmin) return showToast('Only admins can export user management data.', 'error', 'Export');
    const ids = getSelectedAdminUsers().map(user => user.id);
    const data = await fetchUserManagementExport(ids);
    downloadBlob(`credistart-user-management-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(data, null, 2), 'application/json');
  };

  window.exportSelectedUsersCsv = async function exportSelectedUsersCsv() {
    if (!adminCapabilities.isAdmin) return showToast('Only admins can export user management data.', 'error', 'Export');
    const ids = getSelectedAdminUsers().map(user => user.id);
    const data = await fetchUserManagementExport(ids);
    downloadBlob(`credistart-user-management-${new Date().toISOString().slice(0,10)}.csv`, buildUserManagementCsv(data.users || []), 'text/csv;charset=utf-8');
  };

  window.batchResetSelectedUsers = async function batchResetSelectedUsers() {
    const ids = getSelectedAdminUsers().map(user => user.id);
    if (!ids.length) return showToast('Select one or more users first.', 'error', 'Selection');
    if (!await showConfirm({ title:'Batch reset progress?', message:`Reset progress for ${ids.length} selected user(s)?`, confirmText:'Reset Progress', danger:true, kicker:'Batch action' })) return;
    try {
      const result = await postAdmin('/api/admin/users/batch', { action: 'reset-progress', userIds: ids });
      adminUsersCache = result.users || adminUsersCache;
      await showBatchResultFeedback(result, 'Batch reset progress');
      loadAdminData({ silent: true, source: 'batch' });
    } catch (error) {
      showToast(error.message, 'error', 'Batch action');
    }
  };

  window.batchForceResetSelectedUsers = async function batchForceResetSelectedUsers() {
    if (!adminCapabilities.isAdmin) return showToast('Only admins can batch-force password resets.', 'error', 'Batch action');
    const ids = getSelectedAdminUsers().map(user => user.id);
    if (!ids.length) return showToast('Select one or more users first.', 'error', 'Selection');
    const reason = String(adminBatchActionState.note || '').trim();
    if (!await showConfirm({ title:'Batch force reset?', message:`Force password reset for ${ids.length} selected user(s)?`, confirmText:'Force Reset', danger:true, kicker:'Batch action' })) return;
    try {
      const result = await postAdmin('/api/admin/users/batch', { action: 'force-password-reset', userIds: ids, reason });
      adminUsersCache = result.users || adminUsersCache;
      await showBatchResultFeedback(result, 'Batch password reset');
      loadAdminData({ silent: true, source: 'batch' });
    } catch (error) {
      showToast(error.message, 'error', 'Batch action');
    }
  };

  window.batchDeleteSelectedUsers = async function batchDeleteSelectedUsers() {
    if (!adminCapabilities.isAdmin) return showToast('Only admins can batch-delete users.', 'error', 'Batch action');
    const ids = getSelectedAdminUsers().map(user => user.id);
    if (!ids.length) return showToast('Select one or more users first.', 'error', 'Selection');
    if (!await showConfirm({ title:'Batch delete?', message:`Delete ${ids.length} selected user(s)? This cannot be undone.`, confirmText:'Delete Users', danger:true, kicker:'Batch action' })) return;
    try {
      const result = await postAdmin('/api/admin/users/batch', { action: 'delete', userIds: ids });
      await showBatchResultFeedback(result, 'Batch delete');
      selectedAdminUserIds = new Set();
      adminScopedUserIds = null;
      loadAdminData({ silent: true, source: 'batch' });
    } catch (error) {
      showToast(error.message, 'error', 'Batch action');
    }
  };

  function rowsToCsv(headers, rows) {
    return [headers.join(','), ...rows.map(row => headers.map(key => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  }

  function appendCsvSection(parts, title, rows, fallbackShape) {
    parts.push(title);
    const headers = Object.keys(rows[0] || fallbackShape);
    parts.push(rowsToCsv(headers, rows.length ? rows : [fallbackShape]));
    parts.push('');
  }

  function dataUrlToBytes(dataUrl) {
    return Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));
  }

  function roundedCard(ctx, x, y, w, h, r = 20) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.stroke();
  }

  function drawCanvasBars(ctx, items, opts = {}) {
    const startX = opts.startX || 70;
    const startY = opts.startY || 250;
    const trackX = opts.trackX || 360;
    const trackW = opts.trackW || 760;
    const rowGap = opts.rowGap || 62;
    const max = Math.max(...items.map(item => Number(item.value || 0)), 1);
    items.forEach((item, idx) => {
      const y = startY + idx * rowGap;
      ctx.fillStyle = '#0A2240';
      ctx.font = '18px Segoe UI';
      ctx.fillText(item.label, startX, y);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(trackX, y - 18, trackW, 18);
      ctx.fillStyle = item.fill || '#00B4D8';
      ctx.fillRect(trackX, y - 18, Math.max(12, (Number(item.value || 0) / max) * trackW), 18);
      ctx.fillStyle = '#5A6472';
      ctx.fillText(item.valueLabel || String(item.value || 0), trackX + trackW + 32, y);
    });
  }

  function downloadCanvasPng(filename, canvas) {
    downloadBlob(filename, dataUrlToBytes(canvas.toDataURL('image/png')), 'image/png');
  }

  window.exportAdminJson = function exportAdminJson() {
    const bundle = buildAdminExportBundle();
    downloadBlob(`credistart-admin-export-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(bundle, null, 2), 'application/json');
  };

  window.exportAdminCsv = function exportAdminCsv() {
    const bundle = buildAdminExportBundle();
    const parts = [];
    appendCsvSection(parts, 'Filters', [bundle.filters], { role: '', verified: '', device: '', cohort: '' });
    if (bundle.analysisSummary) appendCsvSection(parts, 'Analysis Summary', [bundle.analysisSummary], { totalUsers: '', verifiedCount: '', lockedCount: '', totalTrackedMs: '', totalTrackedLabel: '', avgStep: '', avgTimeMs: '', avgTimeLabel: '' });
    if (bundle.userRows?.length || bundle.toggles.filteredUsers) appendCsvSection(parts, 'Filtered User Rows', bundle.userRows, { id: '', name: '', email: '', role: '', verified: '', deviceType: '', dob: '', currentStep: '', totalActiveMs: '', totalActiveLabel: '', lastSeenAt: '', lastLoginAt: '', failedAttempts: '', locked: '', protectedSystemAccount: '' });
    if (bundle.quizSummary) appendCsvSection(parts, 'Quiz Summary', [bundle.quizSummary], { modulesStarted: '', modulesPassed: '', avgScore: '', avgReadMs: '', avgReadLabel: '', avgAnswerMs: '', avgAnswerLabel: '', totalAttempts: '' });
    if (bundle.quizModuleRows?.length || bundle.toggles.quizModuleRows) appendCsvSection(parts, 'Quiz Module Rows', bundle.quizModuleRows, { moduleId: '', title: '', usersStarted: '', usersPassed: '', avgQuizPercent: '', avgReadMs: '', avgReadLabel: '', avgAnswerMs: '', avgAnswerLabel: '', avgAttempts: '', latestCompletion: '' });
    if (bundle.recentQuizActivity?.length || bundle.toggles.recentQuizActivity) appendCsvSection(parts, 'Recent Quiz Activity', bundle.recentQuizActivity, { user: '', email: '', moduleId: '', moduleTitle: '', startedAt: '', completedAt: '', latestScore: '', totalAttempts: '', avgQuestionMs: '', avgQuestionLabel: '' });
    downloadBlob(`credistart-admin-export-${new Date().toISOString().slice(0,10)}.csv`, parts.join('\n'), 'text/csv;charset=utf-8');
  };

  window.exportAdminPdf = function exportAdminPdf() {
    const bundle = buildAdminExportBundle();
    const win = window.open('', '_blank', 'width=1280,height=980');
    if (!win) return showToast('Popup blocked. Allow popups to export PDF.', 'error', 'Export');
    win.document.write(`<!doctype html><html><head><title>CrediStart Admin Report</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:32px;color:#0A2240;background:#F8FBFF}h1,h2{margin:0 0 10px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}.card{border:1px solid #d9e2ec;border-radius:16px;padding:14px;background:#fff}.label{font-size:11px;text-transform:uppercase;color:#64748b;font-weight:800}.value{font-size:24px;font-weight:900;margin-top:8px}.section{margin-top:26px}table{width:100%;border-collapse:collapse;margin-top:14px;background:#fff}th,td{border:1px solid #d9e2ec;padding:10px;text-align:left;font-size:12px;vertical-align:top}th{background:#f4f8fc}.sub{color:#64748b;font-size:13px;margin-top:4px}</style></head><body><h1>CrediStart Admin Export</h1><div class="sub">Exported ${new Date().toLocaleString()}</div>${bundle.analysisSummary ? `<div class="cards"><div class="card"><div class="label">Filtered Users</div><div class="value">${bundle.analysisSummary.totalUsers}</div></div><div class="card"><div class="label">Verified</div><div class="value">${bundle.analysisSummary.verifiedCount}</div></div><div class="card"><div class="label">Tracked Time</div><div class="value">${bundle.analysisSummary.totalTrackedLabel}</div></div><div class="card"><div class="label">Avg Quiz %</div><div class="value">${bundle.quizSummary ? bundle.quizSummary.avgScore : 0}%</div></div></div>` : ''}${bundle.userRows?.length || bundle.toggles.filteredUsers ? `<div class="section"><h2>Analysis Snapshot</h2><table><thead><tr><th>User</th><th>Role</th><th>Device</th><th>Step</th><th>Total Time</th><th>Last Seen</th></tr></thead><tbody>${(bundle.userRows || []).map(row => `<tr><td>${row.name}<br>${row.email}</td><td>${row.role}</td><td>${row.deviceType || '—'}</td><td>${row.currentStep}</td><td>${row.totalActiveLabel}</td><td>${formatDate(row.lastSeenAt || row.lastLoginAt)}</td></tr>`).join('') || '<tr><td colspan="6">No rows</td></tr>'}</tbody></table></div>` : ''}${bundle.quizModuleRows?.length || bundle.toggles.quizModuleRows ? `<div class="section"><h2>Quiz Module Summary</h2><table><thead><tr><th>Module</th><th>Started</th><th>Passed</th><th>Avg Quiz %</th><th>Avg Read</th><th>Avg Answer</th><th>Avg Attempts</th><th>Latest Completion</th></tr></thead><tbody>${(bundle.quizModuleRows || []).map(row => `<tr><td>Module ${row.moduleId}<br>${row.title}</td><td>${row.usersStarted}</td><td>${row.usersPassed}</td><td>${row.avgQuizPercent}%</td><td>${row.avgReadLabel}</td><td>${row.avgAnswerLabel}</td><td>${row.avgAttempts}</td><td>${formatDate(row.latestCompletion)}</td></tr>`).join('') || '<tr><td colspan="8">No quiz rows</td></tr>'}</tbody></table></div>` : ''}${bundle.recentQuizActivity?.length || bundle.toggles.recentQuizActivity ? `<div class="section"><h2>Recent Quiz Activity</h2><table><thead><tr><th>User</th><th>Module</th><th>Started</th><th>Completed</th><th>Latest Score</th><th>Total Attempts</th><th>Avg Question Time</th></tr></thead><tbody>${(bundle.recentQuizActivity || []).slice(0, 24).map(row => `<tr><td>${row.user}<br>${row.email}</td><td>${row.moduleTitle}</td><td>${formatDate(row.startedAt)}</td><td>${formatDate(row.completedAt)}</td><td>${row.latestScore === '' ? '—' : `${row.latestScore}%`}</td><td>${row.totalAttempts}</td><td>${row.avgQuestionLabel}</td></tr>`).join('') || '<tr><td colspan="7">No activity rows</td></tr>'}</tbody></table></div>` : ''}${bundle.auditLogRows?.length ? `<div class="section"><h2>Audit Log</h2><table><thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Target</th><th>IP / Device</th><th>Before / After</th></tr></thead><tbody>${bundle.auditLogRows.slice(0,50).map(row => `<tr><td>${formatDate(row.at)}</td><td>${row.action}</td><td>${row.actorEmail}<br>${row.actorRole}</td><td>${row.targetUserId || '—'}</td><td>${row.ip || '—'}<br>${row.deviceType || '—'}</td><td>${row.before || '—'}<br>${row.after || row.details || '—'}</td></tr>`).join('')}</tbody></table></div>` : ''}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 250);
  };

  window.exportAdminPng = function exportAdminPng() {
    const bundle = buildAdminExportBundle({ toggles: { analysisSummary: true, filteredUsers: true, quizSummary: true, quizModuleRows: true, recentQuizActivity: true } });
    const dateTag = new Date().toISOString().slice(0,10);

    const analysisCanvas = document.createElement('canvas');
    analysisCanvas.width = 1800;
    analysisCanvas.height = 1100;
    const actx = analysisCanvas.getContext('2d');
    actx.fillStyle = '#F0F4FF';
    actx.fillRect(0, 0, analysisCanvas.width, analysisCanvas.height);
    actx.fillStyle = '#0A2240';
    actx.font = '700 42px Segoe UI';
    actx.fillText('CrediStart Admin Analysis Snapshot', 70, 80);
    actx.font = '20px Segoe UI';
    actx.fillStyle = '#5A6472';
    actx.fillText(`Exported ${new Date().toLocaleString()}`, 70, 115);
    [['Filtered Users', String(bundle.analysisSummary.totalUsers)], ['Verified Rate', `${bundle.analysisSummary.totalUsers ? Math.round((bundle.analysisSummary.verifiedCount / bundle.analysisSummary.totalUsers) * 100) : 0}%`], ['Avg Time', bundle.analysisSummary.avgTimeLabel], ['Locked', String(bundle.analysisSummary.lockedCount)]].forEach((card, idx) => {
      const x = 70 + idx * 420;
      actx.fillStyle = '#FFFFFF';
      actx.strokeStyle = '#D9E2EC';
      actx.lineWidth = 2;
      roundedCard(actx, x, 160, 360, 130, 20);
      actx.fillStyle = '#64748B';
      actx.font = '700 18px Segoe UI';
      actx.fillText(card[0].toUpperCase(), x + 24, 200);
      actx.fillStyle = '#0A2240';
      actx.font = '900 34px Segoe UI';
      actx.fillText(card[1], x + 24, 255);
    });
    actx.fillStyle = '#0A2240';
    actx.font = '800 26px Segoe UI';
    actx.fillText('Top Pages by Time', 70, 360);
    drawCanvasBars(actx, bundle.analysisSummary.pageTime.slice(0, 5).map(item => ({ label: item.label, value: item.value, valueLabel: formatDurationLabel(item.value), fill: '#00B4D8' })), { startY: 410, trackX: 420, trackW: 780, rowGap: 72 });
    actx.fillStyle = '#0A2240';
    actx.font = '800 26px Segoe UI';
    actx.fillText('Top Click Targets', 70, 790);
    drawCanvasBars(actx, bundle.analysisSummary.clickCounts.slice(0, 5).map(item => ({ label: item.label, value: item.value, valueLabel: String(item.value), fill: '#8B5CF6' })), { startY: 840, trackX: 420, trackW: 780, rowGap: 58 });
    downloadCanvasPng(`credistart-admin-analysis-${dateTag}.png`, analysisCanvas);

    const quizCanvas = document.createElement('canvas');
    quizCanvas.width = 1800;
    quizCanvas.height = 1180;
    const qctx = quizCanvas.getContext('2d');
    qctx.fillStyle = '#F7FAFF';
    qctx.fillRect(0, 0, quizCanvas.width, quizCanvas.height);
    qctx.fillStyle = '#0A2240';
    qctx.font = '700 42px Segoe UI';
    qctx.fillText('CrediStart Quiz Insights Snapshot', 70, 80);
    qctx.font = '20px Segoe UI';
    qctx.fillStyle = '#5A6472';
    qctx.fillText(`Exported ${new Date().toLocaleString()}`, 70, 115);
    [['Modules Started', String(bundle.quizSummary.modulesStarted)], ['Modules Passed', String(bundle.quizSummary.modulesPassed)], ['Avg Quiz %', `${bundle.quizSummary.avgScore}%`], ['Avg Answer Time', bundle.quizSummary.avgAnswerLabel]].forEach((card, idx) => {
      const x = 70 + idx * 420;
      qctx.fillStyle = '#FFFFFF';
      qctx.strokeStyle = '#D9E2EC';
      qctx.lineWidth = 2;
      roundedCard(qctx, x, 160, 360, 130, 20);
      qctx.fillStyle = '#64748B';
      qctx.font = '700 18px Segoe UI';
      qctx.fillText(card[0].toUpperCase(), x + 24, 200);
      qctx.fillStyle = '#0A2240';
      qctx.font = '900 34px Segoe UI';
      qctx.fillText(card[1], x + 24, 255);
    });
    qctx.fillStyle = '#0A2240';
    qctx.font = '800 26px Segoe UI';
    qctx.fillText('Module Completion', 70, 360);
    drawCanvasBars(qctx, bundle.quizModuleRows.slice(0, 6).map(item => ({ label: `Module ${item.moduleId}`, value: item.usersPassed, valueLabel: `${item.usersPassed}/${item.usersStarted} passed`, fill: '#22C55E' })), { startY: 410, trackX: 420, trackW: 780, rowGap: 62 });
    qctx.fillStyle = '#0A2240';
    qctx.font = '800 26px Segoe UI';
    qctx.fillText('Recent Quiz Activity', 70, 800);
    const activity = bundle.recentQuizActivity.slice(0, 5);
    activity.forEach((row, idx) => {
      const y = 850 + idx * 58;
      qctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FBFF';
      qctx.strokeStyle = '#D9E2EC';
      roundedCard(qctx, 70, y - 28, 1660, 42, 12);
      qctx.fillStyle = '#0A2240';
      qctx.font = '16px Segoe UI';
      qctx.fillText(`${row.user} • ${row.moduleTitle}`, 90, y);
      qctx.fillStyle = '#5A6472';
      qctx.fillText(`${row.latestScore === '' ? '—' : `${row.latestScore}%`} • ${row.avgQuestionLabel} • ${row.completedAt ? new Date(row.completedAt).toLocaleDateString() : 'in progress'}`, 900, y);
    });
    if (!activity.length) {
      qctx.fillStyle = '#5A6472';
      qctx.font = '20px Segoe UI';
      qctx.fillText('No recent quiz activity recorded yet.', 70, 860);
    }
    downloadCanvasPng(`credistart-admin-quiz-${dateTag}.png`, quizCanvas);
  };

  window.adminSetStep = async function adminSetStep(userId) {
    const step = Number(document.getElementById('admin-step-input').value || 1);
    try {
      await postAdmin(`/api/admin/users/${userId}/progress`, { step });
      await loadAdminData();
      showToast('Progress updated.', 'success', 'User management');
    } catch (error) {
      showToast(error.message, 'error', 'User management');
    }
  };

  window.adminResetProgress = async function adminResetProgress(userId) {
    if (!await showConfirm({ title:'Reset progress?', message:'Reset all progress, quiz scores, and saved credit scores for this user?', confirmText:'Reset Progress', danger:true, kicker:'User management' })) return;
    try {
      await postAdmin(`/api/admin/users/${userId}/reset-progress`, {});
      await loadAdminData();
      showToast('Progress reset.', 'success', 'User management');
    } catch (error) {
      showToast(error.message, 'error', 'User management');
    }
  };

  window.adminSetRole = async function adminSetRole(userId) {
    const user = adminUsersCache.find(item => item.id === userId);
    const role = document.getElementById('admin-role-select').value;
    if (isProtectedSystemAccount(user)) return showToast(user?.protectedSystemReason || 'This protected system account cannot have its role changed.', 'error', 'Protected account');
    if (!await showConfirm({ title:'Update role?', message:`Change ${user?.email || 'this user'} to ${role.replace(/_/g, ' ')}?`, confirmText:'Update Role', kicker:'User management' })) return;
    try {
      await postAdmin(`/api/admin/users/${userId}/role`, { role });
      await loadAdminData();
      showToast('Role updated.', 'success', 'User management');
    } catch (error) {
      showToast(error.message, 'error', 'User management');
    }
  };

  window.adminAttachTeacher = async function adminAttachTeacher(userId) {
    const teacherId = Number(document.getElementById('admin-teacher-attach-select')?.value || 0);
    if (!teacherId) return showToast('Select a teacher first.', 'error', 'User management');
    const user = adminUsersCache.find(item => item.id === userId);
    if (!await showConfirm({ title:'Attach to teacher?', message:`Attach ${user?.email || 'this user'} to the selected teacher?`, confirmText:'Attach User', kicker:'User management' })) return;
    try {
      await postAdmin(`/api/admin/users/${userId}/teacher-override`, { teacherId });
      await loadAdminData();
      showToast('Teacher attachment updated.', 'success', 'User management');
    } catch (error) {
      showToast(error.message, 'error', 'User management');
    }
  };

  window.adminDetachTeacher = async function adminDetachTeacher(userId) {
    const user = adminUsersCache.find(item => item.id === userId);
    if (!await showConfirm({ title:'Remove teacher attachment?', message:`Detach ${user?.email || 'this user'} from their current teacher?`, confirmText:'Detach User', danger:true, kicker:'User management' })) return;
    try {
      await postAdmin(`/api/admin/users/${userId}/teacher-override`, {}, { method: 'DELETE' });
      await loadAdminData();
      showToast('Teacher attachment cleared.', 'success', 'User management');
    } catch (error) {
      showToast(error.message, 'error', 'User management');
    }
  };

  window.adminForcePasswordReset = async function adminForcePasswordReset(userId) {
    const user = adminUsersCache.find(item => item.id === userId);
    if (isProtectedSystemAccount(user)) return showToast(user?.protectedSystemReason || 'This protected system account cannot receive a forced password reset.', 'error', 'Protected account');
    const reason = document.getElementById('admin-reset-reason').value.trim();
    try {
      const data = await postAdmin(`/api/admin/users/${userId}/force-password-reset`, { reason });
      await loadAdminData();
      showToast(data.debugCode ? `Password reset prepared. Dev code: ${data.debugCode}` : 'Password reset email sent.', 'success', 'User management');
    } catch (error) {
      showToast(error.message, 'error', 'User management');
    }
  };

  window.adminDeleteUser = async function adminDeleteUser(userId) {
    const user = adminUsersCache.find(item => item.id === userId);
    if (isProtectedSystemAccount(user)) return showToast(user?.protectedSystemReason || 'This protected system account cannot be deleted.', 'error', 'Protected account');
    if (!await showConfirm({ title:'Delete user?', message:`Delete ${user?.email || 'this user'} and all related progress? This cannot be undone.`, confirmText:'Delete User', danger:true, kicker:'User management' })) return;
    try {
      await postAdmin(`/api/admin/users/${userId}`, {}, { method: 'DELETE' });
      selectedAdminUserId = null;
      await loadAdminData();
      showToast('User deleted.', 'success', 'User management');
    } catch (error) {
      showToast(error.message, 'error', 'User management');
    }
  };


  
async function loadProfilePage() {
  if (!stateRef.currentUser) return;
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value || '—'; };
  setText('profile-name', stateRef.currentUser?.name || '—');
  setText('profile-email', stateRef.currentUser?.email || '—');
  setText('profile-name-tile', stateRef.currentUser?.name || '—');
  setText('profile-email-tile', stateRef.currentUser?.email || '—');
  const rolePill = document.getElementById('profile-role-pill');
  if (rolePill) rolePill.textContent = (stateRef.currentUser?.role || 'student').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  try {
    const res = await fetch('/api/profile', { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load profile.');
    const profile = data.profile || {};
    const joinInfo = profile.joinInfo || {};
    ['profile-name','profile-name-tile'].forEach(id => setText(id, profile.name || stateRef.currentUser?.name || '—'));
    ['profile-email','profile-email-tile'].forEach(id => setText(id, profile.email || stateRef.currentUser?.email || '—'));
    if (rolePill) rolePill.textContent = (profile.role || 'student').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const wrap = document.getElementById('profile-class-wrap');
    const classTitle = document.getElementById('profile-class-title');
    const classSubtitle = document.getElementById('profile-class-subtitle');
    if (!wrap) return;
    const isTeacher = profile.role === 'teacher';
    const isAssistant = profile.role === 'class_assistant';
    const assigned = Boolean(joinInfo.teacherName);
    if (isTeacher) {
      if (classTitle) classTitle.textContent = 'Classroom';
      if (classSubtitle) classSubtitle.textContent = 'Class codes';
      const groups = Array.isArray(profile.classroomGroups) ? profile.classroomGroups : [];
      wrap.innerHTML = `
        <div class="profile-code-hero">
          <div class="eyebrow">Default class code</div>
          <div class="code">${profile.teacherCode || '—'}</div>
          <div class="meta">${profile.className || 'Classroom'}</div>
          <div class="actions"><button class="tiny-btn gold" onclick="copyProfileCode('${profile.teacherCode || ''}')">Copy Code</button></div>
        </div>
        <div class="profile-class-stats">
          <div class="profile-class-row"><span class="k">Class</span><span class="v">${profile.className || '—'}</span></div>
          <div class="profile-class-row"><span class="k">Teacher</span><span class="v">${profile.name || '—'}</span></div>
          <div class="profile-class-row"><span class="k">Email</span><span class="v">${profile.email || '—'}</span></div>
          <div class="profile-class-row"><span class="k">Groups</span><span class="v">${groups.length}</span></div>
        </div>
        ${groups.length ? `<div class="profile-class-stats" style="margin-top:14px;">${groups.map(group => `<div class="profile-class-row"><span class="k">${group.name}</span><span class="v">${group.code} <button class='tiny-btn ghost' style='margin-left:8px;' onclick="copyProfileCode('${group.code}')">Copy</button></span></div>`).join('')}</div>` : ''}`;
      return;
    }
    if (isAssistant && assigned) {
      if (classTitle) classTitle.textContent = 'Assigned Classroom';
      if (classSubtitle) classSubtitle.textContent = 'Class';
      wrap.innerHTML = `
        <div class="profile-code-hero">
          <div class="eyebrow">Class code</div>
          <div class="code">${joinInfo.classCode || joinInfo.teacherCode || '—'}</div>
          <div class="meta">${joinInfo.className || 'Assigned Classroom'}</div>
          <div class="actions"><button class="tiny-btn gold" onclick="copyProfileCode('${joinInfo.classCode || joinInfo.teacherCode || ''}')">Copy Code</button></div>
        </div>
        <div class="profile-class-stats">
          <div class="profile-class-row"><span class="k">Connected to</span><span class="v">${joinInfo.className || '—'}</span></div>
          <div class="profile-class-row"><span class="k">Teacher</span><span class="v">${joinInfo.teacherName || '—'}</span></div>
          <div class="profile-class-row"><span class="k">Class</span><span class="v">${joinInfo.className || '—'}</span></div>
          <div class="profile-class-row"><span class="k">Joined</span><span class="v">${joinInfo.joinedAt ? formatDate(joinInfo.joinedAt) : '—'}</span></div>
        </div>`;
      return;
    }
    if (classTitle) classTitle.textContent = assigned ? 'Class' : 'Join a Class';
    if (classSubtitle) classSubtitle.textContent = assigned ? 'Class' : 'Enter a class code';
    wrap.innerHTML = `
      <div class="class-join-panel">
        <div class="class-join-kicker">Student access</div>
        <div class="class-join-main">${assigned ? (joinInfo.className || 'Connected class') : 'Enter class code'}</div>
        ${assigned ? `<div class="classroom-group-actions" style="margin-top:12px;"><button class="tiny-btn gold" onclick="copyProfileCode('${joinInfo.classCode || joinInfo.teacherCode || ''}')">Copy Code</button></div>` : `<div class="class-code-entry"><input id="profile-teacher-code" type="text" placeholder="ABCD-2345" autocomplete="off" spellcheck="false"><button class="btn-start" onclick="joinTeacherClass()">Join Class</button></div>`}
      </div>
      <div class="profile-class-stats">
        <div class="profile-class-row"><span class="k">Connected to</span><span class="v">${joinInfo.className || 'Unassigned'}</span></div>
        <div class="profile-class-row"><span class="k">Teacher</span><span class="v">${joinInfo.teacherName || '—'}</span></div>
        <div class="profile-class-row"><span class="k">Class</span><span class="v">${joinInfo.className || '—'}</span></div>
        <div class="profile-class-row"><span class="k">Class code:</span><span class="v">${joinInfo.classCode || joinInfo.teacherCode || '—'}</span></div>
        <div class="profile-class-row"><span class="k">Joined</span><span class="v">${joinInfo.joinedAt ? formatDate(joinInfo.joinedAt) : '—'}</span></div>
      </div>
      ${assigned ? `<div style="margin-top:14px;display:flex;justify-content:flex-end;"><button class="tiny-btn danger" onclick="leaveTeacherClass()">Leave Class</button></div>` : ''}`;
  } catch (error) {
    const err = document.getElementById('profile-error');
    if (err) { err.style.display = 'block'; err.textContent = error.message; }
    showToast(error.message, 'error', 'Profile');
  }
}

window.copyProfileCode = async function copyProfileCode(code) {
  try {
    await copyTextToClipboard(code || '');
    showToast('Class code copied.', 'success', 'Copied');
  } catch (_) {
    showToast('Could not copy the code on this device.', 'error', 'Copy failed');
  }
};


  window.saveProfile = async function saveProfile() {
    const err = document.getElementById('profile-error');
    if (err) { err.style.display='block'; err.textContent = 'Name and email are locked to the original signup details in this patch.'; }
  };

  window.joinTeacherClass = async function joinTeacherClass() {
    try {
      const code = (document.getElementById('profile-teacher-code')?.value || '').trim().toUpperCase();
      const res = await fetch('/api/profile/join-class', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin', body: JSON.stringify({ teacherCode: code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not join class.');
      await loadProfilePage();
      await refreshCurrentUser();
      showToast('Class joined successfully.', 'success', 'Joined');
    } catch (error) {
      const err = document.getElementById('profile-error');
      if (err) { err.style.display='block'; err.textContent = error.message; }
      showToast(error.message, 'error', 'Class join');
    }
  };

  window.leaveTeacherClass = async function leaveTeacherClass() {
    if (!await showConfirm({ title:'Leave class?', message:'This account will become unassigned until you join another teacher.', confirmText:'Leave Class', danger:true, kicker:'Class change' })) return;
    try {
      const res = await fetch('/api/profile/leave-class', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not leave class.');
      await loadProfilePage();
      await refreshCurrentUser();
      showToast('You have left the class.', 'success', 'Class updated');
    } catch (error) {
      const err = document.getElementById('profile-error');
      if (err) { err.style.display='block'; err.textContent = error.message; }
      showToast(error.message, 'error', 'Class update');
    }
  };

  window.teacherRemoveStudent = async function teacherRemoveStudent(userId) {
    if (!await showConfirm({ title:'Remove student?', message:'This student will become unassigned from your class.', confirmText:'Remove Student', danger:true, kicker:'Teacher Hub' })) return;
    try {
      await postAdmin(`/api/teacher/students/${userId}/remove`, {});
      await loadAdminData();
      showToast('Student removed from class.', 'success', 'Teacher Hub');
    } catch (error) {
      showToast(error.message, 'error', 'Teacher Hub');
    }
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('site-confirm-overlay');
      if (overlay?.classList.contains('visible')) overlay.classList.remove('visible');
      if (isMobileSidebarMode() && mobileSidebarOpen) closeSidebar();
    }
    if (e.key !== 'Enter') return;
    if (document.getElementById('verify-form')?.style.display !== 'none' && document.activeElement.closest('#verify-form')) window.handleVerifyRegistration();
    if (document.getElementById('reset-request-form')?.style.display !== 'none' && document.activeElement.closest('#reset-request-form')) window.handleRequestPasswordReset();
    if (document.getElementById('reset-confirm-form')?.style.display !== 'none' && document.activeElement.closest('#reset-confirm-form')) window.handleConfirmPasswordReset();
  });

  document.addEventListener('click', event => {
    const clickedNav = event.target.closest('#sidebar .nav-item, #sidebar .logout-btn');
    if (clickedNav && isMobileSidebarMode()) {
      window.setTimeout(() => closeSidebar(), 0);
    }
  });

  if (typeof MOBILE_SIDEBAR_QUERY.addEventListener === 'function') {
    MOBILE_SIDEBAR_QUERY.addEventListener('change', handleSidebarViewportChange);
  } else if (typeof MOBILE_SIDEBAR_QUERY.addListener === 'function') {
    MOBILE_SIDEBAR_QUERY.addListener(handleSidebarViewportChange);
  }
  window.addEventListener('resize', handleSidebarViewportChange, { passive: true });

  injectAuthEnhancements();
  installAuthFieldValidation();
  injectAdminEnhancements();
  refreshCurrentUser();
})();
