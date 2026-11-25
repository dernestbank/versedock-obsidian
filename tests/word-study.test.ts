import { describe, expect, it } from "vitest";
import { describeMorphology } from "../src/core/morphology";
import { initialWordDetailsState, synchronizeWordPin, taggedWordSelection, transitionWordDetails } from "../src/core/word-study";
import { parseReference } from "../src/core/references";

const loved = { ref: parseReference("John 3:16"), token: { text: "loved", strongs: ["G25"] }, index: 6 };
const world = { ref: parseReference("John 3:16"), token: { text: "the world", strongs: ["G2889"] }, index: 8 };

describe("source-owned word selection", () => {
  it("keeps the selected KJV token and its own source coordinates", () => {
    expect(taggedWordSelection("kjv", loved.ref, loved.token, loved.index)).toEqual(loved);
  });
  it("refuses lexical claims for untagged WEB even if tags are supplied", () => {
    expect(taggedWordSelection("webp", loved.ref, loved.token, loved.index)).toBeNull();
  });
  it("does not turn punctuation or untagged text into a word study", () => {
    expect(taggedWordSelection("kjv", loved.ref, { text: ", " }, 1)).toBeNull();
  });
  it("rejects non-source token positions", () => {
    for (const index of [-1, 0.5, NaN, Infinity])
      expect(taggedWordSelection("kjv", loved.ref, loved.token, index)).toBeNull();
  });
});

describe("source morphology descriptions", () => {
  it("describes finite, participle and infinitive verb forms without changing the source code", () => {
    expect(describeMorphology("robinson:V-AAI-3S")).toBe("Verb · Aorist · Active · Indicative · Third person · Singular");
    expect(describeMorphology("robinson:V-2AAP-NSM")).toBe("Verb · Second aorist · Active · Participle · Nominative · Singular · Masculine");
    expect(describeMorphology("robinson:V-PAN")).toBe("Verb · Present · Active · Infinitive");
  });
  it("describes nouns, articles, personal and possessive forms", () => {
    expect(describeMorphology("robinson:N-NSF")).toBe("Noun · Nominative · Singular · Feminine");
    expect(describeMorphology("robinson:T-ASM")).toBe("Definite article · Accusative · Singular · Masculine");
    expect(describeMorphology("robinson:P-2DS")).toBe("Personal pronoun · Second person · Dative · Singular");
    expect(describeMorphology("robinson:S-2PDSM")).toBe("Possessive adjective · Second person · Plural possessor · Dative · Singular · Masculine");
  });
  it("describes documented modifiers and indeclinables", () => {
    expect(describeMorphology("robinson:PRT-N")).toBe("Particle · Negative");
    expect(describeMorphology("robinson:N-PRI")).toBe("Indeclinable proper noun");
    expect(describeMorphology("robinson:A-NSM-C")).toBe("Adjective · Nominative · Singular · Masculine · Comparative");
  });
  it("keeps unfamiliar schemas, malformed combinations and unrecognized modifiers undecoded", () => {
    for (const code of ["strongMorph:TH8804", "packard:N-NSM", "robinson:N-XYZ", "robinson:V-PAN-3S", "robinson:V-AAI-NSM", "robinson:V-PAI-3S-UNKNOWN", "robinson:N-NSM-UNKNOWN"])
      expect(describeMorphology(code)).toBeNull();
  });
});

describe("Instant Details pin and preview", () => {
  it("previews without changing the selected passage or pinning the word", () => {
    const state = transitionWordDetails(initialWordDetailsState(), { type: "preview", word: loved });
    expect(state).toMatchObject({ word: loved, pinned: false, expanded: true, tab: "overview" });
    expect(loved.ref).toEqual(parseReference("John 3:16"));
  });
  it("holds a clicked word against incidental hover previews", () => {
    const state = synchronizeWordPin(initialWordDetailsState(), loved);
    expect(transitionWordDetails(state, { type: "preview", word: world })).toBe(state);
    expect(synchronizeWordPin(state, world).word).toBe(world);
  });
  it("keeps a manual collapse and selected tab across an unrelated Reader render", () => {
    const pinned = synchronizeWordPin(initialWordDetailsState(), loved);
    const collapsed = transitionWordDetails(transitionWordDetails(pinned, { type: "tab", tab: "lexicon" }), { type: "toggle" });
    expect(synchronizeWordPin(collapsed, { ...loved })).toBe(collapsed);
    expect(collapsed).toMatchObject({ expanded: false, tab: "lexicon" });
  });
  it("resets stale word details when the Reader clears the pin", () => {
    const state = synchronizeWordPin(synchronizeWordPin(initialWordDetailsState(), loved), null);
    expect(state.word).toBeNull();
    expect(state.pinned).toBe(false);
    expect(state.expanded).toBe(false);
  });
  it("returns to the overview for a newly selected word", () => {
    const state = transitionWordDetails(synchronizeWordPin(initialWordDetailsState(), loved), { type: "tab", tab: "occurrences" });
    expect(synchronizeWordPin(state, world)).toMatchObject({ word: world, tab: "overview", expanded: true });
  });
});
