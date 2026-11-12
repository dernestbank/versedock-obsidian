import type { App } from "obsidian";
import type { PassageReference } from "./core/references";
import type { OfflineBibleLibrary } from "./core/library";

export interface MySwordSettings {
  reference: string;
  fontSize: number;
  lineHeight: number;
  textWidth: number;
  fontStyle: "serif" | "sans" | "obsidian";
  mode: "classic" | "compact" | "focus";
  bookmarks: string[];
  highlights: string[];
}
export const DEFAULT_SETTINGS: MySwordSettings = {
  reference: "John.3.16", fontSize: 17, lineHeight: 1.68,
  textWidth: 65, fontStyle: "serif", mode: "classic",
  bookmarks: [], highlights: []
};
export interface MySwordController {
  app: App;
  library: OfflineBibleLibrary;
  settings: MySwordSettings;
  currentRef: PassageReference;
  selectReference(ref: PassageReference): void;
  subscribe(callback: (ref: PassageReference) => void): () => void;
  saveSettings(): Promise<void>;
  openReader(): Promise<void>;
  openInspector(): Promise<void>;
  openSearch(): Promise<void>;
  openReferenceModal(mode: "jump" | "insert"): void;
  openStudyNote(ref: PassageReference): Promise<void>;
  copyPassage(ref: PassageReference): Promise<void>;
  toggleBookmark(ref: PassageReference): void;
  toggleHighlight(ref: PassageReference): void;
}
