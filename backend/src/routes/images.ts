import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const imagesDir = path.join(__dirname, '..', '..', 'images');

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
