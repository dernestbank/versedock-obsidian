import { type App, requireApiVersion } from 'obsidian';

// Older Obsidian versions can reuse public listings while this vault is open.
const sessionCatalogues = new WeakMap<App, Map<string, unknown>>();

export function catalogueCache(app: App) {
  if (requireApiVersion('1.8.7')) {
    return {
      load: (key: string): unknown => app.loadLocalStorage('versedock.catalogue.1.' + key),
      save: (key: string, snapshot: unknown) => app.saveLocalStorage('versedock.catalogue.1.' + key, snapshot),
    };
  }
  const cache = sessionCatalogues.get(app) ?? new Map<string, unknown>();
  sessionCatalogues.set(app, cache);
  return {
    load: (key: string): unknown => cache.get(key),
    save: (key: string, snapshot: unknown) => { cache.set(key, snapshot); },
  };
}
