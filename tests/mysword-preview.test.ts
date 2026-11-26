import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { BOOKS } from "../src/core/books";
import path from "node:path";
import initSqlJs, { type SqlJsStatic } from "sql.js";
import { inspectMySwordBible, validateMySwordModuleHeader } from "../src/core/mysword-preview";

let sql: SqlJsStatic;
const filename = "sample.bbl.mybible";
beforeAll(async () => {
  const raw = readFileSync(path.resolve("assets/sql-wasm.wasm"));
  const wasmBinary = Uint8Array.from(raw).buffer;
  sql = await initSqlJs({ wasmBinary });
});
function makeDb(options: {
  invalid?: boolean; duplicate?: boolean; missing?: boolean;
  multipleDetails?: boolean; chapter?: number;
} = {}): Uint8Array {
  const db = new sql.Database();
  try {
    db.run("CREATE TABLE Details (Abbreviation TEXT, Description TEXT, Language TEXT, VersionDate TEXT, OT INT, NT INT, Strong INT, CustomCSS TEXT)");
    if (!options.missing) db.run("CREATE TABLE Bible (Book INT, Chapter INT, Verse INT, Scripture TEXT)");
    db.run("INSERT INTO Details VALUES ('TEST', 'Fixture for tests', 'eng', '2026-01-01',1,1,1,'')");
    if (options.multipleDetails) db.run("INSERT INTO Details (Abbreviation) VALUES ('OTHER')");
    if (!options.missing) {
      db.run("INSERT INTO Bible VALUES (43, ?, 16, ?)", [options.chapter ?? 3,
        options.invalid ? null : "<script>alert('x')</script> For God so loved the world"]);
      if (options.duplicate) db.run("INSERT INTO Bible VALUES (43,3,16,'duplicate')");
    }
    return db.export();
  } finally { db.close(); }
}
describe("MySword SQLite preview", () => {
  it("inspects a valid local Bible without executing unsafe Scripture markup", () => {
    const preview = inspectMySwordBible(sql, filename, makeDb());
    expect(preview.abbreviation).toBe("TEST");
    expect(preview.books).toBe(1);
    expect(preview.chapters).toBe(1);
    expect(preview.verses).toBe(1);
    expect(preview.samples[0].scripture).toContain("<script>alert('x')</script>");
    expect(preview.warnings.join(" ")).toContain("nothing was installed");
  });
  it("rejects renamed and non-SQLite modules", () => {
    const good = makeDb();
    expect(() => validateMySwordModuleHeader("book.cmt.mybible", good)).toThrow();
    expect(() => validateMySwordModuleHeader("sample.bbl.mybible", new Uint8Array(200))).toThrow(/SQLite/);
  });
  it("rejects missing Bible table", () => {
    expect(() => inspectMySwordBible(sql, filename, makeDb({ missing: true }))).toThrow(/Bible tables/);
  });
  it("rejects duplicate verses", () => {
    expect(() => inspectMySwordBible(sql, filename, makeDb({ duplicate: true }))).toThrow(/Duplicate/);
  });
  it("rejects invalid content and references", () => {
    expect(() => inspectMySwordBible(sql, filename, makeDb({ invalid: true }))).toThrow(/unsupported/);
    expect(() => inspectMySwordBible(sql, filename, makeDb({ chapter: -2 }))).toThrow(/unsupported/);
  });
  it("rejects multiple Details records", () => {
    expect(() => inspectMySwordBible(sql, filename, makeDb({ multipleDetails: true }))).toThrow(/multiple records/);
  });
  it("accepts publisher-style Details metadata without Language and leaves the input unchanged", () => {
    const db = new sql.Database();
    try {
      db.run("CREATE TABLE Details (Description TEXT, Abbreviation TEXT, Comments TEXT, Version TEXT, VersionDate DATETIME, PublishDate DATETIME, RightToLeft BOOL, OT BOOL, NT BOOL, Strong BOOL)");
      db.run("INSERT INTO Details VALUES ('World English Bible','WEB','','Public Domain','2025-08-04','','0',1,1,0)");
      db.run("CREATE TABLE Bible (Book INT, Chapter INT, Verse INT, Scripture TEXT)");
      db.run("INSERT INTO Bible VALUES (1,1,1,'In the beginning God created the heavens and the earth.')");
      const input = db.export();
      const pristine = Uint8Array.from(input);
      const result = inspectMySwordBible(sql, "publisher-web.bbl.mybible", input);
      expect(result.abbreviation).toBe("WEB");
      expect(result.language).toBe("Unspecified");
      expect(result.version).toBe("2025-08-04");
      expect(result.books).toBe(1);
      expect(input).toEqual(pristine);
    } finally { db.close(); }
  });
  it("can inspect an entire synthetic 31,103-verse WEB-sized SQLite Bible", () => {
    const db = new sql.Database();
    try {
      db.run("CREATE TABLE Details (Abbreviation TEXT, Description TEXT, OT INT, NT INT)");
      db.run("INSERT INTO Details VALUES ('WEB-TEST','Generated synthetic QA copy',1,1)");
      db.run("CREATE TABLE Bible (Book INT, Chapter INT, Verse INT, Scripture TEXT)");
      db.run("BEGIN");
      const stmt = db.prepare("INSERT INTO Bible (Book,Chapter,Verse,Scripture) VALUES (?,?,?,?)");
      try {
        for (const [i, book] of BOOKS.entries()) {
          const payload = JSON.parse(readFileSync(path.resolve("library/webp", book.vpl + ".json"), "utf8"));
          for (const chapter of payload.chapters) for (const v of chapter.verses) {
            stmt.run([i + 1, chapter.chapter, v.verse, v.text]);
          }
        }
      } finally { stmt.free(); }
      db.run("COMMIT");
      const bytes = db.export();
      const inspected = inspectMySwordBible(sql, "generated-fixture.bbl.mybible", bytes);
      expect(inspected.verses).toBe(31103);
      expect(inspected.books).toBe(66);
      expect(inspected.chapters).toBeGreaterThan(1000);
      expect(inspected.samples.length).toBe(4);
      expect(inspected.warnings.join(" ")).toContain("5 empty verse record(s)");
    } finally { db.close(); }
  }, 30000);
});
