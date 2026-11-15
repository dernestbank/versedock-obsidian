import type { SqlJsStatic, Database, Statement } from "sql.js";
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
const DEFAULT_BATCH_SIZE = 1000;
const MAX_BATCH_SIZE = 5000;

interface ScanState {
  markupVerses: number;
  invalidChapterVerses: number;
  emptyVerses: number;
  gbfMarkers: number;
  htmlMarkers: number;
  unknownMarkers: number;
  tagIssueVerses: number;
  crossReferences: number;
  unresolvedCrossReferences: number;
  semanticReadyMarkupVerses: number;
  opaqueSemanticEvents: number;
  translatorNotes: number;
  titles: number;
  count: number;
}

export interface CooperativePreflightOptions {
  /** Rows analyzed before yielding to Obsidian's event loop. Defaults to 1,000. */
  batchSize?: number;
  /** Injectable for deterministic tests. The default yields through setTimeout(0). */
  yieldControl?: () => Promise<void>;
  /** Checked before work and on both sides of every yield. */
  shouldContinue?: () => boolean;
}

export class MySwordPreflightCancelledError extends Error {
  constructor() {
    super("MySword conversion preflight was cancelled.");
    this.name = "MySwordPreflightCancelledError";
  }
}

function countRows(db: Database): number {
  return Number(db.exec("SELECT COUNT(*) AS n FROM Bible")[0]?.values[0]?.[0] ?? 0);
}

function createScanState(): ScanState {
  return {
    markupVerses: 0,
    invalidChapterVerses: 0,
    emptyVerses: 0,
    gbfMarkers: 0,
    htmlMarkers: 0,
    unknownMarkers: 0,
    tagIssueVerses: 0,
    crossReferences: 0,
    unresolvedCrossReferences: 0,
    semanticReadyMarkupVerses: 0,
    opaqueSemanticEvents: 0,
    translatorNotes: 0,
    titles: 0,
    count: 0
  };
}

function scanCurrentRow(stmt: Statement, state: ScanState): void {
  const [rawBook, rawChapter, rawText] = stmt.get();
  const book = Number(rawBook), chapter = Number(rawChapter);
  const text = String(rawText);
  state.count++;
  if (chapter > CANON_CHAPTERS[book - 1]) state.invalidChapterVerses++;
  if (MARKUP.test(text)) {
    state.markupVerses++;
    const semantics = interpretMySwordGbf(text);
    if (!semantics.lossless) throw new Error("GBF semantic source round-trip failed.");
    state.gbfMarkers += semantics.knownMarkers;
    state.htmlMarkers += semantics.htmlMarkers;
    state.unknownMarkers += semantics.unknownMarkers;
    state.opaqueSemanticEvents += semantics.opaqueEvents;
    state.translatorNotes += semantics.translatorNotes.length;
    state.titles += semantics.titles.length;
    if (semantics.fullyInterpreted) state.semanticReadyMarkupVerses++;
    for (const event of semantics.events) {
      if (event.kind === "cross-reference") state.crossReferences++;
      else if (event.kind === "opaque" && event.raw.startsWith("<RX"))
        state.unresolvedCrossReferences++;
    }
    if (semantics.issues.length) state.tagIssueVerses++;
  }
  if (text.length === 0) state.emptyVerses++;
}

function openReadOnlyDatabase(sql: SqlJsStatic, bytes: Uint8Array): Database {
  const db = new sql.Database(bytes);
  try {
    db.run("PRAGMA trusted_schema=OFF");
    db.run("PRAGMA query_only=ON");
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

function finishPreflight(
  db: Database,
  preview: ReturnType<typeof inspectMySwordBible>,
  state: ScanState
): ConversionPreflight {
  if (state.count !== preview.verses || state.count !== countRows(db))
    throw new Error("Verse count changed during inspection.");
  const blockers: string[] = [];
  if (state.invalidChapterVerses) blockers.push(
    state.invalidChapterVerses + " record(s) exceed the canonical chapter count for their book."
  );
  if (state.markupVerses) blockers.push(
    state.markupVerses + " verse(s) contain markup or escape codes; a verified MySword text parser is required."
  );
  if (preview.strongTags) blockers.push("Strong's tagging requires an explicit, lossless parser.");
  if (state.tagIssueVerses) blockers.push(
    state.tagIssueVerses + " verse(s) have unsupported or unbalanced GBF tags."
  );
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
  if (state.emptyVerses)
    notes.push(state.emptyVerses + " empty Scripture record(s) need source verification.");
  if (preview.books < 66)
    notes.push("Partial Bible: " + preview.books + " of 66 canonical book numbers present.");
  return {
    status: blockers.length ? "blocked" : "text-candidate",
    verses: state.count,
    books: preview.books,
    markupVerses: state.markupVerses,
    gbfMarkers: state.gbfMarkers,
    htmlMarkers: state.htmlMarkers,
    unknownMarkers: state.unknownMarkers,
    crossReferences: state.crossReferences,
    unresolvedCrossReferences: state.unresolvedCrossReferences,
    tagIssueVerses: state.tagIssueVerses,
    semanticReadyMarkupVerses: state.semanticReadyMarkupVerses,
    opaqueSemanticEvents: state.opaqueSemanticEvents,
    translatorNotes: state.translatorNotes,
    titles: state.titles,
    invalidChapterVerses: state.invalidChapterVerses,
    emptyVerses: state.emptyVerses,
    partialBooks: preview.books < 66,
    blockers,
    notes,
    installsModule: false
  };
}

function ensureActive(shouldContinue: () => boolean): void {
  if (!shouldContinue()) throw new MySwordPreflightCancelledError();
}

/** Synchronous CLI/test entry point. The Obsidian UI uses the cooperative variant below. */
export function preflightMySwordPlainText(
  sql: SqlJsStatic,
  name: string,
  bytes: Uint8Array
): ConversionPreflight {
  const preview = inspectMySwordBible(sql, name, bytes);
  const db = openReadOnlyDatabase(sql, bytes);
  const state = createScanState();
  let stmt: Statement | null = null;
  try {
    stmt = db.prepare("SELECT Book, Chapter, Scripture FROM Bible");
    while (stmt.step()) scanCurrentRow(stmt, state);
    return finishPreflight(db, preview, state);
  } finally {
    stmt?.free();
    db.close();
  }
}

/**
 * Read-only UI entry point that yields between bounded row batches. It produces
 * exactly the same report as the synchronous entry point and supports revision cancellation.
 */
export async function preflightMySwordPlainTextCooperatively(
  sql: SqlJsStatic,
  name: string,
  bytes: Uint8Array,
  options: CooperativePreflightOptions = {}
): Promise<ConversionPreflight> {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH_SIZE)
    throw new Error("Preflight batch size must be an integer between 1 and 5,000 rows.");
  const shouldContinue = options.shouldContinue ?? (() => true);
  const yieldControl = options.yieldControl ?? (() =>
    new Promise<void>(resolve => globalThis.setTimeout(resolve, 0)));
  ensureActive(shouldContinue);
  const preview = inspectMySwordBible(sql, name, bytes);
  ensureActive(shouldContinue);
  const db = openReadOnlyDatabase(sql, bytes);
  const state = createScanState();
  let stmt: Statement | null = null;
  try {
    stmt = db.prepare("SELECT Book, Chapter, Scripture FROM Bible");
    while (state.count < preview.verses) {
      let batchCount = 0;
      while (batchCount < batchSize && stmt.step()) {
        scanCurrentRow(stmt, state);
        batchCount++;
      }
      if (batchCount === 0 || state.count >= preview.verses) break;
      ensureActive(shouldContinue);
      await yieldControl();
      ensureActive(shouldContinue);
    }
    ensureActive(shouldContinue);
    return finishPreflight(db, preview, state);
  } finally {
    stmt?.free();
    db.close();
  }
}
