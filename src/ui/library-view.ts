import { ItemView, Notice, type WorkspaceLeaf } from "obsidian";
import type { MySwordController } from "../controller";
import { textButton, emptyState, pill } from "./components";

export const LIBRARY_VIEW = "mysword-plus-library";

/** Read-only inventory baseline; downloading and MySword import are separate future milestones. */
export class LibraryView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private readonly plugin: MySwordController) { super(leaf); }
  getViewType(): string { return LIBRARY_VIEW; }
  getDisplayText(): string { return "MySword+ Module Library"; }
  getIcon(): string { return "library"; }
  async onOpen(): Promise<void> { this.render(); }
  async onClose(): Promise<void> { this.contentEl.empty(); }
  private render(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("mysword-plus", "vd-library");
    root.createSpan({ cls: "vd-overline", text: "YOUR OFFLINE RESOURCES" });
    root.createEl("h2", { text: "Module Library" });
    root.createEl("p", { cls: "vd-subtle", text: "See installed resources and their provenance. Future releases will support authorized MySword imports and additional offline versions." });

    const manifest = this.plugin.library.metadata;
    const card = root.createDiv({ cls: "vd-module-card" });
    const top = card.createDiv({ cls: "vd-module-card-top" });
    top.createEl("h3", { text: manifest?.title ?? "World English Bible" });
    pill(top, manifest ? "Installed · Offline" : "Missing", manifest ? "vd-installed" : "");
    card.createDiv({ cls: "vd-module-sub", text: manifest?.edition ?? "WEB content unavailable" });
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
    card.createEl("p", { cls: "vd-subtle", text: manifest?.licenseNotice ?? "Build and install the public-domain WEB data in the test plugin directory." });
    const actions = card.createDiv({ cls: "vd-action-row" });
    const open = textButton(actions, "Open Bible Reader", () => { void this.plugin.openReader(); }, "mod-cta");
    open.disabled = !manifest;
    textButton(actions, "Recheck local library", () => {
      void (async () => {
        const available = await this.plugin.library.initialize();
        new Notice(available ? "WEB manifest found." : "WEB manifest missing or invalid.");
        this.render();
      })();
    });
    root.createEl("h3", { cls: "vd-category-label", text: "Additional study modules" });
    emptyState(root, "No other modules installed", "Commentary, dictionaries, lexicons, devotionals, comparison translations and MySword imports are planned for later releases.", "layers");
    root.createEl("p", { cls: "vd-library-path", text: "Local development library: .obsidian/plugins/mysword-plus/library/webp" });
    root.createEl("p", { cls: "vd-subtle", text: "This is a development build. Offline content bundles and multi-device synchronization require explicit packaging and storage tests before public distribution." });
  }
}
