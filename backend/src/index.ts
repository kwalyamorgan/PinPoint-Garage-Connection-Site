import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import garagesRouter from './routes/garages';
import mechanicsRouter from './routes/mechanics';
import transportRouter from './routes/transport';
import imagesRouter from './routes/images';
import authRouter from './routes/auth';
import { spawn } from 'child_process';
import os from 'os';

dotenv.config();

const app = express();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'PinPoint Garage Connection Site API',
    status: 'ok',
    endpoints: ['/api/garages', '/api/mechanics', '/api/transport', '/api/images', '/api/auth'],
  });
});

app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.status(200).json({});
});

app.use('/api/garages', garagesRouter);
app.use('/api/mechanics', mechanicsRouter);
app.use('/api/transport', transportRouter);
app.use('/api/images', imagesRouter);
app.use('/api/auth', authRouter);

// serve workspace images folder
app.use('/images', express.static(path.join(__dirname, '..', '..', 'images')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  // In development, spawn the frontend dev server so running the backend starts the frontend automatically.
  if (process.env.NODE_ENV !== 'production' && process.env.START_FRONTEND !== 'false') {
    try {
      const projectRoot = path.join(__dirname, '..', '..');
      // Prefer pnpm/yarn if available
      const cmd = process.env.NPM_EXECUTABLE || 'npm';
      const child = spawn(cmd, ['run', 'dev'], {
        cwd: projectRoot,
        env: { ...process.env },
        stdio: 'inherit',
        shell: true,
      });
      child.on('error', (err) => console.error('Failed to start frontend dev server:', err));
    } catch (err) {
      console.error('Error spawning frontend:', err);
    }
  }
});
