import { Plugin, PluginSettingTab, Setting, Notice, TFile, type WorkspaceLeaf } from "obsidian";
import { BOOKS } from "./core/books";
import { OfflineBibleLibrary } from "./core/library";
import { parseOsis, parseReference, osisId, refLabel, type PassageReference } from "./core/references";
import { DEFAULT_SETTINGS, type MySwordSettings, type MySwordController } from "./controller";
import { ReaderView, READER_VIEW } from "./ui/reader-view";
import { InspectorView, INSPECTOR_VIEW } from "./ui/inspector-view";
import { SearchView, SEARCH_VIEW } from "./ui/search-view";
import { LibraryView, LIBRARY_VIEW } from "./ui/library-view";
import { ReferenceModal } from "./ui/reference-modal";

export default class MySwordPlusPlugin extends Plugin implements MySwordController {
  settings: MySwordSettings = { ...DEFAULT_SETTINGS };
  currentRef: PassageReference = parseReference("John 3:16");
  library!: OfflineBibleLibrary;
  private listeners = new Set<(ref: PassageReference) => void>();
  async onload(): Promise<void> {
    const previous = await this.loadData() as Partial<MySwordSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(previous ?? {}),
      bookmarks: Array.isArray(previous?.bookmarks) ? previous.bookmarks : [],
      highlights: Array.isArray(previous?.highlights) ? previous.highlights : []
    };
    try { this.currentRef = parseOsis(this.settings.reference); }
    catch { this.currentRef = parseReference("John 3:16"); }
    this.library = new OfflineBibleLibrary(this.app, this.manifest.id);
    const available = await this.library.initialize();

    this.registerView(READER_VIEW, (leaf: WorkspaceLeaf) => new ReaderView(leaf, this));
    this.registerView(INSPECTOR_VIEW, (leaf: WorkspaceLeaf) => new InspectorView(leaf, this));
    this.registerView(SEARCH_VIEW, (leaf: WorkspaceLeaf) => new SearchView(leaf, this));
    this.registerView(LIBRARY_VIEW, (leaf: WorkspaceLeaf) => new LibraryView(leaf, this));

    this.addRibbonIcon("book-open", "VerseDock Bible Reader", () => { void this.openReader(); });
    this.addCommand({ id: "open-reader", name: "Open Bible Reader", callback: () => { void this.openReader(); } });
    this.addCommand({ id: "open-study-desk", name: "Open Bible Study Desk", callback: () => {
      void (async () => { await this.openReader(); await this.openInspector(); })();
    } });
    this.addCommand({ id: "open-inspector", name: "Open Study Inspector", callback: () => { void this.openInspector(); } });
    this.addCommand({ id: "search-scripture", name: "Search installed Bible", callback: () => { void this.openSearch(); } });
    this.addCommand({ id: "open-library", name: "Open Module Library", callback: () => { void this.openView(LIBRARY_VIEW, "right"); } });
    this.addCommand({ id: "quick-jump", name: "Quick Jump to Scripture reference", callback: () => this.openReferenceModal("jump") });
    this.addCommand({ id: "quick-insert", name: "Quick Verse Insert into Markdown", callback: () => this.openReferenceModal("insert") });
    this.addCommand({ id: "focus-toggle", name: "Toggle Reader Focus Mode", callback: () => {
      this.settings.mode = this.settings.mode === "focus" ? "classic" : "focus";
      void this.saveSettings();
      this.listeners.forEach(listener => listener(this.currentRef));
    } });
    this.addSettingTab(new MySwordSettingsTab(this));

    if (!available) new Notice("VerseDock: Offline WEB library missing. Build and deploy the library to the plugin directory.");
  }
  onunload(): void {
    this.listeners.clear();
    this.app.workspace.detachLeavesOfType(READER_VIEW);
    this.app.workspace.detachLeavesOfType(INSPECTOR_VIEW);
    this.app.workspace.detachLeavesOfType(SEARCH_VIEW);
    this.app.workspace.detachLeavesOfType(LIBRARY_VIEW);
  }
  selectReference(ref: PassageReference): void {
    if (!BOOKS.includes(ref.book)) return;
    this.currentRef = ref;
    this.settings.reference = osisId(ref);
    void this.saveSettings();
    for (const subscriber of [...this.listeners]) subscriber(ref);
  }
  subscribe(callback: (ref: PassageReference) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  async saveSettings(): Promise<void> { await this.saveData(this.settings); }
  private async openView(type: string, placement: "primary" | "right" = "primary"): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(type)[0];
    if (!leaf) {
      leaf = placement === "right"
        ? this.app.workspace.getRightLeaf(true) ?? this.app.workspace.getLeaf(true)
        : this.app.workspace.getLeaf(true);
      await leaf.setViewState({ type, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }
  async openReader(): Promise<void> { await this.openView(READER_VIEW); }
  async openInspector(): Promise<void> { await this.openView(INSPECTOR_VIEW, "right"); }
  async openSearch(): Promise<void> { await this.openView(SEARCH_VIEW, "right"); }
  openReferenceModal(mode: "jump" | "insert"): void { new ReferenceModal(this, mode).open(); }

  private studyFilePath(ref: PassageReference): string {
    const book = ref.book.name.replace(/[\/:*?"<>|]/g, "");
    return "Bible Study/" + book + "/" + book + " " + ref.chapter + (ref.verse ? "-" + ref.verse : "") + ".md";
  }
  async openStudyNote(ref: PassageReference): Promise<void> {
    const path = this.studyFilePath(ref);
    const folder = path.slice(0, path.lastIndexOf("/"));
    const parent = this.app.vault.getAbstractFileByPath(folder);
    if (!parent) {
      const root = folder.split("/")[0];
      if (!this.app.vault.getAbstractFileByPath(root)) await this.app.vault.createFolder(root);
      await this.app.vault.createFolder(folder);
    }
    let file = this.app.vault.getAbstractFileByPath(path);
    if (!file) {
      const text = [
        "---",
        'type: scripture-study',
        'scripture: "' + osisId(ref) + '"',
        'translation: "WEB"',
        "---", "",
        "# " + refLabel(ref), "",
        "## Observations", "", "## Questions", "", "## Reflections", ""
      ].join("\n");
      file = await this.app.vault.create(path, text);
    }
    if (!(file instanceof TFile)) { new Notice("Cannot open study note: " + path); return; }
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file);
    new Notice("Study note: " + refLabel(ref));
  }
  toggleBookmark(ref: PassageReference): void {
    const id = osisId(ref);
    const had = this.settings.bookmarks.includes(id);
    this.settings.bookmarks = had ? this.settings.bookmarks.filter(x => x !== id) : [...this.settings.bookmarks, id];
    this.selectReference(ref);
    new Notice(had ? "Bookmark removed" : "Verse bookmarked");
  }
  toggleHighlight(ref: PassageReference): void {
    const id = osisId(ref);
    const had = this.settings.highlights.includes(id);
    this.settings.highlights = had ? this.settings.highlights.filter(x => x !== id) : [...this.settings.highlights, id];
    this.selectReference(ref);
    new Notice(had ? "Highlight removed" : "Verse highlighted");
  }
  async copyPassage(ref: PassageReference): Promise<void> {
    try {
      const verseLines = await this.library.getPassage(ref);
      const label = refLabel(ref) + " (WEB)";
      const text = verseLines.map(v => v.verse + " " + v.text).join("\n") + "\n— " + label;
      await navigator.clipboard.writeText(text);
      new Notice("Copied " + label);
    } catch (error) {
      new Notice("Copy failed: " + (error instanceof Error ? error.message : String(error)));
    }
  }
}

class MySwordSettingsTab extends PluginSettingTab {
  constructor(private readonly plugin: MySwordPlusPlugin) { super(plugin.app, plugin); }
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "VerseDock · Appearance" });
    containerEl.createEl("p", { text: "This development build follows your Obsidian theme. All Bible reading uses the installed public-domain WEB edition." });
    new Setting(containerEl).setName("Reading typeface").setDesc("Changes only Scripture, not Obsidian notes.")
      .addDropdown(dropdown => dropdown
        .addOption("serif", "Reading serif")
        .addOption("sans", "System sans")
        .addOption("obsidian", "Follow Obsidian")
        .setValue(this.plugin.settings.fontStyle)
        .onChange(async value => { this.plugin.settings.fontStyle = value as MySwordSettings["fontStyle"]; await this.plugin.saveSettings(); this.plugin.selectReference(this.plugin.currentRef); }));
    new Setting(containerEl).setName("Font size").setDesc("Bible reader font size in pixels.")
      .addSlider(slider => slider.setLimits(14, 26, 1).setValue(this.plugin.settings.fontSize).setDynamicTooltip()
        .onChange(async value => { this.plugin.settings.fontSize = value; await this.plugin.saveSettings(); this.plugin.selectReference(this.plugin.currentRef); }));
    new Setting(containerEl).setName("Reading mode")
      .addDropdown(dropdown => dropdown.addOption("classic","Classic").addOption("compact","Compact").addOption("focus","Focus")
        .setValue(this.plugin.settings.mode)
        .onChange(async value => { this.plugin.settings.mode = value as MySwordSettings["mode"]; await this.plugin.saveSettings(); this.plugin.selectReference(this.plugin.currentRef); }));
    new Setting(containerEl).setName("Offline Bible source")
      .setDesc("World English Bible (ENGWEBP) · Public Domain · 66-book edition. Source: https://ebible.org/details.php?id=engwebp");
  }
}
