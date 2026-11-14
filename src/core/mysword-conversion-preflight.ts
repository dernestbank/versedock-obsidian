import type { SqlJsStatic, Database } from "sql.js";
import { BOOKS } from "./books";
import { inspectMySwordBible } from "./mysword-preview";

/**
 * Text-only conversion preflight, NOT an importer or license check.
 *
 * We do not strip HTML/Strong's markup: doing so would silently change the
 * source's text. Users keep complete control of their own files.
 */
export interface ConversionPreflight {
  status: "text-candidate" | "blocked";
  verses: number;
  books: number;
  markupVerses: number;
  invalidChapterVerses: number;
  emptyVerses: number;
  partialBooks: boolean;
  blockers: string[];
  notes: string[];
  /** Explicitly false until a separate license-aware, opt-in writer exists. */
  installsModule: false;
}

/** Canonical chapter counts for the 66-book Protestant ordering used by MySword. */
export const CANON_CHAPTERS: readonly number[] = [
  50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,
  3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22
];
if (CANON_CHAPTERS.length !== BOOKS.length) throw new Error("Canonical book mapping is incomplete.");

const MARKUP = /<[^>]*>|\\[a-zA-Z]|&(?:#[0-9]+|#x[0-9a-f]+|[a-z]{2,12});/i;
function countRows(db: Database): number {
  return Number(db.exec("SELECT COUNT(*) AS n FROM Bible")[0]?.values[0]?.[0] ?? 0);
}

export function preflightMySwordPlainText(sql: SqlJsStatic, name: string, bytes: Uint8Array): ConversionPreflight {
  // Reuse the same strict format, SQLite integrity, row-type and duplicate validation.
  const preview = inspectMySwordBible(sql, name, bytes);
  const db = new sql.Database(bytes);
  try {
    db.run("PRAGMA trusted_schema=OFF");
    db.run("PRAGMA query_only=ON");
    let markupVerses = 0, invalidChapterVerses = 0, emptyVerses = 0;
    let count = 0;
    const stmt = db.prepare("SELECT Book, Chapter, Scripture FROM Bible");
    try {
      while (stmt.step()) {
        const [rawBook, rawChapter, rawText] = stmt.get();
        const book = Number(rawBook), chapter = Number(rawChapter);
        const text = String(rawText);
        count++;
        if (chapter > CANON_CHAPTERS[book - 1]) invalidChapterVerses++;
        if (MARKUP.test(text)) markupVerses++;
        if (text.length === 0) emptyVerses++;
      }
    } finally {
      stmt.free();
    }
    if (count !== preview.verses || count !== countRows(db)) throw new Error("Verse count changed during inspection.");
    const blockers: string[] = [];
    if (invalidChapterVerses) blockers.push(
      invalidChapterVerses + " record(s) exceed the canonical chapter count for their book."
    );
    if (markupVerses) blockers.push(
      markupVerses + " verse(s) contain markup or escape codes; a verified MySword text parser is required."
    );
    if (preview.strongTags) blockers.push("Strong's tagging requires an explicit, lossless parser.");
    const details = db.exec("PRAGMA table_info(Details)")[0]?.values ?? [];
    if (details.some(row => String(row[1]).toLowerCase() === "righttoleft")) {
      const result = db.exec("SELECT RightToLeft FROM Details LIMIT 1")[0]?.values?.[0]?.[0];
      if (Number(result) === 1) blockers.push("Right-to-left text support must be validated before conversion.");
    }
    const notes = [
      "Read-only preflight: no files were created, modified, uploaded or installed.",
      "Technical preflight cannot verify copyright, licensing, provenance or translation accuracy.",
      "Verse mappings must be compared to the edition's published versification before any conversion."
    ];
    if (emptyVerses) notes.push(emptyVerses + " empty Scripture record(s) need source verification.");
    if (preview.books < 66) notes.push("Partial Bible: " + preview.books + " of 66 canonical book numbers present.");
    return {
      status: blockers.length ? "blocked" : "text-candidate",
      verses: count, books: preview.books, markupVerses, invalidChapterVerses, emptyVerses,
      partialBooks: preview.books < 66,
      blockers, notes, installsModule: false
    };
  } finally {
    db.close();
  }
}
