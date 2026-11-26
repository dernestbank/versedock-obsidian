import { ItemView, Notice, type WorkspaceLeaf } from "obsidian";
import type { SwordDockController } from "../controller";
import {
  LIBRARY_SECTIONS,
  librarySectionElementTag,
  librarySectionForKey,
  type LibrarySection
} from "../core/library-sections";
import { EXTERNAL_RESOURCE_SOURCES } from "../core/resource-sources";
import { formatStorageBytes } from "../core/storage";
import { textButton, emptyState, pill } from "./components";
import { OFFLINE_LIBRARY_RECOVERY, recheckOfflineLibrary } from "./library-recovery";
import { crossReferenceAttribution } from "./cross-reference-panel";
import { commentaryAttribution } from "./commentary-panel";
import { renderReadingDownloads, renderInstalledReading } from "./reading-downloads";
import { renderSourceCatalogue } from "./source-catalogue";

export const LIBRARY_VIEW = "versedock-library";

const SECTION_LABELS: Record<LibrarySection, string> = {
  "get-started": "Get started",
  discover: "Discover",
  installed: "My library",
  downloads: "Downloads",
  import: "Import"
};
let libraryViewSequence = 0;

/** Module inventory, source downloads, local import and offline recovery. */
export class LibraryView extends ItemView {
  private lifetime = 0;
  private cleanups: Array<() => void> = [];
  private section: LibrarySection = "installed";
  private readonly domScope = `versedock-library-${++libraryViewSequence}`;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: SwordDockController) { super(leaf); }
  getViewType(): string { return LIBRARY_VIEW; }
  getDisplayText(): string { return "SwordDock Bible Module Library"; }
  getIcon(): string { return "library"; }
  async onOpen(): Promise<void> { this.lifetime++; this.render(); }
  async onClose(): Promise<void> { this.lifetime++; for(const cleanup of this.cleanups)cleanup();this.cleanups=[];this.contentEl.empty(); }

  private activateSection(section: LibrarySection): void {
    this.section = section;
    this.render();
    const active = this.contentEl.querySelector<HTMLElement>(`[data-vd-library-section="${section}"]`);
    active?.focus({ preventScroll: true });
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  private render(): void {
    for(const cleanup of this.cleanups)cleanup();this.cleanups=[];
    const root = this.contentEl;
    root.empty();
    root.addClass("versedock", "vd-library");

    const header = root.createDiv({ cls: "vd-library-header" });
    const heading = header.createDiv();
    heading.createSpan({ cls: "vd-overline", text: "LOCAL RESOURCE COLLECTION" });
    heading.createEl("h2", { text: "Module Library" });
    heading.createEl("p", { cls: "vd-subtle", text: "Review installed resources, provenance and local integrity." });
    textButton(header, "Import local file", () => this.plugin.openMySwordInspector(), "mod-cta vd-library-import");

    const tabs = root.createDiv({ cls: "vd-library-tabs", attr: { "aria-label": "Library sections", role: "tablist" } });
    for (const section of LIBRARY_SECTIONS) {
      const selected = section === this.section;
      const tab = tabs.createEl(librarySectionElementTag(selected), {
        cls: "vd-text-button " + (selected ? "is-active" : ""),
        text: SECTION_LABELS[section],
        attr: selected ? { type: "button" } : undefined
      });
      tab.setAttribute("role", "tab");
      tab.dataset.vdLibrarySection = section;
      tab.id = `${this.domScope}-tab-${section}`;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.tabIndex = selected ? 0 : -1;
      if (selected) tab.setAttribute("aria-current", "page");
      tab.addEventListener("click", () => this.activateSection(section));
      tab.addEventListener("keydown", event => {
        if (!(event instanceof KeyboardEvent)) return;
        const destination = librarySectionForKey(section, event.key);
        if (!destination) return;
        event.preventDefault();
        this.activateSection(destination);
      });
    }

    const activeTabId = `${this.domScope}-tab-${this.section}`;
    const sectionRoot = root.createDiv({ cls: "vd-library-section", attr: {
      id: `${this.domScope}-panel`, role: "tabpanel", "aria-labelledby": activeTabId, tabindex: "-1"
    } });
    root.querySelector<HTMLElement>(`[data-vd-library-section="${this.section}"]`)?.setAttribute("aria-controls", sectionRoot.id);
    switch (this.section) {
      case "get-started": this.renderGetStarted(sectionRoot); break;
      case "installed": this.renderInstalled(sectionRoot); break;
      case "discover": this.renderDiscover(sectionRoot); break;
      case "downloads": this.renderDownloads(sectionRoot); break;
      case "import": this.renderImport(sectionRoot); break;
    }
  }

  private renderGetStarted(parent: HTMLElement): void {
    const layout = parent.createDiv({ cls: "vd-library-layout" });
    const collection = layout.createDiv({ cls: "vd-library-collection" });
    const manifest = this.plugin.library.metadata;
    const intro = collection.createDiv({ cls: "vd-library-intro" });
    intro.createSpan({ cls: "vd-overline", text: "A PRIVATE, OFFLINE STUDY DESK" });
    intro.createEl("h3", { text: manifest ? "Your Bible is ready to read" : "Finish setting up your offline Bible" });
    intro.createEl("p", { cls: "vd-subtle", text: manifest
      ? "Open an installed edition or preview a local module for import."
      : OFFLINE_LIBRARY_RECOVERY.description });
    const actions = intro.createDiv({ cls: "vd-action-row" });
    const open = textButton(actions, "Open Bible Reader", () => { void this.plugin.openReader(); }, "mod-cta");
    open.disabled = !manifest;
    textButton(actions, OFFLINE_LIBRARY_RECOVERY.action, () => this.recheck());
    textButton(actions, "Import local file", () => this.plugin.openMySwordInspector());
    this.renderResourceSummary(collection, "Bundled offline collection");
    this.renderStorageAside(layout);
  }

  private renderInstalled(parent: HTMLElement): void {
    const layout = parent.createDiv({ cls: "vd-library-layout" });
    const collection = layout.createDiv({ cls: "vd-library-collection" });
    this.renderInstalledResource(collection);
    this.renderTaggedResources(collection);
    collection.createEl("h3", { cls: "vd-category-label", text: "Additional study modules" });
    this.renderCrossReferenceResource(collection);
    this.renderCommentaryResource(collection);
    this.cleanups.push(renderInstalledReading(collection, this.plugin));
    this.renderStorageAside(layout);
  }

  private renderDiscover(parent: HTMLElement): void {
    const layout = parent.createDiv({ cls: "vd-library-layout" });
    const collection = layout.createDiv({ cls: "vd-library-collection" });
    const manifest = this.plugin.library.metadata;
    const intro = collection.createDiv({ cls: "vd-library-intro" });
    intro.createSpan({ cls: "vd-overline", text: "VERIFIED BUNDLED RESOURCE" });
    intro.createEl("h3", { text: "World English Bible (WEB)" });
    intro.createEl("p", { cls: "vd-subtle", text: "SwordDock bundles WEB, tagged KJV, Strong’s dictionaries, OpenBible cross-references and Matthew Henry's Commentary for offline study. Install additional Bibles, commentaries, dictionaries, books, devotionals and maps below." });
    const card = collection.createDiv({ cls: "vd-module-card vd-module-card-discover" });
    const top = card.createDiv({ cls: "vd-module-card-top" });
    const identity = top.createDiv({ cls: "vd-module-identity" });
    identity.createDiv({ cls: "vd-module-glyph", text: "WEB", attr: { "aria-hidden": "true" } });
    const name = identity.createDiv();
    name.createEl("h3", { text: "World English Bible" });
    name.createDiv({ cls: "vd-module-sub", text: manifest?.edition ?? "Public-domain English translation" });
    pill(top, manifest ? "Ready offline" : "Not installed", manifest ? "vd-installed" : "");
    const facts = card.createDiv({ cls: "vd-module-facts" });
    facts.createEl("span", { text: "Source" });
    if (manifest) {
      facts.createEl("a", { text: manifest.sourcePage, attr: { href: manifest.sourcePage, target: "_blank", rel: "noreferrer" } });
    } else {
      facts.createSpan({ text: "Bundled with SwordDock", cls: "vd-module-facts-muted" });
    }
    facts.createEl("span", { text: "License" });
    facts.createEl("strong", { text: manifest?.license ?? "Public domain" });
    const actions = card.createDiv({ cls: "vd-action-row" });
    const open = textButton(actions, "Read WEB", () => { void this.plugin.setBibleEdition("webp").then(() => this.plugin.openReader()); }, "mod-cta");
    open.disabled = !manifest;
    textButton(actions, manifest ? "View edition details" : "Check local package", () => {
      if (manifest) this.plugin.openResourceDetails("webp");
      else this.recheck();
    });
    this.cleanups.push(renderSourceCatalogue(collection, this.plugin));
    this.renderStorageAside(layout);
  }

  private renderDownloads(parent: HTMLElement): void {
    const layout = parent.createDiv({ cls: "vd-library-layout" });
    const collection = layout.createDiv({ cls: "vd-library-collection" });
    this.cleanups.push(renderReadingDownloads(collection, this.plugin));
    this.renderStorageAside(layout);
  }

  private renderImport(parent: HTMLElement): void {
    const layout = parent.createDiv({ cls: "vd-library-layout" });
    const collection = layout.createDiv({ cls: "vd-library-collection" });
    const state = emptyState(collection, "Import a local module", "Preview a compatible MySword SQLite or gzip file, review its source, then install it for offline reading in this vault.", "file-search");
    textButton(state, "Choose local file", () => this.plugin.openMySwordInspector(), "mod-cta");
    const note = collection.createDiv({ cls: "vd-library-note-card" });
    note.createEl("strong", { text: "Safe by default" });
    note.createEl("p", { text: "Preview validates the full resource before saving. Install keeps its filename, fingerprints, source notice and your optional provenance note. The selected original remains unchanged." });
    const sources = collection.createDiv({ cls: "vd-library-sources" });
    sources.createEl("strong", { text: "External source directory" });
    sources.createEl("p", { text: "Visit a publisher or community directory, download a compatible module yourself, then return here for local inspection. SwordDock does not mirror, approve or silently install third-party files." });
    const sourceList = sources.createDiv({ cls: "vd-source-list", attr: { "aria-label": "External module sources" } });
    for (const source of EXTERNAL_RESOURCE_SOURCES) {
      const row = sourceList.createDiv({ cls: "vd-source-row" });
      const identity = row.createDiv({ cls: "vd-source-identity" });
      identity.createEl("strong", { text: source.name });
      identity.createSpan({ cls: "vd-source-meta", text: source.category + " · " + source.domain });
      row.createEl("a", { text: "Visit site", attr: { href: source.url, target: "_blank", rel: "noreferrer" } });
    }
    textButton(sources, "Import downloaded files", () => this.plugin.openMySwordInspector(), "mod-cta");
    this.renderStorageAside(layout);
  }

  private renderInstalledResource(parent: HTMLElement): void {
    const manifest = this.plugin.library.metadata;
    const card = parent.createDiv({ cls: "vd-module-card" });
    const top = card.createDiv({ cls: "vd-module-card-top" });
    const identity = top.createDiv({ cls: "vd-module-identity" });
    identity.createDiv({ cls: "vd-module-glyph", text: "WEB", attr: { "aria-hidden": "true" } });
    const name = identity.createDiv();
    name.createEl("h3", { text: manifest?.title ?? "World English Bible" });
    name.createDiv({ cls: "vd-module-sub", text: manifest?.edition ?? "WEB content unavailable" });
    pill(top, manifest ? "Installed · Offline" : "Missing", manifest ? "vd-installed" : "");
    const stats = card.createDiv({ cls: "vd-module-stats" });
    for (const [label, value] of [
      ["Books", String(manifest?.books.length ?? 0)],
      ["Verses", (manifest?.verseCount ?? 0).toLocaleString()],
      ["License", manifest?.license ?? "Unknown"]
    ]) {
      const cell = stats.createDiv();
      cell.createEl("strong", { text: value });
      cell.createSpan({ text: label });
    }
    card.createEl("p", { cls: "vd-module-license", text: manifest?.licenseNotice ?? OFFLINE_LIBRARY_RECOVERY.description });
    const actions = card.createDiv({ cls: "vd-action-row" });
    const open = textButton(actions, "Read WEB", () => { void this.plugin.setBibleEdition("webp").then(() => this.plugin.openReader()); }, "mod-cta");
    open.disabled = !manifest;
    textButton(actions, OFFLINE_LIBRARY_RECOVERY.action, () => this.recheck());
    const verify = textButton(actions, "Verify installed Bible", () => { void this.verifyInstalled(verify); });
    verify.disabled = !manifest;
    parent.createDiv({ cls: "vd-integrity-status", attr: { role: "status", "aria-live": "polite" } });
  }

  private renderResourceSummary(parent: HTMLElement, title: string): void {
    const summary = parent.createDiv({ cls: "vd-library-summary" });
    summary.createEl("strong", { text: title });
    const ready = [this.plugin.library.metadata && "World English Bible", this.plugin.crossReferences.metadata && "OpenBible Cross-References",
      this.plugin.commentary.metadata && "Matthew Henry's Commentary", this.plugin.kjv.metadata && "Tagged KJV",
      this.plugin.lexicon.metadata && "Strong’s dictionaries"].filter(Boolean);
    summary.createEl("p", { text: ready.length ? ready.join(" · ") + ". See My library for source details and installed-file checks."
      : "No bundled resources are ready. Recheck the library after restoring the complete offline preview package." });
  }

  private renderStorageAside(layout: HTMLElement): void {
    const aside = layout.createEl("aside", { cls: "vd-library-aside" });
    aside.createSpan({ cls: "vd-overline", text: "STORAGE" });
    aside.createEl("h3", { text: "Local-first" });
    aside.createEl("p", { text: "Resources stay on this device unless your vault or plugin folder is synced separately." });
    const installed = [this.plugin.library, this.plugin.kjv, this.plugin.lexicon, this.plugin.crossReferences, this.plugin.commentary].filter(resource => resource.metadata).length + Number(this.plugin.interlinear.available);
    const count = aside.createEl("strong", { text: (installed + this.plugin.modules.installed.length) + " installed resources" });
    const metrics = aside.createDiv({ cls: "vd-library-storage-metrics", attr: { role: "status", "aria-live": "polite" } });
    metrics.setText("Measuring installed files…");
    void this.updateStorageMetrics(metrics);
    let inventory = this.plugin.modules.installed.map(item => item.directory).join();
    this.cleanups.push(this.plugin.modules.subscribe(() => {
      const next = this.plugin.modules.installed.map(item => item.directory).join();
      if (next !== inventory) { inventory = next; count.setText((installed + this.plugin.modules.installed.length) + " installed resources"); void this.updateStorageMetrics(metrics); }
    }));
    textButton(aside, "Manage storage", () => this.plugin.openStorageManagement());
    aside.createEl("p", { cls: "vd-library-note", text: "Preview local files before installing. Imported resources and catalogue downloads stay in this vault with their source notices and fingerprints." });
  }

  private async updateStorageMetrics(target: HTMLElement): Promise<void> {
    const measurements = await Promise.all([this.plugin.library.getStorageSummary(),
      this.plugin.crossReferences.getStorageSummary(), this.plugin.commentary.getStorageSummary(), this.plugin.kjv.getStorageSummary(), this.plugin.lexicon.getStorageSummary(), this.plugin.interlinear.getStorageSummary()]);
    const summary = measurements.reduce((total, item) => ({ bytes: total.bytes + item.bytes,
      files: total.files + item.files, missing: total.missing + item.missing }), { bytes: 0, files: 0, missing: 0 });
    const reading = this.plugin.modules.storageSummary(); summary.bytes += reading.bytes; summary.files += reading.files;
    if (!target.isConnected) return;
    target.empty();
    if (!summary.files && !summary.bytes && !summary.missing) {
      target.setText("No installed files measured.");
      return;
    }
    target.createEl("strong", { text: formatStorageBytes(summary.bytes) + " measured locally" });
    target.createSpan({ text: " · " + summary.files + " files" + (summary.missing ? " · " + summary.missing + " missing" : "") });
  }

  private recheck(): void {
    const lifetime = this.lifetime;
    void (async () => {
      const result = await recheckOfflineLibrary(this.plugin.library);
      const referencesReady = await this.plugin.crossReferences.initialize();
      const commentaryReady = await this.plugin.commentary.initialize();
      await this.plugin.kjv.initialize();
      await this.plugin.lexicon.initialize();
      await this.plugin.interlinear.initialize();
      if (lifetime !== this.lifetime) return;
      new Notice(result.notice + (referencesReady ? " Cross-references ready offline." : " Bundled cross-references unavailable; restore the complete preview package.")
        + (commentaryReady ? " Commentary ready offline." : " Bundled commentary unavailable; restore the complete preview package."));
      this.render();
    })();
  }

  private renderCrossReferenceResource(parent: HTMLElement): void {
    const manifest = this.plugin.crossReferences.metadata;
    const card = parent.createDiv({ cls: "vd-module-card" });
    const top = card.createDiv({ cls: "vd-module-card-top" });
    const identity = top.createDiv({ cls: "vd-module-identity" });
    identity.createDiv({ cls: "vd-module-glyph", text: "REF", attr: { "aria-hidden": "true" } });
    const name = identity.createDiv();
    name.createEl("h3", { text: "OpenBible Cross-References" });
    name.createDiv({ cls: "vd-module-sub", text: manifest ? manifest.edition + " · " + manifest.recordCount.toLocaleString() + " coordinates" : "Bundled coordinate resource unavailable" });
    pill(top, manifest ? "Ready offline" : "Unavailable", manifest ? "vd-installed" : "");
    card.createEl("p", { cls: "vd-module-license", text: "Coordinates and community votes by OpenBible.info. Converted by SwordDock to a subset compatible with local WEB coordinates and targets within one chapter. WEB supplies the passage previews." });
    crossReferenceAttribution(card);
    const actions = card.createDiv({ cls: "vd-action-row" });
    const open = textButton(actions, "Open Cross-References", () => { void this.plugin.openInspector("references"); }, "mod-cta");
    open.disabled = !manifest;
    textButton(actions, "Recheck bundled resources", () => this.recheck());
    card.createEl("p", { cls: "vd-subtle", text: "Preview wording comes from WEB, regardless of the selected Reader edition." });
  }

  private renderTaggedResources(parent: HTMLElement): void {
    for (const [abbreviation, title, ready, description, action, label] of [
      ["KJV", "King James Version", !!this.plugin.kjv.metadata,
        "CrossWire 3.1 · 66 books · 31,102 verses · Strong’s tags, source morphology and red-letter markup. Source KJV coordinates are preserved, including Romans 16:26–27. Distribution: GPL; CrossWire’s full permission and Crown base-text notice are in library/kjv/SOURCE-LICENSE.md.",
        () => { void this.plugin.setBibleEdition("kjv").then(() => this.plugin.openReader()); }, "Read KJV"],
      ["LEX", "Strong’s Greek & Hebrew Dictionaries", !!this.plugin.lexicon.metadata,
        "James Strong, 1890 · Public domain · CrossWire Greek 2.0 / Hebrew 1.2. 5,489 Greek and 8,673 Hebrew entries. Select tagged KJV words for definitions and source-linked occurrences. Numeric gaps in the source remain gaps.",
        () => { void this.plugin.openInspector("lexicon"); }, "Open Word Study"]
    ] as const) {
      const card = parent.createDiv({ cls: "vd-module-card" });
      const top = card.createDiv({ cls: "vd-module-card-top" });
      const identity = top.createDiv({ cls: "vd-module-identity" });
      identity.createDiv({ cls: "vd-module-glyph", text: abbreviation, attr: { "aria-hidden": "true" } });
      identity.createEl("h3", { text: title });
      pill(top, ready ? "Installed · Offline" : "Unavailable", ready ? "vd-installed" : "");
      card.createEl("p", { cls: "vd-module-license", text: description });
      card.createEl("a", { text: "CrossWire source & license", attr: {
        href: "https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=" + (abbreviation === "KJV" ? "KJV" : "StrongsGreek"), target: "_blank", rel: "noreferrer"
      } });
      const open = textButton(card.createDiv({ cls: "vd-action-row" }), label, action, "mod-cta");
      open.disabled = !ready;
    }
    const companion = parent.createDiv({ cls: "vd-module-card" });
    companion.createEl("h3", { text: "Berean interlinear companion" });
    pill(companion, this.plugin.interlinear.available ? "Installed · Offline" : "Unavailable", "vd-installed");
    companion.createEl("p", { cls: "vd-module-license", text: "66 books · 31,102 source verse records · 443,625 Hebrew, Aramaic and Greek words with Berean English glosses, transliteration, Strong’s identifiers and supplied grammar. Seventeen source verse records have no words; those remain explicitly empty. KJV Scripture is displayed separately. Public domain · Free Use Bible API format adaptation." });
    companion.createEl("a", { text: "Berean source and terms", attr: { href: "https://berean.bible/terms.htm", target: "_blank", rel: "noreferrer" } });
    const openCompanion = textButton(companion.createDiv({ cls: "vd-action-row" }), "Read KJV with companion", () => {
      void this.plugin.setBibleEdition("kjv").then(() => this.plugin.setKjvDisplayMode("interlinear")).then(() => this.plugin.openReader());
    }, "mod-cta");
    openCompanion.disabled = !this.plugin.interlinear.available || !this.plugin.kjv.metadata;
  }

  private renderCommentaryResource(parent: HTMLElement): void {
    const manifest = this.plugin.commentary.metadata;
    const card = parent.createDiv({ cls: "vd-module-card" });
    const top = card.createDiv({ cls: "vd-module-card-top" });
    const identity = top.createDiv({ cls: "vd-module-identity" });
    identity.createDiv({ cls: "vd-module-glyph", text: "MHC", attr: { "aria-hidden": "true" } });
    const name = identity.createDiv();
    name.createEl("h3", { text: "Matthew Henry's Commentary" });
    name.createDiv({ cls: "vd-module-sub", text: manifest ? "Complete edition · " + manifest.edition + " · " + manifest.entryCount.toLocaleString() + " sections" : "Bundled commentary unavailable" });
    pill(top, manifest ? "Ready offline" : "Unavailable", manifest ? "vd-installed" : "");
    card.createEl("p", { cls: "vd-module-license", text: "Public-domain text supplied by CrossWire. Preserves original OSIS, supported emphasis and source citation links with KJV coordinates; some sections cover several verses. Citations open an edition-labelled offline preview. The complete edition includes continuations of Henry's work." });
    commentaryAttribution(card);
    const actions = card.createDiv({ cls: "vd-action-row" });
    const open = textButton(actions, "Open Commentary", () => { void this.plugin.openInspector("commentary"); }, "mod-cta");
    open.disabled = !manifest;
    textButton(actions, "Recheck bundled resources", () => this.recheck());
  }

  private async verifyInstalled(button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    const status = this.contentEl.querySelector<HTMLElement>(".vd-integrity-status");
    if (status) status.setText("Checking installed Bible files…");
    try {
      const report = await this.plugin.library.verifyIntegrity((checked, total) => {
        if (status && (checked % 5 === 0 || checked === total))
          status.setText("Checking installed Bible files: " + checked + " / " + total);
      });
      if (status) {
        status.empty();
        if (!report.issues.length) {
          status.setText("Verified " + report.checked + " of " + report.total + " books. All installed files match their recorded SHA-256 checksums and structure.");
        } else {
          status.createEl("strong", { text: report.issues.length + " integrity issue(s) found across " + report.checked + " checked files." });
          for (const issue of report.issues.slice(0, 6)) status.createDiv({ text: issue.code + ": " + issue.problem });
          if (report.issues.length > 6) status.createDiv({ text: "…and " + (report.issues.length - 6) + " more. Reinstall the complete official offline package." });
        }
      }
      new Notice(report.issues.length ? "Bible library verification detected problems." : "Bible library verified.");
    } catch (error) {
      if (status) status.setText("Verification failed: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      button.disabled = false;
    }
  }
}
