import { describe, expect, it } from "vitest";
import { BOOKS, BOOK_BY_VPL, bookByName } from "../src/core/books";
import { extendReferenceInDirection, extendReferenceToVerse, osisId, parseReference, refLabel, parseOsis, referenceContainsVerse, referenceId, storedReferencesContainVerse } from "../src/core/references";

describe("canonical books", () => {
  it("covers each of 66 unique books", () => {
    expect(BOOKS).toHaveLength(66);
    expect(new Set(BOOKS.map(b => b.vpl)).size).toBe(66);
    expect(new Set(BOOKS.map(b => b.osis)).size).toBe(66);
    expect(BOOKS[0].name).toBe("Genesis");
    expect(BOOKS[65].name).toBe("Revelation");
    expect(BOOK_BY_VPL.get("JOH")?.osis).toBe("John");
  });
  it("normalizes common aliases", () => {
    expect(bookByName("1 co")?.name).toBe("1 Corinthians");
    expect(bookByName("Psalms")?.osis).toBe("Ps");
    expect(bookByName("Jn")?.osis).toBe("John");
  });
});
describe("reference parsing", () => {
  it.each([
    ["John 3:16", "John.3.16"],
    ["jn 3 16", "John.3.16"],
    ["ps23", "Ps.23"],
    ["1co 13:4-7", "1Cor.13.4"],
    ["Genesis 1", "Gen.1"],
    ["Song of Solomon 2:1", "Song.2.1"],
    ["2 Timothy 1:7", "2Tim.1.7"]
  ])("parses %s", (input, expected) => {
    expect(osisId(parseReference(input))).toBe(expected);
  });
  it("retains range and label", () => {
    const ref = parseReference("1co 13:4-7");
    expect(ref.endVerse).toBe(7);
    expect(refLabel(ref)).toBe("1 Corinthians 13:4-7");
    expect(referenceContainsVerse(ref, 4)).toBe(true);
    expect(referenceContainsVerse(ref, 7)).toBe(true);
    expect(referenceContainsVerse(ref, 8)).toBe(false);
    expect(referenceId(ref)).toBe("1Cor.13.4-7");
    expect(storedReferencesContainVerse(["1Cor.13.4-7"], parseReference("1 Cor 13:6"))).toBe(true);
    expect(storedReferencesContainVerse(["1Cor.13.4-7"], parseReference("1 Cor 13:8"))).toBe(false);
  });
  it("extends Reader selections from the starting verse", () => {
    const start = parseReference("John 3:16");
    expect(referenceId(extendReferenceToVerse(start, 18))).toBe("John.3.16-18");
    expect(referenceId(extendReferenceToVerse(start, 14))).toBe("John.3.14-16");
    expect(referenceId(extendReferenceToVerse(parseReference("John 3:16-18"), 21))).toBe("John.3.16-21");
    expect(referenceId(extendReferenceToVerse(start, 16))).toBe("John.3.16");
    expect(referenceId(extendReferenceInDirection(parseReference("John 3:16-18"), 19, "forward"))).toBe("John.3.16-19");
    expect(referenceId(extendReferenceInDirection(parseReference("John 3:16-18"), 15, "backward"))).toBe("John.3.15-18");
  });
  it("roundtrips OSIS", () => {
    expect(osisId(parseOsis("John.3.16"))).toBe("John.3.16");
    expect(osisId(parseOsis("1Cor.13.4"))).toBe("1Cor.13.4");
    expect(parseOsis("1Cor.13.4-7").endVerse).toBe(7);
    expect(referenceId(parseOsis("1Cor.13.4-7"))).toBe("1Cor.13.4-7");
  });
  it.each(["John 0", "John 3:0", "John 3:19-17", "John 3:16-201", "notabook 3:16"])("rejects %s", input => {
    expect(() => parseReference(input)).toThrow();
  });
});
