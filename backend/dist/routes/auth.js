"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importStar(require("../db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const SibApiV3Sdk = __importStar(require("sib-api-v3-sdk"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const COOKIE_NAME = process.env.COOKIE_NAME || 'pinpoint_token';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
const RESET_TOKEN_EXPIRY_HOURS = parseInt(process.env.RESET_TOKEN_EXPIRY_HOURS || '1');
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@pinpoint.com';
const FROM_NAME = process.env.FROM_NAME || 'PinPoint';
// Brevo email helper
async function sendEmailViaBrevo(email, subject, code) {
    if (!BREVO_API_KEY) {
        console.warn('Brevo API key not configured. Reset code:', code);
        return false;
    }
    try {
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        if (apiKey) {
            apiKey.apiKey = BREVO_API_KEY;
        }
        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Your reset code is:</p>
      <h3 style="background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace;">${code}</h3>
      <p>This code expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>PinPoint Team</p>
    `;
        sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
        sendSmtpEmail.to = [{ email: email }];
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Password reset email sent to ${email}`);
        return true;
    }
    catch (err) {
        console.error('Failed to send Brevo email:', err?.response?.body || err?.message || err);
        return false;
    }
}
async function verifyGoogleIdToken(idToken) {
    if (!idToken)
        throw new Error('idToken is required');
    if (!GOOGLE_CLIENT_ID)
        throw new Error('Google OAuth client ID is not configured');
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!response.ok) {
        throw new Error('Google token verification failed');
    }
    const payload = await response.json();
    if (!payload.email || !payload.sub) {
        throw new Error('Google token does not contain email or subject');
    }
    if (payload.aud && payload.aud !== GOOGLE_CLIENT_ID) {
        throw new Error('Google token audience mismatch');
    }
    return {
        email: payload.email,
        googleId: payload.sub,
        name: payload.name || payload.email,
    };
}
// Helper to generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
// Helper to generate reset token
function generateResetToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
function setTokenCookie(res, token) {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}
// Request OTP for registration
router.post('/request-otp-register', async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: 'email required' });
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    try {
        const exists = await db_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
        if ((exists.rowCount ?? 0) > 0)
            return res.status(409).json({ error: 'User already exists' });
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        await db_1.default.query('INSERT INTO otp_codes (email, code, type, expiresAt) VALUES ($1, $2, $3, $4)', [email, otp, 'register', expiresAt]);
        // In production, send email with OTP. For now, log it
        console.log(`OTP for ${email}: ${otp}`);
        res.json({ success: true, message: 'OTP sent to email' });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Register with OTP verification
router.post('/register-with-otp', async (req, res) => {
    const { email, password, otp, role } = req.body;
    if (!email || !password || !otp)
        return res.status(400).json({ error: 'email, password and otp required' });
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    try {
        const otpRecord = await db_1.default.query('SELECT code, expiresAt AS "expiresAt" FROM otp_codes WHERE email = $1 AND type = $2 ORDER BY createdAt DESC LIMIT 1', [email, 'register']);
        if (otpRecord.rowCount === 0)
            return res.status(400).json({ error: 'OTP not found' });
        const otpRow = otpRecord.rows[0];
        if (otpRow.code !== otp)
            return res.status(400).json({ error: 'Invalid OTP' });
        if (new Date() > new Date(otpRow.expiresAt))
            return res.status(400).json({ error: 'OTP expired' });
        const exists = await db_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
        if ((exists.rowCount ?? 0) > 0)
            return res.status(409).json({ error: 'User already exists' });
        const id = `u${Date.now()}`;
        const hash = bcryptjs_1.default.hashSync(password, 10);
        const r = role === 'lister' ? 'lister' : 'user';
        await db_1.default.query('INSERT INTO users (id, email, passwordHash, role, providerApproved, providerEnabled) VALUES ($1, $2, $3, $4, $5, $6)', [id, email, hash, r, r !== 'lister', true]);
        // Mark OTP as used
        await db_1.default.query('DELETE FROM otp_codes WHERE email = $1 AND type = $2', [email, 'register']);
        const token = jsonwebtoken_1.default.sign({ id, email, role: r }, JWT_SECRET, { expiresIn: '7d' });
        setTokenCookie(res, token);
        res.json({ user: { id, email, role: r } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
// Original register endpoint (no OTP)
router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'email and password required' });
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    const exists = await db_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
    if ((exists.rowCount ?? 0) > 0)
        return res.status(409).json({ error: 'User exists' });
    const id = `u${Date.now()}`;
    const hash = bcryptjs_1.default.hashSync(password, 10);
    const r = role === 'lister' ? 'lister' : 'user';
    await db_1.default.query('INSERT INTO users (id,email,passwordHash,role,providerApproved,providerEnabled) VALUES ($1,$2,$3,$4,$5,$6)', [id, email, hash, r, r !== 'lister', true]);
    res.json({ success: true, message: 'Account created. Please sign in now.' });
});
router.post('/login', async (req, res) => {
    const { email, password, adminOnly = false } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'email and password required' });
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    const r = await db_1.default.query('SELECT id,email,passwordHash,role FROM users WHERE email = $1', [email]);
    const row = r.rows[0];
    if (!row)
        return res.status(401).json({ error: 'Invalid credentials' });
    if ((adminOnly && row.role !== 'admin') || (!adminOnly && row.role === 'admin')) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const storedHash = typeof row.passwordhash === 'string' ? row.passwordhash : typeof row.passwordHash === 'string' ? row.passwordHash : '';
    if (!storedHash)
        return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcryptjs_1.default.compareSync(password, storedHash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ id: row.id, email: row.email, role: row.role }, JWT_SECRET, { expiresIn: '7d' });
    setTokenCookie(res, token);
    res.json({ user: { id: row.id, email: row.email, role: row.role } });
});
// Request password reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: 'email required' });
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    try {
        const userResult = await db_1.default.query('SELECT id, role FROM users WHERE email = $1', [email]);
        // Don't reveal if user exists
        if (userResult.rowCount === 0) {
            return res.json({ success: true, message: 'If email exists, password reset code sent' });
        }
        const user = userResult.rows[0];
        // Exclude admin users from password reset
        if (user.role === 'admin') {
            return res.json({ success: true, message: 'If email exists, password reset code sent' });
        }
        // Generate a 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
        // Store reset code in database
        await db_1.default.query('INSERT INTO password_reset_tokens (userId, token, expiresAt) VALUES ($1, $2, $3)', [user.id, resetCode, expiresAt]);
        // Send email via Brevo
        const emailSent = await sendEmailViaBrevo(email, 'Your PinPoint Password Reset Code', resetCode);
        if (!emailSent) {
            return res.status(500).json({ error: 'Unable to send password reset email right now. Please try again later.' });
        }
        res.json({ success: true, message: 'If email exists, password reset code sent' });
    }
    catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});
// Reset password with token
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
        return res.status(400).json({ error: 'token and newPassword required' });
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    try {
        const tokenResult = await db_1.default.query('SELECT userId AS "userId", expiresAt AS "expiresAt" FROM password_reset_tokens WHERE token = $1', [token]);
        if (tokenResult.rowCount === 0)
            return res.status(400).json({ error: 'Invalid or expired token' });
        const tokenRow = tokenResult.rows[0];
        if (new Date() > new Date(tokenRow.expiresAt)) {
            await db_1.default.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
            return res.status(400).json({ error: 'Token expired' });
        }
        const hash = bcryptjs_1.default.hashSync(newPassword, 10);
        await db_1.default.query('UPDATE users SET passwordHash = $1 WHERE id = $2', [hash, tokenRow.userId]);
        await db_1.default.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
        res.json({ success: true, message: 'Password reset successful' });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/google-register', async (req, res) => {
    const { email, googleId, name, role } = req.body;
    if (!email || !googleId)
        return res.status(400).json({ error: 'email and googleId required' });
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    try {
        const normalizedRole = role === 'lister' ? 'lister' : 'user';
        const byGoogleId = await db_1.default.query('SELECT id, email, role, googleId, passwordHash FROM users WHERE googleId = $1', [googleId]);
        if (byGoogleId.rowCount && byGoogleId.rows[0]) {
            const existingUser = byGoogleId.rows[0];
            if (existingUser.role !== normalizedRole) {
                await db_1.default.query('UPDATE users SET role = $1 WHERE id = $2', [normalizedRole, existingUser.id]);
            }
            return res.json({ success: true, message: 'Account ready. Please sign in now.' });
        }
        const byEmail = await db_1.default.query('SELECT id, email, role, googleId, passwordHash FROM users WHERE email = $1', [email]);
        if (byEmail.rowCount && byEmail.rows[0]) {
            const existingUser = byEmail.rows[0];
            const existingGoogleId = existingUser.googleId ?? existingUser.googleid;
            if (!existingGoogleId && (existingUser.passwordhash || existingUser.passwordHash)) {
                return res.status(409).json({ error: 'This email already exists. Please sign in with your email and password instead.' });
            }
            if (!existingGoogleId) {
                await db_1.default.query('UPDATE users SET googleId = $1, role = $2, providerApproved = $3 WHERE id = $4', [googleId, normalizedRole, normalizedRole !== 'lister', existingUser.id]);
                return res.json({ success: true, message: 'Account ready. Please sign in now.' });
            }
        }
        const id = `u${Date.now()}`;
        const generatedPassword = `google-oauth:${email}:${id}`;
        const placeholderHash = bcryptjs_1.default.hashSync(generatedPassword, 10);
        await db_1.default.query('INSERT INTO users (id, email, passwordHash, role, googleId, providerApproved, providerEnabled) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, email, placeholderHash, normalizedRole, googleId, normalizedRole !== 'lister', true]);
        res.json({ success: true, message: 'Account created. Please sign in now.' });
    }
    catch (err) {
        console.error('Google registration failed:', err);
        res.status(500).json({ error: 'Google registration failed' });
    }
});
// Google OAuth callback (simplified)
router.post('/google-login', async (req, res) => {
    const { idToken, credential, email, googleId, name } = req.body;
    const token = idToken || credential;
    if (!token)
        return res.status(400).json({ error: 'Google credential is required' });
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    try {
        const googleUser = await verifyGoogleIdToken(token);
        const authEmail = email || googleUser.email;
        const authGoogleId = googleId || googleUser.googleId;
        const authName = name || googleUser.name || authEmail;
        if (!authEmail || !authGoogleId) {
            return res.status(400).json({ error: 'email and googleId required' });
        }
        const userByGoogleId = await db_1.default.query('SELECT id, email, role, googleId, passwordHash FROM users WHERE googleId = $1', [authGoogleId]);
        let user = userByGoogleId.rows[0];
        if (!user) {
            const sameEmailUser = await db_1.default.query('SELECT id, email, role, googleId, passwordHash FROM users WHERE email = $1', [authEmail]);
            const sameEmailGoogleId = sameEmailUser.rows[0]?.googleId ?? sameEmailUser.rows[0]?.googleid;
            if (sameEmailUser.rowCount && sameEmailUser.rows[0] && !sameEmailGoogleId && (sameEmailUser.rows[0].passwordhash || sameEmailUser.rows[0].passwordHash)) {
                return res.status(409).json({
                    error: 'This email is already registered. Please sign in with your email and password.'
                });
            }
            return res.json({
                requiresRegistration: true,
                email: authEmail,
                googleId: authGoogleId,
                name: authName,
                message: 'Google account not found. Please choose a role to sign up.'
            });
        }
        if (!(user.googleId ?? user.googleid)) {
            await db_1.default.query('UPDATE users SET googleId = $1 WHERE id = $2', [authGoogleId, user.id]);
            user.googleId = authGoogleId;
        }
        const authRole = user.role || 'user';
        const tokenPayload = jsonwebtoken_1.default.sign({ id: user.id, email: authEmail, role: authRole }, JWT_SECRET, { expiresIn: '7d' });
        setTokenCookie(res, tokenPayload);
        res.json({ user: { id: user.id, email: authEmail, role: authRole, name: authName } });
    }
    catch (err) {
        console.error('Google login failed:', err?.message || err);
        res.status(401).json({ error: 'Google sign-in failed. Check the configured OAuth client and account permissions.' });
    }
});
router.get('/me', (req, res) => {
    try {
        const header = req.headers.authorization;
        let token;
        if (header && header.startsWith('Bearer '))
            token = header.slice(7);
        else if (req.headers.cookie) {
            const cookies = Object.fromEntries(req.headers.cookie.split(';').map(c => c.split('=').map(s => s.trim())));
            token = cookies[COOKIE_NAME];
        }
        if (!token)
            return res.json({ user: null });
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        res.json({ user: { id: payload.id, email: payload.email, role: payload.role } });
    }
    catch (err) {
        res.status(401).json({ user: null });
    }
});
router.post('/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
});
exports.default = router;
