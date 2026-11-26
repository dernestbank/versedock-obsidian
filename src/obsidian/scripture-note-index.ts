import type { App, TFile } from "obsidian";
import { osisId, refLabel, type PassageReference } from "../core/references";
import {
  MAX_SCRIPTURE_NOTE_SCAN,
  discoverScriptureNotes,
  legacyStudyNotePath,
  normalizeStudyNoteFolder,
  parseScriptureNoteReference,
  scriptureNoteReferenceId,
  studyNotePath,
  type IndexedScriptureNote,
  type ScriptureNoteDiscovery
} from "../core/scripture-notes";

function indexedNote(
  app: App,
  file: TFile,
  options: {scriptureOverride?: string; primary?: boolean; linkedToPrimary?: boolean} = {}
): IndexedScriptureNote {
  return {
    path: file.path,
    basename: file.basename,
    scripture: options.scriptureOverride ?? app.metadataCache.getFileCache(file)?.frontmatter?.scripture,
    modified: file.stat.mtime,
    ...(options.primary ? {primary: true} : {}),
    ...(options.linkedToPrimary ? {linkedToPrimary: true} : {})
  };
}

function hasResolvedBacklink(app: App, file: TFile, primaryPath?: string): boolean {
  if (!primaryPath) return false;
  const sources = app.metadataCache.resolvedLinks;
  if (!sources || !Object.prototype.hasOwnProperty.call(sources, file.path)) return false;
  const destinations = sources[file.path];
  if (!destinations || !Object.prototype.hasOwnProperty.call(destinations, primaryPath)) return false;
  const count = destinations[primaryPath];
  return Number.isSafeInteger(count) && count > 0;
}

function isRecognizedLegacyRange(app: App, file: TFile, reference: PassageReference): boolean {
  if (reference.endVerse === undefined) return false;
  const cache = app.metadataCache.getFileCache(file);
  const scripture = cache?.frontmatter?.scripture;
  if (typeof scripture === "string") {
    try {
      if (scriptureNoteReferenceId(parseScriptureNoteReference(scripture)) === scriptureNoteReferenceId(reference)) return true;
    } catch { /* Fall through to the exact legacy-generated signature. */ }
  }
  return cache?.frontmatter?.type === "scripture-study" && scripture === osisId(reference) &&
    cache?.headings?.some(heading => heading.level === 1 && heading.heading === refLabel(reference)) === true;
}

export interface StudyNoteTarget {
  path: string;
  file: TFile | null;
}

/** Chooses a non-colliding range path while recovering only positively identified legacy range notes. */
export function resolveStudyNoteTarget(app: App, reference: PassageReference, folder = "Bible Study"): StudyNoteTarget {
  const normalizedFolder = normalizeStudyNoteFolder(folder);
  const preferredPath = studyNotePath(reference, normalizedFolder);
  const preferred = app.vault.getFileByPath(preferredPath);
  if (preferred) return {path: preferredPath, file: preferred};
  if (reference.endVerse !== undefined) {
    const legacyPath = legacyStudyNotePath(reference, normalizedFolder);
    const legacy = app.vault.getFileByPath(legacyPath);
    if (legacy && isRecognizedLegacyRange(app, legacy, reference)) return {path: legacyPath, file: legacy};
  }
  return {path: preferredPath, file: null};
}

/** Uses Obsidian's existing metadata index; no Markdown file content is read. */
export function discoverVaultScriptureNotes(app: App, reference: PassageReference, folder = "Bible Study"): ScriptureNoteDiscovery {
  const files = app.vault.getMarkdownFiles();
  const normalizedFolder = normalizeStudyNoteFolder(folder);
  const primaryTarget = resolveStudyNoteTarget(app, reference, normalizedFolder);
  const primary = primaryTarget.file;
  const selected: TFile[] = [];
  if (primary) selected.push(primary);
  for (const file of files) {
    if (selected.length >= MAX_SCRIPTURE_NOTE_SCAN) break;
    if (file.path !== primary?.path) selected.push(file);
  }
  const legacyRange = reference.endVerse !== undefined && primary?.path === legacyStudyNotePath(reference, normalizedFolder);
  const discovery = discoverScriptureNotes(selected.map(file => {
    const isPrimary = file.path === primary?.path;
    return indexedNote(app, file, {
      scriptureOverride: legacyRange && isPrimary ? scriptureNoteReferenceId(reference) : undefined,
      primary: isPrimary,
      linkedToPrimary: !isPrimary && hasResolvedBacklink(app, file, primary?.path)
    });
  }), reference);
  return {...discovery, scanTruncated: files.length > selected.length};
}
