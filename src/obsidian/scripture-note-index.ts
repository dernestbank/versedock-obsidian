import type { App, TFile } from "obsidian";
import type { PassageReference } from "../core/references";
import {
  MAX_SCRIPTURE_NOTE_SCAN,
  discoverScriptureNotes,
  studyNotePath,
  type IndexedScriptureNote,
  type ScriptureNoteDiscovery
} from "../core/scripture-notes";

function indexedNote(app: App, file: TFile): IndexedScriptureNote {
  return {
    path: file.path,
    basename: file.basename,
    scripture: app.metadataCache.getFileCache(file)?.frontmatter?.scripture,
    modified: file.stat.mtime
  };
}

/** Uses Obsidian's existing metadata index; no Markdown file content is read. */
export function discoverVaultScriptureNotes(app: App, reference: PassageReference): ScriptureNoteDiscovery {
  const files = app.vault.getMarkdownFiles();
  const primaryPath = studyNotePath(reference);
  const primary = app.vault.getFileByPath(primaryPath);
  const selected: TFile[] = [];
  if (primary) selected.push(primary);
  for (const file of files) {
    if (selected.length >= MAX_SCRIPTURE_NOTE_SCAN) break;
    if (file.path !== primary?.path) selected.push(file);
  }
  const discovery = discoverScriptureNotes(selected.map(file => indexedNote(app, file)), reference);
  return {...discovery, scanTruncated: files.length > selected.length};
}
