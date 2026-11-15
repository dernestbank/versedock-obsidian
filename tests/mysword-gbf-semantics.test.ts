import { describe, expect, it } from "vitest";
import {
  interpretMySwordGbf,
  MAX_GBF_SEMANTIC_CHARACTERS,
  MAX_GBF_SEMANTIC_NESTING
} from "../src/core/mysword-gbf-semantics";

describe("MySword GBF text-first semantic events", () => {
  it("maps supported typography without changing text or source spans", () => {
    const source = "Before <FI>added<Fi>, <FO>quoted<Fo>, <FR>Jesus<Fr>, <FU>underlined<Fu>.";
    const result = interpretMySwordGbf(source);

    expect(result.fullyInterpreted).toBe(true);
    expect(result.lossless).toBe(true);
    expect(result.opaqueEvents).toBe(0);
    expect(result.events.filter(event => event.kind === "format-open")).toMatchObject([
      {format: "added-words"},
      {format: "old-testament-quote"},
      {format: "words-of-jesus"},
      {format: "underline"}
    ]);
    expect(result.events.filter(event => event.kind === "format-close")).toMatchObject([
      {format: "added-words"},
      {format: "old-testament-quote"},
      {format: "words-of-jesus"},
      {format: "underline"}
    ]);
    expect(result.events.map(event => event.raw).join("")).toBe(source);
    for (const event of result.events) {
      expect(event.raw).toBe(source.slice(event.start, event.end));
    }
  });

  it("maps paragraph, separator and poetry markers into inert structure events", () => {
    const source = "<PI3><PF1>Line one<CI>Line two<CM>";
    const result = interpretMySwordGbf(source);

    expect(result.fullyInterpreted).toBe(true);
    expect(result.events).toMatchObject([
      {kind: "poetry-indent", target: "line", level: 3},
      {kind: "poetry-indent", target: "first-line", level: 1},
      {kind: "text", text: "Line one"},
      {kind: "separator"},
      {kind: "text", text: "Line two"},
      {kind: "paragraph-break"}
    ]);
    expect(result.events.map(event => event.raw).join("")).toBe(source);
  });

  it("carries validated cross-reference metadata without following the link", () => {
    const source = "See <RX 12.6.31—7:20>.";
    const result = interpretMySwordGbf(source);

    expect(result.fullyInterpreted).toBe(true);
    expect(result.events[1]).toMatchObject({
      kind: "cross-reference",
      reference: {
        start: {book: 12, chapter: 6, verse: 31},
        end: {book: 12, chapter: 7, verse: 20}
      }
    });
    expect(result.events.map(event => event.raw).join("")).toBe(source);
  });

  it("keeps unsafe and unimplemented tokens opaque instead of discarding them", () => {
    const source = "<RF>note<Rf><TS>title<Ts><WG5485><script>alert(1)</script><UNKNOWN>";
    const result = interpretMySwordGbf(source);
    const opaque = result.events.filter(event => event.kind === "opaque");

    expect(result.fullyInterpreted).toBe(false);
    expect(result.lossless).toBe(true);
    expect(result.opaqueEvents).toBe(4);
    expect(opaque.map(event => event.reason)).toEqual([
      "unimplemented-semantic", "unsafe-html", "unsafe-html", "invalid-token"
    ]);
    expect(result.events.map(event => event.raw).join("")).toBe(source);
  });

  it("preserves malformed and Unicode source while refusing complete interpretation", () => {
    const source = "📖 ἐν יְהוָה x<FR";
    const result = interpretMySwordGbf(source);

    expect(result.lossless).toBe(true);
    expect(result.fullyInterpreted).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.events.at(-1)).toMatchObject({kind: "opaque", reason: "invalid-token", raw: "<FR"});
    expect(result.events.map(event => event.raw).join("")).toBe(source);
  });

  it("refuses unsupported backslash directives and entities as complete semantics", () => {
    const source = "Verse \\f footnote &copy; &#169;";
    const result = interpretMySwordGbf(source);

    expect(result.lossless).toBe(true);
    expect(result.fullyInterpreted).toBe(false);
    expect(result.issues.join(" ")).toMatch(/escape|entit/i);
    expect(result.events.map(event => event.raw).join("")).toBe(source);
  });

  it("rejects source beyond the inspected Scripture character limit", () => {
    const astralBoundary = "📖".repeat(MAX_GBF_SEMANTIC_CHARACTERS);
    expect(interpretMySwordGbf(astralBoundary)).toMatchObject({
      lossless: true,
      fullyInterpreted: true,
      opaqueEvents: 0
    });
    expect(() => interpretMySwordGbf("x".repeat(MAX_GBF_SEMANTIC_CHARACTERS + 1)))
      .toThrow(/32,768/);
    expect(() => interpretMySwordGbf("📖".repeat(MAX_GBF_SEMANTIC_CHARACTERS + 1)))
      .toThrow(/32,768/);
  });

  it("extracts balanced titles and translator notes as exact inert regions", () => {
    const source = "<TS2>Heading<Ts><RF q=a>literal <FI>note<Fi><Rf>";
    const result = interpretMySwordGbf(source);

    expect(result.fullyInterpreted).toBe(true);
    expect(result.titles).toEqual([{
      kind: "title",
      level: 2,
      raw: "<TS2>Heading<Ts>",
      contentRaw: "Heading",
      start: 0,
      contentStart: 5,
      contentEnd: 12,
      end: 16
    }]);
    expect(result.translatorNotes).toEqual([{
      kind: "translator-note",
      label: "a",
      raw: "<RF q=a>literal <FI>note<Fi><Rf>",
      contentRaw: "literal <FI>note<Fi>",
      start: 16,
      contentStart: 24,
      contentEnd: 44,
      end: 48
    }]);
    expect(result.events.filter(event => event.kind.endsWith("-open"))).toMatchObject([
      {kind: "title-open", level: 2},
      {kind: "note-open", label: "a"},
      {kind: "format-open", format: "added-words"}
    ]);
    expect(result.events.map(event => event.raw).join("")).toBe(source);
  });

  it("keeps HTML inside an extracted note literal and incomplete", () => {
    const source = "<RF><script>alert(1)</script><Rf>";
    const result = interpretMySwordGbf(source);

    expect(result.translatorNotes).toMatchObject([{
      contentRaw: "<script>alert(1)</script>",
      raw: source
    }]);
    expect(result.events.filter(event => event.kind === "opaque")).toHaveLength(2);
    expect(result.fullyInterpreted).toBe(false);
    expect(result.lossless).toBe(true);
  });

  it("does not extract an unmatched annotation region", () => {
    const source = "<RF>unclosed note";
    const result = interpretMySwordGbf(source);

    expect(result.translatorNotes).toEqual([]);
    expect(result.fullyInterpreted).toBe(false);
    expect(result.issues.join(" ")).toContain("Unclosed RF");
    expect(result.events.map(event => event.raw).join("")).toBe(source);
  });

  it("does not extract a region after mismatched nested annotation markers", () => {
    const source = "<RF><TS>mixed<Rf><Ts>";
    const result = interpretMySwordGbf(source);

    expect(result.translatorNotes).toEqual([]);
    expect(result.titles).toEqual([]);
    expect(result.fullyInterpreted).toBe(false);
    expect(result.issues.join(" ")).toMatch(/mismatched|unclosed/i);
    expect(result.events.map(event => event.raw).join("")).toBe(source);
  });

  it("refuses pair nesting beyond the semantic depth limit without losing source", () => {
    const source = "<FI>".repeat(MAX_GBF_SEMANTIC_NESTING + 1) + "text" +
      "<Fi>".repeat(MAX_GBF_SEMANTIC_NESTING + 1);
    const result = interpretMySwordGbf(source);

    expect(result.lossless).toBe(true);
    expect(result.fullyInterpreted).toBe(false);
    expect(result.issues.join(" ")).toMatch(/nesting depth/i);
    expect(result.events.map(event => event.raw).join("")).toBe(source);
  });
});
