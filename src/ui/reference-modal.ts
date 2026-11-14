import { Modal, MarkdownView, Notice } from "obsidian";
import { BOOKS } from "../core/books";
import { parseReference, refLabel, type PassageReference } from "../core/references";
import type { SwordDockController } from "../controller";
import { iconButton, textButton, emptyState } from "./components";
import { captureInsertionSnapshot, insertAtSnapshot, formatPassageMarkdown, type InsertionSnapshot, type InsertFormat } from "../core/insertion";

export class ReferenceModal extends Modal {
  private input!: HTMLInputElement;
  private preview!: HTMLElement;
  private actions!: HTMLElement;
  private current: PassageReference | null = null;
  private revision = 0;
  private readonly editorView: MarkdownView | null;
  private readonly editorPath: string | null;
  private readonly targetSnapshot: InsertionSnapshot | null;
  private inserting = false;

  constructor(private readonly plugin: SwordDockController, private readonly mode: "jump" | "insert") {
    super(plugin.app);
    this.editorView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
    this.editorPath = this.editorView?.file?.path ?? null;
    this.targetSnapshot = this.editorView?.getMode() === "source"
      ? captureInsertionSnapshot(this.editorView.editor) : null;
  }
  onOpen(): void {
    const root = this.contentEl;
    root.empty(); root.addClass("versedock", "vd-reference-modal");
    const head = root.createDiv({ cls: "vd-modal-header" });
    head.createEl("h2", { text: this.mode === "jump" ? "Quick Jump" : "Quick Verse Insert" });
    head.createEl("p", { text: this.mode === "jump" ? "Go directly to a passage" : "Preview and insert Scripture in Markdown" });
    const entry = root.createDiv({ cls: "vd-lookup-input" });
    const icon = entry.createSpan({ cls: "vd-lookup-icon" });
    iconButton(icon, "search", "Search reference", () => this.input.focus());
    this.input = entry.createEl("input", { attr: { type: "search", "aria-label": "Scripture reference", placeholder: "John 3:16 · ps23 · 1co 13:4-7", autocomplete: "off" } });
    this.preview = root.createDiv({ cls: "vd-modal-preview", attr: { "aria-live": "polite", "aria-atomic": "true" } });
    this.actions = root.createDiv({ cls: "vd-modal-actions" });
    this.input.addEventListener("input", () => { void this.update(); });
    this.input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); this.activate(); }
    });
    this.input.value = refLabel(this.plugin.currentRef);
    void this.update();
    this.input.focus(); this.input.select();
    root.createEl("p", { cls: "vd-modal-tip", text: this.mode === "insert"
      ? "Insertion uses the original Markdown selection. If your note or selection changes, Scripture is copied instead. WEB edition · Offline."
      : "Examples: John 3:16, Ps 23, 1 Cor 13:4-7. Preview: installed WEB edition." });
  }
  private async update(): Promise<void> {
    const version = ++this.revision;
    this.preview.empty(); this.actions.empty(); this.current = null;
    let ref: PassageReference;
    try {
      ref = parseReference(this.input.value);
    } catch {
      if (this.input.value.trim()) emptyState(this.preview, "Enter a Scripture reference", "Try John 3:16, Romans 8:28, or Psalms 23.", "search");
      return;
    }
    try {
      const verses = await this.plugin.library.getPassage(ref);
      if (version !== this.revision) return;
      this.current = ref;
      const heading = this.preview.createDiv({ cls: "vd-preview-heading" });
      heading.createEl("strong", { text: refLabel(ref) });
      heading.createSpan({ cls: "vd-pill", text: "WEB · Offline" });
      const content = this.preview.createDiv({ cls: "vd-preview-verse" });
      const max = ref.verse === undefined ? Math.min(verses.length, 4) : verses.length;
      verses.slice(0, max).forEach(v => {
        const line = content.createEl("p");
        line.createEl("sup", { text: String(v.verse) + " " });
        line.appendText(v.text);
      });
      if (verses.length > max) this.preview.createEl("p", { cls: "vd-modal-tip", text: "Showing " + max + " of " + verses.length + " verses." });
      if (this.mode === "jump") {
        textButton(this.actions, "Open passage", () => this.activate(), "mod-cta");
      } else {
        textButton(this.actions, "Insert callout", () => { void this.insert("callout"); }, "mod-cta");
        textButton(this.actions, "Insert quote", () => { void this.insert("quote"); });
        textButton(this.actions, "Copy", () => { void this.plugin.copyPassage(ref); });
      }
    } catch (error) {
      if (version !== this.revision) return;
      emptyState(this.preview, "Passage unavailable", String(error instanceof Error ? error.message : error), "alert-circle");
    }
  }
  private activate(): void {
    if (!this.current) { new Notice("Choose a valid passage first."); return; }
    if (this.mode === "jump") {
      this.plugin.selectReference(this.current);
      void this.plugin.openReader();
      this.close();
    } else {
      void this.insert("callout");
    }
  }
  private async copyInstead(markdown: string, reason: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(markdown);
      new Notice(reason + " Passage copied to clipboard instead.");
      this.close();
    } catch {
      new Notice("Unable to copy automatically. Your note was not modified. Use Copy or try again.");
    }
  }
  private async insert(format: InsertFormat): Promise<void> {
    if (!this.current || this.inserting) return;
    const ref = this.current;
    const version = this.revision;
    this.inserting = true;
    try {
      const verses = await this.plugin.library.getPassage(ref);
      if (this.revision !== version) return;
      const referenceLabel = refLabel(ref) + " (WEB)";
      const markdown = formatPassageMarkdown(format, referenceLabel, verses);
      const viewStillOpen = this.editorView !== null &&
        this.plugin.app.workspace.getLeavesOfType("markdown").some(leaf => leaf.view === this.editorView);
      if (!viewStillOpen || !this.editorView || !this.targetSnapshot ||
          !this.editorPath || this.editorView.file?.path !== this.editorPath ||
          this.editorView.getMode() !== "source") {
        await this.copyInstead(markdown, "No original Markdown editor is available.");
        return;
      }
      if (!insertAtSnapshot(this.editorView.editor, this.targetSnapshot, markdown)) {
        await this.copyInstead(markdown, "The original note or selection changed.");
        return;
      }
      this.close();
      new Notice("Inserted " + referenceLabel);
    } catch (error) {
      new Notice("Verse insertion failed: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      this.inserting = false;
    }
  }
  onClose(): void { this.revision++; this.contentEl.empty(); }
}
