import { Modal } from "obsidian";
import type { SwordDockController } from "../controller";
import type { BibleResource } from "../core/library";
import { resourceInfoRows } from "../core/resource-info";
import { formatStorageBytes } from "../core/storage";
import { emptyState, textButton } from "./components";

/** Read-only edition detail route, with a stable source even if Reader changes. */
export class ResourceDetailModal extends Modal {
  constructor(private readonly plugin: SwordDockController, private readonly bible: BibleResource = plugin.readerBible) { super(plugin.app); }

  onOpen(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("versedock", "vd-storage-modal", "vd-resource-detail-modal");
    root.createSpan({ cls: "vd-overline", text: "RESOURCE DETAILS" });
    root.createEl("h2", { text: this.bible.metadata?.title ?? "Bible edition" });
    root.createEl("p", { cls: "vd-subtle", text: "Verified edition metadata for the local offline reading resource." });

    const manifest = this.bible.metadata;
    if (!manifest) {
      emptyState(root, "WEB resource unavailable", "Recheck the bundled offline library before opening this edition.", "book-open");
      const actions = root.createDiv({ cls: "vd-action-row" });
      textButton(actions, "Open Module Library", () => { this.close(); void this.plugin.openLibrary(); }, "mod-cta");
      textButton(actions, "Close", () => this.close());
      return;
    }

    const facts = root.createDiv({ cls: "vd-resource-facts" });
    for (const { label, value, href } of resourceInfoRows(manifest)) {
      const row = facts.createDiv();
      row.createSpan({ text: label });
      if (href) row.createEl("a", { text: value, attr: { href, target: "_blank", rel: "noreferrer" } });
      else row.createEl("strong", { text: value });
    }

    const status = root.createDiv({ cls: "vd-resource-detail-status", attr: { role: "status", "aria-live": "polite" } });
    status.setText("Measuring installed files…");
    void this.renderStorage(status);
    root.createEl("p", { cls: "vd-subtle", text: manifest.licenseNotice });

    const actions = root.createDiv({ cls: "vd-action-row" });
    textButton(actions, "Open Bible Reader", () => { this.close(); void this.plugin.setBibleEdition(this.bible.edition).then(() => this.plugin.openReader()); }, "mod-cta");
    textButton(actions, "Open Module Library", () => { this.close(); void this.plugin.openLibrary(); });
    textButton(actions, "Close", () => this.close());
  }

  private async renderStorage(target: HTMLElement): Promise<void> {
    try {
      const summary = await this.bible.getStorageSummary();
      if (!target.isConnected) return;
      target.empty();
      target.createEl("strong", { text: "Ready offline" });
      target.createSpan({ text: " · " + formatStorageBytes(summary.bytes) + " across " + summary.files + " local files" });
    } catch (error) {
      if (!target.isConnected) return;
      // Do not surface adapter paths or other filesystem details in a modal
      // that can be captured or shared; the Library view owns recovery copy.
      void error;
      target.setText("Local footprint unavailable. Recheck the installed resource from Module Library.");
    }
  }

  onClose(): void { this.contentEl.empty(); }
}
