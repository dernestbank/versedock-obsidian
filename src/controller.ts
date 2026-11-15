import type { App } from "obsidian";
import type { PassageReference } from "./core/references";
import type { OfflineBibleLibrary } from "./core/library";
import type { ScriptureNoteDiscovery } from "./core/scripture-notes";

export interface SwordDockSettings {
  reference: string;
  fontSize: number;
  lineHeight: number;
  textWidth: number;
  fontStyle: "serif" | "sans" | "obsidian";
  mode: "classic" | "compact" | "focus";
  bookmarks: string[];
  highlights: string[];
  /** Canonical OSIS references, most recent first. */
  history: string[];
}
export const DEFAULT_SETTINGS: SwordDockSettings = {
  reference: "John.3.16", fontSize: 17, lineHeight: 1.68,
  textWidth: 65, fontStyle: "serif", mode: "classic",
  bookmarks: [], highlights: [], history: []
};
export interface SwordDockController {
  app: App;
  library: OfflineBibleLibrary;
  settings: SwordDockSettings;
  currentRef: PassageReference;
  selectReference(ref: PassageReference): void;
  subscribe(callback: (ref: PassageReference) => void): () => void;
  saveSettings(): Promise<void>;
  openReader(): Promise<void>;
  openInspector(): Promise<void>;
  openSearch(): Promise<void>;
  openReferenceModal(mode: "jump" | "insert"): void;
  openMySwordInspector(): void;
  findScriptureNotes(ref: PassageReference): ScriptureNoteDiscovery;
  openStudyNote(ref: PassageReference): Promise<void>;
  openLinkedNote(path: string): Promise<void>;
  copyPassage(ref: PassageReference): Promise<void>;
  toggleBookmark(ref: PassageReference): void;
  toggleHighlight(ref: PassageReference): void;
}
