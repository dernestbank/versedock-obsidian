import { beforeAll, describe, expect, it } from "vitest";
import initSqlJs, { type SqlJsStatic } from "sql.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { BOOKS } from "../src/core/books";
import { CANON_CHAPTERS, preflightMySwordPlainText } from "../src/core/mysword-conversion-preflight";

let sql: SqlJsStatic;
beforeAll(async () => {
  sql = await initSqlJs({
    wasmBinary: Uint8Array.from(readFileSync(path.resolve("assets/sql-wasm.wasm"))).buffer
  });
});
function fixture({text = "In the beginning.", book = 1, chapter = 1, rtl = false, strong = false,
  verseRules = "", customCss = ""}:
  {text?: string; book?: number; chapter?: number; rtl?: boolean; strong?: boolean;
   verseRules?: string; customCss?: string} = {}) {
  const db = new sql.Database();
  try {
    db.run("CREATE TABLE Details (Abbreviation TEXT, RightToLeft BOOL, Strong BOOL, VerseRules TEXT, CustomCSS TEXT)");
    db.run("INSERT INTO Details VALUES ('TEST', ?, ?, ?, ?)",
      [rtl ? 1 : 0, strong ? 1 : 0, verseRules ?? "", customCss ?? ""]);
    db.run("CREATE TABLE Bible (Book INT, Chapter INT, Verse INT, Scripture TEXT)");
    db.run("INSERT INTO Bible VALUES (?, ?, 1, ?)", [book, chapter, text]);
    return db.export();
  } finally { db.close(); }
}
describe("private MySword text-conversion preflight", () => {
  it("allows a plain-text technical candidate without installing or writing", () => {
    const bytes = fixture();
    const snapshot = Uint8Array.from(bytes);
    const report = preflightMySwordPlainText(sql, "test.bbl.mybible", bytes);
    expect(report.status).toBe("text-candidate");
    expect(report.installsModule).toBe(false);
    expect(report.verses).toBe(1);
    expect(report.partialBooks).toBe(true);
    expect(report.blockers).toEqual([]);
    expect(bytes).toEqual(snapshot);
  });
  it("blocks MySword HTML instead of silently rewriting Scripture", () => {
    const report = preflightMySwordPlainText(sql, "test.bbl.mybible",
      fixture({text: "<img src=x onerror=alert(1)> Word of God"}));
    expect(report.status).toBe("blocked");
    expect(report.markupVerses).toBe(1);
    expect(report.blockers.join(" ")).toContain("verified MySword text parser");
  });
  it("blocks Strong's tagged modules and backslash directives", () => {
    const report = preflightMySwordPlainText(sql, "test.bbl.mybible",
      fixture({strong: true, text: "Verse \\f footnote"}));
    expect(report.status).toBe("blocked");
    expect(report.blockers.join(" ")).toContain("Strong's");
  });
  it("blocks chapters exceeding canonical book count", () => {
    const report = preflightMySwordPlainText(sql, "test.bbl.mybible",
      fixture({book: 43, chapter: 100}));
    expect(report.status).toBe("blocked");
    expect(report.invalidChapterVerses).toBe(1);
  });
  it("blocks right-to-left editions until supported", () => {
    const report = preflightMySwordPlainText(sql, "test.bbl.mybible",
      fixture({rtl: true}));
    expect(report.status).toBe("blocked");
    expect(report.blockers.join(" ")).toContain("Right-to-left");
  });
  it("blocks untrusted module-defined regex and CSS without executing either", () => {
    const report = preflightMySwordPlainText(sql, "test.bbl.mybible",
      fixture({verseRules: "(.+)\t$1", customCss: "body{display:none}"}));
    expect(report.status).toBe("blocked");
    expect(report.blockers.join(" ")).toContain("VerseRules");
    expect(report.blockers.join(" ")).toContain("CustomCSS");
    expect(report.installsModule).toBe(false);
  });
  it("returns exact GBF/HTML/unknown counts without converting a verse", () => {
    const report = preflightMySwordPlainText(sql, "test.bbl.mybible",
      fixture({text: "<FR>Jesus<Fr><br/><UNKNOWN>"}));
    expect(report.markupVerses).toBe(1);
    expect(report.gbfMarkers).toBe(2);
    expect(report.htmlMarkers).toBe(1);
    expect(report.unknownMarkers).toBe(1);
    expect(report.tagIssueVerses).toBe(1);
    expect(report.status).toBe("blocked");
  });
  it("accepts valid empty verses but flags them for manual review", () => {
    const report = preflightMySwordPlainText(sql, "test.bbl.mybible",
      fixture({text: ""}));
    expect(report.status).toBe("text-candidate");
    expect(report.emptyVerses).toBe(1);
    expect(report.notes.join(" ")).toContain("empty Scripture");
  });
  it("chapter mapping exactly matches the bundled verified WEB canon", () => {
    const m = JSON.parse(readFileSync(path.resolve("library/webp/manifest.json"), "utf8"));
    expect(CANON_CHAPTERS).toHaveLength(BOOKS.length);
    expect(CANON_CHAPTERS).toEqual(m.books.map((book: {chapters: number}) => book.chapters));
    expect(BOOKS).toHaveLength(66);
  });
});
