import { Router } from 'express';
import db, { isDbReady } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const selectFields = 'id,name,garageId AS "garageId",specialty,phone,imageUrl AS "imageUrl",description,price,discount,availability,label,location,isAvailable AS "isAvailable",ownerId AS "ownerId"';

router.get('/', async (req, res) => {
  if (!isDbReady()) return res.json([]);
  try {
    const { rows } = await db.query(`SELECT m.id,m.name,m.garageId AS "garageId",m.specialty,m.phone,m.imageUrl AS "imageUrl",m.description,m.price,m.discount,m.availability,m.label,m.location,m.isAvailable AS "isAvailable",m.ownerId AS "ownerId" FROM mechanics m LEFT JOIN users u ON u.id = m.ownerId WHERE m.ownerId IS NULL OR (u.providerApproved = true AND u.providerEnabled = true)`);
    res.json(rows);
  } catch (err) {
    console.error('Mechanics query failed:', err);
    return res.status(503).json({ error: 'Database unavailable' });
  }
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.query(`SELECT ${selectFields} FROM mechanics WHERE id = $1`, [req.params.id]);
  const row = rows[0];
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', authenticate, requireRole('lister'), async (req: AuthRequest, res) => {
  if (!isDbReady()) return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
  try {
    const id = `m${Date.now()}`;
    const { name, garageId, specialty, phone, imageUrl, description, price, discount, availability, label, location, isAvailable } = req.body;
    await db.query(
      'INSERT INTO mechanics (id,name,garageId,specialty,phone,imageUrl,description,price,discount,availability,label,location,isAvailable,ownerId) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
      [id, name, garageId, specialty, phone || null, imageUrl || null, description || null, price || null, discount || null, availability || null, label || null, location || null, isAvailable !== false, req.user!.id]
    );
    const { rows } = await db.query(`SELECT ${selectFields} FROM mechanics WHERE id = $1`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create mechanic failed:', err);
    return res.status(503).json({ error: 'Database unavailable' });
  }
});

router.put('/:id', authenticate, requireRole('lister'), async (req: AuthRequest, res) => {
  const { name, garageId, specialty, phone, imageUrl, description, price, discount, availability, label, location, isAvailable } = req.body;
  const info = await db.query('SELECT ownerId FROM mechanics WHERE id = $1', [req.params.id]);
  if (info.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  if (info.rows[0].ownerid !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed to edit this listing' });
  }
  await db.query(
    'UPDATE mechanics SET name = $1, garageId = $2, specialty = $3, phone = $4, imageUrl = $5, description = $6, price = $7, discount = $8, availability = $9, label = $10, location = $11, isAvailable = $12 WHERE id = $13',
    [name, garageId, specialty, phone || null, imageUrl || null, description || null, price || null, discount || null, availability || null, label || null, location || null, isAvailable !== false, req.params.id]
  );
  const { rows } = await db.query(`SELECT ${selectFields} FROM mechanics WHERE id = $1`, [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  const listing = await db.query('SELECT ownerId FROM mechanics WHERE id = $1', [req.params.id]);
  if (listing.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  if (listing.rows[0].ownerid !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed to delete this listing' });
  }
  await db.query('DELETE FROM mechanics WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

export default router;
