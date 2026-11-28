import { Notice } from "obsidian";
import type { SwordDockController } from "../controller";
import { commentarySectionsForPassage } from "../core/installed-study";
import { modulePlainText } from "../core/reading-modules";
import { refLabel, type PassageReference } from "../core/references";
import { renderCommentaryPanel } from "./commentary-panel";
import { textButton } from "./components";
import { DiscoveryWizard } from "./discovery-wizard";
import { InstalledStudyPanel } from "./installed-study-panel";

export function renderInspectorCommentary(parent: HTMLElement, plugin: SwordDockController,
  ref: PassageReference, more?: () => void): () => void {
  const installed = plugin.modules.installed.filter(module => module.kind === "commentary");
  const controls = parent.createDiv({ cls: "vd-inspector-commentary-controls" });
  const label = controls.createEl("label", { text: "Commentary source" });
  const select = label.createEl("select", { attr: { "aria-label": "Commentary source" } });
  select.createEl("option", { value: "mhc", text: "Matthew Henry's Commentary" });
  for (const module of installed) select.createEl("option", { value: module.id, text: module.title });
  const selected = installed.find(module => module.id === plugin.settings.inspectorCommentary);
  select.value = selected?.id ?? "mhc";
  select.addEventListener("change", () => {
    const inspector = parent.closest(".vd-inspector");
    void plugin.setInspectorCommentary(select.value).catch(() => new Notice("Could not save the Inspector commentary preference."));
    inspector?.querySelector<HTMLSelectElement>(".vd-inspector-commentary-controls select")?.focus();
  });
  textButton(controls, "Find commentaries", () => new DiscoveryWizard(plugin, "commentary").open());
  if (!selected) {
    if (plugin.settings.inspectorCommentary !== "mhc") {
      parent.createEl("p", { cls: "vd-subtle", text: "Your preferred commentary is unavailable in this vault. Showing Matthew Henry." });
    }
    renderCommentaryPanel(parent, plugin, ref, !!more, more);
    return () => {};
  }
  const body = parent.createDiv();
  if (!more) {
    const panel = new InstalledStudyPanel(body, plugin, selected.id, ref, "", "", () => {});
    return () => panel.dispose();
  }
  body.setText("Loading local commentary…");
  void plugin.modules.load(selected.id).then(module => {
    if (!body.isConnected) return;
    body.empty();
    const { passage, introductions } = commentarySectionsForPassage(module.entries, ref);
    const entry = passage[0] ?? introductions[0];
    if (!entry) {
      body.createEl("p", { text: "No commentary entry for " + refLabel(ref) + " in this edition." });
      return;
    }
    body.createEl("strong", { text: entry.title });
    const excerpt = modulePlainText(entry);
    body.createEl("p", { cls: "vd-commentary-excerpt", text: excerpt.length > 320 ? excerpt.slice(0, 320).trimEnd() + "…" : excerpt });
    textButton(body, "Read more", more, "vd-study-card-link");
  }).catch((error: unknown) => {
    if (body.isConnected) body.setText(error instanceof Error ? error.message : "Local commentary unavailable.");
  });
  return () => {};
}
