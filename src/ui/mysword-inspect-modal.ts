import { Modal } from "obsidian";
import initSqlJs from "sql.js";
import type { SqlJsStatic } from "sql.js";
import { inspectMySwordBible, MAX_MY_SWORD_BYTES, type MySwordBiblePreview } from "../core/mysword-preview";
import {
  preflightMySwordPlainTextCooperatively,
  type ConversionPreflight
} from "../core/mysword-conversion-preflight";
import type { SwordDockController } from "../controller";
import { requestsFocusRestoration, restoreActionFocus } from "./focus";

export class MySwordInspectModal extends Modal {
  private revision = 0;
  private sqlPromise: Promise<SqlJsStatic> | null = null;
  constructor(private readonly plugin: SwordDockController) { super(plugin.app); }

  private loadSql(): Promise<SqlJsStatic> {
    if (!this.sqlPromise) {
      const path = this.plugin.app.vault.configDir + "/plugins/versedock/assets/sql-wasm.wasm";
      this.sqlPromise = this.plugin.app.vault.adapter.readBinary(path)
        .then(wasm => initSqlJs({ wasmBinary: wasm }))
        .catch(error => { this.sqlPromise = null; throw error; });
    }
    return this.sqlPromise;
  }

  onOpen(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("versedock", "vd-mysword-inspect-modal");
    root.createEl("h2", { text: "Inspect a MySword Bible" });
    root.createEl("p", { cls: "vd-subtle", text:
      "Select a locally owned, unencrypted .bbl.mybible SQLite Bible file (maximum 24 MiB). This is a read-only preview, not an installation or license check." });
    const input = root.createEl("input", { attr: { type: "file",
      accept: ".mybible,application/octet-stream", "aria-label": "Choose MySword Bible module" } });
    const status = root.createDiv({ cls: "vd-import-status",
      attr: { role: "status", "aria-live": "polite" } });
    const result = root.createDiv({ cls: "vd-import-result" });
    status.setText("No module selected. No files will be saved or uploaded.");
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      const version = ++this.revision;
      result.empty();
      if (!file) { status.setText("No module selected."); return; }
      if (file.size > MAX_MY_SWORD_BYTES) {
        status.setText("File is larger than the 24 MiB preview limit."); return;
      }
      status.setText("Validating SQLite module locally…");
      void (async () => {
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          if (version !== this.revision) return;
          const sql = await this.loadSql();
          if (version !== this.revision) return;
          const preview = inspectMySwordBible(sql, file.name, bytes);
          if (version !== this.revision) return;
          status.setText("Preview ready. No content installed or saved.");
          this.renderPreview(result, preview, () => preflightMySwordPlainTextCooperatively(
            sql,
            file.name,
            bytes,
            {shouldContinue: () => this.revision === version}
          ), version);
        } catch (error) {
          if (version !== this.revision) return;
          status.setText(error instanceof Error ? error.message : String(error));
        }
      })();
    });
  }
  private renderPreview(root: HTMLElement, preview: MySwordBiblePreview,
    checkPlainText: () => Promise<ConversionPreflight>, version: number): void {
    root.createEl("h3", { text: preview.description });
    const meta = root.createDiv({ cls: "vd-import-meta" });
    for (const [label, value] of [
      ["File", preview.fileName], ["Abbreviation", preview.abbreviation],
      ["Language", preview.language], ["Edition", preview.version],
      ["Books", String(preview.books)], ["Verses", preview.verses.toLocaleString()],
      ["OT / NT", (preview.hasOT ? "Yes" : "No") + " / " + (preview.hasNT ? "Yes" : "No")],
      ["Strong's tags", preview.strongTags ? "Flagged" : "Not flagged"]
    ]) {
      const line = meta.createDiv();
      line.createEl("strong", { text: label + ": " });
      line.createSpan({ text: value });
    }
    root.createEl("h4", { text: "Sample verses (literal, unformatted data)" });
    for (const row of preview.samples) {
      const el = root.createEl("p", { cls: "vd-import-sample" });
      el.createEl("strong", { text: "Book " + row.book + " " + row.chapter + ":" + row.verse });
      // Never parse imported SQLite verse strings as HTML or Markdown.
      el.createDiv({ text: row.scripture });
    }
    const safety = root.createDiv({ cls: "vd-conversion-check" });
    const button = safety.createEl("button", { cls: "vd-text-button",
      text: "Check text-conversion readiness (no installation)" });
    const summary = safety.createDiv({ cls: "vd-conversion-results",
      attr: { role: "status", "aria-live": "polite" } });
    button.addEventListener("click", event => {
      // Keyboard and assistive-technology activation dispatch click detail 0.
      const returnFocus = requestsFocusRestoration(event);
      button.disabled = true;
      summary.setText("Analyzing Scripture markup and canonical chapter boundaries locally…");
      window.setTimeout(() => {
        if (this.revision !== version) return;
        void (async () => {
          try {
            const report = await checkPlainText();
            if (this.revision !== version) return;
            summary.empty();
            summary.createEl("strong", {
              text: report.status === "blocked" ? "Automatic plain-text conversion blocked" :
                "Text structure passed preliminary checks — installation is still unavailable"
            });
            summary.createDiv({ text: report.books + " book(s), " + report.verses.toLocaleString() +
              " verses; " + report.markupVerses.toLocaleString() + " markup-bearing verses." });
            summary.createDiv({ text: "Source-preserving GBF scan: " +
              report.gbfMarkers.toLocaleString() + " recognized markers, " +
              report.htmlMarkers.toLocaleString() + " HTML markers, " +
              report.unknownMarkers.toLocaleString() + " unsupported markers; " +
              report.tagIssueVerses.toLocaleString() + " verses require syntax review." });
            summary.createDiv({ text: "Cross-reference inspection: " +
              report.crossReferences.toLocaleString() + " validated RX marker(s), " +
              report.unresolvedCrossReferences.toLocaleString() +
              " unresolved. Parsed coordinates are not followed and do not verify edition versification." });
            summary.createDiv({ text: "Semantic inspection: " +
              report.semanticReadyMarkupVerses.toLocaleString() + " of " +
              report.markupVerses.toLocaleString() + " markup-bearing verses fully interpreted; " +
              report.opaqueSemanticEvents.toLocaleString() + " opaque event(s), " +
              report.translatorNotes.toLocaleString() + " translator note(s), " +
              report.titles.toLocaleString() + " title(s)." });
            for (const line of [...report.blockers, ...report.notes]) summary.createDiv({ text: line });
          } catch (error) {
            if (this.revision !== version) return;
            summary.setText("Conversion preflight failed: " +
              (error instanceof Error ? error.message : String(error)));
          } finally {
            button.disabled = false;
            restoreActionFocus(button, returnFocus);
          }
        })();
      }, 0);
    });
    root.createEl("h4", { text: "Review before any future import" });
    const warnings = root.createEl("ul");
    for (const warning of preview.warnings) warnings.createEl("li", { text: warning });
    root.createEl("p", { cls: "vd-subtle", text:
      "This preview does not add another Bible to SwordDock. Import conversion, content rights and versification mapping require separate validation." });
  }

  onClose(): void { ++this.revision; this.contentEl.empty(); }
}
