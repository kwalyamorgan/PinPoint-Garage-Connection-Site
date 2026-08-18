import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  let token: string | undefined;
  if (header && header.startsWith('Bearer ')) token = header.slice(7);
  else if (req.headers.cookie) {
    const cookies = Object.fromEntries(req.headers.cookie.split(';').map(c => c.split('=').map(s => s.trim())));
    token = cookies['pinpoint_token'] || cookies['pinpoint_token'];
  }
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role === 'admin') return next();
    if (req.user.role === role) return next();
    return res.status(403).json({ error: 'Insufficient role' });
  };
}
