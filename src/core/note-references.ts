import { BOOKS } from "./books";
import { parseReference, type PassageReference } from "./references";

export interface StudyPreviews { readingPreviews: boolean; livePreviews: boolean }
export function restoredStudyPreviews(raw: Partial<Record<keyof StudyPreviews, unknown>> | null): StudyPreviews {
  return { readingPreviews: raw?.readingPreviews !== false, livePreviews: raw?.livePreviews !== false };
}

const aliases = [...new Set(BOOKS.flatMap(book => book.aliases))]
  .sort((a, b) => b.length - a.length)
  .map(name => name.replace(/^([1-3]) */, "$1[ \\t]*").replace(/ (?=[A-Za-z])/g, "[ \\t]+"));
const pattern = new RegExp("(?<![\\p{L}\\p{N}_/])(" + aliases.join("|") + ")\\.?[ \\t]+\\d{1,3}:\\d{1,3}(?:[ \\t]*[-–—][ \\t]*\\d{1,3})?(?![\\p{L}\\p{N}_:]|[ \\t]*[-–—][ \\t]*\\d)", "giu");

export interface NoteReference { from: number; to: number; ref: PassageReference }
export function findNoteReferences(text: string): NoteReference[] {
  const matches: NoteReference[] = [];
  for (const match of text.matchAll(pattern)) {
    // Lowercase abbreviations that are also ordinary words often precede clock times.
    if (["is", "am", "re", "ex"].includes(match[1])) continue;
    try {
      matches.push({ from: match.index!, to: match.index! + match[0].length, ref: parseReference(match[0]) });
    } catch { /* A malformed reference remains ordinary note text. */ }
  }
  return matches;
}
