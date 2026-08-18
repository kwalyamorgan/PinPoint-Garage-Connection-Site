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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importStar(require("../db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    if (!(0, db_1.isDbReady)())
        return res.json([]);
    try {
        const { rows } = await db_1.default.query('SELECT id,name,garageId,specialty,ownerId FROM mechanics');
        res.json(rows);
    }
    catch (err) {
        console.error('Mechanics query failed:', err);
        return res.status(503).json({ error: 'Database unavailable' });
    }
});
router.get('/:id', async (req, res) => {
    const { rows } = await db_1.default.query('SELECT id,name,garageId,specialty,ownerId FROM mechanics WHERE id = $1', [req.params.id]);
    const row = rows[0];
    if (!row)
        return res.status(404).json({ error: 'Not found' });
    res.json(row);
});
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)('lister'), async (req, res) => {
    if (!(0, db_1.isDbReady)())
        return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
    try {
        const id = `m${Date.now()}`;
        const { name, garageId, specialty } = req.body;
        await db_1.default.query('INSERT INTO mechanics (id,name,garageId,specialty,ownerId) VALUES ($1,$2,$3,$4,$5)', [id, name, garageId, specialty, req.user.id]);
        const { rows } = await db_1.default.query('SELECT id,name,garageId,specialty,ownerId FROM mechanics WHERE id = $1', [id]);
        res.status(201).json(rows[0]);
    }
    catch (err) {
        console.error('Create mechanic failed:', err);
        return res.status(503).json({ error: 'Database unavailable' });
    }
});
router.put('/:id', auth_1.authenticate, (0, auth_1.requireRole)('lister'), async (req, res) => {
    const { name, garageId, specialty } = req.body;
    const info = await db_1.default.query('SELECT id FROM mechanics WHERE id = $1', [req.params.id]);
    if (info.rowCount === 0)
        return res.status(404).json({ error: 'Not found' });
    await db_1.default.query('UPDATE mechanics SET name = $1, garageId = $2, specialty = $3 WHERE id = $4', [name, garageId, specialty, req.params.id]);
    const { rows } = await db_1.default.query('SELECT id,name,garageId,specialty,ownerId FROM mechanics WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
});
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    if (req.user.role !== 'admin')
        return res.status(403).json({ error: 'Admin only' });
    await db_1.default.query('DELETE FROM mechanics WHERE id = $1', [req.params.id]);
    res.status(204).end();
});
exports.default = router;
