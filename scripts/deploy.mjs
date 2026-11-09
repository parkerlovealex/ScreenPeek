import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { phase1Complete, prepareProduction } from './deploy-config.mjs';

try {
  if (process.env.SCREENPEEK_DEPLOY_ENABLED !== '1') throw new Error('Deployment is disabled. Enable it only after the owner has reviewed the completed build.');
  if (!phase1Complete(await readFile('TASKS.md', 'utf8'))) throw new Error('Phase 1 still has unverified tasks. Finish its checklist before deploying.');
  if (!process.env.CLOUDFLARE_API_TOKEN) throw new Error('Set CLOUDFLARE_API_TOKEN in secure environment settings before deploying.');
  await prepareProduction();
  const child = spawn(process.execPath, [resolve('node_modules/wrangler/bin/wrangler.js'), 'deploy', '--config', 'dist/server/wrangler.json'], { env: process.env, stdio: 'inherit' });
  child.on('error', () => { process.stderr.write('Wrangler could not start.\n'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
} catch (error) { process.stderr.write(`${error instanceof Error ? error.message : 'Deployment failed.'}\n`); process.exitCode = 1; }
