import {
  COLLECTIONS,
  entryKey,
  sourceUrl,
  starterEntries,
  type Collection,
  type DiscoveryEntry,
} from './discovery-sources';
import { parseDiscoveryPage, type DiscoveryPage } from './discovery-parser';

interface Snapshot extends DiscoveryPage {
  time: number;
}
interface Cache {
  load: (key: string) => unknown;
  save: (key: string, snapshot: Snapshot) => void;
}
export class DiscoveryIndex {
  readonly snapshots = new Map<string, Snapshot>();
  readonly errors = new Map<string, string>();
  readonly pending = new Map<string, Promise<void>>();
  constructor(
    private cache: Cache,
    private read: (source: Collection, url: string) => Promise<string>,
  ) {
    for (const c of COLLECTIONS) {
      try {
        const s = cache.load(c.key) as Snapshot;
        if (
          s &&
          Number.isFinite(s.time) &&
          Array.isArray(s.entries) &&
          s.entries.length <= 5000 &&
          (!s.next || sourceUrl(c, s.next) === s.next) &&
          s.entries.every(
            (e) =>
              e.collection === c.key &&
              typeof e.title === 'string' &&
              typeof e.language === 'string' &&
              typeof e.author === 'string' &&
              sourceUrl(c, e.page) === e.page &&
              (!e.url || sourceUrl(c, e.url, c.url, true) === e.url),
          )
        )
          this.snapshots.set(c.key, s);
      } catch {
        /* Rebuild unavailable device cache from the publisher. */
      }
    }
  }
  entries(): DiscoveryEntry[] {
    return [
      ...new Map(
        [...starterEntries, ...[...this.snapshots.values()].flatMap((s) => s.entries)].map((e) => [
          entryKey(e),
          e,
        ]),
      ).values(),
    ];
  }
  refresh(c: Collection, mode: 'auto' | 'refresh' | 'next' = 'auto'): Promise<void> {
    const working = this.pending.get(c.key);
    if (working) return working;
    const previous = this.snapshots.get(c.key);
    if (mode === 'auto' && previous && Date.now() - previous.time < 86400000) return Promise.resolve();
    const url = mode === 'next' ? previous?.next : c.url;
    if (!url) return Promise.resolve();
    const task = (async () => {
      try {
        const page = parseDiscoveryPage(c, url, await this.read(c, url));
        if (!page.entries.length) throw Error('No module listings were readable.');
        if (c.format === 'wordpress') {
          const resolved: DiscoveryEntry[] = [];
          for (const entry of page.entries) {
            try {
              const details = parseDiscoveryPage(c, entry.page, await this.read(c, entry.page), true);
              resolved.push(
                ...(details.entries.length
                  ? details.entries.map((e) => ({
                      ...e,
                      title: details.entries.length === 1 ? entry.title : e.title,
                    }))
                  : [entry]),
              );
            } catch {
              resolved.push(entry);
            }
          }
          page.entries = resolved;
        }
        const entries = [
          ...new Map(
            [...(mode === 'next' ? (previous?.entries ?? []) : []), ...page.entries].map((e) => [
              entryKey(e),
              e,
            ]),
          ).values(),
        ];
        if (entries.length > 5000) throw Error('Collection cache limit reached.');
        const s = { entries, next: page.next, time: Date.now() };
        this.storeSnapshot(c.key, s);
      } catch (e) {
        this.errors.set(c.key, e instanceof Error ? e.message : 'Publisher unavailable.');
      } finally {
        this.pending.delete(c.key);
      }
    })();
    this.pending.set(c.key, task);
    return task;
  }
  private storeSnapshot(key: string, snapshot: Snapshot): void {
    this.snapshots.set(key, snapshot);
    this.errors.delete(key);
    try {
      this.cache.save(key, snapshot);
    } catch {
      this.errors.set(key, 'Device cache is full. This list is available for this session.');
    }
  }
  async resolve(entry: DiscoveryEntry): Promise<void> {
    const c = COLLECTIONS.find((c) => c.key === entry.collection)!;
    if (c.format !== 'wordpress' || entry.url) return;
    const detail = parseDiscoveryPage(c, entry.page, await this.read(c, entry.page), true);
    // Another detail request or a full refresh may have finished while this one was reading.
    const snapshot = this.snapshots.get(c.key);
    if (!snapshot || !snapshot.entries.includes(entry)) return;
    const replacement = detail.entries.length
      ? detail.entries.map((e) => ({ ...e, title: detail.entries.length === 1 ? entry.title : e.title }))
      : [{ ...entry, reason: 'Publisher provides no supported direct download.' }];
    const updated = {
      ...snapshot,
      entries: [...snapshot.entries.filter((e) => entryKey(e) !== entryKey(entry)), ...replacement],
    };
    this.storeSnapshot(c.key, updated);
  }
}
