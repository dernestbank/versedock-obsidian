import type { SwordDockController } from "../controller";
import { strongsMatchesDictionary } from "../core/resource-dock";
import { textButton } from "./components";
import { strongsAnnotations } from "./resource-annotations";

/** A standalone offline lookup, also used in language-specific dictionary panels. */
export function renderStrongsLookup(parent: HTMLElement, plugin: SwordDockController, query: string,
  saveQuery: (query: string) => void, dictionary?: string): void {
  const language = dictionary === "strongs-greek" ? "Greek" : "Hebrew";
  const hint = dictionary ? (language === "Greek" ? "G25" : "H430") : "G25 or H430";
  const form = parent.createEl("form", { cls: "vd-resource-dictionary-search" });
  const label = form.createEl("label", { text: "Look up a Strong’s identifier (" + hint + ")" });
  const input = label.createEl("input", { cls: "vd-resource-dictionary-query", attr: {
    type: "search", maxlength: "6", autocomplete: "off", spellcheck: "false"
  } });
  const result = parent.createDiv({ cls: "vd-word-entries", attr: { "aria-live": "polite" } });
  input.value = query;
  let revision = 0;
  input.addEventListener("input", () => { revision++; result.empty(); saveQuery(input.value); });
  const valid = (key: string) => dictionary ? strongsMatchesDictionary(dictionary, key)
    : strongsMatchesDictionary("strongs-greek", key) || strongsMatchesDictionary("strongs-hebrew", key);
  const lookup = async (): Promise<void> => {
    const request = ++revision;
    const key = input.value.trim().toUpperCase();
    if (!valid(key)) {
      result.setText("Enter a Strong’s identifier such as " + hint + ".");
      return;
    }
    result.setText("Looking up " + key + "…");
    try {
      const entry = await plugin.lexicon.lookup(key);
      if (!result.isConnected || request !== revision) return;
      result.empty();
      result.createEl("h4", { text: key + (entry?.lemma ? " · " + entry.lemma : "") });
      if (entry?.transliteration) result.createEl("p", { cls: "vd-subtle", text: entry.transliteration });
      const definition = result.createEl("p", { text: entry?.text ?? "No entry is available for this identifier." });
      if (entry) strongsAnnotations(definition, plugin, key);
    } catch {
      if (result.isConnected && request === revision) result.setText("The offline dictionary could not be read.");
    }
  };
  textButton(form, "Look up", () => { void lookup(); }, "mod-cta");
  form.addEventListener("submit", event => { event.preventDefault(); void lookup(); });
  if (valid(query.trim())) void lookup();
}
