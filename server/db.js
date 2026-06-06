import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in the .env file');
}

const pool = new Pool({ connectionString });

// Prevent process crashes from unexpected/idle connection closures by the pooler
pool.on('error', (err) => {
  console.error('Unexpected error on idle PG pool client:', err.message);
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
