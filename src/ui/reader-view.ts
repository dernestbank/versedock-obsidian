import { ItemView, Notice, setIcon, type WorkspaceLeaf } from "obsidian";
import { BOOKS, type BookInfo } from "../core/books";
import { refLabel, type PassageReference } from "../core/references";
import type { MySwordController } from "../controller";
import { iconButton, textButton, pill, emptyState } from "./components";
import { BookPickerModal, ChapterPickerModal } from "./pickers";

export const READER_VIEW = "versedock-reader";

export class ReaderView extends ItemView {
  private unsubscribe: (() => void) | null = null;
  private renderId = 0;
  private scroll: HTMLElement | null = null;
  constructor(leaf: WorkspaceLeaf, private readonly plugin: MySwordController) { super(leaf); }
  getViewType(): string { return READER_VIEW; }
  getDisplayText(): string { return "VerseDock Bible Reader"; }
  getIcon(): string { return "book-open"; }
  async onOpen(): Promise<void> {
    this.unsubscribe = this.plugin.subscribe(() => { void this.render(); });
    this.addAction("search", "Quick Jump", () => this.plugin.openReferenceModal("jump"));
    this.addAction("notebook-pen", "Quick Verse Insert", () => this.plugin.openReferenceModal("insert"));
    await this.render();
  }
  async onClose(): Promise<void> { this.unsubscribe?.(); this.unsubscribe = null; this.contentEl.empty(); }

  private navigateChapter(delta: number): void {
    const ref = this.plugin.currentRef;
    const max = this.plugin.library.getChapterCount(ref.book);
    if (!max) return;
    let chapter = ref.chapter + delta;
    let book = ref.book;
    if (chapter < 1 || chapter > max) {
      const index = BOOKS.indexOf(ref.book);
      const nextBook = BOOKS[index + (delta > 0 ? 1 : -1)];
      if (!nextBook) return;
      book = nextBook;
      chapter = delta > 0 ? 1 : this.plugin.library.getChapterCount(nextBook);
    }
    this.plugin.selectReference({ book, chapter });
  }

  private bookPicker(): void {
    new BookPickerModal(this.app, book => this.plugin.selectReference({ book, chapter: 1 })).open();
  }
  private chapterPicker(): void {
    const ref = this.plugin.currentRef;
    new ChapterPickerModal(this.app, ref.book, this.plugin.library.getChapterCount(ref.book),
      chapter => this.plugin.selectReference({ book: ref.book, chapter })).open();
  }
  private applyReaderVariables(root: HTMLElement): void {
    const { settings } = this.plugin;
    root.style.setProperty("--vd-reader-size", settings.fontSize + "px");
    root.style.setProperty("--vd-reader-leading", String(settings.lineHeight));
    root.style.setProperty("--vd-reader-measure", settings.textWidth + "ch");
    root.dataset.font = settings.fontStyle;
    root.dataset.mode = settings.mode;
  }
  private toggleTypography(panel: HTMLElement): void {
    const current = panel.querySelector(".vd-type-popover");
    if (current) { current.remove(); return; }
    const pop = panel.createDiv({ cls: "vd-type-popover" });
    pop.createEl("h3", { text: "Reading appearance" });
    const fontLabel = pop.createEl("label", { text: "Typeface" });
    const select = fontLabel.createEl("select", { attr: { "aria-label": "Reader typeface" } });
    (["serif", "sans", "obsidian"] as const).forEach(font =>
      select.createEl("option", { value: font, text: font === "serif" ? "Reading serif" : font === "sans" ? "System sans" : "Follow Obsidian" }));
    select.value = this.plugin.settings.fontStyle;
    select.addEventListener("change", () => { this.plugin.settings.fontStyle = select.value as "serif"|"sans"|"obsidian"; void this.plugin.saveSettings(); this.applyReaderVariables(this.contentEl); });

    const slider = (label: string, min: number, max: number, step: number, initial: number, update: (v: number) => void) => {
      const row = pop.createEl("label", { cls: "vd-range-label" });
      const text = row.createSpan({ text: label + " · " + initial });
      const range = row.createEl("input", { attr: { type: "range", min: String(min), max: String(max), step: String(step), value: String(initial) } });
      range.addEventListener("input", () => { const n = Number(range.value); text.textContent = label + " · " + n; update(n); this.applyReaderVariables(this.contentEl); });
      range.addEventListener("change", () => { void this.plugin.saveSettings(); });
    };
    slider("Size", 14, 26, 1, this.plugin.settings.fontSize, n => this.plugin.settings.fontSize = n);
    slider("Line height", 1.55, 1.85, 0.05, this.plugin.settings.lineHeight, n => this.plugin.settings.lineHeight = n);
    slider("Text width", 52, 76, 1, this.plugin.settings.textWidth, n => this.plugin.settings.textWidth = n);
  }
  private onReaderKey(event: KeyboardEvent): void {
    const element = event.target as HTMLElement;
    if (element.closest("input,textarea,select,button,[contenteditable]") || event.ctrlKey || event.altKey || event.metaKey) return;
    const ref = this.plugin.currentRef;
    if (event.key === "[") { event.preventDefault(); this.navigateChapter(-1); }
    else if (event.key === "]") { event.preventDefault(); this.navigateChapter(1); }
    else if (event.key === "j" || event.key === "k") {
      const direction = event.key === "j" ? 1 : -1;
      const current = this.contentEl.querySelectorAll<HTMLElement>(".vd-verse");
      const nums = [...current].map(el => Number(el.dataset.verse));
      const present = ref.verse ?? nums[0] ?? 1;
      const at = nums.indexOf(present);
      const next = nums[at + direction];
      if (next) { event.preventDefault(); this.plugin.selectReference({ book: ref.book, chapter: ref.chapter, verse: next }); }
    }
  }

  async render(): Promise<void> {
    const version = ++this.renderId;
    const ref = this.plugin.currentRef;
    const previousScroll = this.scroll?.scrollTop ?? 0;
    const changedChapter = this.scroll?.dataset.chapter !== ref.book.vpl + "." + ref.chapter;
    const root = this.contentEl;
    root.empty(); root.addClass("versedock", "vd-reader");
    this.applyReaderVariables(root);
    const app = root.createDiv({ cls: "vd-view" });

    const top = app.createDiv({ cls: "vd-toolbar" });
    const navigate = top.createDiv({ cls: "vd-toolbar-nav" });
    iconButton(navigate, "chevron-left", "Previous chapter", () => this.navigateChapter(-1));
    textButton(navigate, ref.book.name, () => this.bookPicker(), "vd-breadcrumb-book");
    textButton(navigate, String(ref.chapter), () => this.chapterPicker(), "vd-breadcrumb-chapter");
    if (ref.verse !== undefined) textButton(navigate, ":" + ref.verse, () => this.plugin.openReferenceModal("jump"), "vd-breadcrumb-verse");
    iconButton(navigate, "chevron-right", "Next chapter", () => this.navigateChapter(1));
    const tools = top.createDiv({ cls: "vd-toolbar-actions" });
    pill(tools, "WEB · Offline", "vd-version-chip");
    iconButton(tools, "search", "Quick Jump", () => this.plugin.openReferenceModal("jump"));
    iconButton(tools, "notebook-pen", "Insert Scripture", () => this.plugin.openReferenceModal("insert"));
    iconButton(tools, "book-open-check", "Study Inspector", () => { void this.plugin.openInspector(); });
    iconButton(tools, "type", "Appearance", () => this.toggleTypography(tools));
    iconButton(tools, this.plugin.settings.mode === "focus" ? "minimize-2" : "maximize-2",
      this.plugin.settings.mode === "focus" ? "Leave Focus Mode" : "Focus Mode", () => {
        this.plugin.settings.mode = this.plugin.settings.mode === "focus" ? "classic" : "focus";
        void this.plugin.saveSettings(); void this.render();
      });
    this.scroll = app.createDiv({ cls: "vd-scroll", attr: { tabindex: "0", "aria-label": "Bible chapter reading area" } });
    this.scroll.dataset.chapter = ref.book.vpl + "." + ref.chapter;
    this.scroll.addEventListener("keydown", event => this.onReaderKey(event));
    const article = this.scroll.createEl("article", { cls: "vd-reading-column" });
    if (!this.plugin.library.metadata) {
      emptyState(article, "No offline Bible found", "The WEB library is missing from this development installation. Run the library builder and deploy to your test vault.", "book-open");
      return;
    }
    const chapterHead = article.createDiv({ cls: "vd-chapter-head" });
    chapterHead.createSpan({ cls: "vd-overline", text: "WORLD ENGLISH BIBLE · PUBLIC DOMAIN" });
    chapterHead.createEl("h1", { text: ref.book.name + " " + ref.chapter });
    chapterHead.createSpan({ cls: "vd-chapter-subtitle", text: "Read, study and connect Scripture to your notes." });
    let chapter;
    try { chapter = await this.plugin.library.getChapter(ref); }
    catch(error) {
      if(version !== this.renderId) return;
      emptyState(article, "Chapter unavailable", error instanceof Error ? error.message : String(error), "alert-triangle");
      return;
    }
    if (version !== this.renderId) return;
    const passage = article.createDiv({ cls: "vd-passage" });
    for (const verse of chapter.verses) {
      const selected = ref.verse === verse.verse;
      const verseRef = { book: ref.book, chapter: ref.chapter, verse: verse.verse };
      const highlight = this.plugin.settings.highlights.includes(ref.book.osis + "." + ref.chapter + "." + verse.verse);
      const row = passage.createEl("div", {
        cls: "vd-verse" + (selected ? " is-selected" : "") + (highlight ? " is-highlighted" : ""),
        attr: { tabindex: "0", role: "group", "aria-label": ref.book.name + " " + ref.chapter + ":" + verse.verse + "; press Enter to select" }
      });
      row.dataset.verse = String(verse.verse);
      row.createEl("sup", { cls: "vd-verse-num", text: String(verse.verse) });
      row.createSpan({ cls: "vd-verse-text", text: verse.text });
      row.addEventListener("click", e => {
        if ((e.target as HTMLElement).closest("button")) return;
        this.plugin.selectReference({ book: ref.book, chapter: ref.chapter, verse: verse.verse });
      });
      row.addEventListener("keydown", e => {
        if (e.target === row && e.key === "Enter") {
          e.preventDefault(); this.plugin.selectReference({ book: ref.book, chapter: ref.chapter, verse: verse.verse });
        }
      });
      if (selected) {
        const actions = row.createDiv({ cls: "vd-verse-actions" });
        iconButton(actions, "copy", "Copy verse", () => { void this.plugin.copyPassage(ref); });
        iconButton(actions, "highlighter", "Toggle highlight", () => this.plugin.toggleHighlight(verseRef));
        iconButton(actions, this.plugin.settings.bookmarks.includes(ref.book.osis + "." + ref.chapter + "." + verse.verse) ? "bookmark-check" : "bookmark", "Toggle bookmark", () => this.plugin.toggleBookmark(verseRef));
        iconButton(actions, "notebook-pen", "Open linked note", () => { void this.plugin.openStudyNote(ref); });
        iconButton(actions, "book-open-check", "Open inspector", () => { void this.plugin.openInspector(); });
      }
    }
    const ending = article.createDiv({ cls: "vd-end-nav" });
    textButton(ending, "← Previous chapter", () => this.navigateChapter(-1));
    textButton(ending, "Next chapter →", () => this.navigateChapter(1));
    const footer = app.createDiv({ cls: "vd-status-footer" });
    footer.createSpan({ text: "ENGWEBP · 66 books · " + chapter.verses.length + " verses in chapter" });
    footer.createSpan({ text: "Offline • No account" });

    if (!changedChapter) this.scroll.scrollTop = previousScroll;
    else if (ref.verse !== undefined) {
      const selected = this.scroll.querySelector(".vd-verse.is-selected");
      selected?.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }
}
