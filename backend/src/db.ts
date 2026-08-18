import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'pinpoint'}`;

const pool = new Pool({ connectionString });
let dbReady = false;

async function init() {
  try {
    await pool.query('SELECT 1');
    dbReady = true;

    // create tables if not exist
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      googleId TEXT UNIQUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS googleId TEXT UNIQUE;

    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expiresAt TIMESTAMP NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt TIMESTAMP NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS garages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      ownerId TEXT
    );

    CREATE TABLE IF NOT EXISTS mechanics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      garageId TEXT,
      specialty TEXT,
      ownerId TEXT
    );

    CREATE TABLE IF NOT EXISTS transport (
      id TEXT PRIMARY KEY,
      type TEXT,
      company TEXT,
      phone TEXT,
      ownerId TEXT
    );
    `);

    // seed admin
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const r = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
      if (r.rowCount === 0) {
        const id = `u${Date.now()}`;
        const hash = bcrypt.hashSync(adminPassword, 10);
        await pool.query('INSERT INTO users (id,email,passwordHash,role) VALUES ($1,$2,$3,$4)', [id, adminEmail, hash, 'admin']);
        console.log('Admin user created:', adminEmail);
      }
    }
  } catch (err) {
    dbReady = false;
    console.error('Failed to initialize database', err);
    console.error('Postgres connection failed. Set DATABASE_URL or PGUSER/PGPASSWORD/PGHOST/PGPORT/PGDATABASE to a working database.');
    console.error('Example env: DATABASE_URL=postgresql://postgres:password@localhost:5432/pinpoint');
    // Do not exit here so the server can run for static routes while the DB is configured.
  }
}

init();

export function isDbReady() {
  return dbReady;
}

export default pool;
