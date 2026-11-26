import { it, expect } from 'vitest';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

it('opens SQLite in an empty installation using only the compiled JavaScript', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'sworddock-sqlite-'));
  try {
    const outfile = path.join(folder, 'main.cjs');
    await build({entryPoints: ['src/core/bundled-sqlite.ts'], outfile, bundle: true,
      platform: 'browser', target: 'es2022', format: 'cjs', loader: {'.wasm': 'binary'}, external: ['node:*']});
    const { loadBundledSqlite } = createRequire(import.meta.url)(outfile);
    const sql = await loadBundledSqlite();
    const db = new sql.Database();
    try { expect(db.exec('SELECT 42')[0].values).toEqual([[42]]); }
    finally { db.close(); }
  } finally { await rm(folder, {recursive:true,force:true}); }
});
