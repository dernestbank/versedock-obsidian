import type { App } from 'obsidian';
import { beforeEach, expect, it, vi } from 'vitest';
import { catalogueCache } from '../src/obsidian/discovery-cache';

const versionCheck = vi.hoisted(() => vi.fn());
vi.mock('obsidian', () => ({ requireApiVersion: versionCheck }));
beforeEach(() => versionCheck.mockReset());

it('reuses listings between wizards on older hosts and isolates separate vaults', () => {
  versionCheck.mockReturnValue(false);
  const firstVault = {} as App;
  const otherVault = {} as App;
  catalogueCache(firstVault).save('books', { time: 123 });
  expect(catalogueCache(firstVault).load('books')).toEqual({ time: 123 });
  expect(catalogueCache(otherVault).load('books')).toBeUndefined();
});

it('reads and writes the original persistent cache on hosts with the vault storage API', () => {
  versionCheck.mockReturnValue(true);
  const host = { loadLocalStorage: vi.fn(() => ({ time: 123 })), saveLocalStorage: vi.fn() };
  const cache = catalogueCache(host as unknown as App);
  expect(cache.load('books')).toEqual({ time: 123 });
  cache.save('books', { time: 456 });
  expect(host.loadLocalStorage).toHaveBeenCalledWith('versedock.catalogue.1.books');
  expect(host.saveLocalStorage).toHaveBeenCalledWith('versedock.catalogue.1.books', { time: 456 });
  expect(versionCheck).toHaveBeenCalledWith('1.8.7');
});
