import type { SwordDockController } from "../controller";
import { refLabel } from "../core/references";
import { describeMorphology } from "../core/morphology";
import { initialWordDetailsState, transitionWordDetails, type WordDetailsState, type WordDetailsTab, type WordSelection } from "../core/word-study";
import { iconButton, textButton } from "./components";
import { renderWordStudy } from "./word-study-panel";
import { renderWordOccurrences } from "./word-occurrences";

export interface WordDetailsContext {
  pin(word: WordSelection): void;
  clear(): void;
  openFull(word: WordSelection): void;
  readTagged(): void;
}

/** Updates only the footer for hover/tab changes; it never navigates the Reader. */
export class ReaderWordDetails {
  private readonly root: HTMLElement;
  private version = 0;
  private cancelSearch: (() => void) | null = null;
  constructor(parent: HTMLElement, private readonly plugin: SwordDockController, private state: WordDetailsState,
    private readonly scope: string, private readonly onChange: (state: WordDetailsState) => void,
    private readonly context?: WordDetailsContext) {
    this.root = parent.createDiv({ cls: "vd-reader-instant-details vd-word-details", attr: { role: "region", "aria-label": "Instant Details" } });
    this.render();
  }
  dispose(): void { this.version++; this.cancelSearch?.(); }
  preview(word: WordSelection): void { this.change({ type: "preview", word }); }
  pin(word: WordSelection): void { this.change({ type: "pin", word }); }
  clear(): void {
    this.change({ type: "clear" });
    this.root.querySelector<HTMLElement>(".vd-instant-details-toggle")?.focus({ preventScroll: true });
  }
  private change(event: Parameters<typeof transitionWordDetails>[1]): void {
    const next = transitionWordDetails(this.state, event);
    if (next === this.state) return;
    this.state = next; this.onChange(next); this.render();
  }
  private render(): void {
    const version = ++this.version;
    this.cancelSearch?.(); this.cancelSearch = null;
    const root = this.root;
    root.empty();
    root.dataset.detailsTab = this.state.tab;
    const head = root.createDiv({ cls: "vd-reader-instant-details-header" });
    const toggle = textButton(head, "Instant Details", () => {
      this.change({ type: "toggle" });
      root.querySelector<HTMLElement>(".vd-instant-details-toggle")?.focus({ preventScroll: true });
    }, "vd-instant-details-toggle");
    toggle.setAttribute("aria-expanded", String(this.state.expanded));
    toggle.setAttribute("aria-controls", this.scope + "-word-body");
    const word = this.state.word;
    if (word) {
      head.createSpan({ cls: "vd-word-preview-label", text: (this.state.pinned ? "Pinned" : "Preview") + " · “" + word.token.text + "”" });
      if (!this.state.pinned) iconButton(head, "pin", "Pin word “" + word.token.text + "”", () => {
        if (this.context) this.context.pin(word); else this.plugin.selectWord(word.ref, word.token, word.index);
      });
      iconButton(head, "x", this.state.pinned ? "Unpin word" : "Clear word preview", () => {
        if (this.context) { this.context.clear(); return; }
        if (this.plugin.selectedWord) {
          this.state = initialWordDetailsState(); this.onChange(this.state);
          this.plugin.clearSelectedWord(); return;
        }
        this.change({ type: "clear" });
        root.querySelector<HTMLElement>(".vd-instant-details-toggle")?.focus({ preventScroll: true });
      });
    }
    const body = root.createDiv({ cls: "vd-word-details-body", attr: { id: this.scope + "-word-body" } });
    body.hidden = !this.state.expanded;
    if (!word) {
      body.createEl("p", { cls: "vd-subtle", text: "Preview tagged KJV words with the pointer. Click or press Enter to pin one here." });
      textButton(body, "Read tagged KJV", () => {
        if (this.context) this.context.readTagged(); else void this.plugin.setBibleEdition("kjv").then(() => this.plugin.openReader());
      });
      return;
    }
    const tabs = body.createDiv({ cls: "vd-word-details-tabs", attr: { role: "tablist", "aria-label": "Word study tools" } });
    const options: Array<[WordDetailsTab, string]> = [["overview", "Word"], ["lexicon", "Lexicon"], ["occurrences", "Occurrences"]];
    const activate = (tab: WordDetailsTab): void => {
      this.change({ type: "tab", tab });
      root.querySelector<HTMLElement>('[data-word-tab="' + tab + '"]')?.focus({ preventScroll: true });
    };
    for (const [tab, label] of options) {
      const selected = this.state.tab === tab;
      const control = tabs.createEl(selected ? "button" : "div", { cls: "vd-word-details-tab" + (selected ? " is-active" : ""), text: label,
        attr: { role: "tab", "aria-selected": String(selected), "aria-controls": this.scope + "-word-panel", id: this.scope + "-word-tab-" + tab, ...(selected ? { type: "button" } : {}) } });
      control.dataset.wordTab = tab;
      control.tabIndex = selected ? 0 : -1;
      control.addEventListener("click", () => activate(tab));
      control.addEventListener("keydown", event => {
        if (!(event instanceof KeyboardEvent)) return;
        const index = options.findIndex(([value]) => value === tab);
        const next = event.key === "ArrowRight" ? options[(index + 1) % options.length][0]
          : event.key === "ArrowLeft" ? options[(index + options.length - 1) % options.length][0]
          : event.key === "Home" ? "overview" : event.key === "End" ? "occurrences" : null;
        if (next) { event.preventDefault(); activate(next); }
      });
    }
    const panel = body.createDiv({ cls: "vd-word-details-panel", attr: {
      role: "tabpanel", id: this.scope + "-word-panel", "aria-labelledby": this.scope + "-word-tab-" + this.state.tab
    } });
    if (this.state.tab === "lexicon") renderWordStudy(panel, this.plugin, true, word, this.context?.openFull);
    else if (this.state.tab === "occurrences") {
      const keys = word.token.strongs ?? [];
      const choose = panel.createDiv({ cls: "vd-word-key-selector" });
      const results = panel.createDiv();
      const loadKey = (key: string): void => {
        this.cancelSearch?.(); results.empty();
        for (const control of choose.querySelectorAll<HTMLButtonElement>("button")) control.setAttribute("aria-pressed", String(control.dataset.strongsKey === key));
        this.cancelSearch = renderWordOccurrences(results, this.plugin, key);
      };
      for (const key of keys) {
        const button = textButton(choose, key, () => loadKey(key)); button.dataset.strongsKey = key;
      }
      if (keys[0]) loadKey(keys[0]);
    } else void this.renderOverview(panel, word, version);
  }
  private async renderOverview(panel: HTMLElement, word: WordSelection, version: number): Promise<void> {
    const grid = panel.createDiv({ cls: "vd-instant-word-grid" });
    const identity = grid.createDiv({ cls: "vd-instant-word-identity" });
    const morphology = grid.createDiv({ cls: "vd-instant-word-grammar" });
    morphology.createEl("h4", { text: "Morphology" });
    if (word.token.morphology?.length) for (const code of word.token.morphology) {
      morphology.createEl("code", { text: code.replace(/^robinson:/, ""), attr: { title: code } });
      morphology.createEl("p", { text: describeMorphology(code) ?? "Source code · readable expansion unavailable" });
    } else morphology.createEl("p", { cls: "vd-subtle", text: "No morphology tag supplied." });
    const definition = grid.createDiv({ cls: "vd-instant-word-definition" });
    definition.createEl("h4", { text: "Strong’s definition" });
    const meaning = definition.createEl("p", { text: "Loading offline dictionary…" });
    panel.createEl("a", { cls: "vd-instant-word-credit", text: "CrossWire · Strong’s dictionaries · Public domain", attr: {
      href: "https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=" + (word.token.strongs?.[0]?.startsWith("H") ? "StrongsHebrew" : "StrongsGreek"), target: "_blank", rel: "noreferrer"
    } });
    try {
      const keys = word.token.strongs ?? [];
      const entry = keys[0] ? await this.plugin.lexicon.lookup(keys[0]) : null;
      if (version !== this.version || !panel.isConnected) return;
      identity.createEl("strong", { text: entry?.lemma || word.token.lemmas?.join(" · ") || word.token.text });
      if (entry?.transliteration) identity.createSpan({ text: entry.transliteration });
      identity.createSpan({ cls: "vd-instant-word-keys", text: keys.join(" · ") });
      identity.createSpan({ cls: "vd-subtle", text: refLabel(word.ref) + " · KJV" });
      meaning.setText(entry?.text ?? "No dictionary entry is available for this source identifier.");
      if (keys.length > 1) definition.createSpan({ cls: "vd-subtle", text: "This phrase has " + keys.length + " source links. Open Lexicon for all entries." });
    } catch (error) {
      if (version === this.version && panel.isConnected) meaning.setText(error instanceof Error ? error.message : "Dictionary unavailable.");
    }
  }
}
