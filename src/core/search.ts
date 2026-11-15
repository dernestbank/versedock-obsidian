import { BOOKS, BOOK_BY_OSIS, type BookInfo } from "./books";

export type BibleSearchScope = "all" | "current-book" | "old-testament" | "new-testament";
export const MAX_SEARCH_PHRASE_LENGTH = 200;

export interface BibleSearchRequest {
  phrase: string;
  scope: BibleSearchScope;
  currentBook: BookInfo;
  limit?: number;
  signal?: AbortSignal;
}

const NEW_TESTAMENT_INDEX = BOOKS.findIndex(book => book.osis === "Matt");

export function parseBibleSearchScope(value: string): BibleSearchScope {
  switch (value) {
    case "all":
    case "current-book":
    case "old-testament":
    case "new-testament":
      return value;
    default:
      throw new Error("Unsupported Bible search scope.");
  }
}

/** Resolves UI search scopes to canonical books; caller-supplied book paths are never accepted. */
export function booksForSearchScope(scope: BibleSearchScope, currentBook: BookInfo): readonly BookInfo[] {
  switch (scope) {
    case "all": return BOOKS;
    case "old-testament": return BOOKS.slice(0, NEW_TESTAMENT_INDEX);
    case "new-testament": return BOOKS.slice(NEW_TESTAMENT_INDEX);
    case "current-book": {
      const canonical = BOOK_BY_OSIS.get(currentBook.osis);
      if (!canonical) throw new Error("Current book is outside the supported 66-book canon.");
      return [canonical];
    }
  }
}

export function boundedSearchLimit(value = 80): number {
  if (!Number.isFinite(value)) return 80;
  return Math.max(1, Math.min(200, Math.trunc(value)));
}
