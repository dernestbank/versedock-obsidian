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
  const match = /^(\d+)(?:[:.\s]+(\d+)(?:\s*[-–—]\s*(\d+))?)?$/.exec(tail);
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
  if (endVerse !== undefined && (endVerse < verse! || endVerse > 200)) {
    throw new ReferenceError("Verse range must be ascending and stay within verses 1–200.");
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

/** Returns the persisted identifier, retaining a same-chapter verse range. */
export function referenceId(ref: PassageReference): string {
  return osisId(ref) + (ref.endVerse === undefined ? "" : "-" + ref.endVerse);
}

/** True when a verse is inside the selected reference's same-chapter range. */
export function referenceContainsVerse(ref: PassageReference, verse: number): boolean {
  if (ref.verse === undefined) return false;
  return verse >= ref.verse && verse <= (ref.endVerse ?? ref.verse);
}

/** Extends a same-chapter Reader selection from its starting verse. */
export function extendReferenceToVerse(ref: PassageReference, verse: number): PassageReference {
  if (ref.verse === undefined) return { book: ref.book, chapter: ref.chapter, verse };
  const start = Math.min(ref.verse, verse);
  const end = Math.max(ref.verse, verse);
  return end === start
    ? { book: ref.book, chapter: ref.chapter, verse: start }
    : { book: ref.book, chapter: ref.chapter, verse: start, endVerse: end };
}

/** Extends an existing Reader range at the requested keyboard edge. */
export function extendReferenceInDirection(ref: PassageReference, verse: number, direction: "forward" | "backward"): PassageReference {
  if (ref.verse === undefined) return { book: ref.book, chapter: ref.chapter, verse };
  const currentEnd = ref.endVerse ?? ref.verse;
  const start = direction === "backward" ? Math.min(ref.verse, verse) : ref.verse;
  const end = direction === "forward" ? Math.max(currentEnd, verse) : currentEnd;
  return start === end
    ? { book: ref.book, chapter: ref.chapter, verse: start }
    : { book: ref.book, chapter: ref.chapter, verse: start, endVerse: end };
}

/** Checks a persisted bookmark/highlight list without treating malformed entries as fatal. */
export function storedReferencesContainVerse(ids: readonly string[], target: PassageReference): boolean {
  if (target.verse === undefined) return false;
  return ids.some(id => {
    try {
      const stored = parseOsis(id);
      return stored.book.osis === target.book.osis && stored.chapter === target.chapter && referenceContainsVerse(stored, target.verse!);
    } catch {
      return false;
    }
  });
}
export function parseOsis(input: string): PassageReference {
  const match = /^([1-3]?[A-Za-z]+)\.(\d+)(?:\.(\d+)(?:-(\d+))?)?$/.exec(input);
  if (!match) throw new ReferenceError("Invalid OSIS reference.");
  const book = BOOK_BY_OSIS.get(match[1]);
  if (!book) throw new ReferenceError("Unsupported OSIS book.");
  return parseReference(book.name + " " + match[2] + (match[3] ? ":" + match[3] + (match[4] ? "-" + match[4] : "") : ""));
}

export function passageIsHighlighted(ids: readonly string[], ref: PassageReference): boolean {
  if (ref.verse === undefined) return false;
  for (let verse = ref.verse; verse <= (ref.endVerse ?? ref.verse); verse++) {
    if (!storedReferencesContainVerse(ids, { ...ref, verse })) return false;
  }
  return true;
}

export function togglePassageHighlight(ids: string[], ref: PassageReference): string[] {
  if (ref.verse === undefined) return ids;
  if (!passageIsHighlighted(ids, ref)) return [...ids, referenceId(ref)];
  const from = ref.verse, to = ref.endVerse ?? from;
  const slice = (verse: number, end: number) => referenceId({...ref, verse, endVerse: end > verse ? end : undefined});
  return ids.flatMap(id => {
    let saved;
    try { saved = parseOsis(id); } catch { return [id]; }
    const first = saved.verse, last = saved.endVerse ?? first;
    if (saved.book !== ref.book || saved.chapter !== ref.chapter || first === undefined || last === undefined ||
        first > to || last < from) return [id];
    const remaining = [];
    if (first < from) remaining.push(slice(first, from - 1));
    if (last > to) remaining.push(slice(to + 1, last));
    return remaining;
  });
}
