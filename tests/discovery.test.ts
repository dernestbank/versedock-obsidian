import { describe, expect, it } from 'vitest';
import { zipSync } from 'fflate';
import { moduleMembers } from '../src/core/discovery-archive';
import { DiscoveryIndex } from '../src/core/discovery-index';
import { parseDiscoveryPage } from '../src/core/discovery-parser';
import { COLLECTIONS, pinnedSource, starterEntries } from '../src/core/discovery-sources';

const official = COLLECTIONS[0],
  support = COLLECTIONS.find((c) => c.key === 'support')!;
const html =
  '<table><tr><td class="langhead">Language: French (1)</td></tr><tr><td>1</td><td><a href="https://mysword-bible.info/download/getfile.php?file=test.bbl.mybible.gz">Test Bible</a></td><td>1</td><td>2</td></tr></table>';
const listing = (name: string, next = '') =>
  '<div class="basic_info"><h3><a title="View file named ' +
  name +
  '" href="/e-sword-downloads/file/' +
  name +
  '/">' +
  name +
  '</a></h3><span itemprop="name">Publisher</span></div>' +
  next;
describe('publisher catalogue', () => {
  it('identifies languages, download sizes and the six existing module identities', () => {
    expect(parseDiscoveryPage(official, official.url, html).entries[0]).toMatchObject({
      title: 'Test Bible',
      language: 'French',
      size: 1048576,
      kind: 'bible',
    });
    expect(
      starterEntries.map((e) => pinnedSource(e.url!)?.id).every((id) => id?.startsWith('mysword-')),
    ).toBe(true);
    expect(
      parseDiscoveryPage(official, official.url, html.replace('<td>2', '<td>80')).entries[0].reason,
    ).toContain('64 MiB');
  });
  it('appends second-page listings, reopens the cache offline and retains it on a refresh failure', async () => {
    const data = new Map<string, unknown>();
    let count = 0;
    const cache = {
      load: (k: string) => data.get(k),
      save: (k: string, v: unknown) => {
        data.set(k, v);
      },
    };
    const index = new DiscoveryIndex(cache, async (_c, url) => {
      count++;
      return url === support.url
        ? listing('First', '<a rel="next" href="?st=10">Next</a>')
        : listing('Second');
    });
    await index.refresh(support);
    await index.refresh(support);
    expect(count).toBe(1);
    await index.refresh(support, 'next');
    expect(count).toBe(2);
    const offline = new DiscoveryIndex(cache, async () => {
      throw Error('Offline');
    });
    await offline.refresh(support, 'refresh');
    expect(
      offline
        .entries()
        .filter((e) => e.collection === 'support')
        .map((e) => e.title),
    ).toEqual(['First', 'Second']);
    expect(offline.errors.get(support.key)).toBe('Offline');
    expect(offline.snapshots.get(support.key)?.entries[1]).toMatchObject({
      author: 'Publisher',
      reason: expect.stringContaining('account'),
    });
  });
  it('keeps both publisher detail results when the second request finishes first', async () => {
    const c = COLLECTIONS.find(c => c.key === 'cox')!;
    const entries = ['first', 'second'].map(title => ({
      collection: c.key, page: c.url + title, title, author: '', language: 'English'
    }));
    let finishFirst!: (html: string) => void;
    const first = new Promise<string>(resolve => { finishFirst = resolve; });
    const html = (name: string) => '<article><a href="/'+name+'.mybible">Download</a></article>';
    const index = new DiscoveryIndex({
      load: key => key === c.key ? {entries,time:Date.now()} : null, save: () => {}
    }, async (_source, url) => url === entries[0].page ? first : html('second'));
    const pending = index.resolve(entries[0]);
    await index.resolve(entries[1]);
    finishFirst(html('first'));
    await pending;
    expect(index.snapshots.get(c.key)?.entries.map(e => e.url).sort())
      .toEqual([c.url+'first.mybible', c.url+'second.mybible']);
  });
  it('extracts named third-party modules and leaves other download hosts out', () => {
    const c = COLLECTIONS.find((c) => c.key === 'dave')!;
    const page =
      '<p>A. Writer - My Book <a href="book_ms.zip">MyS</a></p><p><a href="https://example.org/book.zip">Mirror</a></p>';
    expect(parseDiscoveryPage(c, c.url, page).entries).toEqual([
      expect.objectContaining({
        author: 'A. Writer',
        title: 'My Book',
        url: 'https://doctordavet.com/book_ms.zip',
      }),
    ]);
  });
});
describe('ZIP module selection', () => {
  const one = new Uint8Array([1, 2, 3]),
    two = new Uint8Array([9, 8, 7]);
  it('offers individual members and reads only the chosen module', async () => {
    const members = moduleMembers(
      zipSync({ 'docs/readme.txt': one, 'a.bok.mybible': one, 'books/b.bok.mybible': two }),
      'books.zip',
    );
    expect(members.map((m) => m.name)).toEqual(['a.bok.mybible', 'books/b.bok.mybible']);
    expect(await members[1].unpack(new AbortController().signal)).toEqual(two);
    await expect(members[0].unpack(AbortSignal.abort())).rejects.toThrow(/cancel/i);
  });
  it('explains an unsupported archive and rejects an incomplete download', () => {
    expect(() => moduleMembers(zipSync({ 'readme.txt': one }), 'a.zip')).toThrow(/no supported/i);
    expect(() => moduleMembers(zipSync({ 'a.mybible': one }).slice(0, -5), 'a.zip')).toThrow(/incomplete/i);
  });
});
