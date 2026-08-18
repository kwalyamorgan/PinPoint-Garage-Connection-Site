"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    let token;
    if (header && header.startsWith('Bearer '))
        token = header.slice(7);
    else if (req.headers.cookie) {
        const cookies = Object.fromEntries(req.headers.cookie.split(';').map(c => c.split('=').map(s => s.trim())));
        token = cookies['pinpoint_token'] || cookies['pinpoint_token'];
    }
    if (!token)
        return res.status(401).json({ error: 'Missing token' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = { id: payload.id, email: payload.email, role: payload.role };
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: 'Not authenticated' });
        if (req.user.role === 'admin')
            return next();
        if (req.user.role === role)
            return next();
        return res.status(403).json({ error: 'Insufficient role' });
    };
}
