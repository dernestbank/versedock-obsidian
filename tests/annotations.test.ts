import { describe, expect, it } from "vitest";
import { annotationReference, marksForVerse, restoreAnnotations, type ReaderAnnotation } from "../src/core/annotations";
import { parseOsis, passageIsHighlighted, refLabel, togglePassageHighlight } from "../src/core/references";

const mark: ReaderAnnotation = { id: "a", edition: "webp", color: "amber", style: "highlight", note: "Repeated word",
  parts: [{ ref: "John.3.16", start: 6, quote: "light" }] };
describe("Reader annotations", () => {
  it("anchors the selected occurrence to its edition, verse and exact text", () => {
    expect(marksForVerse([mark], "webp", "John.3.16", "light light")).toEqual([{ start: 6, end: 11, mark }]);
    for (const [edition, ref, text] of [["kjv","John.3.16","light light"],["webp","John.3.17","light light"],["webp","John.3.16","light night"]]) {
      expect(marksForVerse([mark],edition,ref,text)).toEqual([]);
    }
  });
  it("retains separate overlapping marks and computes a multi-verse reference", () => {
    const multi = { ...mark, id: "b", parts: [...mark.parts,{ref:"John.3.17",start:0,quote:"For"}] };
    expect(refLabel(annotationReference(multi))).toBe("John 3:16-17");
    expect(marksForVerse([mark,multi],"webp","John.3.16","light light")).toHaveLength(2);
    expect(marksForVerse([multi],"webp","John.3.17","For God")[0].end).toBe(3);
  });
  it("loads older settings and ignores malformed marks without losing valid notes", () => {
    expect(restoreAnnotations(undefined)).toEqual([]);
    expect(restoreAnnotations([null,mark,{...mark,id:"bad",parts:[{ref:"invalid",start:-1,quote:"x"}]}])).toEqual([mark]);
    expect(restoreAnnotations(JSON.parse(JSON.stringify([mark])))).toEqual([mark]);
  });
});


describe("whole-verse highlights from earlier versions", () => {
  it("removes one verse inside a saved range while preserving the surrounding verses", () => {
    expect(togglePassageHighlight(["John.3.15-18","Mark.2.1"],parseOsis("John.3.16"))).toEqual(["John.3.15","John.3.17-18","Mark.2.1"]);
  });
  it("toggles a selection covered by multiple saved ranges", () => {
    const old = ["John.3.15-16","John.3.17-18"];
    const ref = parseOsis("John.3.16-17");
    expect(passageIsHighlighted(old,ref)).toBe(true);
    expect(togglePassageHighlight(old,ref)).toEqual(["John.3.15","John.3.18"]);
    expect(passageIsHighlighted(old,parseOsis("John.3.18-19"))).toBe(false);
    expect(togglePassageHighlight(old,parseOsis("John.3.19"))).toContain("John.3.19");
  });
});
