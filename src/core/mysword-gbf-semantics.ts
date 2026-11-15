import {
  tokenizeMySwordGbf,
  type GbfToken,
  type GbfTokenKind,
  type MySwordCrossReference
} from "./mysword-gbf";

export const MAX_GBF_SEMANTIC_CHARACTERS = 32_768;
export const MAX_GBF_SEMANTIC_NESTING = 32;

export type GbfTextFormat =
  "added-words" | "old-testament-quote" | "words-of-jesus" | "underline";

interface GbfSemanticEventBase {
  /** Exact source substring; semantic consumers must never reconstruct it. */
  raw: string;
  /** UTF-16 source offsets, end exclusive. */
  start: number;
  end: number;
}

export interface GbfTextEvent extends GbfSemanticEventBase {
  kind: "text";
  text: string;
}

export interface GbfFormatEvent extends GbfSemanticEventBase {
  kind: "format-open" | "format-close";
  format: GbfTextFormat;
}

export interface GbfParagraphBreakEvent extends GbfSemanticEventBase {
  kind: "paragraph-break";
}

export interface GbfSeparatorEvent extends GbfSemanticEventBase {
  kind: "separator";
}

export interface GbfPoetryIndentEvent extends GbfSemanticEventBase {
  kind: "poetry-indent";
  target: "line" | "first-line";
  level: number;
}

export interface GbfCrossReferenceEvent extends GbfSemanticEventBase {
  kind: "cross-reference";
  reference: MySwordCrossReference;
}

export interface GbfAnnotationEvent extends GbfSemanticEventBase {
  kind: "note-open" | "note-close" | "title-open" | "title-close";
  label?: string;
  level?: number;
}

export type GbfOpaqueReason = "unsafe-html" | "invalid-token" | "unimplemented-semantic";

export interface GbfOpaqueEvent extends GbfSemanticEventBase {
  kind: "opaque";
  reason: GbfOpaqueReason;
  tokenKind: Exclude<GbfTokenKind, "text">;
  family?: string;
}

export type GbfSemanticEvent =
  GbfTextEvent | GbfFormatEvent | GbfParagraphBreakEvent | GbfSeparatorEvent |
  GbfPoetryIndentEvent | GbfCrossReferenceEvent | GbfAnnotationEvent | GbfOpaqueEvent;

interface GbfSemanticRegionBase {
  raw: string;
  contentRaw: string;
  start: number;
  contentStart: number;
  contentEnd: number;
  end: number;
}

export interface GbfTranslatorNoteRegion extends GbfSemanticRegionBase {
  kind: "translator-note";
  label?: string;
}

export interface GbfTitleRegion extends GbfSemanticRegionBase {
  kind: "title";
  level?: number;
}

export interface GbfSemanticDocument {
  events: GbfSemanticEvent[];
  /** Lexical/balance problems from the source-preserving scanner. */
  issues: string[];
  /** True only when every event still covers the exact original source span. */
  lossless: boolean;
  /** False when any source construct is invalid, unsafe or not yet implemented. */
  fullyInterpreted: boolean;
  opaqueEvents: number;
  knownMarkers: number;
  htmlMarkers: number;
  unknownMarkers: number;
  translatorNotes: GbfTranslatorNoteRegion[];
  titles: GbfTitleRegion[];
}

const TEXT_FORMATS: Readonly<Record<string, GbfTextFormat>> = {
  FI: "added-words",
  FO: "old-testament-quote",
  FR: "words-of-jesus",
  FU: "underline"
};
const UNSUPPORTED_TEXT_MARKUP = /\\[a-zA-Z]|&(?:#[0-9]+|#x[0-9a-f]+|[a-z]{2,12});/i;

function assertBoundedSource(source: string): void {
  // A JavaScript UTF-16 string needs at most two code units per Unicode code point.
  if (source.length > MAX_GBF_SEMANTIC_CHARACTERS * 2) {
    throw new Error("GBF Scripture text exceeds the 32,768-character inspection limit.");
  }
  if (source.length <= MAX_GBF_SEMANTIC_CHARACTERS) return;
  let characters = 0;
  for (const _character of source) {
    characters++;
    if (characters > MAX_GBF_SEMANTIC_CHARACTERS) {
      throw new Error("GBF Scripture text exceeds the 32,768-character inspection limit.");
    }
  }
}

function base(token: GbfToken): GbfSemanticEventBase {
  return {raw: token.raw, start: token.start, end: token.end};
}

function noteLabel(raw: string): string | undefined {
  return /^<RF q=([a-zA-Z0-9_-]+)>$/.exec(raw)?.[1];
}

function titleLevel(raw: string): number | undefined {
  const value = /^<TS([1-9])>$/.exec(raw)?.[1];
  return value ? Number(value) : undefined;
}

function opaque(token: GbfToken): GbfOpaqueEvent {
  const reason: GbfOpaqueReason = token.kind === "html" ? "unsafe-html" :
    token.kind === "unknown" || token.kind === "malformed" ? "invalid-token" :
      "unimplemented-semantic";
  return {
    ...base(token), kind: "opaque", reason,
    tokenKind: token.kind as Exclude<GbfTokenKind, "text">,
    ...(token.family ? {family: token.family} : {})
  };
}

function interpretToken(token: GbfToken): GbfSemanticEvent {
  if (token.kind === "text") return {...base(token), kind: "text", text: token.raw};
  if ((token.kind === "paired-open" || token.kind === "paired-close") && token.family) {
    if (token.family === "RF") {
      const label = token.kind === "paired-open" ? noteLabel(token.raw) : undefined;
      return {
        ...base(token),
        kind: token.kind === "paired-open" ? "note-open" : "note-close",
        ...(label ? {label} : {})
      };
    }
    if (token.family === "TS") {
      const level = token.kind === "paired-open" ? titleLevel(token.raw) : undefined;
      return {
        ...base(token),
        kind: token.kind === "paired-open" ? "title-open" : "title-close",
        ...(level ? {level} : {})
      };
    }
    const format = TEXT_FORMATS[token.family];
    if (format) return {
      ...base(token), kind: token.kind === "paired-open" ? "format-open" : "format-close", format
    };
  }
  if (token.kind === "structural") {
    if (token.family === "CM") return {...base(token), kind: "paragraph-break"};
    if (token.family === "CI") return {...base(token), kind: "separator"};
    if (token.family === "PI" || token.family === "PF") {
      const level = Number(token.raw.slice(3, -1));
      return {
        ...base(token), kind: "poetry-indent",
        target: token.family === "PI" ? "line" : "first-line", level
      };
    }
  }
  if (token.kind === "cross-reference" && token.reference) {
    return {...base(token), kind: "cross-reference", reference: token.reference};
  }
  return opaque(token);
}

function extractAnnotationRegions(tokens: GbfToken[], source: string, issues: string[]): {
  translatorNotes: GbfTranslatorNoteRegion[];
  titles: GbfTitleRegion[];
} {
  const translatorNotes: GbfTranslatorNoteRegion[] = [];
  const titles: GbfTitleRegion[] = [];
  const stack: {family: string; token: GbfToken; valid: boolean}[] = [];
  let reportedDepth = false;
  for (const token of tokens) {
    if (token.kind === "paired-open" && token.family) {
      if (stack.length >= MAX_GBF_SEMANTIC_NESTING && !reportedDepth) {
        issues.push("GBF semantic nesting depth exceeds " + MAX_GBF_SEMANTIC_NESTING +
          " at offset " + token.start + ".");
        reportedDepth = true;
      }
      stack.push({family: token.family, token, valid: true});
      continue;
    }
    if (token.kind !== "paired-close" || !token.family) continue;
    const opener = stack[stack.length - 1];
    if (!opener || opener.family !== token.family) {
      for (const frame of stack) frame.valid = false;
      continue;
    }
    stack.pop();
    if (!opener.valid) continue;
    const region = {
      raw: source.slice(opener.token.start, token.end),
      contentRaw: source.slice(opener.token.end, token.start),
      start: opener.token.start,
      contentStart: opener.token.end,
      contentEnd: token.start,
      end: token.end
    };
    if (token.family === "RF") {
      const label = noteLabel(opener.token.raw);
      translatorNotes.push({kind: "translator-note", ...region, ...(label ? {label} : {})});
    }
    if (token.family === "TS") {
      const level = titleLevel(opener.token.raw);
      titles.push({kind: "title", ...region, ...(level ? {level} : {})});
    }
  }
  return {translatorNotes, titles};
}

/**
 * Produces inert semantic data only. It never renders HTML, follows references,
 * runs module CSS/regex, strips source tokens, or creates installable content.
 */
export function interpretMySwordGbf(source: string): GbfSemanticDocument {
  assertBoundedSource(source);
  const scan = tokenizeMySwordGbf(source);
  const events = scan.tokens.map(interpretToken);
  const opaqueEvents = events.reduce((count, event) => count + (event.kind === "opaque" ? 1 : 0), 0);
  const issues = [...scan.issues];
  if (UNSUPPORTED_TEXT_MARKUP.test(source)) {
    issues.push("Unsupported GBF escape directive or entity syntax requires semantic review.");
  }
  const {translatorNotes, titles} = extractAnnotationRegions(scan.tokens, source, issues);
  const lossless = scan.lossless && events.map(event => event.raw).join("") === source &&
    events.every((event, index) => event.raw === source.slice(event.start, event.end) &&
      (index === 0 ? event.start === 0 : events[index - 1].end === event.start)) &&
    (events.length === 0 ? source.length === 0 : events[events.length - 1].end === source.length);
  if (!lossless && !issues.includes("Semantic source round-trip verification failed")) {
    issues.push("Semantic source round-trip verification failed");
  }
  return {
    events, issues, lossless, opaqueEvents,
    knownMarkers: scan.knownMarkers,
    htmlMarkers: scan.htmlMarkers,
    unknownMarkers: scan.unknownMarkers,
    translatorNotes, titles,
    fullyInterpreted: lossless && issues.length === 0 && opaqueEvents === 0
  };
}
