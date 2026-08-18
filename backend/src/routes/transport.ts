import { Router } from 'express';
import db, { isDbReady } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  if (!isDbReady()) return res.json([]);
  try {
    const { rows } = await db.query('SELECT id,type,company,phone,ownerId FROM transport');
    res.json(rows);
  } catch (err) {
    console.error('Transport query failed:', err);
    return res.status(503).json({ error: 'Database unavailable' });
  }
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.query('SELECT id,type,company,phone,ownerId FROM transport WHERE id = $1', [req.params.id]);
  const row = rows[0];
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', authenticate, requireRole('lister'), async (req: AuthRequest, res) => {
  if (!isDbReady()) return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
  try {
    const id = `t${Date.now()}`;
    const { type, company, phone } = req.body;
    await db.query('INSERT INTO transport (id,type,company,phone,ownerId) VALUES ($1,$2,$3,$4,$5)', [id, type, company, phone, req.user!.id]);
    const { rows } = await db.query('SELECT id,type,company,phone,ownerId FROM transport WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create transport failed:', err);
    return res.status(503).json({ error: 'Database unavailable' });
  }
});

router.put('/:id', authenticate, requireRole('lister'), async (req: AuthRequest, res) => {
  const { type, company, phone } = req.body;
  const info = await db.query('SELECT id FROM transport WHERE id = $1', [req.params.id]);
  if (info.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  await db.query('UPDATE transport SET type = $1, company = $2, phone = $3 WHERE id = $4', [type, company, phone, req.params.id]);
  const { rows } = await db.query('SELECT id,type,company,phone,ownerId FROM transport WHERE id = $1', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  await db.query('DELETE FROM transport WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

export default router;
