import { afterEach, expect, it, vi } from 'vitest';
import { gzipSync } from 'node:zlib';
import { bundledLibraryFolder } from '../src/core/bundled-library-files';

afterEach(() => vi.unstubAllGlobals());

it('reads the version shipped with the directory install even when an upgrade leaves older files on disk', async () => {
  const text = 'ὁ λόγος';
  vi.stubGlobal('SWORDDOCK_LIBRARY', {'webp/GEN.json': [Buffer.byteLength(text), gzipSync(text).toString('base64')]});
  const adapter = {read: vi.fn(), stat: vi.fn()};
  const folder = bundledLibraryFolder(adapter, '.obsidian/plugins/versedock', 'webp');
  expect(await folder.read('GEN.json')).toBe(text);
  expect(await folder.size('GEN.json')).toBe(Buffer.byteLength(text));
  expect(await folder.size('other.json')).toBeNull();
  await expect(folder.read('other.json')).rejects.toThrow();
  expect(adapter.read).not.toHaveBeenCalled();
});

it('reads the extracted resources when running the manual ZIP build', async () => {
  const adapter = {read: vi.fn().mockResolvedValue('manual'), stat: vi.fn().mockResolvedValue({type:'file',size:6})};
  const folder = bundledLibraryFolder(adapter, 'config/plugins/versedock', 'webp');
  expect(await folder.read('GEN.json')).toBe('manual');
  expect(adapter.read).toHaveBeenCalledWith('config/plugins/versedock/library/webp/GEN.json');
  expect(await folder.size('GEN.json')).toBe(6);
});
