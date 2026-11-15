import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { SwordDockController } from "../controller";
import { refLabel, parseOsis } from "../core/references";
import { emptyState, iconButton, textButton } from "./components";

export const INSPECTOR_VIEW = "versedock-inspector";
type InspectorTab = "commentary" | "lexicon" | "notes" | "references" | "bookmarks" | "history";
export class InspectorView extends ItemView {
  private unsubscribe: (() => void) | null = null;
  private tab: InspectorTab = "commentary";
  constructor(leaf: WorkspaceLeaf, private readonly plugin: SwordDockController) { super(leaf); }
  getViewType(): string { return INSPECTOR_VIEW; }
  getDisplayText(): string { return "SwordDock Bible Study Inspector"; }
  getIcon(): string { return "book-open-check"; }
  async onOpen(): Promise<void> { this.unsubscribe = this.plugin.subscribe(() => this.render()); this.render(); }
  async onClose(): Promise<void> { this.unsubscribe?.(); this.unsubscribe = null; this.contentEl.empty(); }
  private render(): void {
    const root = this.contentEl;
    root.empty(); root.addClass("versedock", "vd-inspector");
    const top = root.createDiv({ cls: "vd-inspector-header" });
    top.createEl("strong", { text: "Study Inspector" });
    top.createSpan({ cls: "vd-pill", text: "Follow · " + refLabel(this.plugin.currentRef) });
    const tabs = root.createDiv({ cls: "vd-inspector-tabs", attr: { role: "tablist", "aria-label": "Study resources" } });
    (["commentary","lexicon","references","notes","bookmarks","history"] as InspectorTab[]).forEach(tab => {
      const label = tab === "references" ? "References" : tab[0].toUpperCase() + tab.slice(1);
      const btn = textButton(tabs, label, () => { this.tab = tab; this.render(); }, this.tab === tab ? "is-active" : "");
      btn.setAttribute("role", "tab"); btn.setAttribute("aria-selected", String(this.tab === tab));
    });
    const body = root.createDiv({ cls: "vd-inspector-body" });
    const ref = this.plugin.currentRef;
    body.createDiv({ cls: "vd-resource-heading", text: refLabel(ref) });
    if (this.tab === "history") {
      body.createEl("h3", { text: "Recent reading" });
      body.createEl("p", { cls: "vd-inspector-help", text:
        "Your fifty most recent passages are stored in this plugin's vault settings. SwordDock does not upload them, and you can clear them here at any time." });
      if (!this.plugin.settings.history.length)
        emptyState(body, "No reading history yet", "Open or select a passage to add it here.", "history");
      for (const id of this.plugin.settings.history) {
        try {
          const recent = parseOsis(id);
          textButton(body, refLabel(recent), () => {
            this.plugin.selectReference(recent);
            void this.plugin.openReader();
          });
        } catch { /* Migration already filters invalid entries; stay fail-safe if settings change live. */ }
      }
      if (this.plugin.settings.history.length) {
        const actions = body.createDiv({ cls: "vd-action-row" });
        textButton(actions, "Clear reading history", () => {
          this.plugin.settings.history = [];
          void this.plugin.saveSettings();
          this.render();
        });
      }
      return;
    }
    if (this.tab === "bookmarks") {
      body.createEl("h3", { text: "Bookmarked passages" });
      if (!this.plugin.settings.bookmarks.length) emptyState(body, "No bookmarks yet", "Select a verse in the reader and choose Bookmark.", "bookmark");
      for (const id of this.plugin.settings.bookmarks) {
        try {
          const bookmark = parseOsis(id);
          textButton(body, refLabel(bookmark), () => { this.plugin.selectReference(bookmark); void this.plugin.openReader(); });
        } catch { /* Skip stale/unrecognized references without crashing. */ }
      }
      return;
    }
    if (this.tab === "notes") {
      body.createEl("h3", { text: "Your Scripture notes" });
      body.createEl("p", { cls: "vd-inspector-help", text: "Each passage gets a normal Markdown file in your vault, complete with reference metadata." });
      const row = body.createDiv({ cls: "vd-action-row" });
      textButton(row, "Create or open note", () => { void this.plugin.openStudyNote(ref); }, "mod-cta");
      iconButton(row, "copy", "Copy passage", () => { void this.plugin.copyPassage(ref); });
      return;
    }
    if (this.tab === "commentary") {
      emptyState(body, "Commentary not installed", "Bible commentaries will appear here after the module importer and resource manager are implemented.", "book-text");
    } else if (this.tab === "lexicon") {
      emptyState(body, "Lexicon not installed", "Original-language definitions and Strong's links require a licensed or user-imported dictionary with compatible tags.", "languages");
    } else {
      emptyState(body, "Reference module not installed", "Cross-references will be displayed when a validated cross-reference data source has been installed.", "link-2");
    }
    const details = root.createDiv({ cls: "vd-inspector-footer" });
    details.createEl("strong", { text: "Instant Details" });
    details.createEl("p", { text: "Select an available Strong's-linked word to inspect its verified lexical data. No words are inferred from plain text." });
  }
}
