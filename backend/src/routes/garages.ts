import { Router } from 'express';
import db, { isDbReady } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const SERVICE_TYPES = new Set(['garage', 'car-hire', 'bike-hire']);
const selectFields = 'id,name,address,phone,imageUrl AS "imageUrl",description,price,discount,availability,label,location,isAvailable AS "isAvailable",serviceType AS "serviceType",ownerId AS "ownerId"';

router.get('/', async (req, res) => {
  if (!isDbReady()) return res.json([]);
  try {
    const { rows } = await db.query(`SELECT g.id,g.name,g.address,g.phone,g.imageUrl AS "imageUrl",g.description,g.price,g.discount,g.availability,g.label,g.location,g.isAvailable AS "isAvailable",g.serviceType AS "serviceType",g.ownerId AS "ownerId" FROM garages g LEFT JOIN users u ON u.id = g.ownerId WHERE g.ownerId IS NULL OR (u.providerApproved = true AND u.providerEnabled = true)`);
    res.json(rows);
  } catch (err) {
    console.error('Garages query failed:', err);
    return res.status(503).json({ error: 'Database unavailable' });
  }
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.query(`SELECT ${selectFields} FROM garages WHERE id = $1`, [req.params.id]);
  const row = rows[0];
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', authenticate, requireRole('lister'), async (req: AuthRequest, res) => {
  if (!isDbReady()) return res.status(503).json({ error: 'Database unavailable. Start PostgreSQL and configure DATABASE_URL.' });
  try {
    const id = `g${Date.now()}`;
    const { name, address, phone, imageUrl, description, price, discount, availability, label, location, isAvailable, serviceType, type } = req.body;
    const requestedServiceType = serviceType || type || 'garage';
    const selectedServiceType = SERVICE_TYPES.has(requestedServiceType) ? requestedServiceType : 'garage';
    await db.query(
      'INSERT INTO garages (id,name,address,phone,imageUrl,description,price,discount,availability,label,location,isAvailable,serviceType,ownerId) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
      [id, name, address, phone, imageUrl || null, description || null, price || null, discount || null, availability || null, label || null, location || null, isAvailable !== false, selectedServiceType, req.user!.id]
    );
    const { rows } = await db.query(`SELECT ${selectFields} FROM garages WHERE id = $1`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create garage failed:', err);
    return res.status(503).json({ error: 'Database unavailable' });
  }
});

router.put('/:id', authenticate, requireRole('lister'), async (req: AuthRequest, res) => {
  const { name, address, phone, imageUrl, description, price, discount, availability, label, location, isAvailable, serviceType, type } = req.body;
  const requestedServiceType = serviceType || type || 'garage';
  const selectedServiceType = SERVICE_TYPES.has(requestedServiceType) ? requestedServiceType : 'garage';
  const info = await db.query('SELECT ownerId FROM garages WHERE id = $1', [req.params.id]);
  if (info.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  if (info.rows[0].ownerid !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed to edit this listing' });
  }
  await db.query(
    'UPDATE garages SET name = $1, address = $2, phone = $3, imageUrl = $4, description = $5, price = $6, discount = $7, availability = $8, label = $9, location = $10, isAvailable = $11, serviceType = $12 WHERE id = $13',
    [name, address, phone, imageUrl || null, description || null, price || null, discount || null, availability || null, label || null, location || null, isAvailable !== false, selectedServiceType, req.params.id]
  );
  const { rows } = await db.query(`SELECT ${selectFields} FROM garages WHERE id = $1`, [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  const listing = await db.query('SELECT ownerId FROM garages WHERE id = $1', [req.params.id]);
  if (listing.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  if (listing.rows[0].ownerid !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed to delete this listing' });
  }
  await db.query('DELETE FROM garages WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

export default router;
