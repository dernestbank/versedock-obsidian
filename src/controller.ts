import type { ReaderAnnotation } from "./core/annotations";
import type { App } from "obsidian";
import type { ReadingInstallService } from "./core/reading-install-service";
import type { PassageReference } from "./core/references";
import type { BibleResource, OfflineBibleLibrary, WordToken } from "./core/library";
import type { StrongsLexicon } from "./core/lexicon";
import type { InterlinearLibrary } from "./core/interlinear";
import { restoredInterlinearPreferences, type InterlinearPreferences } from "./core/interlinear-preferences";
import type { WordSelection } from "./core/word-study";
import type { FocusDockState } from "./obsidian/focus-workspace";
import type { KjvDisplayMode } from "./core/kjv-display";
import type { ScriptureNotePreview } from "./core/note-preview";
import type { CrossReferenceLibrary } from "./core/cross-references";
import type { CommentaryLibrary } from "./core/commentary";
import type { ScriptureNoteDiscovery } from "./core/scripture-notes";
import type {
  StudyLinkCause,
  StudyLinkEvent,
  StudyLinkGroup,
  StudyLinkMode,
  StudyLinkOrigin,
  StudyLinkAssignment,
} from "./core/link-groups";

export interface SwordDockSettings {
  bibleEdition: string;
  kjvDisplayMode: KjvDisplayMode;
  kjvInlineStrongs: boolean;
  interlinear: InterlinearPreferences;
  reference: string;
  fontSize: number;
  lineHeight: number;
  textWidth: number;
  fontStyle: "serif" | "sans" | "obsidian";
  mode: "classic" | "compact" | "focus";
  focusReturnMode: "classic" | "compact";
  focusDockState: FocusDockState | null;
  studyNoteFolder: string;
  bookmarks: string[];
  highlights: string[];
  annotations: ReaderAnnotation[];
  /** Canonical OSIS references, most recent first. */
  history: string[];
  studyLinks: {
    reader: StudyLinkAssignment;
    comparison: StudyLinkAssignment;
  };
}
export const DEFAULT_SETTINGS: SwordDockSettings = {
  bibleEdition: "webp", kjvDisplayMode: "word-study", kjvInlineStrongs: false,
  interlinear: restoredInterlinearPreferences(null),
  reference: "John.3.16", fontSize: 17, lineHeight: 1.68,
  textWidth: 65, fontStyle: "serif", mode: "classic", focusReturnMode: "classic",
  focusDockState: null,
  studyNoteFolder: "Bible Study",
  bookmarks: [], highlights: [], annotations: [], history: [],
  studyLinks: {
    reader: { group: "unlinked", mode: "follow" },
    comparison: { group: "unlinked", mode: "follow" }
  }
};
export type InspectorTarget =
  | "study"
  | "parallel"
  | "highlights"
  | "commentary"
  | "lexicon"
  | "references"
  | "notes"
  | "resource-info"
  | "bookmarks"
  | "history";
export interface SwordDockController {
  modules: ReadingInstallService;
  app: App;
  library: OfflineBibleLibrary;
  kjv: OfflineBibleLibrary;
  readerBible: BibleResource;
  lexicon: StrongsLexicon;
  interlinear: InterlinearLibrary;
  selectedWord: WordSelection | null;
  setBibleEdition(edition: string): Promise<void>;
  availableBibleEditions(): Array<{id:string;title:string;ready:boolean}>;
  getBibleResource(edition:string): Promise<BibleResource|null>;
  setKjvDisplayMode(mode: KjvDisplayMode): Promise<void>;
  setKjvInlineStrongs(enabled: boolean): Promise<void>;
  selectWord(ref: PassageReference, token: WordToken, index: number): void;
  clearSelectedWord(): void;
  crossReferences: CrossReferenceLibrary;
  commentary: CommentaryLibrary;
  settings: SwordDockSettings;
  currentRef: PassageReference;
  selectReference(ref: PassageReference, origin?: StudyLinkOrigin, cause?: StudyLinkCause): void;
  canNavigateBack(): boolean;
  canNavigateForward(): boolean;
  navigateBack(): void;
  navigateForward(): void;
  subscribe(callback: (ref: PassageReference) => void): () => void;
  getStudyLinkAssignment(surface: "reader" | "comparison"): StudyLinkAssignment;
  setStudyLinkAssignment(surface: "reader" | "comparison", assignment: StudyLinkAssignment): void;
  subscribeStudyLinks(callback: (event: StudyLinkEvent) => void): () => void;
  saveSettings(): Promise<void>;
  setReaderMode(mode: SwordDockSettings["mode"] | "toggle-focus"): Promise<void>;
  openReader(): Promise<void>;
  openStudyDesk(): Promise<void>;
  openNavigation(): Promise<void>;
  openWorkspaceSettings(): void;
  openWorkspaceHelp(): void;
  openInspector(tab?: InspectorTarget): Promise<void>;
  openResources(moduleId?: string): Promise<void>;
  openSearch(): Promise<void>;
  openLibrary(): Promise<void>;
  openComparison(): Promise<void>;
  openResourceDetails(edition?: string): void;
  openStorageManagement(): void;
  openReferenceModal(mode: "jump" | "insert"): void;
  openMySwordInspector(): void;
  findScriptureNotes(ref: PassageReference): ScriptureNoteDiscovery;
  getScriptureNotePreview(path: string): Promise<ScriptureNotePreview>;
  openStudyNote(ref: PassageReference): Promise<void>;
  openLinkedNote(path: string): Promise<void>;
  copyPassage(ref: PassageReference): Promise<void>;
  toggleBookmark(ref: PassageReference): void;
  changeAnnotation(previous: ReaderAnnotation | null, replacement: ReaderAnnotation | null): Promise<void>;
  toggleHighlight(ref: PassageReference): void;
}

export type { StudyLinkAssignment } from "./core/link-groups";
