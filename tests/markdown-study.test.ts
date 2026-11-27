import { describe, expect, it } from "vitest";
import { findNoteReferences, restoredStudyPreviews } from "../src/core/note-references";
import { citationMarkdown, parseCitationAddress } from "../src/core/study-citation";
import { parseReference, referenceId } from "../src/core/references";

describe("plain verse references", () => {
  it("retains offsets and same-chapter ranges for note and insert syntax", () => {
    const text = "Read John 3:16, Jn 3:16–18 and (1 Cor. 13:4–7).";
    const matches = findNoteReferences(text);
    expect(matches.map(m => text.slice(m.from, m.to))).toEqual(["John 3:16", "Jn 3:16–18", "1 Cor. 13:4–7"]);
    expect(matches.map(m => referenceId(m.ref))).toEqual(["John.3.16", "John.3.16-18", "1Cor.13.4-7"]);
    expect(referenceId(parseReference("1 Corinthians 13:4–7"))).toBe("1Cor.13.4-7");
  });
  it("does not match inside words, partial coordinates, times or descending ranges", () => {
    for (const text of ["PreJohn 3:16", "meet at 3:16", "John 3:16pm", "Jn 3:16–12", "John 3:16–4:2", "Jn 0:1", "13:10", "is 3:16pm"])
      expect(findNoteReferences(text), text).toEqual([]);
  });
});

it("defaults absent or malformed preview switches and preserves independent opt-outs", () => {
  expect(restoredStudyPreviews(null)).toEqual({readingPreviews:true, livePreviews:true});
  expect(restoredStudyPreviews({readingPreviews:false, livePreviews:"off"})).toEqual({readingPreviews:false, livePreviews:true});
  expect(restoredStudyPreviews({readingPreviews:true, livePreviews:false}).livePreviews).toBe(false);
});

it("round-trips exact vault and source keys while keeping a safe, readable Markdown label", () => {
  const address = {module:"local-dictionary-123", entry:"[αγάπη] (a+b) #1&2", source:"a".repeat(64)};
  const markdown = citationMarkdown("Research & notes", "My [dictionary] · Αγάπη", address);
  expect(markdown).toMatch(/^\[My \\\[dictionary\\\] · Αγάπη\]\(obsidian:\/\/sworddock-cite\?/);
  const url = new URL(markdown.slice(markdown.indexOf("](") + 2, -1));
  expect(url.searchParams.get("vault")).toBe("Research & notes");
  expect(parseCitationAddress(Object.fromEntries(url.searchParams))).toEqual(address);
  for (const invalid of [{module:"../other",entry:"1"}, {module:"mhc",entry:""}, {...address,source:"wrong"}])
    expect(parseCitationAddress(invalid)).toBeNull();
});
