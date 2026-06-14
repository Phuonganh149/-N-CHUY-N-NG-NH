import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await loadEnv();

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const storageBucket = process.env.SUPABASE_CV_BUCKET || 'private-cvs';
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
const cvRows = await migrateCvs(db.prepare('SELECT * FROM cvs').all());
await upsert('cvs', cvRows, 'email');

console.log('Migrated SQLite data to Supabase successfully.');



async function migrateCvs(rows) {
  const out = [];
  for (const row of rows) {
    let storagePath = row.storagePath || '';
    let storageBucketName = row.storageBucket || storageBucket;
    const base64 = row.base64 || '';
    if (!storagePath && base64) {
      const file = decodeDataUrl(base64);
      const ext = String(row.ext || 'bin').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
      storagePath = `${safeSegment(row.email || 'unknown')}/${Date.now()}-${safeSegment(row.name || `cv.${ext}`)}`;
      await uploadStorage(storagePath, file.buffer, file.mimeType || row.type || 'application/octet-stream');
      storageBucketName = storageBucket;
    }
    out.push({
      ...row,
      base64: '',
      storageBucket: storageBucketName,
      storagePath,
      industries: normalizeJsonArray(row.industries),
    });
  }
  return out;
}

async function uploadStorage(path, buffer, contentType) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${storageBucket}/${path}`, {
    method: 'POST',
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': contentType, 'x-upsert': 'true' },
    body: buffer,
  });
  if (!response.ok) throw new Error(`storage upload: ${response.status} ${await response.text()}`);
}

function decodeDataUrl(value = '') {
  const match = String(value).match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!match) return { mimeType: 'application/octet-stream', buffer: Buffer.from(String(value), 'base64') };
  return { mimeType: match[1] || 'application/octet-stream', buffer: match[2] ? Buffer.from(match[3] || '', 'base64') : Buffer.from(decodeURIComponent(match[3] || '')) };
}

function safeSegment(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || `file_${Date.now()}`;
}

function normalizeJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

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
