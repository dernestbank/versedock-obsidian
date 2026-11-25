import { ItemView, Menu, Notice, setIcon, type WorkspaceLeaf } from "obsidian";
import { BOOKS, type BookInfo } from "../core/books";
import { extendReferenceInDirection, extendReferenceToVerse, referenceContainsVerse, referenceId, refLabel, storedReferencesContainVerse, type PassageReference } from "../core/references";
import type { StudyLinkGroup, StudyLinkMode } from "../core/link-groups";
import { DEFAULT_SETTINGS, type SwordDockController } from "../controller";
import { iconButton, linkButton, textButton, emptyState } from "./components";
import { OFFLINE_LIBRARY_RECOVERY, recheckOfflineLibrary } from "./library-recovery";
import { BookPickerModal, ChapterPickerModal } from "./pickers";
import { isFocusEscape, readerVerseDirection } from "./reader-mode";
import { ReaderWordDetails } from "./reader-word-details";
import { initialWordDetailsState, synchronizeWordPin } from "../core/word-study";
import { showKjvTaggedControls, showKjvInlineStrongs } from "../core/kjv-display";
import { InterlinearPanel } from "./interlinear-panel";
import {VerseSourceModal} from './verse-source-modal';

export const READER_VIEW = "versedock-reader";
let readerViewSequence = 0;

export class ReaderView extends ItemView {
  private unsubscribe: (() => void) | null = null;
  private renderId = 0;
  private rendering:Promise<void>=Promise.resolve();
  private scroll: HTMLElement | null = null;
  private readonly domScope = `versedock-reader-${++readerViewSequence}`;
  private wordDetails: ReaderWordDetails | null = null;
  private interlinearPanel: InterlinearPanel | null = null;
  private wordDetailsState = initialWordDetailsState();
  private hoverTimer: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  constructor(leaf: WorkspaceLeaf, private readonly plugin: SwordDockController) { super(leaf); }
  getViewType(): string { return READER_VIEW; }
  getDisplayText(): string { return "SwordDock Bible Reader"; }
  getIcon(): string { return "book-open"; }
  async onOpen(): Promise<void> {
    const subscription = this.plugin.subscribe(() => { void this.render(); });
    this.unsubscribe = subscription;
    this.registerDomEvent(document, "keydown", event => {
      if (!isFocusEscape(event) || this.plugin.settings.mode !== "focus"
        || this.app.workspace.getActiveViewOfType(ReaderView) !== this) return;
      const active = document.activeElement as HTMLElement | null;
      const protectedOrigin = '.modal-container,[role="dialog"],input,textarea,select,[contenteditable="true"],.vd-type-popover,.vd-link-popover';
      // Obsidian can dismiss a dialog and restore Reader focus before this
      // listener runs. The original event path still identifies the dialog.
      if (active?.closest(protectedOrigin) || event.composedPath().some(target =>
        target instanceof HTMLElement && target.closest(protectedOrigin))) return;
      event.preventDefault();
      event.stopPropagation();
      this.setMode("toggle-focus");
    }, { capture: true });
    this.addAction("search", "Quick Jump", () => this.plugin.openReferenceModal("jump"));
    this.addAction("notebook-pen", "Quick Verse Insert", () => this.plugin.openReferenceModal("insert"));
    await this.render();
    if (this.unsubscribe !== subscription) return;
    let previousWidth = this.contentEl.clientWidth;
    this.resizeObserver = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? previousWidth;
      if (previousWidth > 0 && Math.abs(width - previousWidth) > 1)
        this.scroll?.querySelector<HTMLElement>(".vd-verse.is-selected")?.scrollIntoView({ block: "nearest", behavior: "auto" });
      previousWidth = width;
    });
    this.resizeObserver.observe(this.contentEl);
  }
  async onClose(): Promise<void> {
    ++this.renderId;
    this.interlinearPanel?.dispose(); this.interlinearPanel = null;
    this.unsubscribe?.(); this.unsubscribe = null;
    this.wordDetails?.dispose();
    this.resizeObserver?.disconnect(); this.resizeObserver = null;
    if (this.hoverTimer !== null) window.clearTimeout(this.hoverTimer);
    this.contentEl.empty();
  }

  private navigateChapter(delta: number): void {
    const ref = this.plugin.currentRef;
    const max = this.plugin.readerBible.getChapterCount(ref.book);
    if (!max) return;
    let chapter = ref.chapter + delta;
    let book = ref.book;
    if (chapter < 1 || chapter > max) {
      const index = BOOKS.indexOf(ref.book);
      const nextBook = BOOKS[index + (delta > 0 ? 1 : -1)];
      if (!nextBook) return;
      book = nextBook;
      chapter = delta > 0 ? 1 : this.plugin.readerBible.getChapterCount(nextBook);
    }
    this.plugin.selectReference({ book, chapter });
  }

  private bookPicker(): void {
    new BookPickerModal(this.app, book => this.plugin.selectReference({ book, chapter: 1 })).open();
  }
  private chapterPicker(): void {
    const ref = this.plugin.currentRef;
    new ChapterPickerModal(this.app, ref.book, this.plugin.readerBible.getChapterCount(ref.book),
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
  private openLinkPopover(parent: HTMLElement): void {
    const current = parent.querySelector(".vd-link-popover");
    if (current) { current.remove(); return; }
    const pop = parent.createDiv({ cls: "vd-link-popover" });
    pop.createEl("h3", { text: "Study links" });
    pop.createEl("p", { cls: "vd-subtle", text: "Link Reader and Comparison only when both panes use the same group." });
    const assignment = this.plugin.getStudyLinkAssignment("reader");
    const label = pop.createEl("label", { text: "Reader link group" });
    const select = label.createEl("select", { attr: { "aria-label": "Reader study link group" } });
    const options: Array<[string, string, StudyLinkGroup, StudyLinkMode]> = [
      ["unlinked", "Unlinked", "unlinked", "follow"],
      ["A-follow", "Link A · Follow", "A", "follow"],
      ["A-pinned", "Link A · Pinned", "A", "pinned"],
      ["B-follow", "Link B · Follow", "B", "follow"],
      ["B-pinned", "Link B · Pinned", "B", "pinned"],
      ["C-follow", "Link C · Follow", "C", "follow"],
      ["C-pinned", "Link C · Pinned", "C", "pinned"],
    ];
    options.forEach(([value, text]) => select.createEl("option", { value, text }));
    select.value = assignment.group === "unlinked" ? "unlinked" : assignment.group + "-" + assignment.mode;
    select.addEventListener("change", () => {
      const chosen = options.find(([value]) => value === select.value);
      if (!chosen) return;
      this.plugin.setStudyLinkAssignment("reader", { group: chosen[2], mode: chosen[3] });
    });
  }
  private toggleTypography(panel: HTMLElement): void {
    const current = panel.querySelector(".vd-type-popover");
    if (current) { current.remove(); return; }
    const pop = panel.createDiv({ cls: "vd-type-popover" });
    pop.addEventListener("keydown", event => {
      if (!isFocusEscape(event)) return;
      event.preventDefault(); event.stopPropagation();
      pop.remove();
      panel.querySelector<HTMLElement>('[aria-label="Appearance"]')?.focus({ preventScroll: true });
    });
    pop.createEl("h3", { text: "Reading appearance" });
    const modeLabel = pop.createEl("label", { text: "Layout" });
    const mode = modeLabel.createEl("select", { attr: { "aria-label": "Reader layout" } });
    for (const [value, label] of [["classic", "Classic"], ["compact", "Compact study"], ["focus", "Focus"]])
      mode.createEl("option", { value, text: label });
    mode.value = this.plugin.settings.mode;
    mode.addEventListener("change", () => this.setMode(mode.value as SwordDockController["settings"]["mode"]));
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
    slider("Line height", 1.15, 2, 0.01, this.plugin.settings.lineHeight, n => this.plugin.settings.lineHeight = n);
    slider("Text width", 52, 76, 1, this.plugin.settings.textWidth, n => this.plugin.settings.textWidth = n);
    const actions = pop.createDiv({ cls: "vd-action-row" });
    textButton(actions, "Reset typography", () => {
      this.plugin.settings.fontStyle = DEFAULT_SETTINGS.fontStyle;
      this.plugin.settings.fontSize = DEFAULT_SETTINGS.fontSize;
      this.plugin.settings.lineHeight = DEFAULT_SETTINGS.lineHeight;
      this.plugin.settings.textWidth = DEFAULT_SETTINGS.textWidth;
      void this.plugin.saveSettings();
      this.applyReaderVariables(this.contentEl);
      pop.remove();
      this.toggleTypography(panel);
    });
  }
  private setMode(mode: SwordDockController["settings"]["mode"] | "toggle-focus"): void {
    void this.plugin.setReaderMode(mode).then(() =>
      this.contentEl.querySelector<HTMLElement>('[aria-label="Appearance"]')?.focus({ preventScroll: true }));
  }
  private renderReaderInstantDetails(parent: HTMLElement): void {
    this.wordDetailsState = synchronizeWordPin(this.wordDetailsState, this.plugin.selectedWord);
    this.wordDetails = new ReaderWordDetails(parent, this.plugin, this.wordDetailsState, this.domScope,
      state => { this.wordDetailsState = state; });
  }
  private onReaderKey(event: KeyboardEvent): void {
    const element = event.target as HTMLElement;
    if (element.closest("input,textarea,select,button,[contenteditable]") || event.ctrlKey || event.altKey || event.metaKey) return;
    if (isFocusEscape(event) && this.plugin.settings.mode === "focus") {
      event.preventDefault();
      this.setMode("toggle-focus");
      return;
    }
    const ref = this.plugin.currentRef;
    const direction = readerVerseDirection(event.key);
    if (event.key === "[") { event.preventDefault(); this.navigateChapter(-1); }
    else if (event.key === "]") { event.preventDefault(); this.navigateChapter(1); }
    else if (direction !== null) {
      const current = this.contentEl.querySelectorAll<HTMLElement>(".vd-verse");
      const nums = [...current].map(el => Number(el.dataset.verse));
      const present = event.shiftKey && ref.endVerse !== undefined && direction > 0
        ? ref.endVerse
        : ref.verse ?? nums[0] ?? 1;
      const at = nums.indexOf(present);
      const next = nums[at + direction];
      if (next) {
        event.preventDefault();
        const nextRef = { book: ref.book, chapter: ref.chapter, verse: next };
        this.plugin.selectReference(event.shiftKey
          ? extendReferenceInDirection(ref, next, direction > 0 ? "forward" : "backward")
          : nextRef);
      }
    }
  }

  /** Explicit view activation hands focus to the completed current passage. */
  async focusPassage():Promise<void>{
    const document=this.contentEl.ownerDocument,origin=document.activeElement;
    let pending:Promise<void>;
    do {pending=this.rendering;await pending;} while(pending!==this.rendering);
    if(!this.contentEl.isConnected||this.app.workspace.getActiveViewOfType(ReaderView)!==this)return;
    const active=document.activeElement;
    if(active!==origin&&active!==document.body&&active!==this.contentEl)return;
    const selected=this.scroll?.querySelector<HTMLElement>('.vd-verse.is-selected');
    selected?.scrollIntoView({block:'nearest',behavior:'auto'});
    (selected??this.scroll)?.focus({preventScroll:true});
  }

  render():Promise<void>{
    this.rendering=this.renderContent();return this.rendering;
  }

  private async renderContent(): Promise<void> {
    const version = ++this.renderId;
    const document = this.contentEl.ownerDocument;
    const ref = this.plugin.currentRef;
    const previousScroll = this.scroll?.scrollTop ?? 0;
    const active = document.activeElement as HTMLElement | null;
    const companionFocus = active?.closest(".vd-interlinear") ? active.dataset.interlinearControl ?? "order" : undefined;
    const focusWithinReader = !!active && (!!this.scroll?.contains(active) || !!active.closest(".vd-word-details"));
    const focusedVerse = focusWithinReader ? active?.closest<HTMLElement>(".vd-verse")?.dataset.verse : undefined;
    const changedChapter = this.scroll?.dataset.chapter !== ref.book.vpl + "." + ref.chapter;
    const changedLayout = this.scroll?.dataset.mode !== this.plugin.settings.mode;
    this.wordDetails?.dispose(); this.wordDetails = null;
    this.interlinearPanel?.dispose(); this.interlinearPanel = null;
    if (this.hoverTimer !== null) window.clearTimeout(this.hoverTimer);
    if (changedChapter || this.plugin.settings.bibleEdition !== "kjv") this.wordDetailsState = initialWordDetailsState();
    const root = this.contentEl;
    root.empty(); root.addClass("versedock", "vd-reader");
    this.applyReaderVariables(root);
    const app = root.createDiv({ cls: "vd-view" });

    const top = app.createDiv({ cls: "vd-toolbar" });
    const navigate = top.createDiv({ cls: "vd-toolbar-nav" });
    const history = navigate.createDiv({ cls: "vd-history-actions", attr: { "aria-label": "Reading navigation" } });
    const back = iconButton(history, "arrow-left", "Back to previous passage", () => this.plugin.navigateBack());
    back.disabled = !this.plugin.canNavigateBack();
    const forward = iconButton(history, "arrow-right", "Forward to next passage", () => this.plugin.navigateForward());
    forward.disabled = !this.plugin.canNavigateForward();
    iconButton(navigate, "chevron-left", "Previous chapter", () => this.navigateChapter(-1));
    textButton(navigate, ref.book.name, () => this.bookPicker(), "vd-breadcrumb-book");
    textButton(navigate, String(ref.chapter), () => this.chapterPicker(), "vd-breadcrumb-chapter");
    if (ref.verse !== undefined) {
      const verseLabel = ":" + ref.verse + (ref.endVerse === undefined ? "" : "-" + ref.endVerse);
      textButton(navigate, verseLabel, () => this.plugin.openReferenceModal("jump"), "vd-breadcrumb-verse");
    }
    iconButton(navigate, "chevron-right", "Next chapter", () => this.navigateChapter(1));
    const tools = top.createDiv({ cls: "vd-toolbar-actions" });
    const editionButton = textButton(tools, this.plugin.readerBible.metadata
      ? this.plugin.readerBible.metadata.abbreviation : OFFLINE_LIBRARY_RECOVERY.unavailableChip,
      () => {
        const menu = new Menu();
        for (const bible of this.plugin.availableBibleEditions()) menu.addItem(item => item
          .setTitle(bible.title)
          .setChecked(this.plugin.settings.bibleEdition === bible.id).setDisabled(!bible.ready)
          .onClick(() => { void this.plugin.setBibleEdition(bible.id); }));
        const bounds = editionButton.getBoundingClientRect();
        menu.showAtPosition({ x: bounds.left, y: bounds.bottom }, this.contentEl.ownerDocument);
      }, "vd-version-selector");
    editionButton.setAttribute("aria-label", "Bible edition: " + (this.plugin.readerBible.metadata?.abbreviation ?? "unavailable"));
    editionButton.setAttribute("aria-haspopup", "menu");
    editionButton.title = (this.plugin.readerBible.metadata?.title ?? "Unavailable") + " · Offline";
    if (this.plugin.settings.bibleEdition === "kjv") {
      const study = app.createDiv({ cls: "vd-study-display-bar", attr: { "aria-label": "KJV study display" } });
      const modes = study.createDiv({ cls: "vd-study-display-modes", attr: { role: "group", "aria-label": "Bible display mode" } });
      for (const [mode, label] of [["reading", "Reading"], ["word-study", "Word study"], ["interlinear", "Interlinear"]] as const) {
        const control = textButton(modes, label, () => {
          void this.plugin.setKjvDisplayMode(mode).then(() =>
            this.contentEl.querySelector<HTMLElement>('[data-kjv-mode="' + mode + '"]')?.focus({ preventScroll: true }));
        }, "vd-study-mode");
        control.dataset.kjvMode = mode;
        control.setAttribute("aria-pressed", String(this.plugin.settings.kjvDisplayMode === mode));
      }
      if (this.plugin.settings.kjvDisplayMode === "word-study") {
        const identifiers = textButton(study, "Numbers", () => {
          void this.plugin.setKjvInlineStrongs(!this.plugin.settings.kjvInlineStrongs).then(() =>
            this.contentEl.querySelector<HTMLElement>(".vd-strongs-toggle")?.focus({ preventScroll: true }));
        }, "vd-strongs-toggle");
        identifiers.setAttribute("aria-label", "Show inline Strong’s identifiers");
        identifiers.setAttribute("aria-pressed", String(this.plugin.settings.kjvInlineStrongs));
      }
      iconButton(study, "info", "About the Berean interlinear companion", () => {
        new Notice("KJV Scripture with a Berean original-language companion. Hebrew, Aramaic and Greek words retain the source’s Berean glosses, grammar and word order. Select a verse to study it below.");
      });
    }
    linkButton(tools, this.plugin.getStudyLinkAssignment("reader"), () => this.openLinkPopover(tools)).addClass("vd-primary-secondary");
    iconButton(tools, "search", "Quick Jump", () => this.plugin.openReferenceModal("jump")).addClass("vd-primary-secondary");
    iconButton(tools, "type", "Appearance", () => this.toggleTypography(tools)).addClass("vd-primary-secondary");
    const more = iconButton(tools, "more-horizontal", "Reader actions", () => {
      const menu = new Menu();
      menu.addItem(item => item.setTitle("Quick Jump").setIcon("search").onClick(() => this.plugin.openReferenceModal("jump")));
      menu.addItem(item => item.setTitle("Appearance").setIcon("type").onClick(() => this.toggleTypography(tools)));
      menu.addItem(item => item.setTitle("Study links").setIcon("link").onClick(() => this.openLinkPopover(tools)));
      menu.addItem(item => item.setTitle("Insert Scripture").setIcon("notebook-pen").onClick(() => this.plugin.openReferenceModal("insert")));
      menu.addItem(item => item.setTitle("Study Inspector").setIcon("book-open-check").onClick(() => { void this.plugin.openInspector(); }));
      menu.addItem(item => item.setTitle("Compare editions").setIcon("columns-2").onClick(() => { void this.plugin.openComparison(); }));
      menu.addSeparator();
      menu.addItem(item => item.setTitle("Focus mode").setIcon("maximize-2")
        .setChecked(this.plugin.settings.mode === "focus").onClick(() => {
          this.setMode("toggle-focus");
        }));
      menu.addSeparator();
      menu.addItem(item => item.setTitle("Back to previous passage").setIcon("arrow-left")
        .setDisabled(!this.plugin.canNavigateBack()).onClick(() => this.plugin.navigateBack()));
      menu.addItem(item => item.setTitle("Forward to next passage").setIcon("arrow-right")
        .setDisabled(!this.plugin.canNavigateForward()).onClick(() => this.plugin.navigateForward()));
      const bounds = more.getBoundingClientRect();
      menu.showAtPosition({ x: bounds.left, y: bounds.bottom }, this.contentEl.ownerDocument);
    });
    more.setAttribute("aria-haspopup", "menu");
    if (this.plugin.settings.mode === "focus") {
      const help = app.createSpan({ cls: "vd-focus-help", attr: { id: this.domScope + "-focus-help" } });
      help.textContent = "Focus mode · Escape restores your workspace";
      more.setAttribute("aria-describedby", this.domScope + "-focus-help");
    }
    this.scroll = app.createDiv({ cls: "vd-scroll", attr: { tabindex: "0", "aria-label": "Bible chapter reading area" } });
    if (this.plugin.settings.mode === "focus") {
      const focusNav = app.createDiv({ cls: "vd-focus-nav", attr: { role: "navigation", "aria-label": "Focus mode chapter navigation" } });
      iconButton(focusNav, "chevron-left", "Previous chapter", () => this.navigateChapter(-1));
      focusNav.createSpan({ cls: "vd-focus-nav-label", text: ref.book.name + " " + ref.chapter });
      iconButton(focusNav, "chevron-right", "Next chapter", () => this.navigateChapter(1));
      textButton(focusNav, "Exit", () => {
        this.setMode("toggle-focus");
      }, "vd-focus-nav-exit");
    }
    this.scroll.dataset.chapter = ref.book.vpl + "." + ref.chapter;
    this.scroll.dataset.mode = this.plugin.settings.mode;
    this.scroll.addEventListener("keydown", event => this.onReaderKey(event));
    const article = this.scroll.createEl("article", { cls: "vd-reading-column" });
    if (!this.plugin.readerBible.metadata) {
      const recovery = emptyState(article, OFFLINE_LIBRARY_RECOVERY.title, OFFLINE_LIBRARY_RECOVERY.description, "book-open");
      textButton(recovery, OFFLINE_LIBRARY_RECOVERY.action, () => {
        void (async () => {
          const result = await recheckOfflineLibrary(this.plugin.settings.bibleEdition === "kjv" ? this.plugin.kjv : this.plugin.library);
          new Notice(result.notice);
          if (result.available) await this.render();
        })();
      }, "mod-cta");
      return;
    }
    const chapterHead = article.createDiv({ cls: "vd-chapter-head" });
    chapterHead.createSpan({ cls: "vd-overline", text: (this.plugin.readerBible.metadata?.title ?? "BIBLE").toUpperCase() + " · OFFLINE EDITION" });
    const chapterTitle = chapterHead.createDiv({ cls: "vd-chapter-title-row" });
    chapterTitle.createEl("h1", { text: ref.book.name });
    chapterTitle.createSpan({
      cls: "vd-chapter-number",
      text: String(ref.chapter),
      attr: { "aria-label": "Chapter " + ref.chapter }
    });
    const metadata = this.plugin.readerBible.metadata;
    article.setAttribute("dir",metadata.rightToLeft ? "rtl" : "ltr");
    chapterHead.createSpan({ cls: "vd-chapter-subtitle", text: metadata.abbreviation + " · " + metadata.books.length + " books · " + metadata.license });
    let chapter;
    try { chapter = await this.plugin.readerBible.getChapter(ref); }
    catch(error) {
      if(version !== this.renderId) return;
      emptyState(article, "Chapter unavailable", error instanceof Error ? error.message : String(error), "alert-triangle");
      return;
    }
    if (version !== this.renderId) return;
    const passage = article.createDiv({ cls: "vd-passage" });
    for (const verse of chapter.verses) {
      const selected = referenceContainsVerse(ref, verse.verse);
      const selectedStart = selected && ref.verse === verse.verse;
      const verseRef = { book: ref.book, chapter: ref.chapter, verse: verse.verse };
      const highlight = storedReferencesContainVerse(this.plugin.settings.highlights, verseRef);
      const row = passage.createEl("div", {
        cls: "vd-verse" + (selected ? " is-selected" : "") + (selectedStart ? " is-selection-start" : "") + (highlight ? " is-highlighted" : ""),
        attr: {
          tabindex: "0",
          role: "group",
          "aria-selected": selected ? "true" : "false",
          ...(selected ? { "aria-current": selectedStart ? "location" : "true" } : {}),
          "aria-label": ref.book.name + " " + ref.chapter + ":" + verse.verse +
            (selected ? "; selected" : "") + "; press Enter to select; hold Shift to extend a selection"
        }
      });
      row.dataset.verse = String(verse.verse);
      row.createEl("sup", { cls: "vd-verse-num", text: String(verse.verse) });
      const verseText = row.createSpan({ cls: "vd-verse-text" });
      if (verse.tokens) verse.tokens.forEach((token, index) => {
        const classes = (token.redLetter ? " vd-red-letter" : "") + (token.added ? " vd-added-word" : "");
        if (token.strongs?.length && showKjvTaggedControls(this.plugin.settings.bibleEdition, this.plugin.settings.kjvDisplayMode)) {
          const word = verseText.createEl("button", { cls: "vd-tagged-word" + classes, text: token.text, attr: {
            type: "button", "aria-label": "Study “" + token.text + "” · " + token.strongs.join(", "),
            "aria-pressed": String(this.plugin.selectedWord?.index === index && referenceId(this.plugin.selectedWord.ref) === referenceId(verseRef))
          } });
          word.dataset.wordIndex = String(index);
          if (showKjvInlineStrongs(this.plugin.settings.bibleEdition, this.plugin.settings.kjvDisplayMode, this.plugin.settings.kjvInlineStrongs))
            word.createEl("sup", { cls: "vd-inline-strongs", text: token.strongs.join(" · "), attr: { "aria-hidden": "true" } });
          const selectedWord = this.plugin.selectedWord;
          word.tabIndex = selectedWord && referenceId(selectedWord.ref) === referenceId(verseRef)
            ? (selectedWord.index === index ? 0 : -1)
            : (index === verse.tokens!.findIndex(token => token.strongs?.length) ? 0 : -1);
          word.addEventListener("click", event => {
            event.stopPropagation();
            if (!window.getSelection()?.isCollapsed) return;
            this.plugin.selectWord(verseRef, token, index);
          });
          word.addEventListener("pointerenter", event => {
            if (event.pointerType !== "mouse" || this.plugin.selectedWord) return;
            if (this.hoverTimer !== null) window.clearTimeout(this.hoverTimer);
            this.hoverTimer = window.setTimeout(() => {
              if (word.isConnected) this.wordDetails?.preview({ ref: verseRef, token, index });
            }, 160);
          });
          word.addEventListener("pointerleave", () => {
            if (this.hoverTimer !== null) window.clearTimeout(this.hoverTimer);
          });
          word.addEventListener("keydown", event => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const words = Array.from(verseText.querySelectorAll<HTMLButtonElement>(".vd-tagged-word"));
            const next = words[words.indexOf(word) + (event.key === "ArrowRight" ? 1 : -1)];
            if (next) { word.tabIndex = -1; next.tabIndex = 0; next.focus(); }
          });
        } else verseText.createSpan({ cls: classes.trim(), text: token.text });
      });
      else verseText.setText(verse.text);
      row.addEventListener("click", e => {
        if ((e.target as HTMLElement).closest("button")) return;
        // Do not tear down the DOM while the user is selecting Scripture text to copy.
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed &&
            (row.contains(selection.anchorNode) || row.contains(selection.focusNode))) return;
        this.plugin.selectReference(e.shiftKey
          ? extendReferenceToVerse(ref, verse.verse)
          : { book: ref.book, chapter: ref.chapter, verse: verse.verse });
      });
      row.addEventListener("keydown", e => {
        if (e.target === row && e.key === "Enter") {
          e.preventDefault(); this.plugin.selectReference(e.shiftKey
            ? extendReferenceToVerse(ref, verse.verse)
            : { book: ref.book, chapter: ref.chapter, verse: verse.verse });
        }
      });
      if (selectedStart) {
        const actions = row.createDiv({ cls: "vd-verse-actions" });
        const range = ref.endVerse !== undefined;
        const selectedLabel = range ? "selected passage" : "verse";
        iconButton(actions, "copy", range ? "Copy selected passage" : "Copy verse", () => { void this.plugin.copyPassage(ref); });
        const highlightId = referenceId(ref);
        const highlightActive = this.plugin.settings.highlights.includes(highlightId) || (!range && highlight);
        iconButton(actions, "notebook-pen", "Open linked note", () => { void this.plugin.openStudyNote(ref); });
        if(verse.source!==undefined)iconButton(actions,'file-text','Source notes and markup for '+refLabel(verseRef),()=>{
          new VerseSourceModal(this.plugin,verseRef,verse.source!,metadata.abbreviation+' · '+metadata.edition).open();
        });
        const bookmarked = this.plugin.settings.bookmarks.includes(referenceId(ref));
        const bookmarkAction = iconButton(actions, bookmarked ? "bookmark-check" : "bookmark", "Toggle bookmark " + selectedLabel, () => this.plugin.toggleBookmark(ref));
        bookmarkAction.setAttribute("aria-pressed", bookmarked ? "true" : "false");
        const more = iconButton(actions, "more-horizontal", "More actions for " + selectedLabel, () => {
          const menu = new Menu();
          menu.addItem(item => item.setTitle("Insert " + selectedLabel + " into note").setIcon("file-plus-2")
            .onClick(() => this.plugin.openReferenceModal("insert")));
          menu.addItem(item => item.setTitle("Highlight " + selectedLabel).setIcon("highlighter").setChecked(highlightActive)
            .onClick(() => this.plugin.toggleHighlight(ref)));
          menu.addSeparator();
          menu.addItem(item => item.setTitle("Open Commentary").setIcon("book-text")
            .onClick(() => { void this.plugin.openInspector("commentary"); }));
          menu.addItem(item => item.setTitle("Open Study Inspector").setIcon("book-open-check")
            .onClick(() => { void this.plugin.openInspector("study"); }));
          menu.addItem(item => item.setTitle("Compare editions").setIcon("columns-2")
            .onClick(() => { void this.plugin.openComparison(); }));
          const bounds = more.getBoundingClientRect();
          menu.showAtPosition({ x: bounds.left, y: bounds.bottom }, this.contentEl.ownerDocument);
        });
        more.setAttribute("aria-haspopup", "menu");
      }
    }
    const ending = article.createDiv({ cls: "vd-end-nav" });
    textButton(ending, "← Previous chapter", () => this.navigateChapter(-1));
    textButton(ending, "Next chapter →", () => this.navigateChapter(1));
    if (ref.verse !== undefined && (this.plugin.settings.bibleEdition !== "kjv" || this.plugin.settings.kjvDisplayMode === "word-study"))
      this.renderReaderInstantDetails(app);
    let companionReadyContext: { scrollTop: number; active: Element | null } | null = null;
    if (this.plugin.settings.bibleEdition === "kjv" && this.plugin.settings.kjvDisplayMode === "interlinear") {
      const companion = app.createDiv();
      this.interlinearPanel = new InterlinearPanel(companion, this.plugin,
        { book: ref.book, chapter: ref.chapter, verse: ref.verse ?? chapter.verses[0]?.verse ?? 1 },
        chapter.verses.at(-1)?.verse ?? 1, companionFocus, () => {
          const context = companionReadyContext;
          companionReadyContext = null;
          if (context && version === this.renderId && ref.verse !== undefined
            && this.scroll?.scrollTop === context.scrollTop && document.activeElement === context.active)
            this.scroll.querySelector<HTMLElement>(".vd-verse.is-selected")?.scrollIntoView({ block: "nearest", behavior: "auto" });
        });
    }
    const footer = app.createDiv({ cls: "vd-status-footer" });
    footer.createSpan({ text: metadata.abbreviation + " · " + metadata.books.length + " books · " + chapter.verses.length + " verses in chapter" });
    footer.createSpan({ text: "Offline • No account" });

    if (!changedChapter) this.scroll.scrollTop = previousScroll;
    const selectedRow = this.scroll.querySelector<HTMLElement>(".vd-verse.is-selected");
    if (ref.verse !== undefined && (changedChapter || changedLayout || focusedVerse !== undefined))
      selectedRow?.scrollIntoView({ block: changedChapter || changedLayout ? "center" : "nearest", behavior: "auto" });
    // Replacing the Reader DOM should never strand keyboard users on the document body.
    if (focusWithinReader && document.activeElement === document.body) {
      const word = this.plugin.selectedWord
        ? selectedRow?.querySelector<HTMLElement>('[data-word-index="' + this.plugin.selectedWord.index + '"]') : null;
      (word ?? (focusedVerse !== undefined ? selectedRow : null) ?? this.scroll).focus({ preventScroll: true });
    }
    companionReadyContext = { scrollTop: this.scroll.scrollTop, active: document.activeElement };
  }
}
