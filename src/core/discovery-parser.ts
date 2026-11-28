import { parse, type HTMLElement } from 'node-html-parser';
import {
  type Collection,
  type DiscoveryEntry,
  artifactName,
  sourceUrl,
  supportedName,
  entryKey,
  pinnedSource,
} from './discovery-sources';
import type { ReadingKind } from './reading-modules';

const tidy = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 350);
function guess(s: string): ReadingKind | undefined {
  if (/commentar|\.cmt\b/i.test(s)) return 'commentary';
  if (/dictionar|lexicon|\.dct\b/i.test(s)) return 'dictionary';
  if (/devotional/i.test(s)) return 'devotional';
  if (/graphic|atlas|maps/i.test(s)) return 'graphics';
  if (/bibles?\b|\.bbl\b/i.test(s)) return 'bible';
  return;
}
export interface DiscoveryPage {
  entries: DiscoveryEntry[];
  next?: string;
}
export function parseDiscoveryPage(c: Collection, page: string, html: string, detail = false): DiscoveryPage {
  if (html.length > 4 * 1024 * 1024) throw Error('Publisher page exceeds the catalogue limit.');
  const root = parse(html, {
    blockTextElements: { script: false, style: false, noscript: false, pre: true },
  });
  const entries: DiscoveryEntry[] = [];
  const href = (a: HTMLElement, artifact = false) =>
    sourceUrl(c, a.getAttribute('href') ?? '', page, artifact);
  const base = { collection: c.key, page, language: '', author: '' };
  if (c.format === 'official') {
    let language = '';
    for (const row of root.querySelectorAll('table tr')) {
      const header = row.querySelector('.langhead');
      if (header) {
        language = tidy(header.text)
          .replace(/^Language:\s*/i, '')
          .replace(/\s*\(\d+\).*$/, '');
        continue;
      }
      const a = row.querySelector('a[href*="getfile"]');
      if (!a) continue;
      const url = href(a, true);
      if (!url) continue;
      const pinned = pinnedSource(url);
      const cells = row.querySelectorAll('td'),
        size = Math.round(Number(cells[2]?.text) * 1024 * 1024);
      const oversize = Math.max(Number(cells[2]?.text), Number(cells[3]?.text)) > 64;
      entries.push({
        ...base,
        title: tidy(a.text),
        url: pinned?.url ?? url,
        kind: c.kind,
        language,
        size: pinned?.compressedBytes ?? (size || undefined),
        hash: row.text.match(/SHA[- ]?256\s*[:=]\s*([a-f0-9]{64})/i)?.[1].toLowerCase(),
        reason: !supportedName(artifactName(url))
          ? 'Unsupported publisher file format.'
          : oversize
            ? 'Exceeds the 64 MiB reading limit.'
            : undefined,
      });
    }
  } else if (c.format === 'dave') {
    let section: ReadingKind = 'book';
    for (const p of root.querySelectorAll('p')) {
      const line = tidy(p.text);
      if (!p.querySelector('a[href]') && line.length < 90) {
        if (/commentary modules/i.test(line)) section = 'commentary';
        else if (/reference|exposition|doctrinal|living|reading|biography|collections/i.test(line))
          section = 'book';
      }
      for (const a of p.querySelectorAll('a[href]')) {
        const url = href(a, true);
        if (!url || !supportedName(artifactName(url))) continue;
        const label = tidy(line.replace(/^[\s^*]+/, '').replace(/\b(?:MyS|eS|TW)\b.*$/i, ''));
        const [author, title] = label.split(/\s+-\s+(.+)/);
        entries.push({
          ...base,
          url,
          title: title || label || artifactName(url),
          author: title ? author : '',
          language: 'English',
          kind:
            guess(artifactName(url)) ??
            (/\bBible(?: Translation)?$/i.test(title || label) ? 'bible' : section),
        });
      }
    }
  } else if (c.format === 'support') {
    for (const a of root.querySelectorAll('a[title^="View file named"]')) {
      const landing = href(a);
      if (!landing) continue;
      const info = a.closest('.basic_info');
      entries.push({
        ...base,
        page: landing,
        title: tidy((a.getAttribute('title') ?? '').replace(/^View file named /, '')),
        author: tidy(info?.querySelector('[itemprop=name]')?.text ?? ''),
        kind: c.kind ?? guess(info?.querySelector('.cat_name')?.text ?? '') ?? 'book',
        reason: 'BibleSupport requires a publisher account for downloads.',
      });
    }
  } else {
    const scope = root.querySelector('main') ?? root;
    for (const a of scope.querySelectorAll(
      detail
        ? 'article a[href], .entry-content a[href]'
        : 'article h2 a[href], article h3 a[href], .entry-title a[href]',
    )) {
      const link = href(a, detail);
      if (!link) continue;
      const direct = supportedName(artifactName(link));
      if (detail && !direct) continue;
      entries.push({
        ...base,
        page: direct ? page : link,
        title: tidy(a.text) || artifactName(link),
        url: direct ? link : undefined,
        language: c.key === 'biblioteca' ? 'Spanish' : 'English',
        reason: direct ? undefined : 'Check publisher detail page for a module.',
      });
    }
  }
  const nextLink = root.querySelector('a[rel=next], link[rel=next], a.next.page-numbers');
  const next = nextLink ? href(nextLink) : undefined;
  return {
    entries: [...new Map(entries.map((e) => [entryKey(e), e])).values()],
    next: next === page ? undefined : next,
  };
}
