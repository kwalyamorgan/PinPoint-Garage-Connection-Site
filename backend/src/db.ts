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
      providerApproved BOOLEAN NOT NULL DEFAULT false,
      providerEnabled BOOLEAN NOT NULL DEFAULT true,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS googleId TEXT UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS providerApproved BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS providerEnabled BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

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
      imageUrl TEXT,
      description TEXT,
      price TEXT,
      discount TEXT,
      availability TEXT,
      label TEXT,
      ownerId TEXT
    );

    ALTER TABLE garages ADD COLUMN IF NOT EXISTS imageUrl TEXT;
    ALTER TABLE garages ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE garages ADD COLUMN IF NOT EXISTS price TEXT;
    ALTER TABLE garages ADD COLUMN IF NOT EXISTS discount TEXT;
    ALTER TABLE garages ADD COLUMN IF NOT EXISTS availability TEXT;
    ALTER TABLE garages ADD COLUMN IF NOT EXISTS label TEXT;
    ALTER TABLE garages ADD COLUMN IF NOT EXISTS location TEXT;
    ALTER TABLE garages ADD COLUMN IF NOT EXISTS isAvailable BOOLEAN DEFAULT true;
    ALTER TABLE garages ADD COLUMN IF NOT EXISTS serviceType TEXT DEFAULT 'garage';

    CREATE TABLE IF NOT EXISTS mechanics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      garageId TEXT,
      specialty TEXT,
      imageUrl TEXT,
      description TEXT,
      price TEXT,
      discount TEXT,
      availability TEXT,
      label TEXT,
      ownerId TEXT
    );

    ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS imageUrl TEXT;
    ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS price TEXT;
    ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS discount TEXT;
    ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS availability TEXT;
    ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS label TEXT;
    ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS location TEXT;
    ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS isAvailable BOOLEAN DEFAULT true;

    CREATE TABLE IF NOT EXISTS transport (
      id TEXT PRIMARY KEY,
      type TEXT,
      company TEXT,
      phone TEXT,
      imageUrl TEXT,
      description TEXT,
      price TEXT,
      discount TEXT,
      availability TEXT,
      label TEXT,
      ownerId TEXT
    );

    ALTER TABLE transport ADD COLUMN IF NOT EXISTS imageUrl TEXT;
    ALTER TABLE transport ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE transport ADD COLUMN IF NOT EXISTS price TEXT;
    ALTER TABLE transport ADD COLUMN IF NOT EXISTS discount TEXT;
    ALTER TABLE transport ADD COLUMN IF NOT EXISTS availability TEXT;
    ALTER TABLE transport ADD COLUMN IF NOT EXISTS label TEXT;
    ALTER TABLE transport ADD COLUMN IF NOT EXISTS location TEXT;
    ALTER TABLE transport ADD COLUMN IF NOT EXISTS isAvailable BOOLEAN DEFAULT true;
    ALTER TABLE transport ADD COLUMN IF NOT EXISTS vehicleType TEXT;

    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      firstName TEXT,
      lastName TEXT,
      phone TEXT,
      whatsapp TEXT,
      location TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS firstName TEXT;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS lastName TEXT;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location TEXT;

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      providerType TEXT NOT NULL,
      providerName TEXT NOT NULL,
      serviceType TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      customerEmail TEXT NOT NULL,
      customerPhone TEXT,
      customerWhatsapp TEXT,
      customerName TEXT,
      providerPhone TEXT,
      providerWhatsapp TEXT,
      providerLocation TEXT,
      bookingChannel TEXT DEFAULT 'site',
      dateRequested TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      dateApproved TIMESTAMP,
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customerWhatsapp TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customerName TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS providerPhone TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS providerWhatsapp TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS providerLocation TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bookingChannel TEXT DEFAULT 'site';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      bookingId TEXT UNIQUE NOT NULL,
      customerId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    // Ensure user profiles table exists and add columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        userId TEXT UNIQUE NOT NULL,
        firstName TEXT,
        lastName TEXT,
        phone TEXT,
        whatsapp TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
