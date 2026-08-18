import { Router } from 'express';
import db, { isDbReady } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const COOKIE_NAME = process.env.COOKIE_NAME || 'pinpoint_token';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
const RESET_TOKEN_EXPIRY_HOURS = parseInt(process.env.RESET_TOKEN_EXPIRY_HOURS || '1');

async function verifyGoogleIdToken(idToken: string) {
  if (!idToken) throw new Error('idToken is required');
  if (!GOOGLE_CLIENT_ID) throw new Error('Google OAuth client ID is not configured');

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) {
    throw new Error('Google token verification failed');
  }

  const payload = await response.json() as any;
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
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to generate reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function setTokenCookie(res: any, token: string) {
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
  if (!email) return res.status(400).json({ error: 'email required' });
  if (!isDbReady()) return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
  
  try {
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if ((exists.rowCount ?? 0) > 0) return res.status(409).json({ error: 'User already exists' });
    
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    
    await db.query(
      'INSERT INTO otp_codes (email, code, type, expiresAt) VALUES ($1, $2, $3, $4)',
      [email, otp, 'register', expiresAt]
    );
    
    // In production, send email with OTP. For now, log it
    console.log(`OTP for ${email}: ${otp}`);
    
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Register with OTP verification
router.post('/register-with-otp', async (req, res) => {
  const { email, password, otp, role } = req.body;
  if (!email || !password || !otp) return res.status(400).json({ error: 'email, password and otp required' });
  if (!isDbReady()) return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
  
  try {
    const otpRecord = await db.query(
      'SELECT code, expiresAt FROM otp_codes WHERE email = $1 AND type = $2 ORDER BY createdAt DESC LIMIT 1',
      [email, 'register']
    );
    
    if (otpRecord.rowCount === 0) return res.status(400).json({ error: 'OTP not found' });
    
    const otpRow = otpRecord.rows[0];
    if (otpRow.code !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(otpRow.expiresAt)) return res.status(400).json({ error: 'OTP expired' });
    
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if ((exists.rowCount ?? 0) > 0) return res.status(409).json({ error: 'User already exists' });
    
    const id = `u${Date.now()}`;
    const hash = bcrypt.hashSync(password, 10);
    const r = role === 'lister' ? 'lister' : 'user';
    
    await db.query('INSERT INTO users (id, email, passwordHash, role) VALUES ($1, $2, $3, $4)', [id, email, hash, r]);
    
    // Mark OTP as used
    await db.query('DELETE FROM otp_codes WHERE email = $1 AND type = $2', [email, 'register']);
    
    const token = jwt.sign({ id, email, role: r }, JWT_SECRET, { expiresIn: '7d' });
    setTokenCookie(res, token);
    res.json({ user: { id, email, role: r } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Original register endpoint (no OTP)
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  if (!isDbReady()) return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
  const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if ((exists.rowCount ?? 0) > 0) return res.status(409).json({ error: 'User exists' });
  const id = `u${Date.now()}`;
  const hash = bcrypt.hashSync(password, 10);
  const r = role === 'lister' ? 'lister' : 'user';
  await db.query('INSERT INTO users (id,email,passwordHash,role) VALUES ($1,$2,$3,$4)', [id, email, hash, r]);
  const token = jwt.sign({ id, email, role: r }, JWT_SECRET, { expiresIn: '7d' });
  setTokenCookie(res, token);
  res.json({ user: { id, email, role: r } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  if (!isDbReady()) return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
  const r = await db.query('SELECT id,email,passwordHash,role FROM users WHERE email = $1', [email]);
  const row = r.rows[0];
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, row.passwordhash || row.passwordHash || row.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: row.id, email: row.email, role: row.role }, JWT_SECRET, { expiresIn: '7d' });
  setTokenCookie(res, token);
  res.json({ user: { id: row.id, email: row.email, role: row.role } });
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  if (!isDbReady()) return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rowCount === 0) {
      // Don't reveal if user exists
      return res.json({ success: true, message: 'If email exists, password reset link sent' });
    }
    
    const user = userResult.rows[0];
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    
    await db.query(
      'INSERT INTO password_reset_tokens (userId, token, expiresAt) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );
    
    // In production, send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({ success: true, message: 'If email exists, password reset link sent' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword required' });
  if (!isDbReady()) return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
  
  try {
    const tokenResult = await db.query(
      'SELECT userId, expiresAt FROM password_reset_tokens WHERE token = $1',
      [token]
    );
    
    if (tokenResult.rowCount === 0) return res.status(400).json({ error: 'Invalid or expired token' });
    
    const tokenRow = tokenResult.rows[0];
    if (new Date() > new Date(tokenRow.expiresAt)) {
      await db.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
      return res.status(400).json({ error: 'Token expired' });
    }
    
    const hash = bcrypt.hashSync(newPassword, 10);
    await db.query('UPDATE users SET passwordHash = $1 WHERE id = $2', [hash, tokenRow.userId]);
    await db.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
    
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Google OAuth callback (simplified)
router.post('/google-login', async (req, res) => {
  const { idToken, credential, email, googleId, name } = req.body;
  const token = idToken || credential;

  if (!token) return res.status(400).json({ error: 'Google credential is required' });
  if (!isDbReady()) return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });

  try {
    const googleUser = await verifyGoogleIdToken(token);
    const authEmail = email || googleUser.email;
    const authGoogleId = googleId || googleUser.googleId;
    const authName = name || googleUser.name || authEmail;

    if (!authEmail || !authGoogleId) {
      return res.status(400).json({ error: 'email and googleId required' });
    }

    let userResult = await db.query(
      'SELECT id, email, role, googleId FROM users WHERE email = $1 OR googleId = $2',
      [authEmail, authGoogleId]
    );
    let user = userResult.rows[0];

    if (!user) {
      const id = `u${Date.now()}`;
      await db.query(
        'INSERT INTO users (id, email, passwordHash, role, googleId) VALUES ($1, $2, $3, $4, $5)',
        [id, authEmail, '', 'user', authGoogleId]
      );
      user = { id, email: authEmail, role: 'user', googleid: authGoogleId };
    } else if (!user.googleid) {
      await db.query('UPDATE users SET googleId = $1 WHERE id = $2', [authGoogleId, user.id]);
      user.googleid = authGoogleId;
    }

    const authRole = user.role || 'user';
    const tokenPayload = jwt.sign({ id: user.id, email: authEmail, role: authRole }, JWT_SECRET, { expiresIn: '7d' });
    setTokenCookie(res, tokenPayload);
    res.json({ user: { id: user.id, email: authEmail, role: authRole, name: authName } });
  } catch (err: any) {
    console.error('Google login failed:', err?.message || err);
    res.status(401).json({ error: 'Google sign-in failed. Check the configured OAuth client and account permissions.' });
  }
});

router.get('/me', (req, res) => {
  try {
    const header = req.headers.authorization;
    let token: string | undefined;
    if (header && header.startsWith('Bearer ')) token = header.slice(7);
    else if (req.headers.cookie) {
      const cookies = Object.fromEntries(req.headers.cookie.split(';').map(c => c.split('=').map(s => s.trim())));
      token = cookies[COOKIE_NAME];
    }
    if (!token) return res.json({ user: null });
    const payload = jwt.verify(token, JWT_SECRET) as any;
    res.json({ user: { id: payload.id, email: payload.email, role: payload.role } });
  } catch (err) {
    res.status(401).json({ user: null });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

export default router;
