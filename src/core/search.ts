import { BOOKS, BOOK_BY_OSIS, type BookInfo } from "./books";

export type BibleSearchScope = "all" | "current-chapter" | "current-book" | "old-testament" | "new-testament";
export type BibleSearchMatch = "phrase" | "all-words";
export const MAX_SEARCH_PHRASE_LENGTH = 200;
export const MAX_SEARCH_TERMS = 16;

export interface BibleSearchRequest {
  phrase: string;
  scope: BibleSearchScope;
  match: BibleSearchMatch;
  currentBook: BookInfo;
  currentChapter?: number;
  limit?: number;
  signal?: AbortSignal;
}

const NEW_TESTAMENT_INDEX = BOOKS.findIndex(book => book.osis === "Matt");

export interface PreparedBibleSearchQuery {
  match: BibleSearchMatch;
  normalized: string;
  terms: readonly string[];
}

export function parseBibleSearchScope(value: string): BibleSearchScope {
  switch (value) {
    case "all":
    case "current-chapter":
    case "current-book":
    case "old-testament":
    case "new-testament":
      return value;
    default:
      throw new Error("Unsupported Bible search scope.");
  }
}

export function parseBibleSearchMatch(value: string): BibleSearchMatch {
  switch (value) {
    case "phrase":
    case "all-words":
      return value;
    default:
      throw new Error("Unsupported Bible search match mode.");
  }
}

export function prepareBibleSearchQuery(phrase: string, match: BibleSearchMatch): PreparedBibleSearchQuery {
  const validatedMatch = parseBibleSearchMatch(match);
  const normalized = phrase.trim().toLocaleLowerCase();
  if (normalized.length > MAX_SEARCH_PHRASE_LENGTH) {
    throw new Error("Search phrase must be 200 characters or fewer.");
  }
  if (validatedMatch === "phrase") return { match: validatedMatch, normalized, terms: normalized ? [normalized] : [] };
  const words = normalized ? normalized.split(/\s+/u) : [];
  if (words.length > MAX_SEARCH_TERMS) throw new Error("Search supports at most 16 words.");
  return { match: validatedMatch, normalized, terms: [...new Set(words)] };
}

export function verseMatchesSearch(text: string, query: PreparedBibleSearchQuery): boolean {
  const candidate = text.toLocaleLowerCase();
  return query.terms.length > 0 && (query.match === "phrase"
    ? candidate.includes(query.terms[0])
    : query.terms.every(term => candidate.includes(term)));
}

/** Resolves UI search scopes to canonical books; caller-supplied book paths are never accepted. */
export function booksForSearchScope(scope: BibleSearchScope, currentBook: BookInfo): readonly BookInfo[] {
  switch (scope) {
    case "all": return BOOKS;
    case "old-testament": return BOOKS.slice(0, NEW_TESTAMENT_INDEX);
    case "new-testament": return BOOKS.slice(NEW_TESTAMENT_INDEX);
    case "current-chapter":
    case "current-book": {
      const canonical = BOOK_BY_OSIS.get(currentBook.osis);
      if (!canonical) throw new Error("Current book is outside the supported 66-book canon.");
      return [canonical];
    }
  }
}

export function currentChapterForSearchScope(scope: BibleSearchScope, chapter?: number): number | undefined {
  if (scope !== "current-chapter") return undefined;
  if (chapter === undefined) throw new Error("Current chapter is required for this search scope.");
  if (!Number.isSafeInteger(chapter) || chapter < 1 || chapter > 200) {
    throw new Error("Current chapter is outside the supported range.");
  }
  return chapter;
}

export function boundedSearchLimit(value = 80): number {
  if (!Number.isFinite(value)) return 80;
  return Math.max(1, Math.min(200, Math.trunc(value)));
}
