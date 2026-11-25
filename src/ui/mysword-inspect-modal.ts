import { Modal } from "obsidian";
import initSqlJs from "sql.js";
import type { SqlJsStatic } from "sql.js";
import { inspectMySwordBible, MAX_MY_SWORD_BYTES, type MySwordBiblePreview } from "../core/mysword-preview";
import {
  preflightMySwordPlainTextCooperatively,
  type ConversionPreflight
} from "../core/mysword-conversion-preflight";
import { formatStorageBytes } from "../core/storage";
import type { SwordDockController } from "../controller";
import { textButton } from "./components";
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

  private async sha256(bytes: Uint8Array): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes).buffer as ArrayBuffer);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }

  onOpen(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("versedock", "vd-mysword-inspect-modal");
    root.createEl("h2", { text: "Inspect a MySword Bible" });
    root.createEl("p", { cls: "vd-subtle", text:
      "Select a locally owned, unencrypted .bbl.mybible SQLite Bible file (maximum 24 MiB). This is a read-only preview, not an installation or license check." });
    const actions = root.createDiv({ cls: "vd-action-row" });
    textButton(actions, "Open module import", () => {
      this.close(); this.plugin.openMySwordInspector();
    }, "mod-cta");
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
        const started = performance.now();
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          if (version !== this.revision) return;
          const sql = await this.loadSql();
          if (version !== this.revision) return;
          const preview = inspectMySwordBible(sql, file.name, bytes);
          const sourceSha256 = await this.sha256(bytes);
          if (version !== this.revision) return;
          status.setText("Preview ready. No content installed or saved.");
          this.renderPreview(result, preview, () => preflightMySwordPlainTextCooperatively(
            sql,
            file.name,
            bytes,
            {shouldContinue: () => this.revision === version}
          ), version, {
            sourceBytes: bytes.byteLength,
            sourceSha256,
            elapsedMs: Math.max(0, performance.now() - started)
          });
        } catch (error) {
          if (version !== this.revision) return;
          status.setText(error instanceof Error ? error.message : String(error));
        }
      })();
    });
  }
  private renderPreview(root: HTMLElement, preview: MySwordBiblePreview,
    checkPlainText: () => Promise<ConversionPreflight>, version: number,
    evidence: { sourceBytes: number; sourceSha256: string; elapsedMs: number }): void {
    root.createEl("h3", { text: preview.description });
    const meta = root.createDiv({ cls: "vd-import-meta" });
    for (const [label, value] of [
      ["File", preview.fileName], ["Abbreviation", preview.abbreviation],
      ["Language", preview.language], ["Edition", preview.version],
      ["Books", String(preview.books)], ["Chapters", preview.chapters.toLocaleString()],
      ["Verses", preview.verses.toLocaleString()],
      ["OT / NT", (preview.hasOT ? "Yes" : "No") + " / " + (preview.hasNT ? "Yes" : "No")],
      ["Strong's tags", preview.strongTags ? "Flagged" : "Not flagged"]
    ]) {
      const line = meta.createDiv();
      line.createEl("strong", { text: label + ": " });
      line.createSpan({ text: value });
    }
    const evidencePanel = root.createDiv({ cls: "vd-import-evidence" });
    evidencePanel.createEl("strong", { text: "Source integrity" });
    const evidenceRows: Array<[string, string]> = [
      ["Source bytes", formatStorageBytes(evidence.sourceBytes) + " (" + evidence.sourceBytes.toLocaleString() + " bytes)"],
      ["SHA-256", evidence.sourceSha256],
      ["Inspection time", evidence.elapsedMs.toFixed(1) + " ms"],
      ["Mode", "Read-only inspection · no saved package"]
    ];
    for (const [label, value] of evidenceRows) {
      const line = evidencePanel.createDiv();
      line.createSpan({ text: label });
      line.createEl("strong", { text: value });
    }
    evidencePanel.createEl("p", { text: "This inspection does not install or save content. Open module import to review a compatible SQLite or gzip file and its prepared library size before installing." });
    root.createEl("h4", { text: "Sample verses (literal, unformatted data)" });
    for (const row of preview.samples) {
      const el = root.createEl("p", { cls: "vd-import-sample" });
      el.createEl("strong", { text: "Book " + row.book + " " + row.chapter + ":" + row.verse });
      // Never parse imported SQLite verse strings as HTML or Markdown.
      el.createDiv({ text: row.scripture });
    }
    const safety = root.createDiv({ cls: "vd-conversion-check" });
    const button = safety.createEl("button", { cls: "vd-text-button",
      text: "Check text structure (read-only)" });
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
              text: report.status === "blocked" ? "Advanced inspection: source structures need review" :
                "Advanced inspection: text structure checks passed"
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
            summary.setText("Text structure check failed: " +
              (error instanceof Error ? error.message : String(error)));
          } finally {
            button.disabled = false;
            restoreActionFocus(button, returnFocus);
          }
        })();
      }, 0);
    });
    root.createEl("h4", { text: "Source review" });
    const warnings = root.createEl("ul");
    for (const warning of preview.warnings) warnings.createEl("li", { text: warning });
    root.createEl("p", { cls: "vd-subtle", text:
      "Use Open module import to install compatible Bibles, commentaries, dictionaries, books, devotionals and graphics. Its preview includes source information, sample content and an optional source or permission note. The original file is unchanged." });
  }

  onClose(): void { ++this.revision; this.contentEl.empty(); }
}
