═══════════════════════════════════════════════════
  CrediStart Student Portal — Setup Guide
═══════════════════════════════════════════════════

WHAT THIS IS:
  A full web application for the CrediStart credit
  literacy course with student accounts, email
  verification, progress tracking, quizzes,
  certificates, analytics, and a built-in admin
  console for staff users.

WHAT CHANGED IN THIS VERSION:
  - Account creation now validates email format
  - Duplicate accounts are blocked before signup
  - New accounts must verify a 6-digit code sent by email
  - Password reset codes are supported
  - Signup + usage analytics are stored per user
  - Admin/moderator console added for user oversight
  - Moderators can view users and edit progress
  - Admins can also change roles, force resets, and delete users

REQUIREMENTS:
  - Node.js v18 or newer
  - A host with a writable persistent filesystem
  - For real email delivery: SMTP credentials

HOW TO RUN:
  1. Open a terminal / command prompt
  2. Navigate to this folder
  3. Install dependencies:
       npm install
  4. Start the server:
       npm start
     or:
       node server.js
  5. Open your browser to:
       http://localhost:3000

DATA STORAGE:
  - User accounts, sessions, progress, analytics,
    pending verifications, and reset requests are stored in:
      credistart-data.json
  - Override the location with:
      DATA_PATH=/path/to/file.json node server.js

EMAIL / VERIFICATION SETUP:
  To send real verification and reset emails, configure:

    SMTP_HOST
    SMTP_PORT
    SMTP_USER
    SMTP_PASS
    SMTP_FROM   (optional, defaults to SMTP_USER)

  Notes:
  - If SMTP is NOT configured, the app still works in
    development/testing mode and returns a debug code in API
    responses so you can verify locally.
  - In production, you should configure SMTP so users receive
    real emails.

ADMIN / MODERATOR SETUP:
  To define which accounts start with elevated roles:

    ADMIN_EMAILS=max@example.com,owner@example.com
    MODERATOR_EMAILS=staff1@example.com,staff2@example.com

  Notes:
  - These roles are applied when the account is created.
  - After that, an admin can change roles from the admin console.

ANALYTICS CAPTURED PER USER:
  - Signup time (server + browser local time)
  - Browser timezone / locale
  - Referrer and browser/device string
  - IP and available proxy geo headers
  - Total active time on site
  - Time spent per page
  - Page views
  - Tracked button/nav/link clicks
  - Login count / session count

ADMIN CONSOLE CAPABILITIES:
  Moderator:
  - View all users
  - View account details and analytics
  - Set the user's current course step
  - Reset a user's course progress

  Admin:
  - Everything moderators can do
  - Change roles (student / moderator / admin)
  - Force a password reset email/code
  - Delete users from the system

FILES:
  server.js                — Backend server + APIs
  public/index.html        — Main frontend
  public/enhancements.js   — Auth/admin UI enhancements
  credistart-data.json     — Auto-created data store
  README.txt               — This file

IMPORTANT FOR DEPLOYMENT:
  This app needs a real Node server environment.

  Good fit:
  - Railway / Render / VPS / Node hosting
    with a persistent disk / volume

  Bad fit:
  - Static-only hosting
  - Serverless setups without persistent local storage

  If your host wipes local files on restart, accounts may
  appear to work temporarily but will not persist. Attach a
  persistent disk / volume or move storage to a database.

SECURITY NOTES:
  - Passwords are hashed with PBKDF2 + salt
  - Sessions use HttpOnly cookies
  - Secure cookies are enabled automatically on HTTPS
  - Email verification and reset codes expire automatically
  - Admin actions are written to an audit log

RAILWAY RECOMMENDATION:
  On Railway, set a persistent volume and point DATA_PATH to a
  file inside that mounted volume so accounts, sessions, and
  analytics survive redeploys/restarts.

═══════════════════════════════════════════════════


Resend quick example:
  SMTP_HOST=smtp.resend.com
  SMTP_PORT=465
  SMTP_USER=resend
  SMTP_PASS=<your Resend API key>
  SMTP_FROM="CrediStart <noreply@mail.credistart.org>"

Notes:
- The SMTP_FROM address must use your verified sending domain/subdomain.
- This build adds shorter SMTP timeouts so account creation falls back faster if email delivery is slow or misconfigured.


RESEND API SETUP (Railway-friendly):
  Set either RESEND_API_KEY or reuse SMTP_PASS when SMTP_HOST=smtp.resend.com and SMTP_USER=resend.

  Recommended variables:
    RESEND_API_KEY
    RESEND_FROM

  Backward-compatible variables supported by this patch:
    SMTP_PASS   (used as Resend API key when SMTP_HOST=smtp.resend.com and SMTP_USER=resend)
    SMTP_FROM   (used as sender if RESEND_FROM is not set)

  Example:
    RESEND_API_KEY=re_xxxxxxxxx
    RESEND_FROM="Credistart <noreply@mail.credistart.org>"
