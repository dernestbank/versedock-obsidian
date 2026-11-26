import { Modal } from "obsidian";
import type { SwordDockController } from "../controller";
import { formatStorageBytes, storageResourceRow } from "../core/storage";
import { textButton } from "./components";
import { ModuleManagementModal } from './module-management-modal';
import {ResourceStorageModal} from './resource-storage-modal';

/** Measures active resource files and links to version/removal management. */
export class StorageManagementModal extends Modal {
  constructor(private readonly plugin: SwordDockController) { super(plugin.app); }

  onOpen(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("versedock", "vd-storage-modal");
    root.createSpan({ cls: "vd-overline", text: "LOCAL DATA SCOPE" });
    root.createEl("h2", { text: "Storage & resources" });
    root.createEl("p", { cls: "vd-subtle", text: "Review measured plugin-managed files without touching personal Markdown notes, bookmarks or imported originals." });
    const status = root.createDiv({ cls: "vd-storage-status", attr: { role: "status", "aria-live": "polite" } });
    status.setText("Measuring installed files…");
    void this.renderSummary(status);
    const actions = root.createDiv({ cls: "vd-action-row" });
    textButton(actions,'Review all resource storage',()=>{this.close();new ResourceStorageModal(this.plugin).open();},'mod-cta');
    textButton(actions,'Manage additional resources',()=>{this.close();new ModuleManagementModal(this.plugin).open();},'mod-cta');
    textButton(actions, "Open Module Library", () => { this.close(); void this.plugin.openLibrary(); }, "mod-cta");
    textButton(actions, "Close", () => this.close());
  }

  private async renderSummary(root: HTMLElement): Promise<void> {
    const [summary, references, commentary, kjv, lexicon, interlinear] = await Promise.all([
      this.plugin.library.getStorageSummary(), this.plugin.crossReferences.getStorageSummary(), this.plugin.commentary.getStorageSummary(),
      this.plugin.kjv.getStorageSummary(), this.plugin.lexicon.getStorageSummary(), this.plugin.interlinear.getStorageSummary()
    ]);
    if (!root.isConnected) return;
    root.empty();
    const installed = this.plugin.library.metadata;
    const resource = storageResourceRow(!!installed, summary, this.plugin.settings.bibleEdition === "webp");
    const resourceCard = root.createDiv({ cls: "vd-storage-resource" });
    const resourceIdentity = resourceCard.createDiv({ cls: "vd-storage-resource-identity" });
    resourceIdentity.createEl("strong", { text: resource.title });
    resourceIdentity.createSpan({ cls: "vd-storage-resource-meta", text: resource.details });
    const resourceState = resourceCard.createDiv({ cls: "vd-storage-resource-state" });
    resourceState.createEl("strong", { text: resource.status });
    resourceState.createSpan({ text: resource.note });
    const remove = resourceCard.createEl("button", {
      cls: "vd-text-button vd-storage-remove",
      text: "Remove",
      attr: { type: "button", disabled: "true", "aria-label": resource.title + " removal unavailable" }
    });
    remove.disabled = !resource.canRemove;
    const referencesInstalled = this.plugin.crossReferences.metadata;
    const referenceCard = root.createDiv({ cls: "vd-storage-resource" });
    const identity = referenceCard.createDiv({ cls: "vd-storage-resource-identity" });
    identity.createEl("strong", { text: "OpenBible Cross-References" });
    identity.createSpan({ cls: "vd-storage-resource-meta", text: formatStorageBytes(references.bytes) + " · " + references.files + " files" });
    const referenceState = referenceCard.createDiv({ cls: "vd-storage-resource-state" });
    referenceState.createEl("strong", { text: referencesInstalled ? (references.missing ? "Needs recovery" : "Bundled · Offline") : "Unavailable" });
    referenceState.createSpan({ text: "CC BY 4.0 · Bundled resource removal is not available in this build." });
    const commentaryInstalled = this.plugin.commentary.metadata;
    const commentaryCard = root.createDiv({ cls: "vd-storage-resource" });
    const commentaryIdentity = commentaryCard.createDiv({ cls: "vd-storage-resource-identity" });
    commentaryIdentity.createEl("strong", { text: "Matthew Henry's Commentary" });
    commentaryIdentity.createSpan({ cls: "vd-storage-resource-meta", text: formatStorageBytes(commentary.bytes) + " · " + commentary.files + " files" });
    const commentaryState = commentaryCard.createDiv({ cls: "vd-storage-resource-state" });
    commentaryState.createEl("strong", { text: commentaryInstalled ? (commentary.missing ? "Needs recovery" : "Bundled · Offline") : "Unavailable" });
    commentaryState.createSpan({ text: "Public domain · Bundled resource removal is not available in this build." });
    for (const [title, measurement, installed, license] of [
      ["King James Version", kjv, !!this.plugin.kjv.metadata, "CrossWire 3.1 · GPL; see full source notice"],
      ["Strong’s Greek & Hebrew Dictionaries", lexicon, !!this.plugin.lexicon.metadata, "Public domain"],
      ["Berean interlinear companion", interlinear, this.plugin.interlinear.available, "Public domain · 66 books · Berean glosses"]
    ] as const) {
      const card = root.createDiv({ cls: "vd-storage-resource" });
      const identity = card.createDiv({ cls: "vd-storage-resource-identity" });
      identity.createEl("strong", { text: title });
      identity.createSpan({ cls: "vd-storage-resource-meta", text: formatStorageBytes(measurement.bytes) + " · " + measurement.files + " files" });
      const state = card.createDiv({ cls: "vd-storage-resource-state" });
      state.createEl("strong", { text: installed ? (measurement.missing ? "Needs recovery"
        : title === "King James Version" && this.plugin.settings.bibleEdition === "kjv" ? "Current default · protected" : "Bundled · Offline") : "Unavailable" });
      state.createSpan({ text: license });
    }
    const reading = this.plugin.modules.storageSummary();
    for (const module of this.plugin.modules.installed) {
      const card = root.createDiv({cls:"vd-storage-resource"});
      const identity = card.createDiv({cls:"vd-storage-resource-identity"});
      identity.createEl("strong",{text:module.title});
      identity.createSpan({cls:"vd-storage-resource-meta",text:formatStorageBytes(module.bytes)+" · "+module.entryCount+" entries"});
      card.createDiv({cls:"vd-storage-resource-state",text:"Verified · Offline"});
    }
    const facts = root.createDiv({ cls: "vd-storage-facts" });
    for (const [label, value] of [
      ["Installed resources", String(Number(!!installed) + Number(!!referencesInstalled) + Number(!!commentaryInstalled) + Number(!!this.plugin.kjv.metadata) + Number(!!this.plugin.lexicon.metadata) + Number(this.plugin.interlinear.available) + this.plugin.modules.installed.length)],
      ["Active resource entries", String(summary.files + references.files + commentary.files + kjv.files + lexicon.files + interlinear.files + reading.files)],
      ["Uncompressed resource size", formatStorageBytes(summary.bytes + references.bytes + commentary.bytes + kjv.bytes + lexicon.bytes + interlinear.bytes + reading.bytes)],
      ["Missing files", String(summary.missing + references.missing + commentary.missing + kjv.missing + lexicon.missing + interlinear.missing)]
    ]) {
      const row = facts.createDiv();
      row.createSpan({ text: label });
      row.createEl("strong", { text: value });
    }

    const protection = root.createDiv({ cls: "vd-storage-protection" });
    protection.createEl("strong", { text: this.plugin.readerBible.metadata ? "Current default Bible protected" : "No default Bible installed" });
    protection.createEl("p", { text: this.plugin.readerBible.metadata
      ? "The current reading edition is " + this.plugin.readerBible.metadata?.title + ". Bundled resource removal is not offered in this preview."
      : "Install or recover a permitted Bible before storage cleanup can be reviewed." });

    const scope = root.createDiv({ cls: "vd-storage-scope" });
    scope.createEl("strong", { text: "Data scope" });
    scope.createEl("p", { text: "Discover and Downloads track installations. Totals cover active verified resource generations; interrupted staging, management records and retained older generations are excluded. Personal Markdown notes, reading history, bookmarks and original import files are outside this resource-managed scope." });

    const sync = root.createDiv({ cls: "vd-storage-scope" });
    sync.createEl("strong", { text: "Sync & backup" });
    sync.createEl("p", { text: "Available disk space is not exposed by the current Obsidian adapter. Resource files may be included by vault sync, Git or cloud backup according to your own exclusions; SwordDock does not silently upload or back them up." });
  }
}
