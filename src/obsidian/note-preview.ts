import type { App } from "obsidian";
import { MAX_NOTE_PREVIEW_BYTES, notePreviewText, type ScriptureNotePreview } from "../core/note-preview";

/** Read one displayed note after metadata discovery; never crawl note bodies for links. */
export async function readScriptureNotePreview(app: App, path: string): Promise<ScriptureNotePreview> {
  const fallback: ScriptureNotePreview = { state: "missing", title: "Linked note", text: "", modified: null };
  try {
    const file = app.vault.getFileByPath(path);
    if (!file || file.extension !== "md") return fallback;
    const heading = app.metadataCache.getFileCache(file)?.headings?.find(entry => entry.level === 1)?.heading;
    const base = { title: (heading?.trim() || file.basename).slice(0, 200), text: "",
      modified: Number.isFinite(file.stat.mtime) && file.stat.mtime > 0 ? file.stat.mtime : null };
    if (!Number.isSafeInteger(file.stat.size) || file.stat.size < 0 || file.stat.size > MAX_NOTE_PREVIEW_BYTES)
      return { ...base, state: "too-large" };
    const raw = await app.vault.cachedRead(file);
    if (raw.length > MAX_NOTE_PREVIEW_BYTES) return { ...base, state: "too-large" };
    const text = notePreviewText(raw);
    return { ...base, state: text ? "ready" : "empty", text };
  } catch { return { ...fallback, state: "unavailable" }; }
}
