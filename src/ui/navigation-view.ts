import { ItemView, setIcon, type WorkspaceLeaf } from "obsidian";
import type { SwordDockController } from "../controller";
import { refLabel } from "../core/references";
import { iconButton, textButton } from "./components";
import { INSPECTOR_TAB_CHANGED } from "./inspector-tabs";

export const NAVIGATION_VIEW = "sworddock-navigation";

/** Persistent navigation in Obsidian's native left dock. */
export class NavigationView extends ItemView {
  private unsubscribe: (() => void) | null = null;
  private removeActiveListener: (() => void) | null = null;
  constructor(leaf: WorkspaceLeaf, private readonly plugin: SwordDockController) { super(leaf); }
  getViewType(): string { return NAVIGATION_VIEW; }
  getDisplayText(): string { return "SwordDock Workspace"; }
  getIcon(): string { return "book-open"; }
  async onOpen(): Promise<void> {
    this.render();
    this.unsubscribe = this.plugin.subscribe(() => this.updateContext());
    const event = this.app.workspace.on("active-leaf-change", () => this.updateContext());
    const update = () => this.updateContext();
    this.contentEl.ownerDocument.addEventListener(INSPECTOR_TAB_CHANGED, update);
    this.removeActiveListener = () => {
      this.app.workspace.offref(event);
      this.contentEl.ownerDocument.removeEventListener(INSPECTOR_TAB_CHANGED, update);
    };
  }
  async onClose(): Promise<void> { this.unsubscribe?.(); this.removeActiveListener?.(); this.contentEl.empty(); }
  private render(): void {
    const root = this.contentEl;
    root.empty(); root.addClass("versedock", "vd-navigation");
    const brand = root.createDiv({ cls: "vd-navigation-brand" });
    setIcon(brand.createSpan(), "book-open");
    brand.createEl("strong", { text: "SwordDock Bible" });
    const body = root.createDiv({ cls: "vd-navigation-content" });
    const nav = body.createEl("nav", { attr: { "aria-label": "Bible study workspace" } });
    const routes: Array<[string, string, string, () => void]> = [
      ["book-open", "Bible Reader", "versedock-reader", () => { void this.plugin.openReader(); }],
      ["search", "Search", "versedock-search", () => { void this.plugin.openSearch(); }],
      ["library", "Module Library", "versedock-library", () => { void this.plugin.openLibrary(); }],
      ["layers", "Resources", "sworddock-resources", () => { void this.plugin.openResources(); }],
      ["columns-2", "Parallel Compare", "versedock-comparison", () => { void this.plugin.openComparison(); }],
      ["notebook-pen", "Notes & Journals", "notes", () => { void this.plugin.openInspector("notes"); }],
      ["highlighter", "Highlights", "highlights", () => { void this.plugin.openInspector("highlights"); }],
      ["bookmark", "Bookmarks", "bookmarks", () => { void this.plugin.openInspector("bookmarks"); }],
      ["history", "History", "history", () => { void this.plugin.openInspector("history"); }]
    ];
    for (const [icon, label, route, action] of routes) {
      const button = textButton(nav, label, action, "vd-navigation-item");
      button.dataset.route = route;
      setIcon(button.createSpan({ cls: "vd-navigation-icon" }), icon);
      button.prepend(button.lastChild!);
    }
    const modules = body.createDiv({ cls: "vd-navigation-modules" });
    modules.createEl("h3", { text: "Active modules · Offline" });
    const module = textButton(modules, "World English Bible", () => { void this.plugin.setBibleEdition("webp").then(() => this.plugin.openReader()); }, "vd-navigation-module");
    module.prepend(module.createSpan({ cls: "vd-module-abbreviation", text: "WEB" }));
    module.title = "World English Bible · English · 66 books · Offline";
    if (this.plugin.kjv.metadata) {
      const kjv = textButton(modules, "King James Version", () => { void this.plugin.setBibleEdition("kjv").then(() => this.plugin.openReader()); }, "vd-navigation-module");
      kjv.prepend(kjv.createSpan({ cls: "vd-module-abbreviation", text: "KJV" }));
      kjv.title = "King James Version · Tagged words · Red letter · Offline";
    }
    if (this.plugin.lexicon.metadata) {
      const lexicon = textButton(modules, "Strong’s Dictionaries", () => { void this.plugin.openInspector("lexicon"); }, "vd-navigation-module");
      lexicon.prepend(lexicon.createSpan({ cls: "vd-module-abbreviation", text: "LEX" }));
      lexicon.title = "Strong’s Greek and Hebrew Dictionaries · Offline";
    }
    if (this.plugin.crossReferences.metadata) {
      const references = textButton(modules, "Cross-References", () => { void this.plugin.openInspector("references"); }, "vd-navigation-module");
      references.prepend(references.createSpan({ cls: "vd-module-abbreviation", text: "REF" }));
      references.title = "OpenBible.info cross-references · Offline";
    }
    if (this.plugin.commentary.metadata) {
      const commentary = textButton(modules, "Matthew Henry", () => { void this.plugin.openInspector("commentary"); }, "vd-navigation-module");
      commentary.prepend(commentary.createSpan({ cls: "vd-module-abbreviation", text: "MHC" }));
      commentary.title = "Matthew Henry’s Commentary · Offline";
    }
    textButton(modules, "Add study resources", () => { void this.plugin.openLibrary(); }, "vd-navigation-add");
    const workspace = body.createDiv({ cls: "vd-navigation-workspace" });
    workspace.createEl("h3", { text: "Workspace" });
    textButton(workspace, "Open Study Desk", () => { void this.plugin.openStudyDesk(); }, "vd-navigation-item");
    textButton(workspace, "New passage note", () => { void this.plugin.openStudyNote(this.plugin.currentRef); }, "vd-navigation-item");
    const footer = root.createDiv({ cls: "vd-navigation-footer" });
    footer.createSpan({ cls: "vd-navigation-reference" });
    footer.createEl("small", { text: "Offline · No account" });
    const utilities = footer.createDiv({ cls: "vd-navigation-utilities", attr: { role: "group", "aria-label": "Workspace utilities" } });
    iconButton(utilities, "settings", "SwordDock settings", () => this.plugin.openWorkspaceSettings());
    iconButton(utilities, "circle-help", "SwordDock help", () => this.plugin.openWorkspaceHelp());
    this.updateContext();
  }
  private updateContext(): void {
    const view = this.app.workspace.getActiveViewOfType(ItemView);
    const inspectorTab = view?.getViewType() === "versedock-inspector" ? view.getState().tab : null;
    // Study and docked Parallel belong to the Reader workspace; utility tabs
    // retain their own navigation entries when selected.
    const active = inspectorTab === "study" || inspectorTab === "parallel"
      ? "versedock-reader"
      : inspectorTab ?? view?.getViewType();
    for (const button of this.contentEl.querySelectorAll<HTMLElement>("[data-route]")) {
      const selected = button.dataset.route === active;
      button.toggleClass("is-active", selected);
      if (selected) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }
    this.contentEl.querySelector(".vd-navigation-reference")?.setText(refLabel(this.plugin.currentRef));
  }
}
