import { type BookInfo, findBookPrefix, BOOK_BY_OSIS } from "./books";

export interface PassageReference {
  book: BookInfo;
  chapter: number;
  verse?: number;
  endVerse?: number;
}
export class ReferenceError extends Error {
  constructor(message: string) { super(message); this.name = "ReferenceError"; }
}
export function parseReference(input: string): PassageReference {
  const result = findBookPrefix(input.trim());
  if (!result) throw new ReferenceError("Enter a reference such as John 3:16 or Ps 23.");
  const tail = result.remaining.trim();
  // Supported: 3, 3:16, 3 16, 3:16-18, 3.16, including aliases such as 1co.
  const match = /^(\d+)(?:[:.\s]+(\d+)(?:\s*-\s*(\d+))?)?$/.exec(tail);
  if (!match) throw new ReferenceError("Use a book, chapter and optional verse (for example John 3:16-18).");
  const chapter = Number(match[1]);
  const verse = match[2] ? Number(match[2]) : undefined;
  const endVerse = match[3] ? Number(match[3]) : undefined;
  if (!Number.isSafeInteger(chapter) || chapter < 1 || chapter > 200) {
    throw new ReferenceError("Chapter number is out of range.");
  }
  if (verse !== undefined && (!Number.isSafeInteger(verse) || verse < 1 || verse > 200)) {
    throw new ReferenceError("Verse number is out of range.");
  }
  if (endVerse !== undefined && (endVerse < verse! || endVerse > 200 || endVerse - verse! > 100)) {
    throw new ReferenceError("Verse range must be ascending and contain at most 101 verses.");
  }
  return { book: result.book, chapter, verse, endVerse };
}
export function refLabel(ref: PassageReference): string {
  let label = ref.book.name + " " + ref.chapter;
  if (ref.verse !== undefined) label += ":" + ref.verse;
  if (ref.endVerse !== undefined) label += "-" + ref.endVerse;
  return label;
}
export function osisId(ref: PassageReference): string {
  let id = ref.book.osis + "." + ref.chapter;
  if (ref.verse !== undefined) id += "." + ref.verse;
  return id;
}
export function parseOsis(input: string): PassageReference {
  const match = /^([1-3]?[A-Za-z]+)\.(\d+)(?:\.(\d+))?$/.exec(input);
  if (!match) throw new ReferenceError("Invalid OSIS reference.");
  const book = BOOK_BY_OSIS.get(match[1]);
  if (!book) throw new ReferenceError("Unsupported OSIS book.");
  return parseReference(book.name + " " + match[2] + (match[3] ? ":" + match[3] : ""));
}
