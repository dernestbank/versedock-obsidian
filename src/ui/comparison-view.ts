import { ItemView, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import { BOOKS } from "../core/books";
import { parseOsis, referenceId, referenceContainsVerse, type PassageReference } from "../core/references";
import { comparisonEditionLabel, comparisonNumberingNotice, isComparisonEdition, restoredComparisonState, type ComparisonEdition } from "../core/comparison";
import type { StudyLinkGroup, StudyLinkMode, StudyLinkCause } from "../core/link-groups";
import type { SwordDockController } from "../controller";
import type { BibleResource } from "../core/library";
import { initialWordDetailsState, taggedWordSelection, wordSelectionKey, type WordSelection } from "../core/word-study";
import { emptyState, iconButton, linkButton, pill, textButton } from "./components";
import { ReaderWordDetails } from "./reader-word-details";
import { WordStudyModal } from "./word-study-modal";

export const COMPARISON_VIEW = "versedock-comparison";
let comparisonViewSequence = 0;
const MAX_COMPARISON_HISTORY = 100;

/** Two source editions, with independent verse coordinates and local passage text. */
export class ComparisonView extends ItemView {
  private unsubscribe: (() => void) | null = null;
  private unsubscribeLinks: (() => void) | null = null;
  private renderId = 0;
  private localRef: PassageReference | null = null;
  private backStack: PassageReference[] = [];
  private forwardStack: PassageReference[] = [];
  private leftEdition: ComparisonEdition;
  private rightEdition: ComparisonEdition;
  private readonly domScope = `sworddock-comparison-${++comparisonViewSequence}`;
  private wordState = initialWordDetailsState();
  private wordDetails: ReaderWordDetails | null = null;
  private hoverTimer: number | null = null;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: SwordDockController) {
    super(leaf);
    const initial = restoredComparisonState(null, plugin.settings.bibleEdition, plugin.currentRef, plugin.availableBibleEditions().map(edition=>edition.id));
    this.leftEdition = initial.leftEdition; this.rightEdition = initial.rightEdition;
  }
  getViewType(): string { return COMPARISON_VIEW; }
  getDisplayText(): string { return "SwordDock Bible Comparison"; }
  getIcon(): string { return "columns-2"; }
  getState(): Record<string, unknown> {
    return { leftEdition: this.leftEdition, rightEdition: this.rightEdition,
      reference: referenceId(this.localRef ?? this.plugin.currentRef) };
  }
  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    const restored = restoredComparisonState(state, this.plugin.settings.bibleEdition, this.plugin.currentRef, this.plugin.availableBibleEditions().map(edition=>edition.id));
    this.leftEdition = restored.leftEdition; this.rightEdition = restored.rightEdition;
    this.localRef = restored.reference;
    this.backStack = []; this.forwardStack = [];
    this.wordState = initialWordDetailsState();
    await super.setState(state, result);
    this.render();
  }

  async onOpen(): Promise<void> {
    this.localRef ??= this.plugin.currentRef;
    this.unsubscribe = this.plugin.subscribe(() => this.render(this.scrollPositions()));
    this.unsubscribeLinks = this.plugin.subscribeStudyLinks(event => {
      const assignment = this.plugin.getStudyLinkAssignment("comparison");
      if (assignment.group === "unlinked" || assignment.mode !== "follow" || event.group !== assignment.group) return;
      try {
        const next = parseOsis(event.osis);
        if (next.book.osis !== this.localRef?.book.osis || next.chapter !== this.localRef?.chapter)
          this.wordState = initialWordDetailsState();
        this.rememberReference(next);
        this.localRef = next;
      } catch { return; }
      this.render();
      this.app.workspace.requestSaveLayout();
    });
    this.render();
  }

  async onClose(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.unsubscribeLinks?.();
    this.unsubscribeLinks = null;
    this.renderId++;
    this.clearHover(); this.wordDetails?.dispose(); this.wordDetails = null;
    this.contentEl.empty();
  }

  private openLinkPopover(parent: HTMLElement): void {
    const current = parent.querySelector(".vd-link-popover");
    if (current) { current.remove(); return; }
    const pop = parent.createDiv({ cls: "vd-link-popover" });
    pop.createEl("h3", { text: "Study links" });
    pop.createEl("p", { cls: "vd-subtle", text: "Follow Reader only when both panes use the same group." });
    const assignment = this.plugin.getStudyLinkAssignment("comparison");
    const label = pop.createEl("label", { text: "Comparison link group" });
    const select = label.createEl("select", { attr: { "aria-label": "Comparison study link group" } });
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
      this.plugin.setStudyLinkAssignment("comparison", { group: chosen[2], mode: chosen[3] });
    });
  }

  private scrollPositions(): [number, number] {
    const bodies = this.contentEl.querySelectorAll<HTMLElement>(".vd-comparison-pane-body");
    return [bodies[0]?.scrollTop ?? 0, bodies[1]?.scrollTop ?? 0];
  }

  private editionLabel(edition: ComparisonEdition): string {
    return edition === "kjv" || edition === "webp" ? comparisonEditionLabel(edition)
      : this.plugin.availableBibleEditions().find(source=>source.id===edition)?.title ?? edition;
  }

  private clearHover(): void {
    if (this.hoverTimer !== null) window.clearTimeout(this.hoverTimer);
    this.hoverTimer = null;
  }

  private changeEdition(index: number, edition: ComparisonEdition): void {
    const positions = this.scrollPositions();
    positions[index] = 0;
    if (index === 0) this.leftEdition = edition; else this.rightEdition = edition;
    if (this.leftEdition !== "kjv" && this.rightEdition !== "kjv") this.wordState = initialWordDetailsState();
    this.render(positions);
    this.app.workspace.requestSaveLayout();
    this.contentEl.querySelector<HTMLElement>(`[data-vd-comparison-edition="${index === 0 ? "left" : "right"}"]`)?.focus({ preventScroll: true });
  }

  private pinWord(word: WordSelection): void {
    this.rememberReference(word.ref);
    this.localRef = { ...word.ref };
    this.updateHistoryButtons();
    this.wordDetails?.pin(word);
    for (const row of this.contentEl.querySelectorAll<HTMLElement>("[data-comparison-verse]"))
      row.toggleClass("is-selected", referenceContainsVerse(word.ref, Number(row.dataset.comparisonVerse)));
    this.app.workspace.requestSaveLayout();
  }

  private updateWordButtons(): void {
    const pinned = this.wordState.pinned && this.wordState.word ? wordSelectionKey(this.wordState.word) : null;
    for (const row of this.contentEl.querySelectorAll<HTMLElement>(".vd-comparison-verse")) {
      const buttons = [...row.querySelectorAll<HTMLButtonElement>("[data-comparison-word]")];
      const selected = buttons.find(button => button.dataset.comparisonWord === pinned);
      buttons.forEach((button, index) => {
        button.setAttribute("aria-pressed", String(button === selected));
        button.tabIndex = selected ? (button === selected ? 0 : -1) : index === 0 ? 0 : -1;
      });
    }
  }

  private render(restoreScroll?: [number, number]): void {
    const version = ++this.renderId;
    this.clearHover(); this.wordDetails?.dispose(); this.wordDetails = null;
    const root = this.contentEl;
    root.empty();
    root.addClass("versedock", "vd-comparison");
    const ref = this.localRef ?? this.plugin.currentRef;
    const header = root.createDiv({ cls: "vd-comparison-header" });
    const heading = header.createDiv();
    heading.createEl("h2", { text: ref.book.name + " " + ref.chapter });
    heading.createEl("p", { cls: "vd-subtle", text: "Compare chapters; each edition keeps its source verse numbers." });
    const actions = header.createDiv({ cls: "vd-toolbar-actions" });
    const back = iconButton(actions, "arrow-left", "Back to previous passage", () => this.travelHistory("back"));
    back.setAttribute("data-comparison-history", "back");
    back.disabled = this.backStack.length === 0;
    const forward = iconButton(actions, "arrow-right", "Forward to next passage", () => this.travelHistory("forward"));
    forward.setAttribute("data-comparison-history", "forward");
    forward.disabled = this.forwardStack.length === 0;
    iconButton(actions, "chevron-left", "Previous chapter", () => this.navigate(-1));
    iconButton(actions, "chevron-right", "Next chapter", () => this.navigate(1));
    linkButton(actions, this.plugin.getStudyLinkAssignment("comparison"), () => this.openLinkPopover(actions));
    textButton(actions, "Open Reader", () => { void this.plugin.openReader(); }, "mod-cta");

    const notice = root.createDiv({ cls: "vd-comparison-numbering", attr: { role: "status", "aria-live": "polite" } });
    notice.setText("Checking source verse numbers…");
    const panes = root.createDiv({ cls: "vd-comparison-panes" });
    const editions = [this.leftEdition, this.rightEdition];
    const sources = this.plugin.availableBibleEditions();
    const pending = editions.map(async (edition, index) => {
      const side = index === 0 ? "left" : "right";
      const sideLabel = index === 0 ? "Left" : "Right";
      const title = sources.find(source=>source.id===edition)?.title ?? edition;
      const pane = panes.createEl("section", { cls: "vd-comparison-pane", attr: { "aria-label": sideLabel + " comparison pane" } });
      const head = pane.createDiv({ cls: "vd-comparison-pane-head" });
      head.createEl("strong", { text: title });
      const controls = head.createDiv({ cls: "vd-comparison-edition-controls" });
      const select = controls.createEl("select", { attr: {
        "aria-label": sideLabel + " comparison edition", "data-vd-comparison-edition": side
      } });
      for (const source of sources) {
        select.createEl("option", { value: source.id, text: this.editionLabel(source.id) });
      }
      select.value = edition;
      select.addEventListener("change", () => {
        if (!isComparisonEdition(select.value, sources.map(source=>source.id))) return;
        this.changeEdition(index, select.value);
      });
      const status = pill(controls, "Opening…", "vd-version-chip");
      const body = pane.createDiv({ cls: "vd-comparison-pane-body", attr: {
        role: "region", tabindex: edition === "kjv" ? "-1" : "0", "aria-label": sideLabel + " " + this.editionLabel(edition) + " chapter text"
      } });
      try {
        const bible = await this.plugin.getBibleResource(edition);
        if(version!==this.renderId)return null;
        status.setText(bible?.metadata ? "Offline" : "Unavailable");
        if (!bible?.metadata) throw new Error("Recheck this edition in Module Library.");
        body.setAttribute("dir",bible.metadata.rightToLeft ? "rtl" : "ltr");
        return await this.renderPrimary(body, ref, version, edition, bible, restoreScroll?.[index]);
      } catch(error) {
        if(version===this.renderId) {
          status.setText("Unavailable");
          emptyState(body, this.editionLabel(edition)+" is unavailable",error instanceof Error?error.message:"Recheck Module Library.","languages");
        }
        return null;
      }
    });
    void Promise.all(pending).then(numbers => {
      if (version !== this.renderId || !notice.isConnected) return;
      if (numbers[0] === null || numbers[1] === null) {
        notice.setText("Source verse numbers could not be compared because a chapter is unavailable.");
        return;
      }
      const message = comparisonNumberingNotice(this.editionLabel(editions[0]), numbers[0], this.editionLabel(editions[1]), numbers[1]);
      notice.setText(message ?? "");
      notice.hidden = message === null;
    });
    this.wordDetails = new ReaderWordDetails(root, this.plugin, this.wordState, this.domScope, state => {
      this.wordState = state; this.updateWordButtons();
    }, {
      pin: word => this.pinWord(word),
      clear: () => this.wordDetails?.clear(),
      openFull: word => new WordStudyModal(this.plugin, word).open(),
      readTagged: () => this.changeEdition(0, "kjv")
    });
  }

  private async renderPrimary(parent: HTMLElement, ref: PassageReference, version: number, edition: ComparisonEdition, bible: BibleResource, scrollTop?: number): Promise<number[] | null> {
    try {
      const chapter = await bible.getChapter(ref);
      if (version !== this.renderId) return null;
      for (const verse of chapter.verses) {
        const verseRef = { book: ref.book, chapter: ref.chapter, verse: verse.verse };
        const row = parent.createDiv({ cls: "vd-comparison-verse", attr: {
          role: "group", "aria-label": this.editionLabel(edition) + " " + ref.book.name + " " + ref.chapter + ":" + verse.verse
        } });
        row.dataset.comparisonVerse = String(verse.verse);
        row.toggleClass("is-selected", ref.verse !== undefined && referenceContainsVerse(ref, verse.verse));
        row.createEl("sup", { text: String(verse.verse) });
        const text = row.createSpan();
        if (edition === "kjv" && verse.tokens) verse.tokens.forEach((token, index) => {
          const classes = (token.redLetter ? " vd-red-letter" : "") + (token.added ? " vd-added-word" : "");
          const word = taggedWordSelection(edition, verseRef, token, index);
          if (!word) { text.createSpan({ cls: classes.trim(), text: token.text }); return; }
          const button = text.createEl("button", { cls: "vd-tagged-word" + classes, text: token.text, attr: {
            type: "button", "aria-label": "Study “" + token.text + "” · " + token.strongs!.join(", ") + " · KJV comparison"
          } });
          button.dataset.comparisonWord = wordSelectionKey(word);
          button.addEventListener("click", event => {
            event.stopPropagation();
            if (!window.getSelection()?.isCollapsed) return;
            this.pinWord(word);
            window.requestAnimationFrame(() => {
              if (button.isConnected) button.scrollIntoView({ block: "nearest", inline: "nearest" });
            });
          });
          button.addEventListener("pointerenter", event => {
            if (event.pointerType !== "mouse" || this.wordState.pinned) return;
            this.clearHover();
            this.hoverTimer = window.setTimeout(() => {
              this.hoverTimer = null;
              if (button.isConnected) this.wordDetails?.preview(word);
            }, 160);
          });
          button.addEventListener("pointerleave", () => this.clearHover());
          button.addEventListener("keydown", event => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            const words = [...row.querySelectorAll<HTMLButtonElement>("[data-comparison-word]")];
            const next = words[words.indexOf(button) + (event.key === "ArrowRight" ? 1 : -1)];
            if (next) { event.preventDefault(); next.focus({ preventScroll: true }); }
          });
        });
        else text.setText(verse.text);
      }
      this.updateWordButtons();
      if (scrollTop !== undefined) parent.scrollTop = scrollTop;
      return chapter.verses.map(verse => verse.verse);
    } catch (error) {
      if (version !== this.renderId) return null;
      emptyState(parent, "Chapter unavailable", error instanceof Error ? error.message : String(error), "alert-triangle");
      return null;
    }
  }

  private rememberReference(next: PassageReference): void {
    const current = this.localRef ?? this.plugin.currentRef;
    if (referenceId(current) === referenceId(next)) return;
    this.backStack.push(current);
    if (this.backStack.length > MAX_COMPARISON_HISTORY) this.backStack.shift();
    this.forwardStack = [];
  }

  private updateHistoryButtons(): void {
    for (const [direction, stack] of [["back", this.backStack], ["forward", this.forwardStack]] as const) {
      const button = this.contentEl.querySelector<HTMLButtonElement>(`[data-comparison-history="${direction}"]`);
      if (button) button.disabled = stack.length === 0;
    }
  }

  private travelHistory(direction: "back" | "forward"): void {
    const from = direction === "back" ? this.backStack : this.forwardStack;
    const to = direction === "back" ? this.forwardStack : this.backStack;
    const target = from.pop();
    if (!target) return;
    to.push(this.localRef ?? this.plugin.currentRef);
    this.showReference(target, "history");
  }

  private showReference(next: PassageReference, cause: StudyLinkCause): void {
    this.wordState = initialWordDetailsState();
    this.localRef = next;
    const assignment = this.plugin.getStudyLinkAssignment("comparison");
    if (assignment.group !== "unlinked" && assignment.mode === "follow") {
      this.plugin.selectReference(next, "comparison", cause);
    } else {
      this.render();
    }
    this.app.workspace.requestSaveLayout();
  }

  private navigate(delta: number): void {
    const ref = this.localRef ?? this.plugin.currentRef;
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
    const next = { book, chapter };
    this.rememberReference(next);
    this.showReference(next, "navigation");
  }
}
