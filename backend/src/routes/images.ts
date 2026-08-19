import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const imagesDir = path.join(__dirname, '..', '..', 'images');

router.get('/cloudinary-signature', authenticate, (_req: AuthRequest, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ error: 'Cloudinary is not configured' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'pinpoint/listings';
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  return res.json({ cloudName, apiKey, folder, timestamp, signature });
});

router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(imagesDir, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name);
    res.json({ images: files });
  } catch (err) {
    res.status(500).json({ error: 'Unable to read images folder' });
  }
});

export default router;
