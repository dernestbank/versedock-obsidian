/**
 * Lossless, untrusted-data tokenizer for MySword's GBF (General Bible Format).
 *
 * This DOES NOT render, strip markup, convert, or install Scripture. Every
 * source token retains its exact spelling and UTF-16 offsets, so consumers can
 * inspect structure without silently changing verse wording or formatting.
 *
 * Tag definitions: https://mysword.info/modules-format
 */
import { CANON_CHAPTERS } from "./canon";

export type GbfTokenKind =
  "text" | "paired-open" | "paired-close" | "structural" |
  "cross-reference" | "lexical" | "html" | "unknown" | "malformed";

export interface GbfToken {
  kind: GbfTokenKind;
  raw: string;
  /** UTF-16 source offsets, end exclusive */
  start: number;
  end: number;
  /** Canonical tag family for recognized tokens, never rendered as HTML */
  family?: string;
  /** Validated, non-rendering metadata for a recognized RX token. */
  reference?: MySwordCrossReference;
}

export interface MySwordReferencePoint {
  /** MySword's 1-based Protestant-canon book number. */
  book: number;
  chapter: number;
  verse: number;
}

export interface MySwordCrossReference {
  start: MySwordReferencePoint;
  end?: MySwordReferencePoint;
}

export interface GbfScan {
  tokens: GbfToken[];
  issues: string[];
  lossless: boolean;
  knownMarkers: number;
  htmlMarkers: number;
  unknownMarkers: number;
}
const PAIRS: ReadonlyMap<string, string> = new Map([
  ["FI","Fi"],["FO","Fo"],["FR","Fr"],["FU","Fu"],
  ["RF","Rf"],["TS","Ts"],["Q","q"],["E","e"],
  ["T","t"],["X","x"],["H","h"],["G","g"]
]);
const CLOSING = new Map([...PAIRS].map(([start, end]) => [end, start]));

function validPoint(point: MySwordReferencePoint): boolean {
  return Number.isSafeInteger(point.book) && point.book >= 1 && point.book <= CANON_CHAPTERS.length &&
    Number.isSafeInteger(point.chapter) && point.chapter >= 1 &&
    point.chapter <= CANON_CHAPTERS[point.book - 1] &&
    Number.isSafeInteger(point.verse) && point.verse >= 1 && point.verse <= 200;
}

/**
 * Parses the documented b.c.v / b.c.v-tv forms and the observed b.c.v—c:v
 * publisher extension. It never resolves links or changes the source token.
 */
export function parseMySwordGbfReference(raw: string): MySwordCrossReference | null {
  const match = /^<RX\s*([0-9]{1,2})\.([0-9]{1,3})\.([0-9]{1,3})(?:(?:-([0-9]{1,3}))|(?:[-–—]([0-9]{1,3}):([0-9]{1,3})))?>$/.exec(raw);
  if (!match) return null;
  const start = {book: Number(match[1]), chapter: Number(match[2]), verse: Number(match[3])};
  if (!validPoint(start)) return null;
  let end: MySwordReferencePoint | undefined;
  if (match[4]) {
    end = {...start, verse: Number(match[4])};
    if (!validPoint(end) || end.verse < start.verse || end.verse - start.verse > 100) return null;
  } else if (match[5] && match[6]) {
    end = {book: start.book, chapter: Number(match[5]), verse: Number(match[6])};
    if (!validPoint(end) || end.chapter < start.chapter ||
        (end.chapter === start.chapter && end.verse < start.verse)) return null;
  }
  return end ? {start, end} : {start};
}

function describe(raw: string): {kind: GbfTokenKind; family?: string; reference?: MySwordCrossReference} {
  const inner = raw.slice(1, -1);
  if (PAIRS.has(inner)) return {kind: "paired-open", family: inner};
  if (CLOSING.has(inner)) return {kind: "paired-close", family: CLOSING.get(inner)};
  if (/^RF q=[a-zA-Z0-9_-]+$/.test(inner))
    return {kind: "paired-open", family: "RF"};
  if (/^TS[1-9]$/.test(inner))
    return {kind: "paired-open", family: "TS"};
  if (/^(CM|CI|D|wh|wg|wt)$/.test(inner))
    return {kind: "structural", family: inner};
  if (/^(PI|PF)[0-7]$/.test(inner))
    return {kind: "structural", family: inner.slice(0, 2)};
  if (/^(WG|WH)[1-9][0-9]*$/.test(inner))
    return {kind: "lexical", family: inner.slice(0, 2)};
  if (/^WT[A-Za-z0-9_-]+$/.test(inner))
    return {kind: "lexical", family: "WT"};
  const reference = parseMySwordGbfReference(raw);
  if (reference) return {kind: "cross-reference", family: "RX", reference};
  // HTML occurs in MySword content. Never treat it as executable markup.
  if (/^\/?[a-z][a-z0-9]*(?:\s+[^<>]*)?\/?$/.test(inner))
    return {kind: "html", family: "HTML"};
  return {kind: "unknown"};
}

/** O(n) scan; never evaluates code, HTML, CSS, links, or regex from a module. */
export function tokenizeMySwordGbf(source: string): GbfScan {
  const tokens: GbfToken[] = [], issues: string[] = [];
  const stack: {family: string; start: number}[] = [];
  let knownMarkers = 0, htmlMarkers = 0, unknownMarkers = 0;
  const add = (start: number, end: number, kind: GbfTokenKind, family?: string,
    reference?: MySwordCrossReference) => tokens.push({
      kind, raw: source.slice(start, end), start, end,
      ...(family ? {family} : {}), ...(reference ? {reference} : {})
    });
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf("<", i);
    if (open === -1) { add(i, source.length, "text"); break; }
    if (open > i) add(i, open, "text");
    const close = source.indexOf(">", open + 1);
    const nested = source.indexOf("<", open + 1);
    if (close === -1 || (nested !== -1 && nested < close)) {
      const end = close === -1 ? source.length : nested;
      add(open, end, "malformed");
      issues.push("Unterminated or nested tag-like token at offset " + open);
      unknownMarkers++;
      i = end;
      continue;
    }
    const raw = source.slice(open, close + 1);
    const {kind, family, reference} = describe(raw);
    add(open, close + 1, kind, family, reference);
    if (kind === "unknown") {
      unknownMarkers++;
      issues.push("Unsupported tag-like token at offset " + open);
    } else if (kind === "html") {
      htmlMarkers++;
    } else {
      knownMarkers++;
      if (kind === "paired-open" && family) stack.push({family, start: open});
      if (kind === "paired-close" && family) {
        const last = stack[stack.length - 1];
        if (last?.family === family) stack.pop();
        else issues.push("Mismatched closing tag at offset " + open);
      }
    }
    i = close + 1;
  }
  for (const unclosed of stack)
    issues.push("Unclosed " + unclosed.family + " tag at offset " + unclosed.start);
  const lossless = tokens.map(token => token.raw).join("") === source &&
    tokens.every((token, idx) => token.raw === source.slice(token.start, token.end) &&
      (idx === 0 ? token.start === 0 : tokens[idx - 1].end === token.start)) &&
    (tokens.length === 0 ? source.length === 0 : tokens[tokens.length - 1].end === source.length);
  if (!lossless) issues.push("Source round-trip verification failed");
  return {tokens, issues, lossless, knownMarkers, htmlMarkers, unknownMarkers};
}
