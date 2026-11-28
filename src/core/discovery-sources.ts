import type { ReadingKind } from './reading-modules';
import { READING_SOURCES } from './reading-catalogue';

export interface Collection {
  key: string;
  publisher: string;
  url: string;
  kind?: ReadingKind;
  format: 'official' | 'support' | 'dave' | 'wordpress';
}
const official = (slug: string, kind: ReadingKind): Collection => ({
  key: slug,
  publisher: 'MySword',
  kind,
  format: 'official',
  url: 'https://www.mysword.info/download-mysword/' + slug,
});
export const COLLECTIONS: Collection[] = [
  official('bibles', 'bible'),
  official('bibles-indigenous', 'bible'),
  official('commentaries', 'commentary'),
  official('dictionaries', 'dictionary'),
  official('books', 'book'),
  official('devotionals', 'devotional'),
  official('graphics', 'graphics'),
  {
    key: 'dave',
    publisher: 'Doctor Dave',
    format: 'dave',
    url: 'https://doctordavet.com/myswordmodules.html',
  },
  {
    key: 'support',
    publisher: 'BibleSupport',
    format: 'support',
    url: 'https://www.biblesupport.com/e-sword-downloads/category/26-mysword-modules/',
  },
  {
    key: 'foreign',
    publisher: 'BibleSupport',
    format: 'support',
    kind: 'bible',
    url: 'https://www.biblesupport.com/e-sword-downloads/category/47-foreign-language-bibles/',
  },
  {
    key: 'cox',
    publisher: 'David Cox · English',
    format: 'wordpress',
    url: 'https://www.myswordmodules.com/',
  },
  {
    key: 'biblioteca',
    publisher: 'David Cox · Spanish',
    format: 'wordpress',
    url: 'https://myswordbiblioteca.com/',
  },
];
export interface DiscoveryEntry {
  collection: string;
  title: string;
  author: string;
  language: string;
  kind?: ReadingKind;
  page: string;
  url?: string;
  size?: number;
  reason?: string;
  hash?: string;
}
export const entryKey = (e: DiscoveryEntry) => e.collection + '|' + (e.url ?? e.page);
export function sourceUrl(
  collection: Collection,
  value: string,
  base = collection.url,
  artifact = false,
): string | undefined {
  try {
    const url = new URL(value, base);
    const host = new URL(collection.url).hostname.replace(/^www\./, '');
    const same = url.hostname.replace(/^www\./, '') === host;
    if (url.protocol === 'http:' && same) url.protocol = 'https:';
    if (
      url.protocol !== 'https:' ||
      url.port ||
      url.username ||
      url.password ||
      url.href.length > 2048 ||
      !(same || (artifact && collection.format === 'official' && url.hostname === 'mysword-bible.info'))
    )
      return;
    url.hash = '';
    return url.href;
  } catch {
    return;
  }
}
export const artifactName = (url: string) => {
  const u = new URL(url);
  return u.searchParams.get('file') ?? decodeURIComponent(u.pathname.split('/').pop() ?? '');
};
export const supportedName = (name: string) => /\.(?:zip|mybible(?:\.gz)?|sqlite(?:\.gz)?)$/i.test(name);
export function pinnedSource(url: string) {
  // Some publisher pages offer the same database in ZIP and gzip variants.
  const name = artifactName(url)
    .toLowerCase()
    .replace(/\.(gz|zip)$/, '');
  return new URL(url).hostname === 'mysword-bible.info'
    ? READING_SOURCES.find((s) => artifactName(s.url).replace(/\.gz$/, '') === name)
    : undefined;
}
export const starterEntries: DiscoveryEntry[] = READING_SOURCES.map((s) => ({
  collection: COLLECTIONS.find((c) => c.url === s.sourcePage)!.key,
  title: s.title,
  author: '',
  language: 'English',
  kind: s.type,
  page: s.sourcePage,
  url: s.url,
  size: s.compressedBytes,
}));
export function isDiscoveredId(id: string, kind?: ReadingKind): boolean {
  return (
    /^online-(bible|commentary|dictionary|book|devotional|graphics)-[a-f0-9]{24}$/.test(id) &&
    (!kind || id.startsWith('online-' + kind + '-'))
  );
}
