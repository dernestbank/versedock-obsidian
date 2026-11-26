import { BOOKS } from './books';
import type { ReadingEntry } from './reading-modules';
import type { PassageReference } from './references';

/** Introduction records and overlapping ranges retain their publisher coordinates. */
export function commentaryForPassage(entries: readonly ReadingEntry[], ref: PassageReference): ReadingEntry[] {
  const book = BOOKS.findIndex(book => book.osis === ref.book.osis) + 1;
  return entries.filter(entry => {
    const source = entry.reference;
    if (!source || source.book !== book) return false;
    if (source.chapter === 0) return true;
    if (source.chapter !== ref.chapter) return false;
    return source.verse === 0 || ref.verse === undefined ||
      (source.verse <= (ref.endVerse ?? ref.verse) && source.endVerse >= ref.verse);
  });
}

/** Keep the passage in view; source introductions remain available separately. */
export function commentarySectionsForPassage(entries: readonly ReadingEntry[], ref: PassageReference): {
  passage: ReadingEntry[]; introductions: ReadingEntry[];
} {
  const passage: ReadingEntry[] = [], introductions: ReadingEntry[] = [];
  for (const entry of commentaryForPassage(entries, ref)) {
    const source = entry.reference!;
    (source.chapter === 0 || source.verse === 0 ? introductions : passage).push(entry);
  }
  return {passage, introductions};
}

export function dictionaryHeadwords(entries: readonly ReadingEntry[], query: string, offset = 0, limit = 25): {
  entries: ReadingEntry[]; total: number;
} {
  const normalized = query.normalize('NFKC').trim().toLocaleLowerCase();
  const matches = entries.filter(entry => entry.title.normalize('NFKC').toLocaleLowerCase().includes(normalized));
  if (normalized) matches.sort((left, right) =>
    Number(right.title.normalize('NFKC').toLocaleLowerCase() === normalized) -
    Number(left.title.normalize('NFKC').toLocaleLowerCase() === normalized));
  const start = Number.isSafeInteger(offset) ? Math.max(0, offset) : 0;
  const count = Number.isSafeInteger(limit) ? Math.max(1, Math.min(100, limit)) : 25;
  return { entries: matches.slice(start, start + count), total: matches.length };
}
