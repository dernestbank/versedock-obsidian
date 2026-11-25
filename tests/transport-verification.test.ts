import {describe, expect, it} from 'vitest';
import {mkdtemp, mkdir, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const verifier = join(root, 'scripts/verify-download-transport.mjs');

describe('transport verification report', () => {
  for (const failure of ['startup build', 'HTTPS request'] as const) {
    it(`invalidates prior success before a ${failure} failure`, async () => {
      const directory = await mkdtemp(join(tmpdir(), 'sworddock-transport-report-'));
      try {
        const reports = join(directory, '.research/modules');
        await mkdir(reports, {recursive: true});
        const reportPath = join(reports, 'transport-report.json');
        await writeFile(reportPath, JSON.stringify({complete: true, actualHttps: true, cancelledAt: 999}));
        await mkdir(join(directory, 'scripts'));
        const isolatedVerifier = join(directory, 'scripts/verify-download-transport.mjs');
        await writeFile(isolatedVerifier, await readFile(verifier));
        await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'junction');
        const args = [isolatedVerifier];
        if (failure === 'HTTPS request') {
          await symlink(join(root, 'src'), join(directory, 'src'), 'junction');
          const preload = join(directory, 'reject-https.cjs');
          await writeFile(preload, `
const https = require('node:https');
const {EventEmitter} = require('node:events');
https.get = () => {
  const request = new EventEmitter();
  request.destroy = () => {request.destroyed = true; return request;};
  process.nextTick(() => request.emit('error', new Error('CONTROLLED_HTTPS_FAILURE')));
  return request;
};
require('node:module').syncBuiltinESMExports();
`);
          args.unshift('--require', preload);
        }
        const result = spawnSync(process.execPath, args, {cwd: directory, encoding: 'utf8', timeout: 10000});
        expect(result.error).toBeUndefined();
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain(failure === 'startup build' ? 'Could not resolve' : 'CONTROLLED_HTTPS_FAILURE');
        expect(JSON.parse(await readFile(reportPath, 'utf8'))).toEqual({complete: false});
      } finally {
        await rm(directory, {recursive: true, force: true});
      }
    });
  }
});
