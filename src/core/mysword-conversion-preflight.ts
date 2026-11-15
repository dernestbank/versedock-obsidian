import type { SqlJsStatic, Database } from "sql.js";
import { BOOKS } from "./books";
import { CANON_CHAPTERS } from "./canon";
import { inspectMySwordBible } from "./mysword-preview";
import { interpretMySwordGbf } from "./mysword-gbf-semantics";

export { CANON_CHAPTERS } from "./canon";

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
  gbfMarkers: number;
  htmlMarkers: number;
  unknownMarkers: number;
  crossReferences: number;
  unresolvedCrossReferences: number;
  semanticReadyMarkupVerses: number;
  opaqueSemanticEvents: number;
  translatorNotes: number;
  titles: number;
  tagIssueVerses: number;
  invalidChapterVerses: number;
  emptyVerses: number;
  partialBooks: boolean;
  blockers: string[];
  notes: string[];
  /** Explicitly false until a separate license-aware, opt-in writer exists. */
  installsModule: false;
}

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
    let gbfMarkers = 0, htmlMarkers = 0, unknownMarkers = 0, tagIssueVerses = 0;
    let crossReferences = 0, unresolvedCrossReferences = 0;
    let semanticReadyMarkupVerses = 0, opaqueSemanticEvents = 0;
    let translatorNotes = 0, titles = 0;
    let count = 0;
    const stmt = db.prepare("SELECT Book, Chapter, Scripture FROM Bible");
    try {
      while (stmt.step()) {
        const [rawBook, rawChapter, rawText] = stmt.get();
        const book = Number(rawBook), chapter = Number(rawChapter);
        const text = String(rawText);
        count++;
        if (chapter > CANON_CHAPTERS[book - 1]) invalidChapterVerses++;
        if (MARKUP.test(text)) {
          markupVerses++;
          const semantics = interpretMySwordGbf(text);
          if (!semantics.lossless) throw new Error("GBF semantic source round-trip failed.");
          gbfMarkers += semantics.knownMarkers;
          htmlMarkers += semantics.htmlMarkers;
          unknownMarkers += semantics.unknownMarkers;
          opaqueSemanticEvents += semantics.opaqueEvents;
          translatorNotes += semantics.translatorNotes.length;
          titles += semantics.titles.length;
          if (semantics.fullyInterpreted) semanticReadyMarkupVerses++;
          for (const event of semantics.events) {
            if (event.kind === "cross-reference") crossReferences++;
            else if (event.kind === "opaque" && event.raw.startsWith("<RX"))
              unresolvedCrossReferences++;
          }
          if (semantics.issues.length) tagIssueVerses++;
        }
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
    if (tagIssueVerses) blockers.push(tagIssueVerses + " verse(s) have unsupported or unbalanced GBF tags.");
    // Do not execute arbitrary module-defined regex rules or CSS during preflight.
    const details = db.prepare("SELECT * FROM Details LIMIT 1");
    let metadata: Record<string, unknown>;
    try {
      if (!details.step()) throw new Error("Missing MySword Details record.");
      metadata = Object.fromEntries(Object.entries(details.getAsObject()).map(([key, value]) =>
        [key.toLowerCase(), value]));
    } finally {
      details.free();
    }
    if (Number(metadata.righttoleft) === 1)
      blockers.push("Right-to-left text support must be validated before conversion.");
    if (typeof metadata.verserules === "string" && metadata.verserules.trim())
      blockers.push("Module VerseRules are present; module-defined regex must not run without explicit approval.");
    if (typeof metadata.customcss === "string" && metadata.customcss.trim())
      blockers.push("Module CustomCSS is present; its display behavior requires safe rendering review.");
    const notes = [
      "Supported GBF semantics were analyzed without changing source text; conversion and installation remain unavailable.",
      "Read-only preflight: no files were created, modified, uploaded or installed.",
      "Technical preflight cannot verify copyright, licensing, provenance or translation accuracy.",
      "Verse mappings must be compared to the edition's published versification before any conversion."
    ];
    if (emptyVerses) notes.push(emptyVerses + " empty Scripture record(s) need source verification.");
    if (preview.books < 66) notes.push("Partial Bible: " + preview.books + " of 66 canonical book numbers present.");
    return {
      status: blockers.length ? "blocked" : "text-candidate",
      verses: count, books: preview.books, markupVerses, gbfMarkers, htmlMarkers,
      unknownMarkers, crossReferences, unresolvedCrossReferences, tagIssueVerses,
      semanticReadyMarkupVerses, opaqueSemanticEvents, translatorNotes, titles,
      invalidChapterVerses, emptyVerses,
      partialBooks: preview.books < 66,
      blockers, notes, installsModule: false
    };
  } finally {
    db.close();
  }
}
