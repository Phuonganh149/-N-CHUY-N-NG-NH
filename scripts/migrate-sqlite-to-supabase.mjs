import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await loadEnv();

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const dbPath = join(root, 'data', 'cvms.sqlite');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}
if (!existsSync(dbPath)) {
  throw new Error(`SQLite database not found: ${dbPath}`);
}

const db = new DatabaseSync(dbPath);

await upsert('users', db.prepare('SELECT * FROM users').all(), 'email');
await upsert('jobs', db.prepare('SELECT * FROM jobs').all().map((row) => ({
  ...row,
  tags: JSON.parse(row.tags || '[]'),
  active: row.active !== 0,
})), 'id');
await upsert('applications', db.prepare('SELECT * FROM applications').all(), 'id');
await upsert('notifications', db.prepare('SELECT * FROM notifications').all().map((row) => ({
  ...row,
  read: row.read === 1,
})), 'id');
await upsert('cvs', db.prepare('SELECT * FROM cvs').all(), 'email');

console.log('Migrated SQLite data to Supabase successfully.');

async function upsert(table, rows, onConflict) {
  if (!rows.length) {
    console.log(`${table}: 0 rows`);
    return;
  }
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table}: ${response.status} ${text}`);
  }
  console.log(`${table}: ${rows.length} rows`);
}

async function loadEnv() {
  try {
    const raw = await readFile(join(root, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...parts] = trimmed.split('=');
      if (!process.env[key]) process.env[key] = parts.join('=').trim();
    }
  } catch {
    // .env is optional
  }
}
