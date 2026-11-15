import { osisId, parseOsis, parseReference, refLabel, type PassageReference } from "./references";

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
    try { return scriptureNoteReferenceId(parseScriptureNoteReference(candidate)) === target; }
    catch { return false; }
  });
}

export function scriptureNoteReferenceId(reference: PassageReference): string {
  const start = osisId(reference);
  return reference.endVerse === undefined ? start : start + "-" + reference.endVerse;
}

export function parseScriptureNoteReference(input: string): PassageReference {
  const range = /^([1-3]?[A-Za-z]+\.\d+\.\d+)-(\d+)$/.exec(input);
  if (!range) return parseOsis(input);
  const start = parseOsis(range[1]);
  return parseReference(start.book.name + " " + start.chapter + ":" + start.verse + "-" + range[2]);
}

export function discoverScriptureNotes(
  entries: readonly IndexedScriptureNote[],
  reference: PassageReference
): ScriptureNoteDiscovery {
  const examined = Math.min(entries.length, MAX_SCRIPTURE_NOTE_SCAN);
  const target = scriptureNoteReferenceId(reference);
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

function studyNotePathBase(reference: PassageReference, includeEnd: boolean): string {
  const book = reference.book.name.replace(/[\/:*?"<>|]/g, "");
  return "Bible Study/" + book + "/" + book + " " + reference.chapter +
    (reference.verse ? "-" + reference.verse : "") +
    (includeEnd && reference.endVerse ? "-" + reference.endVerse : "") + ".md";
}

/** Preferred path; ranges include both endpoints so they cannot collide with a single verse. */
export function studyNotePath(reference: PassageReference): string {
  return studyNotePathBase(reference, true);
}

/** Start-only path used by previews through 0.1.11; retained for legacy range-note recovery. */
export function legacyStudyNotePath(reference: PassageReference): string {
  return studyNotePathBase(reference, false);
}

export function newStudyNoteMarkdown(reference: PassageReference): string {
  return [
    "---",
    "type: scripture-study",
    'scripture: "' + scriptureNoteReferenceId(reference) + '"',
    'translation: "WEB"',
    "---", "",
    "# " + refLabel(reference), "",
    "## Observations", "", "## Questions", "", "## Reflections", ""
  ].join("\n");
}
