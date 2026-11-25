import { parseOsis, parseReference, refLabel, referenceId, type PassageReference } from "./references";

export const MAX_SCRIPTURE_NOTE_SCAN = 5_000;
export const MAX_SCRIPTURE_NOTE_RESULTS = 50;
export const MAX_SCRIPTURE_NOTE_REFERENCES = 16;
const MAX_SCRIPTURE_NOTE_REFERENCE_LENGTH = 64;
const DEFAULT_STUDY_NOTE_FOLDER = "Bible Study";

/** Keeps the user-configured note destination inside the vault and fails closed on unsafe segments. */
export function normalizeStudyNoteFolder(input: unknown): string {
  if (typeof input !== "string") return DEFAULT_STUDY_NOTE_FOLDER;
  const segments = input.trim().replace(/\\/g, "/").split("/").map(segment => segment.trim());
  if (!segments.length || segments.some(segment => !segment || segment === "." || segment === ".." || /[\\:*?"<>|\[\]]/.test(segment)))
    return DEFAULT_STUDY_NOTE_FOLDER;
  return segments.join("/");
}

export interface IndexedScriptureNote {
  path: string;
  basename: string;
  scripture: unknown;
  modified: number;
  primary?: boolean;
  linkedToPrimary?: boolean;
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
  return referenceId(reference);
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
    if (entry.primary || entry.linkedToPrimary || linksToReference(entry.scripture, target)) matches.push(entry);
  }
  matches.sort((left, right) => Number(Boolean(right.primary)) - Number(Boolean(left.primary)) ||
    right.modified - left.modified || (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  return {
    notes: matches.slice(0, MAX_SCRIPTURE_NOTE_RESULTS),
    examined,
    scanTruncated: entries.length > examined,
    resultsTruncated: matches.length > MAX_SCRIPTURE_NOTE_RESULTS
  };
}

function studyNotePathBase(reference: PassageReference, includeEnd: boolean, folder: string): string {
  const book = reference.book.name.replace(/[\/:*?"<>|]/g, "");
  return normalizeStudyNoteFolder(folder) + "/" + book + "/" + book + " " + reference.chapter +
    (reference.verse ? "-" + reference.verse : "") +
    (includeEnd && reference.endVerse ? "-" + reference.endVerse : "") + ".md";
}

/** Preferred path; ranges include both endpoints so they cannot collide with a single verse. */
export function studyNotePath(reference: PassageReference, folder = DEFAULT_STUDY_NOTE_FOLDER): string {
  return studyNotePathBase(reference, true, folder);
}

/** Start-only path used by previews through 0.1.11; retained for legacy range-note recovery. */
export function legacyStudyNotePath(reference: PassageReference, folder = DEFAULT_STUDY_NOTE_FOLDER): string {
  return studyNotePathBase(reference, false, folder);
}

export function newStudyNoteMarkdown(reference: PassageReference, edition: string = "WEB"): string {
  return [
    "---",
    "type: scripture-study",
    'scripture: "' + scriptureNoteReferenceId(reference) + '"',
    'translation: ' + JSON.stringify(edition),
    "---", "",
    "# " + refLabel(reference), "",
    "## Observations", "", "## Questions", "", "## Reflections", ""
  ].join("\n");
}
