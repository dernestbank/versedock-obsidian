import { restoreAnnotations, type ReaderAnnotation } from "./core/annotations";
import { addIcon } from "obsidian";
import ribbonSvg from "../assets/brand/ribbon.svg?raw";
import { bundledLibraryFolder } from "./core/bundled-library-files";
import { Plugin, PluginSettingTab, Setting, Modal, Notice, TFile, type WorkspaceLeaf } from "obsidian";
import { createReadingInstaller } from "./obsidian/reading-installer";
import type { ReadingInstallService } from "./core/reading-install-service";
import { BOOK_BY_OSIS } from "./core/books";
import { OfflineBibleLibrary, type BibleResource } from "./core/library";
import { ImportedBibleResource } from "./core/imported-bible";
import {installedModuleFootprint} from './core/module-installation';
import { isLocalModuleId } from "./core/module-provenance";
import type { WordToken } from "./core/library";
import { StrongsLexicon } from "./core/lexicon";
import { InterlinearLibrary } from "./core/interlinear";
import { restoredInterlinearPreferences } from "./core/interlinear-preferences";
import { CrossReferenceLibrary } from "./core/cross-references";
import { CommentaryLibrary } from "./core/commentary";
import { parseOsis, parseReference, passageIsHighlighted, togglePassageHighlight, referenceId, refLabel, type PassageReference } from "./core/references";
import { restoredKjvDisplayMode, type KjvDisplayMode } from "./core/kjv-display";
import { normalizeReadingHistory, recordReadingHistory } from "./core/reading-history";
import { newStudyNoteMarkdown, normalizeStudyNoteFolder, type ScriptureNoteDiscovery } from "./core/scripture-notes";
import { DEFAULT_SETTINGS, type InspectorTarget, type SwordDockSettings, type SwordDockController } from "./controller";
import { discoverVaultScriptureNotes, resolveStudyNoteTarget } from "./obsidian/scripture-note-index";
import { ReaderView, READER_VIEW } from "./ui/reader-view";
import { InspectorView, INSPECTOR_VIEW } from "./ui/inspector-view";
import { ResourcesView, RESOURCES_VIEW } from "./ui/resources-view";
import { SearchView, SEARCH_VIEW } from "./ui/search-view";
import { LibraryView, LIBRARY_VIEW } from "./ui/library-view";
import { ComparisonView, COMPARISON_VIEW } from "./ui/comparison-view";
import { OFFLINE_LIBRARY_RECOVERY } from "./ui/library-recovery";
import { ReferenceModal } from "./ui/reference-modal";
import { LocalModuleImportModal } from "./ui/local-module-import-modal";
import { StorageManagementModal } from "./ui/storage-modal";
import { ResourceDetailModal } from "./ui/resource-detail-modal";
import { NavigationView, NAVIGATION_VIEW } from "./ui/navigation-view";
import { migrateStudyToolsToCenter } from "./obsidian/study-layout";
import { WorkspaceHelpModal } from "./ui/workspace-help-modal";
import { normalizeStudyLinkAssignment, StudyLinkBus, type StudyLinkCause, type StudyLinkEvent, type StudyLinkOrigin, type StudyLinkAssignment } from "./core/link-groups";
import { transitionReaderMode } from "./ui/reader-mode";
import { FocusDockSession, restoredFocusDockState } from "./obsidian/focus-workspace";
import { readScriptureNotePreview } from "./obsidian/note-preview";
import type { ScriptureNotePreview } from "./core/note-preview";

export default class SwordDockBiblePlugin extends Plugin implements SwordDockController {
  modules!: ReadingInstallService;
  settings: SwordDockSettings = { ...DEFAULT_SETTINGS };
  currentRef: PassageReference = parseReference("John 3:16");
  library!: OfflineBibleLibrary;
  kjv!: OfflineBibleLibrary;
  lexicon!: StrongsLexicon;
  interlinear!: InterlinearLibrary;
  selectedWord: { ref: PassageReference; token: WordToken; index: number } | null = null;
  private importedBibles = new Map<string, BibleResource>();
  private importedBibleGenerations = new Map<string,string>();
  private readonly importedBibleLifetime=new AbortController();
  private moduleRefreshRevision=0;
  private editionSelectionRevision=0;
  get readerBible(): BibleResource { return this.importedBibles.get(this.settings.bibleEdition) ?? (this.settings.bibleEdition === "kjv" ? this.kjv : this.library); }
  availableBibleEditions(): Array<{id:string;title:string;ready:boolean}> {
    return [{id:"webp",title:"World English Bible",ready:!!this.library.metadata}, ...(this.kjv.metadata ? [{id:"kjv",title:"KJV · CrossWire tagged edition",ready:true}] : []),
      ...this.modules.installed.filter(module=>module.kind==="bible").map(module=>({id:module.id,title:module.title+" · "+(isLocalModuleId(module.id)?"Local file":"MySword")+" "+module.version,ready:true}))];
  }
  async getBibleResource(edition:string):Promise<BibleResource|null> {
    if(edition==="webp")return this.library;
    if(edition==="kjv")return this.kjv;
    const info=this.modules.installed.find(module=>module.id===edition&&module.kind==="bible");
    if(!info)return null;
    const cached=this.importedBibles.get(edition);
    if(cached&&this.importedBibleGenerations.get(edition)===info.directory)return cached;
    const module=await this.modules.load(edition);
    if(this.modules.installed.find(item=>item.id===edition)?.directory!==info.directory)return this.getBibleResource(edition);
    const bible=await ImportedBibleResource.create(module,installedModuleFootprint(info),async()=>{await this.modules.readVersion(info.directory);},this.importedBibleLifetime.signal);
    if(this.modules.installed.find(item=>item.id===edition)?.directory!==info.directory)return this.getBibleResource(edition);
    this.importedBibles.set(edition,bible);this.importedBibleGenerations.set(edition,info.directory);return bible;
  }
  crossReferences!: CrossReferenceLibrary;
  commentary!: CommentaryLibrary;
  private listeners = new Set<(ref: PassageReference) => void>();
  private readonly studyLinkBus = new StudyLinkBus();
  private studyLinkAssignments: Record<"reader" | "comparison", StudyLinkAssignment> = {
    reader: { group: "unlinked", mode: "follow" },
    comparison: { group: "unlinked", mode: "follow" },
  };
  private linkEventCounter = 0;
  private backStack: PassageReference[] = [];
  private forwardStack: PassageReference[] = [];
  private focusDocks: FocusDockSession | null = null;
  async onload(): Promise<void> {
    const previous = await this.loadData() as Partial<SwordDockSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(previous ?? {}),
      annotations: restoreAnnotations(previous?.annotations),
      bookmarks: Array.isArray(previous?.bookmarks) ? previous.bookmarks : [],
      highlights: Array.isArray(previous?.highlights) ? previous.highlights : [],
      studyNoteFolder: normalizeStudyNoteFolder(previous?.studyNoteFolder),
      history: normalizeReadingHistory(previous?.history),
      focusReturnMode: previous?.focusReturnMode === "compact" ? "compact" : "classic",
      focusDockState: restoredFocusDockState(previous?.focusDockState),
      bibleEdition: typeof previous?.bibleEdition === "string" && /^[a-z0-9-]{1,80}$/.test(previous.bibleEdition) ? previous.bibleEdition : "webp",
      kjvDisplayMode: restoredKjvDisplayMode(previous?.kjvDisplayMode),
      kjvInlineStrongs: previous?.kjvInlineStrongs === true,
      interlinear: restoredInterlinearPreferences(previous?.interlinear),
      studyLinks: {
        reader: normalizeStudyLinkAssignment(previous?.studyLinks?.reader),
        comparison: normalizeStudyLinkAssignment(previous?.studyLinks?.comparison)
      }
    };
    this.studyLinkAssignments = {
      reader: { ...this.settings.studyLinks.reader },
      comparison: { ...this.settings.studyLinks.comparison }
    };
    try { this.currentRef = parseOsis(this.settings.reference); }
    catch { this.currentRef = parseReference("John 3:16"); }
    this.library = new OfflineBibleLibrary(this.app, this.manifest.id);
    const available = await this.library.initialize();
    this.kjv = new OfflineBibleLibrary(this.app, this.manifest.id, "kjv");
    await this.kjv.initialize();
    const pluginDir = this.app.vault.configDir + "/plugins/" + this.manifest.id;
    if (this.settings.bibleEdition === "kjv" && !this.kjv.metadata && available) this.settings.bibleEdition = "webp";
    const lexiconFiles = bundledLibraryFolder(this.app.vault.adapter, pluginDir, "strongs");
    this.lexicon = new StrongsLexicon(lexiconFiles.read, lexiconFiles.size);
    await this.lexicon.initialize();
    const interlinearFiles = bundledLibraryFolder(this.app.vault.adapter, pluginDir, "interlinear");
    this.interlinear = new InterlinearLibrary(interlinearFiles.read, interlinearFiles.size);
    await this.interlinear.initialize();
    const crossReferencesFiles = bundledLibraryFolder(this.app.vault.adapter, pluginDir, "crossrefs");
    this.crossReferences = new CrossReferenceLibrary(crossReferencesFiles.read, crossReferencesFiles.size);
    await this.crossReferences.initialize();
    const commentaryFiles = bundledLibraryFolder(this.app.vault.adapter, pluginDir, "mhc");
    this.commentary = new CommentaryLibrary(commentaryFiles.read, commentaryFiles.size);
    await this.commentary.initialize();

    this.modules = await createReadingInstaller(this.app, ()=>[this.settings.bibleEdition]);
    if(this.settings.bibleEdition!=="webp"&&this.settings.bibleEdition!=="kjv") {
      try {if(!await this.getBibleResource(this.settings.bibleEdition))throw new Error("Unavailable Bible");}
      catch {this.settings.bibleEdition="webp";new Notice("The previously selected Bible is unavailable. WEB has been selected; check Module Library.");}
    }
    let inventory=this.modules.installed.map(info=>info.directory).sort().join();
    this.register(this.modules.subscribe(()=>{
      const next=this.modules.installed.map(info=>info.directory).sort().join();
      if(next===inventory)return;inventory=next;
      const edition=this.settings.bibleEdition,revision=++this.moduleRefreshRevision;
      const refresh=():void=>{if(revision===this.moduleRefreshRevision)this.listeners.forEach(listener=>listener(this.currentRef));};
      if(edition==='webp'||edition==='kjv'){refresh();return;}
      void this.getBibleResource(edition).then(bible=>{
        if(revision!==this.moduleRefreshRevision||this.settings.bibleEdition!==edition)return;
        if(!bible)throw Error('Selected Bible unavailable.');refresh();
      }).catch(()=>{
        if(revision!==this.moduleRefreshRevision||this.settings.bibleEdition!==edition)return;
        this.settings.bibleEdition='webp';this.selectedWord=null;refresh();void this.saveSettings();
        new Notice('The selected Bible could not be reopened. WEB is selected; review resource recovery in Module Library.');
      });
    }));
    this.registerView(READER_VIEW, (leaf: WorkspaceLeaf) => new ReaderView(leaf, this));
    this.registerView(NAVIGATION_VIEW, (leaf: WorkspaceLeaf) => new NavigationView(leaf, this));
    this.registerView(INSPECTOR_VIEW, (leaf: WorkspaceLeaf) => new InspectorView(leaf, this));
    this.registerView(RESOURCES_VIEW, (leaf: WorkspaceLeaf) => new ResourcesView(leaf, this));
    this.registerView(SEARCH_VIEW, (leaf: WorkspaceLeaf) => new SearchView(leaf, this));
    this.registerView(LIBRARY_VIEW, (leaf: WorkspaceLeaf) => new LibraryView(leaf, this));
    this.registerView(COMPARISON_VIEW, (leaf: WorkspaceLeaf) => new ComparisonView(leaf, this));
    this.focusDocks = new FocusDockSession(this.app.workspace, this.settings.focusDockState, state => {
      this.settings.focusDockState = state;
      void this.saveSettings();
    });
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.synchronizeFocusDocks()));
    this.app.workspace.onLayoutReady(() => this.synchronizeFocusDocks());

    addIcon("sworddock-bookmark", ribbonSvg.slice(ribbonSvg.indexOf(">") + 1, ribbonSvg.lastIndexOf("</svg>")));
    this.addRibbonIcon("sworddock-bookmark", "SwordDock Bible Reader", () => { void this.openReader(); });
    this.addCommand({ id: "open-reader", name: "Open Bible Reader", callback: () => { void this.openReader(); } });
    this.addCommand({ id: "open-study-desk", name: "Open Bible Study Desk", callback: () => { void this.openStudyDesk(); } });
    this.addCommand({ id: "open-navigation", name: "Open Bible navigation dock", callback: () => { void this.openNavigation(); } });
    this.addCommand({ id: "open-inspector", name: "Open Study Inspector", callback: () => { void this.openInspector(); } });
    this.addCommand({ id: "open-resources", name: "Open Resources dock", callback: () => { void this.openResources(); } });
    this.addCommand({ id: "search-scripture", name: "Search installed Bible", callback: () => { void this.openSearch(); } });
    this.addCommand({ id: "open-library", name: "Open Module Library", callback: () => { void this.openLibrary(); } });
    this.addCommand({ id: "open-comparison", name: "Open Bible Comparison", callback: () => { void this.openComparison(); } });
    this.addCommand({ id: "inspect-mysword-bible", name: "Import or inspect a local MySword module", callback: () => this.openMySwordInspector() });
    this.addCommand({ id: "quick-jump", name: "Quick Jump to Scripture reference", callback: () => this.openReferenceModal("jump") });
    this.addCommand({ id: "quick-insert", name: "Quick Verse Insert into Markdown", callback: () => this.openReferenceModal("insert") });
    this.addCommand({ id: "focus-toggle", name: "Toggle Reader Focus Mode", callback: () => {
      void this.openView(READER_VIEW).then(() => this.setReaderMode("toggle-focus"));
    } });
    this.addSettingTab(new SwordDockSettingsTab(this));

    if (!available) new Notice(OFFLINE_LIBRARY_RECOVERY.startupNotice);
  }
  onunload(): void {
    this.importedBibleLifetime.abort();
    this.moduleRefreshRevision++;
    this.editionSelectionRevision++;
    this.modules?.stop();
    this.focusDocks?.stop();
    this.listeners.clear();
  }
  selectReference(ref: PassageReference, origin: StudyLinkOrigin = "reader", cause: StudyLinkCause = "user"): void {
    if (this.selectedWord && referenceId(ref) !== referenceId(this.selectedWord.ref)) this.selectedWord = null;
    // Modal/parser surfaces can hand us an equivalent BookInfo object from a
    // bundled module boundary. Canonicalize by OSIS before validating so
    // range references are not silently discarded by an identity check.
    const canonicalBook = BOOK_BY_OSIS.get(ref.book.osis);
    if (!canonicalBook) return;
    const canonicalRef = canonicalBook === ref.book ? ref : { ...ref, book: canonicalBook };
    if (referenceId(canonicalRef) !== referenceId(this.currentRef)) {
      this.backStack.push(this.currentRef);
      this.forwardStack = [];
    }
    this.applyReference(canonicalRef, origin, cause);
  }
  canNavigateBack(): boolean { return this.backStack.length > 0; }
  canNavigateForward(): boolean { return this.forwardStack.length > 0; }
  navigateBack(): void {
    const target = this.backStack.pop();
    if (!target) return;
    this.forwardStack.push(this.currentRef);
    this.applyReference(target, "reader", "history");
  }
  navigateForward(): void {
    const target = this.forwardStack.pop();
    if (!target) return;
    this.backStack.push(this.currentRef);
    this.applyReference(target, "reader", "history");
  }
  private applyReference(ref: PassageReference, origin: StudyLinkOrigin, cause: StudyLinkCause): void {
    if (this.selectedWord && referenceId(ref) !== referenceId(this.selectedWord.ref)) this.selectedWord = null;
    this.currentRef = ref;
    this.settings.reference = referenceId(ref);
    this.settings.history = recordReadingHistory(this.settings.history, ref);
    void this.saveSettings();
    for (const subscriber of [...this.listeners]) subscriber(ref);
    const assignment = this.studyLinkAssignments[origin === "comparison" ? "comparison" : "reader"];
    if (assignment.group !== "unlinked") {
      this.studyLinkBus.publish({
        eventId: "study-link-" + Date.now() + "-" + (++this.linkEventCounter),
        timestamp: Date.now(),
        origin,
        group: assignment.group,
        osis: referenceId(ref),
        sourceVersification: "osis",
        selectionKind: ref.verse === undefined ? "chapter" : ref.endVerse === undefined ? "verse" : "range",
        cause,
      });
    }
  }
  subscribe(callback: (ref: PassageReference) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  getStudyLinkAssignment(surface: "reader" | "comparison"): StudyLinkAssignment {
    return { ...this.studyLinkAssignments[surface] };
  }
  setStudyLinkAssignment(surface: "reader" | "comparison", assignment: StudyLinkAssignment): void {
    const normalized = normalizeStudyLinkAssignment(assignment);
    this.studyLinkAssignments[surface] = normalized;
    this.settings.studyLinks = {
      ...this.settings.studyLinks,
      [surface]: { ...normalized }
    };
    void this.saveSettings();
    for (const subscriber of [...this.listeners]) subscriber(this.currentRef);
  }
  subscribeStudyLinks(callback: (event: StudyLinkEvent) => void): () => void {
    return this.studyLinkBus.subscribe(callback);
  }
  private pendingSave: Promise<void> = Promise.resolve();
  saveSettings(): Promise<void> {
    const write = this.pendingSave.then(() => this.saveData(this.settings));
    this.pendingSave = write.catch(() => {});
    return write;
  }
  private pendingAnnotation: Promise<void> = Promise.resolve();
  changeAnnotation(previous: ReaderAnnotation | null, replacement: ReaderAnnotation | null): Promise<void> {
    const change = this.pendingAnnotation.then(async () => {
      const before = this.settings.annotations;
      if (previous && !before.includes(previous)) throw new Error("This annotation changed. Reopen it before editing.");
      this.settings.annotations = previous
        ? before.flatMap(mark => mark !== previous ? [mark] : replacement ? [replacement] : [])
        : [...before, ...(replacement ? [replacement] : [])];
      try { await this.saveSettings(); }
      catch (error) { this.settings.annotations = before; throw error; }
      for (const subscriber of this.listeners) subscriber(this.currentRef);
    });
    this.pendingAnnotation = change.catch(() => {});
    return change;
  }
  async setBibleEdition(edition: string): Promise<void> {
    const revision=++this.editionSelectionRevision;
    let bible: BibleResource|null;
    try {bible=await this.getBibleResource(edition);}catch(error){if(revision===this.editionSelectionRevision)new Notice(error instanceof Error?error.message:"Unable to load this Bible.");return;}
    if(revision!==this.editionSelectionRevision)return;
    if (!bible?.metadata) { new Notice("This Bible edition is unavailable. Recheck Module Library."); return; }
    this.settings.bibleEdition = edition;
    this.selectedWord = null;
    this.listeners.forEach(listener => listener(this.currentRef));
    await this.saveSettings();
  }
  async setKjvDisplayMode(mode: KjvDisplayMode): Promise<void> {
    this.settings.kjvDisplayMode = restoredKjvDisplayMode(mode);
    if (this.settings.kjvDisplayMode !== "word-study") this.selectedWord = null;
    this.listeners.forEach(listener => listener(this.currentRef));
    await this.saveSettings();
  }
  async setKjvInlineStrongs(enabled: boolean): Promise<void> {
    this.settings.kjvInlineStrongs = enabled;
    this.listeners.forEach(listener => listener(this.currentRef));
    await this.saveSettings();
  }
  selectWord(ref: PassageReference, token: WordToken, index: number): void {
    if (this.settings.bibleEdition !== "kjv" || this.settings.kjvDisplayMode !== "word-study" || !token.strongs?.length) return;
    this.selectedWord = { ref, token, index };
    this.selectReference(ref);
  }
  clearSelectedWord(): void {
    this.selectedWord = null;
    this.listeners.forEach(listener => listener(this.currentRef));
  }
  async setReaderMode(mode: SwordDockSettings["mode"] | "toggle-focus"): Promise<void> {
    Object.assign(this.settings, transitionReaderMode(this.settings, mode));
    this.synchronizeFocusDocks();
    this.listeners.forEach(listener => listener(this.currentRef));
    await this.saveSettings();
  }
  private synchronizeFocusDocks(): void {
    const reader = this.app.workspace.getActiveViewOfType(ReaderView);
    const root = reader?.leaf.getRoot();
    this.focusDocks?.update(this.settings.mode === "focus" && !!reader
      && root !== this.app.workspace.leftSplit && root !== this.app.workspace.rightSplit);
  }
  private async openView(type: string, placement: "primary" | "right" | "left" = "primary"): Promise<WorkspaceLeaf> {
    let leaf = this.app.workspace.getLeavesOfType(type)[0];
    if (!leaf) {
      leaf = placement === "left" ? this.app.workspace.getLeftLeaf(false) ?? this.app.workspace.getLeaf(true) : placement === "right"
        ? this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf(true)
        : this.app.workspace.getLeaf(true);
      await leaf.setViewState({ type, active: true });
    }
    if (placement === "left") this.app.workspace.leftSplit.expand();
    if (placement === "right") this.app.workspace.rightSplit.expand();
    await this.app.workspace.revealLeaf(leaf);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    return leaf;
  }
  async openNavigation(): Promise<void> { await this.openView(NAVIGATION_VIEW, "left"); }
  openWorkspaceSettings(): void { new WorkspaceSettingsModal(this).open(); }
  openWorkspaceHelp(): void { new WorkspaceHelpModal(this).open(); }
  async openReader(): Promise<void> {
    if (this.settings.mode !== "focus") {
      await this.openNavigation();
      if (!this.app.workspace.getLeavesOfType(INSPECTOR_VIEW).length) await this.openInspector("study");
    }
    const leaf=await this.openView(READER_VIEW);await leaf.loadIfDeferred();
    if(leaf.view instanceof ReaderView)await leaf.view.focusPassage();
  }
  async openStudyDesk(): Promise<void> {
    if (this.settings.mode === "focus") await this.setReaderMode("toggle-focus");
    // Earlier builds put full-page tools into separate right-dock splits.
    // Reopen only those plugin-owned views in the center before removing
    // their old leaves, allowing the Study dock to use the available height.
    await migrateStudyToolsToCenter(this.app.workspace, [SEARCH_VIEW, LIBRARY_VIEW, COMPARISON_VIEW]);
    await this.openReader();
    await this.openInspector("study");
    // The Inspector opens in the right dock, but the Reader remains the
    // primary working surface for the next navigation or selection.
    await this.openReader();
  }
  async openInspector(tab?: InspectorTarget): Promise<void> {
    const leaf = await this.openView(INSPECTOR_VIEW, "right");
    await leaf.loadIfDeferred();
    const view = leaf.view;
    if (view instanceof InspectorView && tab) view.activateExternalTab(tab);
  }
  async openResources(moduleId?: string): Promise<void> {
    const leaf = await this.openView(RESOURCES_VIEW, "right");
    await leaf.loadIfDeferred();
    if (moduleId && leaf.view instanceof ResourcesView) leaf.view.openModule(moduleId);
  }
  async openSearch(): Promise<void> { await this.openNavigation(); await this.openView(SEARCH_VIEW); }
  async openLibrary(): Promise<void> { await this.openNavigation(); await this.openView(LIBRARY_VIEW); }
  async openComparison(): Promise<void> { await this.openNavigation(); await this.openView(COMPARISON_VIEW); }
  openResourceDetails(edition?: string): void {
    if(edition&&edition!=="webp"&&edition!=="kjv") {
      void this.getBibleResource(edition).then(bible=>{if(bible)new ResourceDetailModal(this,bible).open();}).catch(()=>new Notice("This edition could not be loaded."));return;
    }
    new ResourceDetailModal(this, edition === "webp" ? this.library : edition === "kjv" ? this.kjv : this.readerBible).open();
  }
  openStorageManagement(): void { new StorageManagementModal(this).open(); }
  openReferenceModal(mode: "jump" | "insert"): void { new ReferenceModal(this, mode).open(); }
  openMySwordInspector(): void { new LocalModuleImportModal(this).open(); }

  findScriptureNotes(ref: PassageReference): ScriptureNoteDiscovery {
    return discoverVaultScriptureNotes(this.app, ref, this.settings.studyNoteFolder);
  }
  getScriptureNotePreview(path: string): Promise<ScriptureNotePreview> {
    return readScriptureNotePreview(this.app, path);
  }
  async openStudyNote(ref: PassageReference): Promise<void> {
    const target = resolveStudyNoteTarget(this.app, ref, this.settings.studyNoteFolder);
    const path = target.path;
    let file: TFile | null = target.file;
    if (!file) {
      const folder = path.slice(0, path.lastIndexOf("/"));
      if (!this.app.vault.getAbstractFileByPath(folder)) {
        const root = folder.split("/")[0];
        if (!this.app.vault.getAbstractFileByPath(root)) await this.app.vault.createFolder(root);
        await this.app.vault.createFolder(folder);
      }
      file = await this.app.vault.create(path, newStudyNoteMarkdown(ref, this.readerBible.metadata?.abbreviation ?? this.settings.bibleEdition));
    }
    await this.revealNote(file);
    new Notice("Study note: " + refLabel(ref));
  }
  async openLinkedNote(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile) || file.extension !== "md") {
      new Notice("Linked Scripture note is no longer available.");
      return;
    }
    await this.revealNote(file);
  }
  private async revealNote(file: TFile): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType("markdown")
      .find(leaf => leaf.getViewState().state?.file === file.path);
    const leaf = existing ?? this.app.workspace.getLeaf(true);
    if (!existing) await leaf.openFile(file);
    await this.app.workspace.revealLeaf(leaf);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }
  toggleBookmark(ref: PassageReference): void {
    const id = referenceId(ref);
    const had = this.settings.bookmarks.includes(id);
    this.settings.bookmarks = had ? this.settings.bookmarks.filter(x => x !== id) : [...this.settings.bookmarks, id];
    this.selectReference(ref);
    new Notice(had ? "Bookmark removed" : "Verse bookmarked");
  }
  toggleHighlight(ref: PassageReference): void {
    const had = passageIsHighlighted(this.settings.highlights, ref);
    this.settings.highlights = togglePassageHighlight(this.settings.highlights, ref);
    this.selectReference(ref);
    new Notice(had ? "Highlight removed" : "Verse highlighted");
  }
  async copyPassage(ref: PassageReference): Promise<void> {
    try {
      const bible = this.readerBible;
      const verseLines = await bible.getPassage(ref);
      const label = refLabel(ref) + " (" + bible.metadata?.abbreviation + ")";
      const text = verseLines.map(v => v.verse + " " + v.text).join("\n") + "\n— " + label;
      await navigator.clipboard.writeText(text);
      new Notice("Copied " + label);
    } catch (error) {
      new Notice("Copy failed: " + (error instanceof Error ? error.message : String(error)));
    }
  }
}

class SwordDockSettingsTab extends PluginSettingTab {
  constructor(private readonly plugin: SwordDockBiblePlugin) { super(plugin.app, plugin); }
  display(): void {
    this.renderInto(this.containerEl);
  }
  renderInto(containerEl: HTMLElement): void {
    containerEl.empty();
    new Setting(containerEl).setName("SwordDock Bible · Settings").setHeading();
    containerEl.createEl("p", { text: "SwordDock follows your Obsidian theme. WEB, the Berean companion and your installed resources are available offline." });
    new Setting(containerEl).setName("Reading & appearance").setHeading();
    new Setting(containerEl).setName("Reading typeface").setDesc("Changes only Scripture, not Obsidian notes.")
      .addDropdown(dropdown => dropdown
        .addOption("serif", "Reading serif")
        .addOption("sans", "System sans")
        .addOption("obsidian", "Follow Obsidian")
        .setValue(this.plugin.settings.fontStyle)
        .onChange(async value => { this.plugin.settings.fontStyle = value as SwordDockSettings["fontStyle"]; await this.plugin.saveSettings(); this.plugin.selectReference(this.plugin.currentRef); }));
    new Setting(containerEl).setName("Font size").setDesc("Bible reader font size in pixels.")
      .addSlider(slider => slider.setLimits(14, 26, 1).setValue(this.plugin.settings.fontSize).setDynamicTooltip()
        .onChange(async value => { this.plugin.settings.fontSize = value; await this.plugin.saveSettings(); this.plugin.selectReference(this.plugin.currentRef); }));
    new Setting(containerEl).setName("Line height").setDesc("Space between Scripture lines in the Reader.")
      .addSlider(slider => slider.setLimits(1.15, 2, 0.01).setValue(this.plugin.settings.lineHeight).setDynamicTooltip()
        .onChange(async value => { this.plugin.settings.lineHeight = value; await this.plugin.saveSettings(); this.plugin.selectReference(this.plugin.currentRef); }));
    new Setting(containerEl).setName("Text width").setDesc("Reading measure in characters; narrower panes reflow automatically.")
      .addSlider(slider => slider.setLimits(52, 76, 1).setValue(this.plugin.settings.textWidth).setDynamicTooltip()
        .onChange(async value => { this.plugin.settings.textWidth = value; await this.plugin.saveSettings(); this.plugin.selectReference(this.plugin.currentRef); }));
    new Setting(containerEl).setName("Reading mode")
      .addDropdown(dropdown => dropdown.addOption("classic","Classic").addOption("compact","Compact study").addOption("focus","Focus")
        .setValue(this.plugin.settings.mode)
        .onChange(async value => { await this.plugin.setReaderMode(value as SwordDockSettings["mode"]); }));
    new Setting(containerEl).setName("Offline Bible source")
      .setDesc("Choose an installed Bible. Module Library retains the source and notices for each edition.")
      .addDropdown(dropdown => {
        for(const edition of this.plugin.availableBibleEditions().filter(edition=>edition.ready)) dropdown.addOption(edition.id,edition.title);
        dropdown.setValue(this.plugin.settings.bibleEdition).onChange(value => this.plugin.setBibleEdition(value));
      });
    new Setting(containerEl).setName("Scripture study display")
      .setDesc("Read Scripture or open its labelled Berean companion. Tagged word study is available for an existing tagged KJV. Companion glosses follow Berean wording.")
      .addDropdown(dropdown => dropdown.addOption("reading", "Reading").addOption("word-study", "Word study").addOption("interlinear", "Berean interlinear companion")
        .setValue(this.plugin.settings.kjvDisplayMode)
        .onChange(async value => { await this.plugin.setKjvDisplayMode(restoredKjvDisplayMode(value)); }));
    new Setting(containerEl).setName("Show KJV Strong’s identifiers")
      .setDesc("Show the source’s H/G identifiers beside tagged words in Word study mode.")
      .addToggle(toggle => toggle.setValue(this.plugin.settings.kjvInlineStrongs)
        .onChange(value => this.plugin.setKjvInlineStrongs(value)));
    new Setting(containerEl).setName("Reset reading appearance")
      .setDesc("Restore the default typeface, size, line height, text width and classic mode.")
      .addButton(button => button.setButtonText("Reset").onClick(async () => {
        this.plugin.settings.fontStyle = DEFAULT_SETTINGS.fontStyle;
        this.plugin.settings.fontSize = DEFAULT_SETTINGS.fontSize;
        this.plugin.settings.lineHeight = DEFAULT_SETTINGS.lineHeight;
        this.plugin.settings.textWidth = DEFAULT_SETTINGS.textWidth;
        await this.plugin.setReaderMode(DEFAULT_SETTINGS.mode);
        this.renderInto(containerEl);
      }));

    new Setting(containerEl).setName("Study workspace").setHeading();
    new Setting(containerEl).setName("Study Inspector")
      .setDesc("Open the linked notes, bookmarks, history and validated resource panels beside the Reader.")
      .addButton(button => button.setButtonText("Open Inspector").onClick(() => { void this.plugin.openInspector(); }));
    new Setting(containerEl).setName("Resources dock")
      .setDesc("Browse installed Bible, commentary and Strong’s dictionaries in a separate native right-sidebar tab.")
      .addButton(button => button.setButtonText("Open Resources").onClick(() => { void this.plugin.openResources(); }));
    new Setting(containerEl).setName("Scripture search")
      .setDesc("Search the selected offline Bible without leaving the vault.")
      .addButton(button => button.setButtonText("Open Search").onClick(() => { void this.plugin.openSearch(); }));

    new Setting(containerEl).setName("Library & downloads").setHeading();
    new Setting(containerEl).setName("Module Library")
      .setDesc("Review installed resource provenance, integrity and safe MySword inspection.")
      .addButton(button => button.setButtonText("Open Library").onClick(() => { void this.plugin.openLibrary(); }));
    new Setting(containerEl).setName("Network access")
      .setDesc("Catalogue downloads use the reviewed publisher sources and start only when requested. Reading and local-file import work offline.");

    new Setting(containerEl).setName("Notes & references").setHeading();
    new Setting(containerEl).setName("Study notes")
      .setDesc("Primary Scripture notes are normal Markdown files in your vault. The Reader can create or open them for the current passage.")
      .addButton(button => button.setButtonText("Open current note").onClick(() => { void this.plugin.openStudyNote(this.plugin.currentRef); }));
    new Setting(containerEl).setName("Note destination")
      .setDesc("Folder for newly created primary Scripture notes. Existing notes are never moved.")
      .addText(text => text.setPlaceholder("Bible Study").setValue(this.plugin.settings.studyNoteFolder)
        .onChange(async value => {
          const normalized = normalizeStudyNoteFolder(value);
          this.plugin.settings.studyNoteFolder = normalized;
          text.setValue(normalized);
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl).setName("Reference insertion")
      .setDesc("Quick Verse Insert writes a callout or quote using the selected Bible edition; it never overwrites an existing note automatically.");

    new Setting(containerEl).setName("Keyboard & accessibility").setHeading();
    new Setting(containerEl).setName("Reader shortcuts")
      .setDesc("Use [ and ] for chapter navigation, J and K for verse movement, Shift+J/Shift+K to extend a selection, and Tab or Enter for verse actions. Reader controls expose accessible names.");
    new Setting(containerEl).setName("Reduced motion")
      .setDesc("SwordDock follows Obsidian's motion preferences and does not add looping or distracting animation.");

    new Setting(containerEl).setName("Data & privacy").setHeading();
    new Setting(containerEl).setName("Local data")
      .setDesc("Reading history, bookmarks and highlights are stored in plugin settings inside this vault. They are not uploaded by SwordDock.");
    new Setting(containerEl).setName("Storage & resources")
      .setDesc("Review measured offline resource files and the protection around the current default Bible.")
      .addButton(button => button.setButtonText("Manage storage").onClick(() => this.plugin.openStorageManagement()));
    new Setting(containerEl).setName("Clear local reading history")
      .setDesc("Remove the recent passage list without affecting notes or the installed Bible files.")
      .addButton(button => button.setButtonText("Clear history").onClick(async () => {
        if (!window.confirm("Clear SwordDock reading history? This does not delete notes, bookmarks or Bible files.")) return;
        this.plugin.settings.history = [];
        await this.plugin.saveSettings();
        button.setButtonText("Cleared");
      }));
  }
}

/** The same settings renderer serves the native settings tab and dock modal. */
class WorkspaceSettingsModal extends Modal {
  constructor(private readonly plugin: SwordDockBiblePlugin) { super(plugin.app); }
  onOpen(): void {
    this.contentEl.addClass("versedock", "vd-workspace-settings");
    new SwordDockSettingsTab(this.plugin).renderInto(this.contentEl);
  }
  onClose(): void { this.contentEl.empty(); }
}
