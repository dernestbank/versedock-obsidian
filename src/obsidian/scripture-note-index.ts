import type { App, TFile } from "obsidian";
import { osisId, refLabel, type PassageReference } from "../core/references";
import {
  MAX_SCRIPTURE_NOTE_SCAN,
  discoverScriptureNotes,
  legacyStudyNotePath,
  parseScriptureNoteReference,
  scriptureNoteReferenceId,
  studyNotePath,
  type IndexedScriptureNote,
  type ScriptureNoteDiscovery
} from "../core/scripture-notes";

function indexedNote(app: App, file: TFile, scriptureOverride?: string): IndexedScriptureNote {
  return {
    path: file.path,
    basename: file.basename,
    scripture: scriptureOverride ?? app.metadataCache.getFileCache(file)?.frontmatter?.scripture,
    modified: file.stat.mtime
  };
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
export function resolveStudyNoteTarget(app: App, reference: PassageReference): StudyNoteTarget {
  const preferredPath = studyNotePath(reference);
  const preferred = app.vault.getFileByPath(preferredPath);
  if (preferred) return {path: preferredPath, file: preferred};
  if (reference.endVerse !== undefined) {
    const legacyPath = legacyStudyNotePath(reference);
    const legacy = app.vault.getFileByPath(legacyPath);
    if (legacy && isRecognizedLegacyRange(app, legacy, reference)) return {path: legacyPath, file: legacy};
  }
  return {path: preferredPath, file: null};
}

/** Uses Obsidian's existing metadata index; no Markdown file content is read. */
export function discoverVaultScriptureNotes(app: App, reference: PassageReference): ScriptureNoteDiscovery {
  const files = app.vault.getMarkdownFiles();
  const primaryTarget = resolveStudyNoteTarget(app, reference);
  const primary = primaryTarget.file;
  const selected: TFile[] = [];
  if (primary) selected.push(primary);
  for (const file of files) {
    if (selected.length >= MAX_SCRIPTURE_NOTE_SCAN) break;
    if (file.path !== primary?.path) selected.push(file);
  }
  const legacyRange = reference.endVerse !== undefined && primary?.path === legacyStudyNotePath(reference);
  const discovery = discoverScriptureNotes(selected.map(file => indexedNote(
    app,
    file,
    legacyRange && file.path === primary?.path ? scriptureNoteReferenceId(reference) : undefined
  )), reference);
  return {...discovery, scanTruncated: files.length > selected.length};
}
