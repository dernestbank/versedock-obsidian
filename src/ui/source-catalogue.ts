import type { SwordDockController } from "../controller";
import { readingSource } from "../core/reading-catalogue";
import { textButton } from "./components";
import { RESOURCE_LABELS, RESOURCE_TYPES, type ResourceType } from "../core/resource-dock";
import { sourceCandidates } from "../core/source-catalogue";
import { EXTERNAL_RESOURCE_SOURCES } from "../core/resource-sources";

/** Locally preloaded metadata. Opening source URLs is explicit; no automatic installation. */
export function renderSourceCatalogue(parent: HTMLElement, plugin: SwordDockController): () => void {
  const section = parent.createDiv({ cls: "vd-catalogue" });
  section.createEl("h3", { text: "Browse available modules" });
  section.createEl("p", { cls: "vd-subtle", text:
    "Install supported Bibles, commentaries, dictionaries, books, devotionals and maps directly from their publisher." });
  const filters = section.createDiv({ cls: "vd-catalogue-filters" });
  const search = filters.createEl("input", { attr: {
    type: "search", placeholder: "Search Bibles, commentaries, books…",
    "aria-label": "Search the preloaded module catalogue", maxlength: "100"
  } });
  const category = filters.createEl("select", { attr: { "aria-label": "Filter modules by resource type" } });
  category.createEl("option", { value: "all", text: "All resource types" });
  for (const type of RESOURCE_TYPES)
    category.createEl("option", { value: type, text: RESOURCE_LABELS[type] });
  const selected = new Set<string>();
  const batch = textButton(filters, "Install selected", () => {
    for (const id of selected) void plugin.modules.install(id);
    selected.clear(); refresh();
  });
  const statusUpdates: Array<() => void> = [];
  const count = section.createEl("p", { cls: "vd-subtle vd-catalogue-count", attr: { role: "status" } });
  const results = section.createDiv({ cls: "vd-catalogue-results" });
  const refresh = (): void => {
    results.empty(); statusUpdates.length = 0; batch.disabled = !selected.size;
    const selectedType = category.value as ResourceType | "all";
    const candidates = sourceCandidates(selectedType, search.value);
    count.setText(candidates.length + " publisher links shown");
    if (!candidates.length) {
      results.createEl("p", { cls: "vd-subtle", text: "No matching modules. Try a different title or category." });
      return;
    }
    for (const candidate of candidates) {
      const card = results.createDiv({ cls: "vd-catalogue-card" });
      const head = card.createDiv({ cls: "vd-catalogue-card-header" });
      head.createEl("strong", { text: candidate.title });
      head.createSpan({ text: RESOURCE_LABELS[candidate.type], cls: "vd-version-chip" });
      card.createEl("p", { cls: "vd-subtle", text: candidate.publisher + " · " + candidate.container });
      const actions = card.createDiv({ cls: "vd-action-row" });
      if (readingSource(candidate.id)) {
        const label = actions.createEl("label", {text:"Select"});
        const checkbox = label.createEl("input", {attr:{type:"checkbox", "aria-label":"Select " + candidate.title}}); checkbox.checked = selected.has(candidate.id);
        checkbox.addEventListener("change", () => {if(checkbox.checked)selected.add(candidate.id);else selected.delete(candidate.id);batch.disabled=!selected.size;});
        const status = card.createEl("p", {cls:"vd-subtle",attr:{role:"status"}});
        const install = textButton(actions, "Install", () => {
          if (plugin.modules.installed.some(module=>module.id===candidate.id)) void plugin.openResources(candidate.id);
          else void plugin.modules.install(candidate.id);
        }, "mod-cta");
        const cancel = textButton(actions, "Cancel", () => plugin.modules.cancel(candidate.id));
        const update = ():void => {
          const ready = plugin.modules.installed.some(module=>module.id===candidate.id);
          const job = plugin.modules.jobs.get(candidate.id);
          const busy = !!job && !["ready","cancelled","failed"].includes(job.status);
          install.setText(ready ? "Open" : job?.status==="failed" || job?.status==="cancelled" ? "Retry install" : "Install");
          install.disabled = busy; cancel.hidden = !busy;
          status.setText(busy ? job!.status[0].toUpperCase()+job!.status.slice(1)+"…" : ready ? "Ready offline" : job?.error ?? "Download, verify and prepare for offline reading");
        };
        statusUpdates.push(update); update();
      }
      actions.createEl("a", { cls: "vd-text-button", text: "Download file", attr: {
        href: candidate.directDownload, target: "_blank", rel: "noreferrer",
        "aria-label": "Download " + candidate.title + " from its publisher"
      } });
      actions.createEl("a", { cls: "vd-text-button", text: "Publisher page", attr: {
        href: candidate.sourcePage, target: "_blank", rel: "noreferrer"
      } });
    }
  };
  search.addEventListener("input", refresh);
  category.addEventListener("change", refresh);
  refresh();
  const note = section.createDiv({ cls: "vd-library-note-card" });
  note.createEl("strong", { text: "Supported installations" });
  note.createEl("p", { text: "Install is available for six verified publisher resources, covering every resource type. Each download is checked against the reviewed source before activation. Publisher attribution stays with each installed resource." });
  const external = section.createDiv({ cls: "vd-library-sources" });
  external.createEl("h4", { text: "Explore more third-party modules" });
  for (const source of EXTERNAL_RESOURCE_SOURCES) {
    const row = external.createDiv({ cls: "vd-catalogue-external" });
    row.createSpan({ text: source.name + " · " + source.category });
    row.createEl("a", { text: "Visit source", attr: { href: source.url, target: "_blank", rel: "noreferrer" } });
  }
  return plugin.modules.subscribe(() => {for(const update of statusUpdates)update();});
}
