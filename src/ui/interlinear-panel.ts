import type { SwordDockController } from "../controller";
import { interlinearLexiconKey, interlinearWordsForOrder, type InterlinearVerse, type InterlinearWord } from "../core/interlinear";
import type { InterlinearPreferences } from "../core/interlinear-preferences";
import { refLabel, type PassageReference } from "../core/references";
import { textButton, iconButton } from "./components";

/** A selected-verse companion, with its own source selection and async lifetime. */
export class InterlinearPanel {
  private version = 0;
  private selectionVersion = 0;
  private disposed = false;
  private verse: InterlinearVerse | null = null;
  private selected: number | null = null;
  constructor(private readonly root: HTMLElement, private readonly plugin: SwordDockController, private readonly ref: PassageReference, private readonly lastVerse: number, private focusControl?: string, private readonly onReady?: () => void) {
    root.addClass("vd-interlinear");
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", "Berean interlinear companion");
    void this.load();
  }
  dispose(): void { this.disposed = true; ++this.version; ++this.selectionVersion; }

  private async load(): Promise<void> {
    const version = ++this.version;
    this.root.createEl("p", { cls: "vd-subtle", text: "Loading offline Berean interlinear…", attr: { role: "status" } });
    try {
      this.verse = await this.plugin.interlinear.getVerse(this.ref);
      if (this.disposed || version !== this.version) return;
      this.render();
      this.onReady?.();
    } catch (error) {
      if (this.disposed || version !== this.version) return;
      this.root.empty();
      this.root.createEl("strong", { text: "Berean interlinear unavailable" });
      this.root.createEl("p", { text: error instanceof Error ? error.message : "The offline source could not be read." });
      textButton(this.root, "Recheck companion", () => { void this.plugin.interlinear.initialize().then(() => { if (!this.disposed) void this.load(); }); });
    }
  }
  private update<K extends keyof InterlinearPreferences>(key: K, value: InterlinearPreferences[K]): void {
    this.plugin.settings.interlinear = { ...this.plugin.settings.interlinear, [key]: value };
    void this.plugin.saveSettings();
    const focus = (this.root.ownerDocument.activeElement as HTMLElement | null)?.dataset.interlinearControl;
    const displayOpen = this.root.querySelector<HTMLDetailsElement>(".vd-interlinear-display")?.open ?? false;
    this.render(displayOpen);
    this.onReady?.();
    if (focus) this.root.querySelector<HTMLElement>(`[data-interlinear-control="${focus}"]`)?.focus({ preventScroll: true });
  }
  private render(displayOpen = false): void {
    ++this.selectionVersion;
    const root = this.root;
    const focusControl = this.focusControl;
    this.focusControl = undefined;
    const restoreFocus = root.ownerDocument.activeElement === root.ownerDocument.body;
    root.empty();
    const prefs = this.plugin.settings.interlinear;
    root.dataset.font = prefs.font;
    root.style.setProperty("--vd-original-size", prefs.size + "px");
    const head = root.createDiv({ cls: "vd-interlinear-head" });
    const title = head.createDiv();
    title.createEl("strong", { text: "Berean interlinear companion" });
    title.createSpan({ cls: "vd-interlinear-reference", text: refLabel(this.ref) });
    const navigation = head.createDiv({ cls: "vd-interlinear-navigation" });
    const move = (delta: number): void => this.plugin.selectReference({ book: this.ref.book, chapter: this.ref.chapter, verse: this.ref.verse! + delta });
    const previous = iconButton(navigation, "chevron-left", "Previous companion verse", () => move(-1)); previous.disabled = this.ref.verse === 1;
    const next = iconButton(navigation, "chevron-right", "Next companion verse", () => move(1)); next.disabled = this.ref.verse! >= this.lastVerse;
    previous.dataset.interlinearControl = "previous"; next.dataset.interlinearControl = "next";
    root.createEl("p", { cls: "vd-interlinear-source", text: `Original words with Berean English glosses. ${this.plugin.settings.bibleEdition === "kjv" ? "KJV" : "WEB"} Scripture is shown above.` });
    const controls = root.createDiv({ cls: "vd-interlinear-controls" });
    const orderLabel = controls.createEl("label", { text: "Word order " });
    const order = orderLabel.createEl("select", { attr: { "aria-label": "Interlinear word order", "data-interlinear-control": "order" } });
    order.createEl("option", { value: "source", text: "Original" }); order.createEl("option", { value: "english", text: "Berean English" });
    order.value = prefs.order;
    order.addEventListener("change", () => this.update("order", order.value === "english" ? "english" : "source"));
    const display = controls.createEl("details", { cls: "vd-interlinear-display" }); display.open = displayOpen;
    display.createEl("summary", { text: "Display", attr: { "data-interlinear-control": "display" } });
    const options = display.createDiv({ cls: "vd-interlinear-options" });
    for (const [key, text] of [["transliteration", "Transliteration"], ["gloss", "Berean gloss"], ["strongs", "Strong’s number"], ["grammar", "Grammar"]] as const) {
      const label = options.createEl("label");
      const toggle = label.createEl("input", { type: "checkbox", attr: { "data-interlinear-control": key } }); toggle.checked = prefs[key];
      label.createSpan({ text }); toggle.addEventListener("change", () => this.update(key, toggle.checked));
    }
    const fontLabel = options.createEl("label", { text: "Original typeface " });
    const font = fontLabel.createEl("select", { attr: { "aria-label": "Original typeface", "data-interlinear-control": "font" } });
    font.createEl("option", { value: "system", text: "System" }); font.createEl("option", { value: "serif", text: "Serif" }); font.value = prefs.font;
    font.addEventListener("change", () => this.update("font", font.value === "serif" ? "serif" : "system"));
    const sizeLabel = options.createEl("label", { text: "Original size " + prefs.size + " px " });
    const size = sizeLabel.createEl("input", { type: "range", attr: { min: "18", max: "36", step: "1", "aria-label": "Original text size", "data-interlinear-control": "size" } });
    size.value = String(prefs.size); size.addEventListener("change", () => this.update("size", Number(size.value)));
    if (!this.verse) {
      root.createEl("p", { text: "No companion verse is supplied at this reference.", attr: { role: "status" } });
      return;
    }
    const words = interlinearWordsForOrder(this.verse.words, prefs.order);
    if (!words.length) root.createEl("p", { cls: "vd-interlinear-empty", text: "The Berean source supplies no original words at this reference. The selected Scripture verse is shown above.", attr: { role: "status" } });
    const rtl = prefs.order === "source" && words.every(word => word.language !== "greek");
    const grid = root.createDiv({ cls: "vd-interlinear-words", attr: { dir: rtl ? "rtl" : "ltr", role: "group", "aria-label": "Original words in " + (prefs.order === "source" ? "source" : "Berean English") + " order" } });
    const detail = root.createDiv({ cls: "vd-interlinear-detail", attr: { role: "status", "aria-live": "polite", "aria-atomic": "true" } });
    const buttons: HTMLButtonElement[] = [];
    for (const [index, word] of words.entries()) {
      const button = grid.createEl("button", { cls: "vd-interlinear-word", attr: { type: "button", "aria-label": word.language + " word " + word.pos + ": " + word.text + (word.gloss ? ", " + word.gloss : ", gloss not supplied"), "aria-pressed": String(this.selected === word.pos) } });
      button.dataset.sourcePosition = String(word.pos);
      button.tabIndex = this.selected === word.pos || this.selected === null && index === 0 ? 0 : -1;
      button.createSpan({ cls: "vd-interlinear-original", text: word.text, attr: { lang: word.language === "greek" ? "el" : word.language === "aramaic" ? "arc" : "he", dir: word.language === "greek" ? "ltr" : "rtl" } });
      for (const [key, value, label] of [["transliteration", word.transliteration, "Transliteration"], ["gloss", word.gloss, "Berean gloss"], ["strongs", word.strongs, "Strong’s number"], ["grammar", word.parsing, "Grammar"]] as const) {
        if (!prefs[key]) continue;
        button.createSpan({ cls: "vd-interlinear-row vd-interlinear-" + key + (value === null ? " is-missing" : ""), text: value ?? "—", attr: { dir: "ltr", title: label + ": " + (value ?? "not supplied") } });
      }
      button.addEventListener("click", () => {
        this.selected = word.pos;
        for (const candidate of buttons) { const selected = candidate === button; candidate.setAttribute("aria-pressed", String(selected)); candidate.tabIndex = selected ? 0 : -1; }
        void this.showWord(detail, word);
        detail.scrollIntoView({ block: "nearest" });
      });
      button.addEventListener("keydown", event => {
        const delta = event.key === "ArrowRight" ? (rtl ? -1 : 1) : event.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0;
        const target = event.key === "Home" ? 0 : event.key === "End" ? words.length - 1 : delta ? (index + delta + words.length) % words.length : -1;
        if (target < 0) return;
        event.preventDefault();
        buttons.forEach((candidate, i) => candidate.tabIndex = i === target ? 0 : -1); buttons[target].focus();
      });
      buttons.push(button);
    }
    if (this.selected !== null) {
      const word = words.find(word => word.pos === this.selected);
      if (word) void this.showWord(detail, word);
    }
    const credit = root.createEl("details", { cls: "vd-interlinear-credit" });
    credit.createEl("summary", { text: "Source and row guide" });
    credit.createEl("p", { text: "Berean Standard Bible interlinear tables · Public domain. Free Use Bible API format adaptation. Source and Berean English ranks are preserved per word; repeated Strong’s numbers remain separate. A dash means the source did not supply that row. Word selection opens the bundled Strong’s dictionary." });
    credit.createEl("p", { text: "English order follows the Berean glosses. Scripture above follows the selected edition." });
    credit.createEl("a", { text: "Berean source and terms", attr: { href: "https://berean.bible/terms.htm", target: "_blank", rel: "noreferrer" } });
    if (focusControl && restoreFocus) {
      const control = focusControl === "previous" ? previous : focusControl === "next" ? next : order;
      (control.disabled ? order : control).focus({ preventScroll: true });
    }
  }
  private async showWord(detail: HTMLElement, word: InterlinearWord): Promise<void> {
    const version = ++this.selectionVersion;
    detail.empty();
    detail.createEl("strong", { text: word.text, attr: { dir: "auto" } });
    detail.createEl("p", { text: refLabel(this.ref) + " · Berean source word " + word.pos + " · English rank " + word.bsbPos + " · " + word.language });
    detail.createEl("p", { text: "Berean gloss: " + (word.gloss ?? "Not supplied") });
    detail.createEl("p", { text: "Grammar: " + (word.parsingFull ?? word.parsing ?? "Not supplied") });
    const key = interlinearLexiconKey(word.strongs);
    const definition = detail.createEl("p", { text: key ? "Loading offline Strong’s definition…" : "Strong’s identifier not supplied." });
    if (!key) return;
    try {
      const entry = await this.plugin.lexicon.lookup(key);
      if (this.disposed || version !== this.selectionVersion || !detail.isConnected) return;
      definition.setText(word.strongs + " · Strong’s dictionary: " + (entry ? entry.lemma + " · " + entry.text : "No entry available."));
    } catch (error) {
      if (!this.disposed && version === this.selectionVersion && detail.isConnected) definition.setText(error instanceof Error ? error.message : "Dictionary unavailable.");
    }
  }
}
