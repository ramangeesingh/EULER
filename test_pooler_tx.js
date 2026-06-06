import pg from 'pg';

const projectRef = "fayhpssprfklmfsyvgoi";
const password = "#Euler@0812";
const host = "aws-1-ap-southeast-2.pooler.supabase.com";

console.log(`Testing Transaction Mode (port 6543) on pooler: ${host}...`);

const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${host}:6543/postgres?pgbouncer=true`;
const pool = new pg.Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
});

try {
  const client = await pool.connect();
  console.log(`✅ SUCCESS! Successfully connected via Transaction Mode on port 6543.`);
  const res = await client.query('SELECT NOW()');
  console.log('Server time:', res.rows[0]);
  client.release();
} catch (err) {
  console.error(`❌ Failed: ${err.message}`);
} finally {
  await pool.end();
}
