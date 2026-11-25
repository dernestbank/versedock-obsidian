import type { SwordDockController } from "../controller";
import { CROSS_REFERENCE_LICENSE, CROSS_REFERENCE_SOURCE } from "../core/cross-references";
import { refLabel, type PassageReference } from "../core/references";
import { textButton } from "./components";

/** Related coordinates are local; only the explicit source links open a website. */
export function crossReferenceAttribution(parent: HTMLElement): void {
  const credit = parent.createDiv({ cls: "vd-cross-reference-credit" });
  credit.createEl("a", { text: "OpenBible.info", attr: { href: CROSS_REFERENCE_SOURCE, target: "_blank", rel: "noreferrer" } });
  credit.createSpan({ text: " · " });
  credit.createEl("a", { text: "CC BY 4.0", attr: { href: CROSS_REFERENCE_LICENSE, target: "_blank", rel: "noreferrer" } });
}

export function renderCrossReferencePanel(parent: HTMLElement, plugin: SwordDockController,
  ref: PassageReference, compact: boolean, more?: () => void): void {
  if (!compact) parent.createEl("h3", { text: "Related passages" });
  const results = parent.createDiv({ cls: "vd-cross-reference-list" + (compact ? " is-compact" : ""), attr: { "aria-busy": "true", "aria-live": "polite" } });
  results.createEl("p", { cls: "vd-subtle", text: "Loading local cross-references…" });
  if (compact && more) textButton(parent, "View all references", more, "vd-study-card-link");
  crossReferenceAttribution(parent);
  if (!compact) {
    const about = parent.createEl("details", { cls: "vd-notes-discovery-help" });
    about.createEl("summary", { text: "About these references" });
    about.createEl("p", { text: "Coordinates and community votes by OpenBible.info, CC BY 4.0. Converted to book JSON by SwordDock. Ranked by votes; up to twelve unique targets are shown. Previews are excerpts from the installed public-domain WEB. References with unavailable coordinates or targets spanning chapters are omitted. Matching coordinates do not guarantee equivalent versification." });
  }
  void (async () => {
    try {
      if (ref.verse === undefined) {
        results.setText("Select a verse or range in the Reader to see related passages.");
        return;
      }
      const references = await plugin.crossReferences.lookup(ref, compact ? 3 : 12);
      if (!results.isConnected) return;
      results.empty();
      if (!references.length) {
        results.createEl("p", { cls: "vd-subtle", text: "No related passages in this resource for " + refLabel(ref) + "." });
        return;
      }
      for (const { reference } of references) {
        if (!results.isConnected) return;
        const item = results.createDiv({ cls: "vd-cross-reference-item" });
        const link = textButton(item, refLabel(reference), () => {
          plugin.selectReference(reference);
          void plugin.openReader();
        }, "vd-cross-reference-link");
        link.setAttribute("aria-label", "Open " + refLabel(reference) + " in Bible Reader");
        const excerpt = item.createEl("p", { cls: "vd-cross-reference-excerpt" });
        try {
          const verses = await plugin.library.getPassage(reference);
          if (!results.isConnected) return;
          const text = verses.map(verse => verse.text).join(" ");
          const limit = compact ? 180 : 400;
          excerpt.setText((text.length > limit ? text.slice(0, limit).replace(/\s+\S*$/, "") + "…" : text) + " — WEB");
        } catch {
          if (!results.isConnected) return;
          excerpt.setText("WEB preview unavailable. Review the installed Bible in Module Library.");
        }
      }
    } catch (error) {
      if (!results.isConnected) return;
      results.setText(error instanceof Error ? error.message : "Local cross-references unavailable.");
      textButton(results, "Open Module Library", () => { void plugin.openLibrary(); }, "vd-study-card-link");
    } finally { results.setAttribute("aria-busy", "false"); }
  })();
}
