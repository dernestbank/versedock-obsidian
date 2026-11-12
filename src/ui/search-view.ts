import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { MySwordController } from "../controller";
import { emptyState, textButton } from "./components";

export const SEARCH_VIEW = "versedock-search";
export class SearchView extends ItemView {
  private version = 0;
  constructor(leaf: WorkspaceLeaf, private readonly plugin: MySwordController) { super(leaf); }
  getViewType(): string { return SEARCH_VIEW; }
  getDisplayText(): string { return "VerseDock Search"; }
  getIcon(): string { return "search"; }
  async onOpen(): Promise<void> {
    this.contentEl.empty(); this.contentEl.addClass("versedock","vd-search");
    this.contentEl.createEl("h2", { text: "Search Scripture" });
    this.contentEl.createEl("p", { cls: "vd-subtle", text: "Search the installed WEB edition entirely offline." });
    const inputRow = this.contentEl.createDiv({ cls: "vd-search-input-row" });
    const input = inputRow.createEl("input", { attr: { type: "search", placeholder: "Search words or phrases", "aria-label": "Bible search phrase" } });
    const results = this.contentEl.createDiv({ cls: "vd-search-results" });
    const perform = async (): Promise<void> => {
      const id = ++this.version;
      const term = input.value.trim();
      results.empty();
      if (term.length < 2) { emptyState(results, "Enter a search term", "Use two or more letters to find verses.", "search"); return; }
      results.createEl("p", { cls: "vd-subtle", text: "Searching offline Bible..." });
      try {
        const found = await this.plugin.library.search(term, 80);
        if (id !== this.version) return;
        results.empty();
        results.createEl("p", { cls: "vd-subtle", text: found.length + (found.length === 80 ? "+ results (first 80 shown)" : " results") });
        for (const match of found) {
          const row = results.createDiv({ cls: "vd-search-result" });
          textButton(row, match.label, () => {
            this.plugin.selectReference({ book: match.book, chapter: match.chapter, verse: match.verse });
            void this.plugin.openReader();
          }, "vd-result-ref");
          row.createEl("p", { text: match.text });
        }
        if (!found.length) emptyState(results, "No matching verses", "Try fewer words, different spelling, or a shorter phrase.", "search-x");
      } catch(error) {
        if (id !== this.version) return;
        results.empty();
        emptyState(results, "Search unavailable", error instanceof Error ? error.message : String(error), "alert-circle");
      }
    };
    textButton(inputRow, "Search", () => { void perform(); }, "mod-cta");
    input.addEventListener("keydown", e => { if(e.key === "Enter") { e.preventDefault(); void perform(); } });
    emptyState(results, "Find a passage", "Search all 66 books with simple text matching. More advanced search comes in a future version.", "search");
  }
  async onClose(): Promise<void> { this.version++; this.contentEl.empty(); }
}
