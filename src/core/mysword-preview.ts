import type { SqlJsStatic, Database } from "sql.js";

export const MAX_MY_SWORD_BYTES = 24 * 1024 * 1024;
const SQLITE_MAGIC = new TextEncoder().encode("SQLite format 3\0");

export interface MySwordVersePreview {
  book: number;
  chapter: number;
  verse: number;
  scripture: string;
}
export interface MySwordBiblePreview {
  fileName: string;
  description: string;
  abbreviation: string;
  language: string;
  version: string;
  hasOT: boolean;
  hasNT: boolean;
  strongTags: boolean;
  books: number;
  verses: number;
  samples: MySwordVersePreview[];
  warnings: string[];
}

function single(db: Database, query: string): unknown[] {
  const rows = db.exec(query);
  return rows[0]?.values[0] ?? [];
}
function tableColumns(db: Database, table: "Details" | "Bible"): Set<string> {
  return new Set(db.exec(`PRAGMA table_info("${table}")`)[0]?.values
    .map(row => String(row[1]).toLowerCase()) ?? []);
}
function safeText(value: unknown, length = 120): string {
  return typeof value === "string" ? value.slice(0, length).trim() : "";
}
function inspectMetadata(db: Database): Record<string, unknown> {
  const columns = tableColumns(db, "Details");
  if (!columns.has("abbreviation")) throw new Error("Details.Abbreviation is missing.");
  const stmt = db.prepare("SELECT * FROM Details LIMIT 2");
  try {
    if (!stmt.step()) throw new Error("Details table is empty.");
    const value = stmt.getAsObject() as Record<string, unknown>;
    if (stmt.step()) throw new Error("Details table has multiple records.");
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k.toLowerCase(), v]));
  } finally { stmt.free(); }
}
function readSamples(db: Database): MySwordVersePreview[] {
  const stmt = db.prepare("SELECT Book,Chapter,Verse,Scripture FROM Bible ORDER BY Book,Chapter,Verse LIMIT 4");
  const samples: MySwordVersePreview[] = [];
  try {
    while (stmt.step()) {
      const row = stmt.get();
      samples.push({ book: Number(row[0]), chapter: Number(row[1]), verse: Number(row[2]),
        scripture: safeText(row[3], 500) });
    }
  } finally { stmt.free(); }
  return samples;
}
export function validateMySwordModuleHeader(filename: string, bytes: Uint8Array): void {
  if (!/^[^/\\]+\.bbl\.mybible$/i.test(filename))
    throw new Error("Select an uncompressed .bbl.mybible Bible module. Other module types are not supported yet.");
  if (bytes.byteLength < 100 || bytes.byteLength > MAX_MY_SWORD_BYTES)
    throw new Error("Module must be an SQLite file between 100 bytes and 24 MiB.");
  if (!SQLITE_MAGIC.every((byte, index) => bytes[index] === byte))
    throw new Error("Not an unencrypted SQLite database; compressed, encrypted and renamed files are not supported.");
}
/** Preview a user-provided file in memory. Never writes to the vault or renders HTML. */
export function inspectMySwordBible(
  sql: SqlJsStatic, filename: string, bytes: Uint8Array
): MySwordBiblePreview {
  validateMySwordModuleHeader(filename, bytes);
  let db: Database | null = null;
  try {
    db = new sql.Database(bytes);
    db.run("PRAGMA trusted_schema=OFF");
    db.run("PRAGMA query_only=ON");
    const integrity = single(db, "PRAGMA quick_check(1)");
    if (integrity[0] !== "ok") throw new Error("SQLite integrity check failed.");
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0]?.values
      .map(row => String(row[0]).toLowerCase()) ?? [];
    if (!tables.includes("details") || !tables.includes("bible"))
      throw new Error("Expected physical Details and Bible tables were not found.");
    const columns = tableColumns(db, "Bible");
    if (!["book", "chapter", "verse", "scripture"].every(col => columns.has(col)))
      throw new Error("Bible table must have Book, Chapter, Verse and Scripture columns.");
    const metadata = inspectMetadata(db);
    const count = Number(single(db, "SELECT COUNT(*) FROM Bible")[0]);
    if (!Number.isSafeInteger(count) || count < 1 || count > 100000)
      throw new Error("Unsupported Bible verse count (must be 1–100,000).");
    const malformed = single(db, `SELECT 1 FROM Bible WHERE
      typeof(Book) != 'integer' OR Book NOT BETWEEN 1 AND 66
      OR typeof(Chapter) != 'integer' OR Chapter NOT BETWEEN 1 AND 200
      OR typeof(Verse) != 'integer' OR Verse NOT BETWEEN 1 AND 200
      OR typeof(Scripture) != 'text' OR length(Scripture) NOT BETWEEN 0 AND 32768
      LIMIT 1`);
    if (malformed.length) throw new Error("Bible contains unsupported book, chapter, verse or text values.");
    const duplicates = single(db, `SELECT 1 FROM Bible
      GROUP BY Book,Chapter,Verse HAVING COUNT(*)>1 LIMIT 1`);
    if (duplicates.length) throw new Error("Duplicate Book/Chapter/Verse records detected.");
    const books = Number(single(db, "SELECT COUNT(DISTINCT Book) FROM Bible")[0]);
    const emptyVerses = Number(single(db, "SELECT COUNT(*) FROM Bible WHERE length(Scripture) = 0")[0]);
    const samples = readSamples(db);
    const hasFormatting = samples.some(s => /<[^>]+>|\\[A-Za-z]+/.test(s.scripture));
    const warnings: string[] = [
      "Preview only: nothing was installed, modified, saved or uploaded.",
      "Copyright and distribution permission for this selected module have not been verified.",
      "Numbers are shown as stored. Versification and book mapping need verification before conversion."
    ];
    if (metadata.verserules || metadata.customcss || metadata.strong === 1 || hasFormatting)
      warnings.push("Module includes specialized markup or rules. This preview displays literal text, not formatted Scripture.");
    if (books < 66) warnings.push("Partial Bible detected; not all 66 Protestant-canon books are present.");
    if (emptyVerses) warnings.push(emptyVerses + " empty verse record(s) found. Check source text and versification before conversion.");
    return {
      fileName: filename,
      description: safeText(metadata.description, 180) || filename,
      abbreviation: safeText(metadata.abbreviation, 40) || "Unspecified",
      language: safeText(metadata.language, 40) || "Unspecified",
      version: safeText(metadata.versiondate, 32) || safeText(metadata.version, 32) || "Unknown",
      hasOT: Number(metadata.ot) === 1,
      hasNT: Number(metadata.nt) === 1,
      strongTags: Number(metadata.strong) === 1,
      books, verses: count, samples, warnings
    };
  } catch (cause) {
    throw new Error("MySword module inspection failed: " +
      (cause instanceof Error ? cause.message : String(cause)));
  } finally {
    db?.close();
  }
}
