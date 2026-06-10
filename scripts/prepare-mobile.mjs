import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, 'www');

const entries = [
  'index.html',
  'Trangchu.html',
  'Tuyendung.html',
  'Vechungtoi.html',
  'Lienhe.html',
  'Daingo.html',
  'login.html',
  'booking.html',
  'company',
  'css',
  'jss',
  'admin',
  'user'
];

async function copyIfExists(entry) {
  try {
    await cp(join(root, entry), join(out, entry), { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const entry of entries) {
  await copyIfExists(entry);
}

console.log(`Prepared mobile web assets in ${out}`);
