import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Local only. Never use sample fixtures against a remote database.
mkdirSync('.cache', { recursive: true });
const seedPath = resolve('.cache/sample-seed.sql');
const sql = execFileSync(process.execPath, ['db/seed.mjs'], { encoding: 'utf8' });
writeFileSync(seedPath, sql);
const output = execFileSync(process.execPath, [
  'scripts/tool.mjs', 'wrangler', 'd1', 'execute', 'movie-db',
  '--local', '--persist-to', '.wrangler/state', '--file', seedPath, '--json',
], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const results = JSON.parse(output);
if (results.some(result => result.success !== true)) throw new Error('Local sample seed failed');
console.log(`Local sample fixture import: ${results.length} SQL statements succeeded. No remote database was touched.`);
