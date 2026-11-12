import { Modal, MarkdownView, Notice } from "obsidian";
import { BOOKS } from "../core/books";
import { parseReference, refLabel, type PassageReference } from "../core/references";
import type { MySwordController } from "../controller";
import { iconButton, textButton, emptyState } from "./components";

export class ReferenceModal extends Modal {
  private input!: HTMLInputElement;
  private preview!: HTMLElement;
  private actions!: HTMLElement;
  private current: PassageReference | null = null;
  private revision = 0;
  private readonly editorView: MarkdownView | null;
  private readonly editorPath: string | null;

  constructor(private readonly plugin: MySwordController, private readonly mode: "jump" | "insert") {
    super(plugin.app);
    this.editorView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
    this.editorPath = this.editorView?.file?.path ?? null;
  }
  onOpen(): void {
    const root = this.contentEl;
    root.empty(); root.addClass("mysword-plus", "vd-reference-modal");
    const head = root.createDiv({ cls: "vd-modal-header" });
    head.createEl("h2", { text: this.mode === "jump" ? "Quick Jump" : "Quick Verse Insert" });
    head.createEl("p", { text: this.mode === "jump" ? "Go directly to a passage" : "Preview and insert Scripture in Markdown" });
    const entry = root.createDiv({ cls: "vd-lookup-input" });
    const icon = entry.createSpan({ cls: "vd-lookup-icon" });
    iconButton(icon, "search", "Search reference", () => this.input.focus());
    this.input = entry.createEl("input", { attr: { type: "search", "aria-label": "Scripture reference", placeholder: "John 3:16 · ps23 · 1co 13:4-7", autocomplete: "off" } });
    this.preview = root.createDiv({ cls: "vd-modal-preview" });
    this.actions = root.createDiv({ cls: "vd-modal-actions" });
    this.input.addEventListener("input", () => { void this.update(); });
    this.input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); this.activate(); }
    });
    this.input.value = refLabel(this.plugin.currentRef);
    void this.update();
    this.input.focus(); this.input.select();
    root.createEl("p", { cls: "vd-modal-tip", text: "Examples: John 3:16, Ps 23, 1 Cor 13:4-7. The preview uses your installed WEB edition." });
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
  private async insert(format: "callout" | "quote"): Promise<void> {
    if (!this.current) return;
    const ref = this.current;
    const verses = await this.plugin.library.getPassage(ref);
    const text = verses.map(v => String(v.verse) + " " + v.text);
    const referenceLabel = refLabel(ref) + " (WEB)";
    const markdown = format === "callout"
      ? ["> [!bible] " + referenceLabel, ...text.map(x => "> " + x)].join("\n")
      : [...text.map(x => "> " + x), "> — " + referenceLabel].join("\n");
    if (!this.editorView || !this.editorPath || this.editorView.file?.path !== this.editorPath) {
      await navigator.clipboard.writeText(markdown);
      new Notice("No unchanged Markdown editor target; passage copied instead.");
      this.close(); return;
    }
    this.editorView.editor.replaceSelection(markdown + "\n");
    this.close();
    new Notice("Inserted " + referenceLabel);
  }
  onClose(): void { this.revision++; this.contentEl.empty(); }
}
