import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { SwordDockController } from "../controller";
import { BOOKS, BOOK_BY_OSIS } from "../core/books";
import {
  MAX_SEARCH_PHRASE_LENGTH,
  parseBibleSearchMatch,
  parseBibleSearchScope,
  prepareBibleSearchQuery
} from "../core/search";
import { emptyState, textButton } from "./components";
import { renderSearchHighlights } from "./search-highlights";

export const SEARCH_VIEW = "versedock-search";
export class SearchView extends ItemView {
  private version = 0;
  private activeSearch: AbortController | null = null;
  private unsubscribe: (() => void) | null = null;
  constructor(leaf: WorkspaceLeaf, private readonly plugin: SwordDockController) { super(leaf); }
  getViewType(): string { return SEARCH_VIEW; }
  getDisplayText(): string { return "SwordDock Bible Search"; }
  getIcon(): string { return "search"; }
  async onOpen(): Promise<void> {
    this.contentEl.empty(); this.contentEl.addClass("versedock","vd-search");
    this.contentEl.createEl("h2", { text: "Search Scripture" });
    const editionInfo = this.contentEl.createEl("p", { cls: "vd-subtle", text: "Search " + this.plugin.readerBible.metadata?.abbreviation + " offline by chapter, book, or testament. Change editions in Reader." });
    const filterRow = this.contentEl.createDiv({ cls: "vd-search-filter-row" });
    const scopeLabel = filterRow.createEl("label", { text: "Search in" });
    const scope = scopeLabel.createEl("select", { attr: { "aria-label": "Bible search scope" } });
    for (const [value, label] of [
      ["all", "Whole Bible"],
      ["current-chapter", "Current chapter · " + this.plugin.currentRef.book.name + " " + this.plugin.currentRef.chapter],
      ["current-book", "Current book · " + this.plugin.currentRef.book.name],
      ["selected-book", "Selected book"],
      ["old-testament", "Old Testament"],
      ["new-testament", "New Testament"]
    ] as const) scope.createEl("option", { value, text: label });
    const bookLabel = filterRow.createEl("label", { text: "Book" });
    const selectedBook = bookLabel.createEl("select", { attr: { "aria-label": "Selected Bible book" } });
    for (const book of BOOKS) selectedBook.createEl("option", {value: book.osis, text: book.name});
    selectedBook.value = this.plugin.currentRef.book.osis;
    let selectedBookOverridden = false;
    bookLabel.hidden = true;
    const matchLabel = filterRow.createEl("label", { text: "Match" });
    const matchMode = matchLabel.createEl("select", { attr: { "aria-label": "Bible search match mode" } });
    matchMode.createEl("option", { value: "phrase", text: "Exact phrase" });
    matchMode.createEl("option", { value: "all-words", text: "All words" });
    matchMode.createEl("option", { value: "any-words", text: "Any words" });
    const inputRow = this.contentEl.createDiv({ cls: "vd-search-input-row" });
    const input = inputRow.createEl("input", { attr: {
      type: "search",
      placeholder: "Search words or phrases",
      "aria-label": "Bible search phrase",
      autocomplete: "off",
      maxlength: String(MAX_SEARCH_PHRASE_LENGTH)
    } });
    const status = this.contentEl.createDiv({ cls: "vd-subtle vd-search-status", attr: { role: "status", "aria-live": "polite" } });
    const results = this.contentEl.createDiv({ cls: "vd-search-results" });
    const perform = async (): Promise<void> => {
      const id = ++this.version;
      const term = input.value.trim();
      this.activeSearch?.abort();
      this.activeSearch = null;
      status.empty();
      status.setAttribute("aria-busy", "false");
      results.empty();
      if (term.length < 2) {
        emptyState(results, "Enter a search term", "Use two or more letters to find verses.", "search");
        return;
      }
      const controller = new AbortController();
      this.activeSearch = controller;
      status.setAttribute("aria-busy", "true");
      status.setText("Searching offline Bible…");
      try {
        const selectedMatch = parseBibleSearchMatch(matchMode.value);
        const preparedQuery = prepareBibleSearchQuery(term, selectedMatch);
        const bible = this.plugin.readerBible;
        const page = await bible.search({
          phrase: term,
          scope: parseBibleSearchScope(scope.value),
          match: selectedMatch,
          currentBook: this.plugin.currentRef.book,
          currentChapter: this.plugin.currentRef.chapter,
          selectedBook: BOOK_BY_OSIS.get(selectedBook.value),
          limit: 80,
          signal: controller.signal
        });
        if (id !== this.version) return;
        const found = page.results;
        results.empty();
        status.setText(bible.metadata?.abbreviation + " · " + (page.truncated ? found.length + "+ results (first " + found.length + " shown)" : found.length + " results"));
        for (const result of found) {
          const row = results.createDiv({ cls: "vd-search-result" });
          textButton(row, result.label, () => {
            this.plugin.selectReference({ book: result.book, chapter: result.chapter, verse: result.verse });
            void this.plugin.openReader();
          }, "vd-result-ref");
          const verseText = row.createEl("p");
          renderSearchHighlights(verseText, result.text, preparedQuery);
        }
        if (!found.length) emptyState(results, "No matching verses", "Try fewer words, different spelling, or a shorter phrase.", "search-x");
      } catch(error) {
        if (id !== this.version) return;
        status.empty();
        results.empty();
        emptyState(results, "Search unavailable", error instanceof Error ? error.message : String(error), "alert-circle");
      } finally {
        if (this.activeSearch === controller) {
          status.setAttribute("aria-busy", "false");
          this.activeSearch = null;
        }
      }
    };
    textButton(inputRow, "Search", () => { void perform(); }, "mod-cta");
    input.addEventListener("keydown", e => { if(e.key === "Enter") { e.preventDefault(); void perform(); } });
    scope.addEventListener("change", () => {
      bookLabel.hidden = scope.value !== "selected-book";
      if (input.value.trim().length >= 2) void perform();
    });
    selectedBook.addEventListener("change", () => {
      selectedBookOverridden = true;
      if (input.value.trim().length >= 2) void perform();
    });
    matchMode.addEventListener("change", () => { if (input.value.trim().length >= 2) void perform(); });
    emptyState(results, "Find a passage", "Enter two or more letters, choose a scope and match style, and search the selected Bible edition.", "search");
    let lastEdition = this.plugin.settings.bibleEdition;
    let lastBible = this.plugin.readerBible;
    const currentChapterOption = scope.querySelector<HTMLOptionElement>('option[value="current-chapter"]');
    const currentBookOption = scope.querySelector<HTMLOptionElement>('option[value="current-book"]');
    this.unsubscribe = this.plugin.subscribe(() => {
      const sourceChanged = lastEdition !== this.plugin.settings.bibleEdition || lastBible !== this.plugin.readerBible;
      lastEdition = this.plugin.settings.bibleEdition;
      lastBible = this.plugin.readerBible;
      editionInfo.setText("Search " + this.plugin.readerBible.metadata?.abbreviation + " offline by chapter, book, or testament. Change editions in Reader.");
      const current = this.plugin.currentRef;
      if (currentChapterOption) currentChapterOption.textContent = "Current chapter · " + current.book.name + " " + current.chapter;
      if (currentBookOption) currentBookOption.textContent = "Current book · " + current.book.name;
      if (!selectedBookOverridden || scope.value !== "selected-book") selectedBook.value = current.book.osis;
      if (input.value.trim().length >= 2 && (sourceChanged || scope.value === "current-chapter" || scope.value === "current-book")) void perform();
    });
    input.focus();
  }
  async onClose(): Promise<void> {
    this.version++;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.activeSearch?.abort();
    this.activeSearch = null;
    this.contentEl.empty();
  }
}
