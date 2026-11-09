import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const state = process.argv[2] || '.wrangler/state';

// Local only. Never use sample fixtures against a remote database.
mkdirSync('.cache', { recursive: true });
const seedPath = resolve('.cache/sample-seed.sql');
const sql = execFileSync(process.execPath, ['db/seed.mjs'], { encoding: 'utf8' });
writeFileSync(seedPath, sql);
const output = execFileSync(process.execPath, [
  'scripts/tool.mjs', 'wrangler', 'd1', 'execute', 'movie-db',
  '--local', '--persist-to', state, '--file', seedPath, '--json',
], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const results = JSON.parse(output);
if (results.some(result => result.success !== true)) throw new Error('Local sample seed failed');
console.log(`Local sample fixture import: ${results.length} SQL statements succeeded. No remote database was touched.`);
const { localBindings } = await import('../sync/local.ts');
const bindings = await localBindings(state);
try {
  const tables = await bindings.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='title_genres'");
  if (tables.length) await bindings.db.batch([{
    sql: `INSERT OR IGNORE INTO title_genres(title_id,title_type,genre_slug)
      SELECT t.id,t.type,j.value FROM titles t,json_each(t.genres) j WHERE j.type='text'`,
  }]);
} finally { await bindings.dispose(); }
