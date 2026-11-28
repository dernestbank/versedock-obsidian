import { annotationReference } from "../core/annotations";
import { AnnotationModal } from "./annotation-modal";
import { ItemView, setIcon as importIcon, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import type { InspectorTarget, SwordDockController } from "../controller";
import { renderWordStudy } from "./word-study-panel";
import { refLabel, parseOsis, referenceId, type PassageReference } from "../core/references";
import { resourceInfoRows } from "../core/resource-info";
import { emptyState, iconButton, textButton } from "./components";
import { renderCrossReferencePanel } from "./cross-reference-panel";
import { renderInspectorCommentary } from "./inspector-commentary";
import { renderStrongsLookup } from "./strongs-lookup";
import { renderScriptureNoteCard } from "./scripture-note-card";
import { discoverScriptureNotes } from "../core/scripture-notes";
import {
  INSPECTOR_TABS,
  INSPECTOR_TAB_CHANGED,
  restoredInspectorTab,
  restoredInspectorPin,
  restoredCollapsedSections,
  type StudySection,
  inspectorTabDomIds,
  inspectorTabElementTag,
  inspectorTabForKey,
  type InspectorTab
} from "./inspector-tabs";

export const INSPECTOR_VIEW = "versedock-inspector";
let inspectorViewSequence = 0;
export class InspectorView extends ItemView {
  private unsubscribe: (() => void) | null = null;
  private tab: InspectorTab = "study";
  private collapsedSections = new Set<StudySection>();
  private pinnedReference: PassageReference | null = null;
  private readonly domScope = `versedock-inspector-${++inspectorViewSequence}`;
  private displayedNotePaths = new Set<string>();
  private primaryNotePath: string | null = null;
  private noteEventCleanup: Array<() => void> = [];
  private noteRefreshTimer: number | null = null;
  private commentaryCleanup: (() => void) | null = null;
  private instantExpanded = false;
  private lexiconQuery = "";
  private parallelEdition = "";
  private wordStudyCleanup: (() => void) | null = null;
  constructor(leaf: WorkspaceLeaf, private readonly plugin: SwordDockController) { super(leaf); }
  getViewType(): string { return INSPECTOR_VIEW; }
  getDisplayText(): string { return "SwordDock Bible Study Inspector"; }
  getIcon(): string { return "book-open-check"; }
  getState(): Record<string, unknown> {
    return { tab: this.tab, parallelEdition: this.parallelEdition, instantExpanded: this.instantExpanded, lexiconQuery: this.lexiconQuery, collapsedSections: [...this.collapsedSections],
      pinnedReference: this.pinnedReference ? referenceId(this.pinnedReference) : null };
  }
  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    this.tab = restoredInspectorTab(state);
    const saved = state as { instantExpanded?: unknown; lexiconQuery?: unknown; parallelEdition?: unknown } | null;
    this.parallelEdition = typeof saved?.parallelEdition === "string" ? saved.parallelEdition : "";
    this.instantExpanded = saved?.instantExpanded === true;
    this.lexiconQuery = typeof saved?.lexiconQuery === "string" ? saved.lexiconQuery.slice(0, 6) : "";
    this.collapsedSections = restoredCollapsedSections(state);
    this.pinnedReference = restoredInspectorPin(state);
    await super.setState(state, result);
    this.render();
  }
  async onOpen(): Promise<void> {
    this.unsubscribe = this.plugin.subscribe(() => this.render());
    const refresh = (file: { path: string }): void => {
      if (this.tab !== "study" && this.tab !== "notes") return;
      if (!this.displayedNotePaths.has(file.path)) {
        const actual = this.app.vault.getFileByPath(file.path);
        if (!actual || actual.extension !== "md") return;
        const scripture = this.app.metadataCache.getFileCache(actual)?.frontmatter?.scripture;
        const directlyLinked = discoverScriptureNotes([{ path: actual.path, basename: actual.basename,
          scripture, modified: actual.stat.mtime }], this.reference).notes.length > 0;
        const links = this.app.metadataCache.resolvedLinks;
        const destinations = Object.hasOwn(links, actual.path) ? links[actual.path] : null;
        const backlink = this.primaryNotePath && destinations && Object.hasOwn(destinations, this.primaryNotePath)
          && destinations[this.primaryNotePath] > 0;
        if (!directlyLinked && !backlink) return;
      }
      if (this.noteRefreshTimer !== null) window.clearTimeout(this.noteRefreshTimer);
      this.noteRefreshTimer = window.setTimeout(() => this.render(), 120);
    };
    const changed = this.app.metadataCache.on("changed", refresh);
    const resolved = this.app.metadataCache.on("resolve", refresh);
    const deleted = this.app.vault.on("delete", refresh);
    const renamed = this.app.vault.on("rename", (_file, oldPath) => refresh({ path: oldPath }));
    this.noteEventCleanup = [() => this.app.metadataCache.offref(changed), () => this.app.metadataCache.offref(resolved),
      () => this.app.vault.offref(deleted), () => this.app.vault.offref(renamed)];
    this.render();
  }
  async onClose(): Promise<void> {
    this.unsubscribe?.(); this.unsubscribe = null;
    this.wordStudyCleanup?.(); this.wordStudyCleanup = null;
    this.commentaryCleanup?.(); this.commentaryCleanup = null;
    this.noteEventCleanup.forEach(cleanup => cleanup()); this.noteEventCleanup = [];
    if (this.noteRefreshTimer !== null) window.clearTimeout(this.noteRefreshTimer);
    this.contentEl.empty();
  }
  private activateTab(tab: InspectorTab): void {
    if (tab === this.tab) return;
    this.tab = tab;
    this.render();
    const activeTab = this.contentEl.querySelector<HTMLElement>(`[data-vd-inspector-tab="${tab}"]`);
    activeTab?.focus({ preventScroll: true });
    activeTab?.scrollIntoView({ block: "nearest", inline: "nearest" });
    this.app.workspace.requestSaveLayout();
    this.contentEl.ownerDocument.dispatchEvent(new CustomEvent(INSPECTOR_TAB_CHANGED));
  }
  /** Select a tab when another pane opens the Inspector contextually. */
  activateExternalTab(tab: InspectorTarget): void {
    this.activateTab(tab);
  }
  private render(): void {
    this.wordStudyCleanup?.(); this.wordStudyCleanup = null;
    this.commentaryCleanup?.(); this.commentaryCleanup = null;
    this.displayedNotePaths.clear(); this.primaryNotePath = null;
    const root = this.contentEl;
    root.empty(); root.addClass("versedock", "vd-inspector");
    const top = root.createDiv({ cls: "vd-inspector-header" });
    top.createEl("strong", { text: "Study Inspector" });
    const pin = textButton(top, (this.pinnedReference ? "Pinned · " : "Follow · ") + refLabel(this.reference), () => {
      this.pinnedReference = this.pinnedReference ? null : { ...this.plugin.currentRef };
      this.app.workspace.requestSaveLayout();
      this.render();
      this.contentEl.querySelector<HTMLElement>(".vd-inspector-follow")?.focus({ preventScroll: true });
    }, "vd-pill vd-inspector-follow");
    pin.setAttribute("aria-pressed", String(!!this.pinnedReference));
    pin.setAttribute("aria-label", this.pinnedReference
      ? "Unpin Inspector and follow Reader; pinned to " + refLabel(this.reference)
      : "Pin Inspector to " + refLabel(this.reference));
    const tabs = root.createDiv({ cls: "vd-inspector-tabs", attr: { role: "tablist", "aria-label": "Inspector sections" } });
    INSPECTOR_TABS.forEach(tab => {
      const label = tab === "references" ? "References"
        : tab === "resource-info" ? "Resource Info"
        : tab[0].toUpperCase() + tab.slice(1);
      const selected = this.tab === tab;
      const ids = inspectorTabDomIds(this.domScope, tab);
      const tabElement = tabs.createEl(inspectorTabElementTag(selected), {
        cls: "vd-text-button " + (selected ? "is-active" : ""),
        text: label,
        attr: selected ? { type: "button" } : undefined
      });
      tabElement.id = ids.tabId;
      tabElement.dataset.vdInspectorTab = tab;
      tabElement.setAttribute("role", "tab");
      tabElement.setAttribute("aria-controls", ids.panelId);
      tabElement.setAttribute("aria-selected", String(selected));
      tabElement.tabIndex = selected ? 0 : -1;
      tabElement.addEventListener("click", () => this.activateTab(tab));
      tabElement.addEventListener("keydown", event => {
        if (!(event instanceof KeyboardEvent)) return;
        const destination = inspectorTabForKey(tab, event.key);
        if (!destination) return;
        event.preventDefault();
        this.activateTab(destination);
      });
    });
    const activeIds = inspectorTabDomIds(this.domScope, this.tab);
    const content = root.createDiv({ cls: "vd-inspector-content", attr: {
      id: activeIds.panelId, role: "tabpanel", "aria-labelledby": activeIds.tabId
    } });
    if (this.tab === "study") {
      this.renderStudyOverview(content);
      this.renderInstantDetails(root);
      return;
    }
    if (this.tab === "parallel") {
      void this.renderParallel(content);
      this.renderInstantDetails(root);
      return;
    }
    const body = content.createDiv({ cls: "vd-inspector-body" });
    const ref = this.reference;
    body.createDiv({ cls: "vd-resource-heading", text: refLabel(ref) });
    if (this.tab === "highlights") {
      body.createEl("h3", { text: "Highlights and annotations" });
      if (!this.plugin.settings.annotations.length && !this.plugin.settings.highlights.length) emptyState(body, "No highlights yet", "Select a verse or phrase in the Reader and choose the highlighter in the toolbar.", "highlighter");
      for (const id of this.plugin.settings.highlights) {
        try {
          const highlighted = parseOsis(id);
          textButton(body, refLabel(highlighted), () => { this.plugin.selectReference(highlighted); void this.plugin.openReader(); });
        } catch { /* Ignore stale references. */ }
      }
      for (const mark of this.plugin.settings.annotations) {
        const entry = body.createDiv({cls: "vd-annotation-entry"});
        const reference = mark.resource ? null : annotationReference(mark);
        entry.createEl("strong", {text: reference ? refLabel(reference) + " · " + mark.edition : mark.resource!.label});
        entry.createEl("blockquote", {text: mark.parts.map(part => part.quote).join(" ")});
        if (mark.note) entry.createEl("p", {text: mark.note});
        const actions = entry.createDiv({cls: "vd-action-row"});
        if (reference) textButton(actions, "Open passage", async () => {
          if (this.plugin.settings.bibleEdition !== mark.edition) await this.plugin.setBibleEdition(mark.edition);
          if (this.plugin.settings.bibleEdition !== mark.edition) return;
          this.plugin.selectReference(reference);
          await this.plugin.openReader();
        });
        textButton(actions, "Edit annotation", () => new AnnotationModal(this.plugin, mark, true).open());
      }
      this.renderInstantDetails(root);
      return;
    }
    if (this.tab === "history") {
      body.createEl("h3", { text: "Recent reading" });
      body.createEl("p", { cls: "vd-inspector-help", text:
        "Your fifty most recent passages are stored in this plugin's vault settings. SwordDock does not upload them, and you can clear them here at any time." });
      if (!this.plugin.settings.history.length)
        emptyState(body, "No reading history yet", "Open or select a passage to add it here.", "history");
      for (const id of this.plugin.settings.history) {
        try {
          const recent = parseOsis(id);
          textButton(body, refLabel(recent), () => {
            this.plugin.selectReference(recent);
            void this.plugin.openReader();
          });
        } catch { /* Migration already filters invalid entries; stay fail-safe if settings change live. */ }
      }
      if (this.plugin.settings.history.length) {
        const actions = body.createDiv({ cls: "vd-action-row" });
        textButton(actions, "Clear reading history", () => {
          if (!window.confirm("Clear SwordDock reading history? This does not delete notes, bookmarks or Bible files.")) return;
          this.plugin.settings.history = [];
          void this.plugin.saveSettings();
          this.render();
        });
      }
      this.renderInstantDetails(root);
      return;
    }
    if (this.tab === "bookmarks") {
      body.createEl("h3", { text: "Bookmarked passages" });
      if (!this.plugin.settings.bookmarks.length) emptyState(body, "No bookmarks yet", "Select a verse in the reader and choose Bookmark.", "bookmark");
      for (const id of this.plugin.settings.bookmarks) {
        try {
          const bookmark = parseOsis(id);
          textButton(body, refLabel(bookmark), () => { this.plugin.selectReference(bookmark); void this.plugin.openReader(); });
        } catch { /* Skip stale/unrecognized references without crashing. */ }
      }
      this.renderInstantDetails(root);
      return;
    }
    if (this.tab === "notes") {
      body.createEl("h3", { text: "Your Scripture notes" });
      body.createEl("p", { cls: "vd-inspector-help", text:
        "Keep your observations in ordinary Markdown notes. Create a passage note or open a linked note below." });
      const discovery = this.plugin.findScriptureNotes(ref);
      this.primaryNotePath = discovery.notes.find(note => note.primary)?.path ?? null;
      if (!discovery.notes.length) {
        emptyState(body, "No linked notes", "Create the primary note, add this passage's canonical OSIS value to Scripture frontmatter, or link another note to the primary study note.", "notebook-pen");
      } else {
        const heading = discovery.resultsTruncated
          ? "Linked notes · " + discovery.notes.length + "+ shown"
          : "Linked notes · " + discovery.notes.length;
        body.createEl("h4", { cls: "vd-note-list-heading", text: heading });
        const list = body.createDiv({ cls: "vd-note-list" });
        for (const [index, note] of discovery.notes.entries()) {
          this.displayedNotePaths.add(note.path);
          if (index < 5) {
            renderScriptureNoteCard(list, this.plugin, note);
            continue;
          }
          const item = list.createDiv({ cls: "vd-note-item" });
          textButton(item, note.basename, () => { void this.plugin.openLinkedNote(note.path); }, "vd-note-link");
          item.createDiv({ cls: "vd-note-path", text: (note.linkedToPrimary ? "Backlink · " : "") + note.path });
        }
      }
      if (discovery.scanTruncated) body.createEl("p", { cls: "vd-inspector-warning", text:
        "Partial index: checked 5,000 Markdown files, prioritizing this passage's primary SwordDock note." });
      if (discovery.resultsTruncated) body.createEl("p", { cls: "vd-inspector-warning", text:
        "More linked notes exist; the fifty most recently modified are shown." });
      const row = body.createDiv({ cls: "vd-action-row" });
      textButton(row, "Create or open primary note", () => {
        void this.plugin.openStudyNote(ref).then(() => this.render());
      }, "mod-cta");
      iconButton(row, "copy", "Copy passage", () => { void this.plugin.copyPassage(ref); });
      iconButton(row, "refresh-cw", "Refresh linked notes", () => this.render());
      const help = body.createEl("details", { cls: "vd-notes-discovery-help" });
      help.createEl("summary", { text: "How linked notes are found" });
      help.createEl("p", { text: "This list uses Scripture frontmatter and Obsidian backlinks to the primary passage note. Excerpts read only the first five displayed notes, with a 256 KB file limit. Note bodies are not searched to discover links." });
      this.renderInstantDetails(root);
      return;
    }
    if (this.tab === "resource-info") {
      this.renderResourceInfo(body);
      this.renderInstantDetails(root);
      return;
    }
    if (this.tab === "commentary") {
      this.commentaryCleanup = renderInspectorCommentary(body, this.plugin, ref);
    } else if (this.tab === "lexicon") {
      body.createEl("h3", { text: "Strong’s Lexicon" });
      renderStrongsLookup(body, this.plugin, this.lexiconQuery, query => {
        this.lexiconQuery = query;
        this.app.workspace.requestSaveLayout();
      });
      const word = this.plugin.selectedWord;
      if (word && (!this.pinnedReference || referenceId(word.ref) === referenceId(ref))) {
        this.wordStudyCleanup = renderWordStudy(body.createDiv(), this.plugin, false, word);
      }
      return;
    } else {
      renderCrossReferencePanel(body, this.plugin, ref, false);
    }
    this.renderInstantDetails(root);
  }

  private get reference(): PassageReference { return this.pinnedReference ?? this.plugin.currentRef; }

  private async renderParallel(root: HTMLElement): Promise<void> {
    const ref = this.reference;
    const body = root.createDiv({ cls: "vd-inspector-body vd-dock-parallel" });
    body.createDiv({ cls: "vd-resource-heading", text: refLabel(ref) });
    const actions = body.createDiv({ cls: "vd-action-row" });
    textButton(actions, "Copy " + (this.plugin.readerBible.metadata?.abbreviation ?? "Bible") + " passage", () => { void this.plugin.copyPassage(ref); });
    textButton(actions, "Open full comparison", () => { void this.plugin.openComparison(); });
    body.createEl("p", { cls: "vd-subtle", text: "Source verse numbers are preserved independently; matching numbers do not imply identical versification." });
    const editions = this.plugin.availableBibleEditions().filter(edition => edition.ready);
    const primary = editions.find(edition => edition.id === this.plugin.settings.bibleEdition) ?? editions[0];
    if (!primary) {
      body.createEl("p", { text: "No Bible editions are available in this vault." });
      textButton(body, "Open Module Library", () => { void this.plugin.openLibrary(); });
      return;
    }
    const others = editions.filter(edition => edition.id !== primary.id);
    const secondary = others.find(edition => edition.id === this.parallelEdition) ?? others[0];
    if (others.length > 1) {
      const label = body.createEl("label", { text: "Compare with " });
      const select = label.createEl("select");
      for (const edition of others) select.createEl("option", { value: edition.id, text: edition.title });
      select.value = secondary.id;
      select.onchange = () => {
        this.parallelEdition = select.value;
        this.app.workspace.requestSaveLayout();
        this.render();
      };
    } else if (!secondary) {
      body.createEl("p", { text: "Install another Bible in the Module Library to compare this passage." });
      textButton(body, "Open Module Library", () => { void this.plugin.openLibrary(); });
    }
    for (const edition of secondary ? [primary, secondary] : [primary]) {
      const head = body.createDiv({ cls: "vd-dock-edition" });
      head.createEl("strong", { text: edition.title });
      head.createSpan({ cls: "vd-version-chip", text: "Offline" });
      const preview = body.createDiv({ cls: "vd-dock-parallel-preview", attr: { "aria-busy": "true" } });
      preview.setText("Loading passage…");
      try {
        const bible = await this.plugin.getBibleResource(edition.id);
        if (!preview.isConnected) return;
        if (!bible) throw new Error("This edition is no longer installed.");
        const verses = await bible.getPassage(ref);
        if (!preview.isConnected) return;
        preview.empty();
        if (!verses.length) preview.setText("No text for this passage in this edition.");
        for (const verse of verses) {
          const row = preview.createEl("p");
          row.createEl("sup", { text: String(verse.verse) + " " });
          row.createSpan({ text: verse.text });
        }
      } catch (error) {
        if (!preview.isConnected) return;
        preview.setText(error instanceof Error ? error.message : "Passage unavailable. Recheck Module Library.");
      } finally {
        preview.setAttribute("aria-busy", "false");
      }
    }
  }

  private renderStudyOverview(root: HTMLElement): void {
    const body = root.createDiv({ cls: "vd-inspector-body vd-study-overview" });
    const ref = this.reference;
    const section = (title: StudySection, icon: string): HTMLElement => {
      const card = body.createEl("details", { cls: "vd-study-card" });
      card.open = !this.collapsedSections.has(title);
      card.addEventListener("toggle", () => {
        if (!card.isConnected) return;
        const wasCollapsed = this.collapsedSections.has(title);
        if (card.open) this.collapsedSections.delete(title);
        else this.collapsedSections.add(title);
        if (wasCollapsed !== !card.open) this.app.workspace.requestSaveLayout();
      });
      const summary = card.createEl("summary");
      const glyph = summary.createSpan();
      // Obsidian supplies the same icon vocabulary as the Reader controls.
      importIcon(glyph, icon);
      summary.createSpan({ text: title });
      return card.createDiv({ cls: "vd-study-card-content" });
    };
    const commentary = section("Commentary", "book-open");
    this.commentaryCleanup = renderInspectorCommentary(commentary, this.plugin, ref, () => this.activateTab("commentary"));
    const references = section("Cross-References", "link");
    renderCrossReferencePanel(references, this.plugin, ref, true, () => this.activateTab("references"));
    const notes = section("My Notes", "notebook-pen");
    const discovery = this.plugin.findScriptureNotes(ref);
    this.primaryNotePath = discovery.notes.find(note => note.primary)?.path ?? null;
    if (!discovery.notes.length) notes.createEl("p", { text: "Keep your observations alongside " + refLabel(ref) + "." });
    for (const note of discovery.notes.slice(0, 3)) {
      this.displayedNotePaths.add(note.path);
      renderScriptureNoteCard(notes, this.plugin, note, true);
    }
    textButton(notes, "Create or open passage note", () => { void this.plugin.openStudyNote(ref).then(() => this.render()); }, "vd-study-card-link");
    if (discovery.notes.length > 3 || discovery.scanTruncated || discovery.resultsTruncated)
      textButton(notes, "View linked note index", () => this.activateTab("notes"), "vd-study-card-link");
    const resources = body.createDiv({ cls: "vd-study-resource-footer" });
    textButton(resources, "Resources", () => { void this.plugin.openResources(); });
  }

  private renderResourceInfo(body: HTMLElement): void {
    body.createEl("h3", { text: "Installed resource" });
    const manifest = this.plugin.readerBible.metadata;
    if (!manifest) {
      emptyState(body, "WEB resource unavailable", "Recheck the bundled offline library before reviewing provenance and integrity metadata.", "book-open");
      textButton(body, "Open Module Library", () => { void this.plugin.openLibrary(); }, "mod-cta");
      return;
    }
    const facts = body.createDiv({ cls: "vd-resource-facts" });
    for (const { label, value, href } of resourceInfoRows(manifest)) {
      const row = facts.createDiv();
      row.createSpan({ text: label });
      if (href) {
        row.createEl("a", { text: value, attr: { href, target: "_blank", rel: "noreferrer" } });
      } else {
        row.createEl("strong", { text: value });
      }
    }
    body.createEl("p", { cls: "vd-inspector-help", text: manifest.licenseNotice });
    const actions = body.createDiv({ cls: "vd-action-row" });
    textButton(actions, "Open Module Library", () => { void this.plugin.openLibrary(); }, "mod-cta");
    textButton(actions, "Review integrity in Library", () => { void this.plugin.openLibrary(); });
  }

  private renderInstantDetails(root: HTMLElement): void {
    const details = root.createDiv({ cls: "vd-inspector-footer" });
    const toggle = details.createEl("button", {
      cls: "vd-instant-details-toggle",
      text: "Instant Details",
      attr: { type: "button", "aria-expanded": String(this.instantExpanded), "aria-controls": this.domScope + "-instant-details" }
    });
    const content = details.createDiv({ cls: "vd-instant-details-content", attr: { id: this.domScope + "-instant-details" } });
    content.hidden = !this.instantExpanded;
    if (this.instantExpanded) renderWordStudy(content, this.plugin, true);
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      content.hidden = expanded;
      this.instantExpanded = !expanded;
      if (!expanded && !content.hasChildNodes()) renderWordStudy(content, this.plugin, true);
      this.app.workspace.requestSaveLayout();
    });
  }
}
