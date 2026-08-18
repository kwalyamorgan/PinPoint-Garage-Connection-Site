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
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const COOKIE_NAME = process.env.COOKIE_NAME || 'pinpoint_token';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
const RESET_TOKEN_EXPIRY_HOURS = parseInt(process.env.RESET_TOKEN_EXPIRY_HOURS || '1');
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
        const otpRecord = await db_1.default.query('SELECT code, expiresAt FROM otp_codes WHERE email = $1 AND type = $2 ORDER BY createdAt DESC LIMIT 1', [email, 'register']);
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
        await db_1.default.query('INSERT INTO users (id, email, passwordHash, role) VALUES ($1, $2, $3, $4)', [id, email, hash, r]);
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
    await db_1.default.query('INSERT INTO users (id,email,passwordHash,role) VALUES ($1,$2,$3,$4)', [id, email, hash, r]);
    const token = jsonwebtoken_1.default.sign({ id, email, role: r }, JWT_SECRET, { expiresIn: '7d' });
    setTokenCookie(res, token);
    res.json({ user: { id, email, role: r } });
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'email and password required' });
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    const r = await db_1.default.query('SELECT id,email,passwordHash,role FROM users WHERE email = $1', [email]);
    const row = r.rows[0];
    if (!row)
        return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcryptjs_1.default.compareSync(password, row.passwordhash || row.passwordHash || row.passwordHash);
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
        const userResult = await db_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userResult.rowCount === 0) {
            // Don't reveal if user exists
            return res.json({ success: true, message: 'If email exists, password reset link sent' });
        }
        const user = userResult.rows[0];
        const resetToken = generateResetToken();
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
        await db_1.default.query('INSERT INTO password_reset_tokens (userId, token, expiresAt) VALUES ($1, $2, $3)', [user.id, resetToken, expiresAt]);
        // In production, send email with reset link
        console.log(`Password reset token for ${email}: ${resetToken}`);
        res.json({ success: true, message: 'If email exists, password reset link sent' });
    }
    catch (err) {
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
        const tokenResult = await db_1.default.query('SELECT userId, expiresAt FROM password_reset_tokens WHERE token = $1', [token]);
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
// Google OAuth callback (simplified)
router.post('/google-login', async (req, res) => {
    const { idToken, email, googleId, name } = req.body;
    if (!email || !googleId)
        return res.status(400).json({ error: 'email and googleId required' });
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    try {
        let userResult = await db_1.default.query('SELECT id, email, role, googleId FROM users WHERE email = $1 OR googleId = $2', [email, googleId]);
        let user = userResult.rows[0];
        if (!user) {
            const id = `u${Date.now()}`;
            await db_1.default.query('INSERT INTO users (id, email, passwordHash, role, googleId) VALUES ($1, $2, $3, $4, $5)', [id, email, '', 'user', googleId]);
            user = { id, email, role: 'user', googleid: googleId };
        }
        else if (!user.googleid) {
            // Link Google account to existing user
            await db_1.default.query('UPDATE users SET googleId = $1 WHERE id = $2', [googleId, user.id]);
            user.googleid = googleId;
        }
        const authEmail = user.email || email;
        const authRole = user.role || 'user';
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: authEmail, role: authRole }, JWT_SECRET, { expiresIn: '7d' });
        setTokenCookie(res, token);
        res.json({ user: { id: user.id, email: authEmail, role: authRole } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
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
