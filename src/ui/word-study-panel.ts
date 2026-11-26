import type { SwordDockController } from "../controller";
import { refLabel } from "../core/references";
import { textButton } from "./components";
import { describeMorphology, MORPHOLOGY_SOURCE } from "../core/morphology";
import type { WordSelection } from "../core/word-study";
import { renderWordOccurrences } from "./word-occurrences";

/** Uses source tags only. All source content is rendered as inert text. */
export function renderWordStudy(parent: HTMLElement, plugin: SwordDockController, compact = false,
  selected: WordSelection | null = plugin.selectedWord, openFull?: (word: WordSelection) => void): () => void {
  const searches = new Set<() => void>();
  parent.addClass("vd-word-study");
  if (!selected && !plugin.kjv.metadata) {
    parent.createEl("p", { cls: "vd-subtle", text: "Select a word in the Berean companion to open its offline dictionary entry." });
    textButton(parent, "Open Berean companion", () => {
      void plugin.setBibleEdition("webp").then(() => plugin.setKjvDisplayMode("interlinear")).then(() => plugin.openReader());
    });
    return () => {};
  }
  if (!selected) {
    parent.createEl("p", { cls: "vd-subtle", text: "Select a tagged word in the KJV Reader to see its original-language links and dictionary entries." });
    textButton(parent, "Read tagged KJV", () => { void plugin.setBibleEdition("kjv").then(() => plugin.openReader()); });
    return () => {};
  }
  const { token, ref } = selected;
  const identity = parent.createDiv({ cls: "vd-word-identity" });
  identity.createEl("strong", { text: token.text });
  identity.createSpan({ cls: "vd-subtle", text: refLabel(ref) + " · KJV" });
  if (token.lemmas?.length) identity.createSpan({ cls: "vd-word-form", text: token.lemmas.join(" · ") });
  if (token.morphology?.length) {
    const morphology = parent.createDiv({ cls: "vd-word-morphology" });
    for (const code of token.morphology) {
      morphology.createEl("code", { text: code });
      morphology.createEl("p", { text: describeMorphology(code) ?? "No readable expansion is available for this source code." });
    }
    morphology.createEl("a", { text: "Robinson code guide", attr: { href: MORPHOLOGY_SOURCE, target: "_blank", rel: "noreferrer" } });
  }
  const entries = parent.createDiv({ cls: "vd-word-entries", attr: { "aria-busy": "true" } });
  entries.setText("Loading offline dictionary…");
  void (async () => {
    try {
      const definitions = await Promise.all((token.strongs ?? []).map(async key => ({ key, entry: await plugin.lexicon.lookup(key) })));
      if (!entries.isConnected) return;
      entries.empty();
      for (const { key, entry } of definitions) {
        const section = entries.createEl("section", { cls: "vd-word-definition" });
        section.createEl("h4", { text: key + (entry?.lemma ? " · " + entry.lemma : "") + (entry?.transliteration ? " · " + entry.transliteration : "") });
        section.createEl("p", { text: entry?.text ?? "This identifier has no entry in the bundled dictionary. The source tag is preserved." });
        if (!compact) {
          const results = section.createDiv();
          const find = textButton(section, "Find " + key + " occurrences in KJV", () => {
            find.disabled = true;
            searches.add(renderWordOccurrences(results, plugin, key));
          });
        }
      }
      entries.createEl("p", { cls: "vd-word-credit vd-subtle", text: "Strong’s dictionaries · James Strong, 1890 · Public domain · CrossWire Greek 2.0 / Hebrew 1.2. Source tags can link an English phrase to several words. Original morphology codes remain visible." });
      if (compact) textButton(entries, "Open full word study", () => {
        if (openFull) openFull(selected); else void plugin.openInspector("lexicon");
      });
    } catch (error) {
      if (entries.isConnected) entries.setText(error instanceof Error ? error.message : "Dictionary unavailable.");
    } finally { entries.setAttribute("aria-busy", "false"); }
  })();
  return () => { for (const cancel of searches) cancel(); searches.clear(); };
}
