import { describe, expect, it } from "vitest";
import { tokenizeMySwordGbf } from "../src/core/mysword-gbf";

describe("MySword GBF source-preserving lexical scanner", () => {
  it("recognizes publisher paragraph, poetry, note and red-letter markers", () => {
    const raw = "<PF1><PI3>Words of Christ<CI><FR>red words<Fr><RF>note<Rf><CM>";
    const parsed = tokenizeMySwordGbf(raw);
    expect(parsed.lossless).toBe(true);
    expect(parsed.issues).toEqual([]);
    expect(parsed.knownMarkers).toBe(8);
    expect(parsed.htmlMarkers).toBe(0);
    expect(parsed.tokens.map(t => t.raw).join("")).toBe(raw);
    expect(parsed.tokens.filter(t => t.kind === "paired-open").map(t => t.family)).toEqual(["FR","RF"]);
  });
  it("recognizes official RX numeric references including spaces, Strong and morphology", () => {
    const raw = "<RX 43.3.16><RX43.3.16-18><WG5485><WH2617><WTN-NSF>";
    const parsed = tokenizeMySwordGbf(raw);
    expect(parsed.issues).toEqual([]);
    expect(parsed.knownMarkers).toBe(5);
    expect(parsed.tokens.map(t => t.family)).toEqual(["RX","RX","WG","WH","WT"]);
  });
  it("recognizes title levels, translators note labels, interlinear paired markers", () => {
    const raw = "<TS2>Title<Ts><RF q=a>Note<Rf><Q><E>word<e><q>";
    const parsed = tokenizeMySwordGbf(raw);
    expect(parsed.lossless).toBe(true);
    expect(parsed.issues).toEqual([]);
    expect(parsed.tokens.filter(t => t.kind === "paired-open").map(t => t.family)).toEqual(["TS","RF","Q","E"]);
  });
  it("does not interpret HTML/script tokens or drop their text", () => {
    const raw = '<script>alert("x")</script> <em>hello</em> <br/>';
    const parsed = tokenizeMySwordGbf(raw);
    expect(parsed.lossless).toBe(true);
    expect(parsed.htmlMarkers).toBe(5);
    expect(parsed.tokens.map(t => t.raw).join("")).toBe(raw);
    expect(parsed.tokens.filter(t => t.kind === "html").map(t => t.raw)).toEqual(
      ["<script>","</script>","<em>","</em>","<br/>"]
    );
  });
  it("identifies unsupported markup without modifying even one character", () => {
    const raw = "Hello<UNKNOWN attr=x>world</UNKNOWN>";
    const parsed = tokenizeMySwordGbf(raw);
    expect(parsed.lossless).toBe(true);
    expect(parsed.unknownMarkers).toBe(2);
    expect(parsed.issues).toHaveLength(2);
  });
  it("reports malformed and mismatched markers while still round-tripping them", () => {
    for (const raw of ["<FR>unclosed", "<Fr>orphan", "x<RF broken <CM>", "oops<FR"]) {
      const parsed = tokenizeMySwordGbf(raw);
      expect(parsed.lossless).toBe(true);
      expect(parsed.issues.length).toBeGreaterThan(0);
      expect(parsed.tokens.map(t => t.raw).join("")).toBe(raw);
    }
  });
  it("tracks precise UTF-16 offsets including emoji, Greek, and Hebrew", () => {
    const raw = "📖 ἐν <FR>יְהוָה<Fr> end";
    const parsed = tokenizeMySwordGbf(raw);
    expect(parsed.issues).toEqual([]);
    for (const token of parsed.tokens) {
      expect(token.raw).toBe(raw.slice(token.start, token.end));
      expect(token.end).toBeGreaterThan(token.start);
    }
    expect(parsed.tokens.map(t => t.raw).join("")).toBe(raw);
  });
  it("preserves and flags the uncommon publisher cross-chapter reference", () => {
    const raw = "<RX 12.6.31—7:20>";
    const parsed = tokenizeMySwordGbf(raw);
    expect(parsed.lossless).toBe(true);
    expect(parsed.unknownMarkers).toBe(1);
    expect(parsed.issues).toHaveLength(1);
    expect(parsed.tokens[0].raw).toBe(raw);
  });
  it("returns an empty but lossless scan for empty Scripture", () => {
    expect(tokenizeMySwordGbf("")).toMatchObject({
      tokens: [], issues: [], knownMarkers: 0, unknownMarkers: 0, lossless: true
    });
  });
});
