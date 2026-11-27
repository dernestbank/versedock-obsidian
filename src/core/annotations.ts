import { parseOsis, type PassageReference } from "./references";

export const MARK_COLORS = ["amber", "green", "blue", "rose"] as const;
export interface MarkPart {
  ref: string;
  start: number;
  quote: string;
}
export interface ReaderAnnotation {
  id: string;
  edition: string;
  resource?: {key: string; label: string};
  parts: MarkPart[];
  color: typeof MARK_COLORS[number];
  style: "highlight" | "underline";
  note: string;
}

export function annotationReference(mark: Pick<ReaderAnnotation, "parts">): PassageReference {
  const first = parseOsis(mark.parts[0].ref);
  if (mark.parts.length > 1) first.endVerse = parseOsis(mark.parts[mark.parts.length - 1].ref).verse;
  return first;
}

function validMark(value: unknown): value is ReaderAnnotation {
  if (!value || typeof value !== "object") return false;
  const mark = value as ReaderAnnotation;
  if (typeof mark.id !== "string" || !mark.id || typeof mark.edition !== "string" || !mark.edition ||
      !MARK_COLORS.includes(mark.color) || !["highlight", "underline"].includes(mark.style) ||
      typeof mark.note !== "string" || !Array.isArray(mark.parts) || !mark.parts.length) return false;
  if (mark.resource !== undefined) {
    const target = mark.resource;
    return !!target && typeof target.key === "string" && !!target.key && typeof target.label === "string" && !!target.label &&
      mark.parts.every(part => part && /^block-\d+$/.test(part.ref) && Number.isSafeInteger(part.start) &&
        part.start >= 0 && typeof part.quote === "string" && !!part.quote.trim());
  }
  try {
    const first = parseOsis(mark.parts[0].ref);
    let previous = 0;
    return mark.parts.every(part => {
      const ref = parseOsis(part.ref);
      if (!ref.verse || ref.endVerse || ref.book !== first.book || ref.chapter !== first.chapter || ref.verse <= previous) return false;
      previous = ref.verse;
      return Number.isSafeInteger(part.start) && part.start >= 0 && typeof part.quote === "string" && !!part.quote.trim();
    });
  } catch { return false; }
}

export function restoreAnnotations(value: unknown): ReaderAnnotation[] {
  return Array.isArray(value) ? value.filter(validMark) : [];
}

// Retain the original quote for review when an imported edition changes its wording.
export function marksForVerse(marks: readonly ReaderAnnotation[], edition: string, ref: string, text: string) {
  return marks.flatMap(mark => {
    if (mark.edition !== edition) return [];
    const part = mark.parts.find(candidate => candidate.ref === ref);
    if (!part || !text.startsWith(part.quote, part.start)) return [];
    return [{ start: part.start, end: part.start + part.quote.length, mark }];
  });
}
