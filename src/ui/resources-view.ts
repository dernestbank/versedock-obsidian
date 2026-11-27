import { strongsAnnotations } from "./resource-annotations";
import { ItemView, Notice, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import type { SwordDockController } from "../controller";
import { referenceId, refLabel, type PassageReference } from "../core/references";
import {
  RESOURCE_LABELS, RESOURCE_TYPES, installedDockResources, restoredResourceDockState,
  selectedDockResource, strongsMatchesDictionary, type ResourceAvailability, type ResourceType
} from "../core/resource-dock";
import { emptyState, textButton } from "./components";
import { renderCommentaryPanel } from "./commentary-panel";
import { renderWordStudy } from "./word-study-panel";
import { ReadingResourcePanel, restoredReadingPositions, type ReadingPosition } from "./reading-resource-panel";
import type { BibleResource } from "../core/library";
import { InstalledStudyPanel } from "./installed-study-panel";
import { isLocalModuleId } from "../core/module-provenance";
import {VerseSourceModal} from './verse-source-modal';

export const RESOURCES_VIEW = "sworddock-resources";

/** Native right-sidebar tab: the existing Study/Parallel/Notes Inspector is never repurposed. */
export class ResourcesView extends ItemView {
  private unsubscribe: (() => void) | null = null;
  private resourceType: ResourceType = "commentary";
  private moduleId: string | null = null;
  private pinnedReference: PassageReference | null = null;
  private renderSequence = 0;
  private inventory = "";
  private wordCleanup: (() => void) | null = null;
  private moduleSelections: Partial<Record<ResourceType, string>> = {};
  private dictionaryQueries: Record<string, string> = {};
  private readingPositions: Record<string, ReadingPosition> = {};
  private readingPanel: ReadingResourcePanel | null = null;
  private studyPanel: InstalledStudyPanel | null = null;
  private unsubscribeModules: (() => void) | null = null;

  openModule(id: string): void {
    const installed = this.plugin.modules.installed.find(module => module.id === id);
    if (!installed) return;
    this.resourceType = installed.kind; this.moduleId = id; this.moduleSelections[installed.kind] = id;
    this.render(); this.app.workspace.requestSaveLayout();
  }

  private inventoryKey(): string {
    return this.plugin.modules.installed.filter(module => module.kind === this.resourceType).map(module => module.directory).sort().join();
  }

  private choices(): Array<{id:string;type:ResourceType;title:string}> {
    return [...installedDockResources(this.resourceType, this.available),
      ...this.plugin.modules.installed.filter(module => module.kind === this.resourceType)
        .map(module => ({ id:module.id, type:module.kind, title:module.title+(isLocalModuleId(module.id)?" · Local file":"") }))];
  }

  constructor(leaf: WorkspaceLeaf, private readonly plugin: SwordDockController) { super(leaf); }
  getViewType(): string { return RESOURCES_VIEW; }
  getDisplayText(): string { return "SwordDock Resources"; }
  getIcon(): string { return "library"; }

  getState(): Record<string, unknown> {
    return {
      resourceType: this.resourceType, moduleId: this.moduleId,
      moduleSelections: this.moduleSelections, dictionaryQueries: this.dictionaryQueries,
      readingPositions: this.readingPositions,
      pinnedReference: this.pinnedReference ? referenceId(this.pinnedReference) : null
    };
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    const restored = restoredResourceDockState(state);
    this.resourceType = restored.resourceType;
    this.moduleId = restored.moduleId;
    this.pinnedReference = restored.pinnedReference;
    this.moduleSelections = restored.moduleSelections;
    this.dictionaryQueries = restored.dictionaryQueries;
    this.readingPositions = restoredReadingPositions(state && typeof state === "object" ? (state as Record<string,unknown>).readingPositions : null);
    await super.setState(state, result);
    this.render();
  }

  async onOpen(): Promise<void> {
    this.unsubscribe = this.plugin.subscribe(() => {
      if(this.resourceType==="dictionary" && this.plugin.modules.installed.some(module=>module.id===this.moduleId))return;
      if (!["book", "devotional", "graphics"].includes(this.resourceType)) this.render();
    });
    this.inventory = this.inventoryKey();
    this.unsubscribeModules = this.plugin.modules.subscribe(() => {
      if (this.inventoryKey() !== this.inventory) this.render();
    });
    this.render();
  }
  async onClose(): Promise<void> {
    this.unsubscribe?.(); this.unsubscribe = null;
    this.wordCleanup?.(); this.wordCleanup = null;
    this.unsubscribeModules?.(); this.unsubscribeModules = null;
    this.readingPanel?.dispose(); this.readingPanel = null;
    this.studyPanel?.dispose(); this.studyPanel = null;
    this.renderSequence++;
    this.contentEl.empty();
  }

  private get reference(): PassageReference { return this.pinnedReference ?? this.plugin.currentRef; }
  private get available(): ResourceAvailability {
    return {
      webp: !!this.plugin.library.metadata, kjv: !!this.plugin.kjv.metadata,
      mhc: !!this.plugin.commentary.metadata, strongs: !!this.plugin.lexicon.metadata
    };
  }

  private selectType(type: ResourceType): void {
    if (this.moduleId) this.moduleSelections[this.resourceType] = this.moduleId;
    this.resourceType = type; this.moduleId = this.moduleSelections[type] ?? null;
    this.render();
    this.contentEl.querySelector<HTMLElement>(".vd-resource-type-select")?.focus({ preventScroll: true });
    this.app.workspace.requestSaveLayout();
  }

  private selectModule(id: string): void {
    const module = this.choices().find(module => module.id === id);
    if (!module || module.id !== id) return;
    this.moduleId = id;
    this.moduleSelections[this.resourceType] = id;
    this.render();
    this.contentEl.querySelector<HTMLElement>(".vd-resource-module-select")?.focus({ preventScroll: true });
    this.app.workspace.requestSaveLayout();
  }

  private render(): void {
    this.inventory = this.inventoryKey();
    this.readingPanel?.dispose(); this.readingPanel = null;
    this.studyPanel?.dispose(); this.studyPanel = null;
    const priorQuery = this.contentEl.querySelector<HTMLInputElement>(".vd-resource-dictionary-query");
    const selection = priorQuery && priorQuery === this.contentEl.ownerDocument.activeElement
      ? { start: priorQuery.selectionStart, end: priorQuery.selectionEnd, direction: priorQuery.selectionDirection }
      : null;
    const scrollTop = this.contentEl.querySelector<HTMLElement>(".vd-resources-body")?.scrollTop ?? 0;
    this.wordCleanup?.(); this.wordCleanup = null;
    const sequence = ++this.renderSequence;
    const modules = this.choices();
    const selected = modules.find(module => module.id === this.moduleId) ?? modules[0] ?? null;
    this.moduleId=selected?.id??null;
    const root = this.contentEl;
    root.empty(); root.addClass("versedock", "vd-resources");
    const header = root.createDiv({ cls: "vd-resources-header" });
    header.createEl("h2", { text: "Resources" });
    const current = this.reference;
    const context = header.createDiv({ cls: "vd-resources-context" });
    const independentDictionary=this.resourceType==="dictionary"&&this.plugin.modules.installed.some(module=>module.id===this.moduleId);
    const independent = independentDictionary || ["book", "devotional", "graphics"].includes(this.resourceType);
    context.createSpan({ cls: "vd-resource-reference", text: independentDictionary ? "Headword lookup" : independent ? "Independent reading" : refLabel(current) });
    const pin = textButton(context, this.pinnedReference ? "Pinned" : "Follow", () => {
      this.pinnedReference = this.pinnedReference ? null : { ...this.plugin.currentRef };
      this.app.workspace.requestSaveLayout();
      this.render();
      this.contentEl.querySelector<HTMLElement>(".vd-resource-pin")?.focus({ preventScroll: true });
    }, "vd-resource-pin");
    pin.setAttribute("aria-pressed", String(!!this.pinnedReference));
    pin.setAttribute("aria-label", this.pinnedReference ? "Unpin Resources and follow Reader" : "Pin Resources to " + refLabel(current));
    pin.hidden = independent;

    const controls = root.createDiv({ cls: "vd-resource-switch-controls" });
    const typeLabel = controls.createEl("label");
    typeLabel.createSpan({ text: "Resource type" });
    const typeSelect = typeLabel.createEl("select", { cls: "vd-resource-type-select", attr: { "aria-label": "Resource type" } });
    for (const type of RESOURCE_TYPES)
      typeSelect.createEl("option", { value: type, text: RESOURCE_LABELS[type] });
    typeSelect.value = this.resourceType;
    typeSelect.addEventListener("change", () => this.selectType(typeSelect.value as ResourceType));

    const moduleLabel = controls.createEl("label");
    moduleLabel.createSpan({ text: "Installed module" });
    const moduleSelect = moduleLabel.createEl("select", { cls: "vd-resource-module-select", attr: { "aria-label": "Installed module" } });
    if (!selected) moduleSelect.createEl("option", { value: "", text: "None installed" });
    else for (const module of modules)
      moduleSelect.createEl("option", { value: module.id, text: module.title });
    moduleSelect.value = selected?.id ?? "";
    moduleSelect.title = selected?.title ?? "No installed module";
    moduleSelect.disabled = !selected;
    moduleSelect.addEventListener("change", () => this.selectModule(moduleSelect.value));

    const body = root.createDiv({ cls: "vd-resources-body" });
    if (!selected) {
      emptyState(body, "No " + RESOURCE_LABELS[this.resourceType].toLowerCase() + " module installed",
        "Only validated, ready offline resources appear here. Source files and generated mockup entries are not installed modules.", "library");
    } else if (selected.type === "bible") {
      body.setText("Opening offline Bible…");
      void this.plugin.getBibleResource(selected.id).then(bible=>{
        if(!body.isConnected||sequence!==this.renderSequence)return;
        body.empty();
        if(bible)this.renderBible(body,bible,current,sequence);
        else body.setText("This Bible resource is unavailable. Recheck Module Library.");
      }).catch(error=>{if(body.isConnected&&sequence===this.renderSequence)body.setText(error instanceof Error?error.message:"Unable to open this Bible.");});
    } else if ((selected.type === "commentary" || selected.type === "dictionary") && this.plugin.modules.installed.some(module=>module.id===selected.id)) {
      this.studyPanel=new InstalledStudyPanel(body,this.plugin,selected.id,current,this.dictionaryQueries[selected.id]??"",this.readingPositions[selected.id]?.entry??"",(query,entry)=>{
        this.dictionaryQueries[selected.id]=query;
        this.readingPositions[selected.id]={entry,scroll:0,bookmarks:[],zoom:1};
        this.app.workspace.requestSaveLayout();
      });
    } else if (selected.type === "commentary") {
      renderCommentaryPanel(body, this.plugin, current, false);
    } else if (selected.type === "dictionary") {
      this.renderDictionary(body, selected.id, current, sequence);
    } else {
      this.readingPanel = new ReadingResourcePanel(body, this.plugin, selected.id, this.readingPositions[selected.id], position => {
        this.readingPositions[selected.id] = position; this.app.workspace.requestSaveLayout();
      });
    }
    const footer = root.createDiv({ cls: "vd-resources-footer" });
    textButton(footer, "Explore more " + RESOURCE_LABELS[this.resourceType].toLowerCase() + " resources", () => {
      void this.plugin.openLibrary();
    }, "vd-study-card-link");

    body.scrollTop = scrollTop;
    if (selection) {
      const input = root.querySelector<HTMLInputElement>(".vd-resource-dictionary-query");
      input?.focus({ preventScroll: true });
      if (selection.start !== null && selection.end !== null)
        input?.setSelectionRange(selection.start, selection.end, selection.direction ?? undefined);
    }
  }

  private renderBible(parent: HTMLElement, bible: BibleResource,
    ref: PassageReference, sequence: number): void {
    const metadata = bible.metadata;
    parent.createEl("h3", { text: metadata?.title ?? "Bible unavailable" });
    parent.createEl("p", { cls: "vd-subtle", text: (metadata?.abbreviation ?? "") + " · " +
      (metadata?.edition ?? "Unavailable") + " · Offline" });
    const preview = parent.createDiv({ cls: "vd-resource-preview", attr: { "aria-busy": "true" } });
    preview.setText("Loading Scripture…");
    const actions = parent.createDiv({ cls: "vd-action-row" });
    textButton(actions, "Open in Reader", () => {
      void this.plugin.setBibleEdition(bible.edition).then(() => {
        if(this.plugin.settings.bibleEdition!==bible.edition)return;
        this.plugin.selectReference(ref);
        return this.plugin.openReader();
      });
    }, "mod-cta");
    textButton(actions, "Edition details", () => this.plugin.openResourceDetails(bible.edition));
    void (async () => {
      try {
        const verses = await bible.getPassage(ref);
        if (!preview.isConnected || sequence !== this.renderSequence) return;
        preview.empty();
        for (const verse of verses.slice(0, 8)) {
          const line = preview.createEl("p");
          line.createEl("sup", { text: String(verse.verse) + " " });
          line.createSpan({ text: verse.text });
          if(verse.source!==undefined)textButton(line,'Source notes',()=>new VerseSourceModal(this.plugin,
            {book:ref.book,chapter:ref.chapter,verse:verse.verse},verse.source!,metadata?.abbreviation??bible.edition).open(),'vd-study-card-link');
        }
        if (verses.length > 8) preview.createEl("p", { cls: "vd-subtle", text: "Showing the first 8 verses; open in Reader for the full passage." });
        if (!verses.length) preview.setText("This passage is unavailable in the selected edition.");
      } catch (error) {
        if (preview.isConnected && sequence === this.renderSequence)
          preview.setText(error instanceof Error ? error.message : "Unable to read this Bible resource.");
      } finally { preview.setAttribute("aria-busy", "false"); }
    })();
  }

  private renderDictionary(parent: HTMLElement, resourceId: string,
    ref: PassageReference, sequence: number): void {
    const name = resourceId === "strongs-greek" ? "Greek" : "Hebrew";
    parent.createEl("h3", { text: "Strong’s " + name + " Dictionary" });
    parent.createEl("p", { cls: "vd-subtle", text: "James Strong, 1890 · Public domain · CrossWire offline edition" });
    const selected = this.plugin.selectedWord;
    if (selected && (!this.pinnedReference || referenceId(selected.ref) === referenceId(ref))) {
      const keys = selected.token.strongs?.filter(key => strongsMatchesDictionary(resourceId, key)) ?? [];
      if (keys.length) {
        this.wordCleanup = renderWordStudy(parent.createDiv(), this.plugin, false,
          { ...selected, token: { ...selected.token, strongs: keys } });
      }
    }
    const form = parent.createDiv({ cls: "vd-resource-dictionary-search" });
    const label = form.createEl("label", { text: "Look up a Strong’s identifier (" + (name === "Greek" ? "G25" : "H430") + ")" });
    const input = label.createEl("input", { cls: "vd-resource-dictionary-query", attr: { type: "search", maxlength: "6", autocomplete: "off", spellcheck: "false" } });
    input.value = this.dictionaryQueries[resourceId] ?? "";
    input.addEventListener("input", () => {
      this.dictionaryQueries[resourceId] = input.value.slice(0, 6);
      this.app.workspace.requestSaveLayout();
    });
    const result = parent.createDiv({ cls: "vd-word-entries" });
    let lookupSequence = 0;
    const lookup = (): void => {
      const lookupId = ++lookupSequence;
      const key = input.value.trim().toUpperCase();
      if (!strongsMatchesDictionary(resourceId, key)) {
        result.setText("Enter a valid " + name + " Strong’s identifier.");
        return;
      }
      result.setText("Looking up " + key + "…");
      void this.plugin.lexicon.lookup(key).then(entry => {
        if (!result.isConnected || sequence !== this.renderSequence || lookupId !== lookupSequence) return;
        result.empty();
        result.createEl("h4", { text: key + (entry?.lemma ? " · " + entry.lemma : "") });
        if (entry?.transliteration) result.createEl("p", { cls: "vd-subtle", text: entry.transliteration });
        const definition = result.createEl("p", { text: entry?.text ?? "No entry is available for this identifier." });
        if (entry) strongsAnnotations(definition, this.plugin, key);
      }).catch(() => {
        if (result.isConnected && sequence === this.renderSequence && lookupId === lookupSequence) result.setText("The offline dictionary could not be read.");
      });
    };
    textButton(form, "Look up", lookup, "mod-cta");
    if (strongsMatchesDictionary(resourceId, input.value)) lookup();
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") { event.preventDefault(); lookup(); }
    });
    if (!selected) parent.createEl("p", { cls: "vd-subtle", text: "Select a tagged word in the KJV Reader, or enter an identifier directly." });
    textButton(parent, "Open tagged KJV", () => { void this.plugin.setBibleEdition("kjv").then(() => this.plugin.openReader()); }, "vd-study-card-link");
  }
}
