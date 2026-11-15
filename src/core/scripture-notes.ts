import { osisId, parseOsis, type PassageReference } from "./references";

export const MAX_SCRIPTURE_NOTE_SCAN = 5_000;
export const MAX_SCRIPTURE_NOTE_RESULTS = 50;
export const MAX_SCRIPTURE_NOTE_REFERENCES = 16;
const MAX_SCRIPTURE_NOTE_REFERENCE_LENGTH = 64;

export interface IndexedScriptureNote {
  path: string;
  basename: string;
  scripture: unknown;
  modified: number;
}

export interface ScriptureNoteDiscovery {
  notes: readonly IndexedScriptureNote[];
  examined: number;
  scanTruncated: boolean;
  resultsTruncated: boolean;
}

function frontmatterReferences(value: unknown): readonly string[] {
  if (typeof value === "string") return value.length <= MAX_SCRIPTURE_NOTE_REFERENCE_LENGTH ? [value] : [];
  if (!Array.isArray(value) || value.length > MAX_SCRIPTURE_NOTE_REFERENCES) return [];
  if (!value.every(item => typeof item === "string" && item.length <= MAX_SCRIPTURE_NOTE_REFERENCE_LENGTH)) return [];
  return value;
}

function linksToReference(value: unknown, target: string): boolean {
  return frontmatterReferences(value).some(candidate => {
    try { return osisId(parseOsis(candidate)) === target; }
    catch { return false; }
  });
}

export function discoverScriptureNotes(
  entries: readonly IndexedScriptureNote[],
  reference: PassageReference
): ScriptureNoteDiscovery {
  const examined = Math.min(entries.length, MAX_SCRIPTURE_NOTE_SCAN);
  const target = osisId(reference);
  const matches: IndexedScriptureNote[] = [];
  for (let index = 0; index < examined; index++) {
    const entry = entries[index];
    if (linksToReference(entry.scripture, target)) matches.push(entry);
  }
  matches.sort((left, right) => right.modified - left.modified || (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  return {
    notes: matches.slice(0, MAX_SCRIPTURE_NOTE_RESULTS),
    examined,
    scanTruncated: entries.length > examined,
    resultsTruncated: matches.length > MAX_SCRIPTURE_NOTE_RESULTS
  };
}

/** Stable path used by every released SwordDock/VerseDock preview. */
export function studyNotePath(reference: PassageReference): string {
  const book = reference.book.name.replace(/[\/:*?"<>|]/g, "");
  return "Bible Study/" + book + "/" + book + " " + reference.chapter +
    (reference.verse ? "-" + reference.verse : "") + ".md";
}
