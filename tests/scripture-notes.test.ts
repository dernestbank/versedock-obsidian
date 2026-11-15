import { describe, expect, it } from "vitest";
import { parseReference } from "../src/core/references";
import {
  MAX_SCRIPTURE_NOTE_REFERENCES,
  MAX_SCRIPTURE_NOTE_RESULTS,
  MAX_SCRIPTURE_NOTE_SCAN,
  discoverScriptureNotes,
  legacyStudyNotePath,
  newStudyNoteMarkdown,
  parseScriptureNoteReference,
  scriptureNoteReferenceId,
  studyNotePath,
  type IndexedScriptureNote
} from "../src/core/scripture-notes";

function note(
  path: string,
  scripture: unknown,
  modified: number
): IndexedScriptureNote {
  return {path, basename: path.replace(/\.md$/u, ""), scripture, modified};
}

describe("Scripture-linked note discovery", () => {
  it("finds exact scalar and array references in recent-first order without mutating input", () => {
    const entries = [
      note("Older.md", "John.3.16", 10),
      note("Newest.md", ["Ps.23", "John.3.16"], 30),
      note("Other.md", "John.3.15", 40),
      note("Middle.md", "John.3.16", 20)
    ];
    const original = structuredClone(entries);

    const result = discoverScriptureNotes(entries, parseReference("John 3:16"));

    expect(result.notes.map(item => item.path)).toEqual(["Newest.md", "Middle.md", "Older.md"]);
    expect(result).toMatchObject({examined: 4, scanTruncated: false, resultsTruncated: false});
    expect(entries).toEqual(original);
  });

  it("keeps the primary note first and includes an indexed backlink without Scripture frontmatter", () => {
    const entries: IndexedScriptureNote[] = [
      {...note("Primary.md", undefined, 1), primary: true},
      {...note("Backlink.md", undefined, 30), linkedToPrimary: true},
      note("Frontmatter.md", "John.3.16", 20),
      note("Unrelated.md", undefined, 40)
    ];

    expect(discoverScriptureNotes(entries, parseReference("John 3:16")).notes.map(item => item.path))
      .toEqual(["Primary.md", "Backlink.md", "Frontmatter.md"]);
  });

  it("fails closed for oversized, invalid, and non-string frontmatter values", () => {
    const tooMany = Array.from({length: MAX_SCRIPTURE_NOTE_REFERENCES + 1}, () => "John.3.16");
    const entries = [
      note("Too-many.md", tooMany, 5),
      note("Too-long.md", "x".repeat(65), 4),
      note("Invalid.md", "../../John.3.16", 3),
      note("Object.md", {scripture: "John.3.16"}, 2),
      note("Valid.md", "John.3.16", 1)
    ];

    expect(discoverScriptureNotes(entries, parseReference("John 3:16")).notes.map(item => item.path))
      .toEqual(["Valid.md"]);
  });

  it("bounds indexed-file examination and reports when the scan is incomplete", () => {
    const entries = Array.from({length: MAX_SCRIPTURE_NOTE_SCAN + 1}, (_, index) =>
      note(`Note-${index}.md`, index === MAX_SCRIPTURE_NOTE_SCAN ? "John.3.16" : "Ps.23", index));

    const result = discoverScriptureNotes(entries, parseReference("John 3:16"));

    expect(result.notes).toEqual([]);
    expect(result.examined).toBe(MAX_SCRIPTURE_NOTE_SCAN);
    expect(result.scanTruncated).toBe(true);
  });

  it("bounds displayed matches and reports additional linked notes", () => {
    const entries = Array.from({length: MAX_SCRIPTURE_NOTE_RESULTS + 1}, (_, index) =>
      note(`Note-${index}.md`, "John.3.16", index));

    const result = discoverScriptureNotes(entries, parseReference("John 3:16"));

    expect(result.notes).toHaveLength(MAX_SCRIPTURE_NOTE_RESULTS);
    expect(result.notes[0].path).toBe(`Note-${MAX_SCRIPTURE_NOTE_RESULTS}.md`);
    expect(result.resultsTruncated).toBe(true);
  });

  it("builds the backward-compatible primary note path without unsafe filename characters", () => {
    expect(studyNotePath(parseReference("John 3:16"))).toBe("Bible Study/John/John 3-16.md");
    expect(studyNotePath(parseReference("1 John 2"))).toBe("Bible Study/1 John/1 John 2.md");
  });

  it("preserves a complete canonical range in note metadata and a non-colliding path", () => {
    const range = parseReference("1 Corinthians 13:4-7");

    expect(scriptureNoteReferenceId(range)).toBe("1Cor.13.4-7");
    expect(parseScriptureNoteReference("1Cor.13.4-7")).toEqual(range);
    expect(studyNotePath(range)).toBe("Bible Study/1 Corinthians/1 Corinthians 13-4-7.md");
    expect(legacyStudyNotePath(range)).toBe("Bible Study/1 Corinthians/1 Corinthians 13-4.md");
  });

  it("matches full ranges exactly and rejects malformed or descending range metadata", () => {
    const entries = [
      note("Full.md", "John.3.16-18", 3),
      note("Start-only.md", "John.3.16", 2),
      note("Descending.md", "John.3.18-16", 1)
    ];

    expect(discoverScriptureNotes(entries, parseReference("John 3:16-18")).notes.map(item => item.path))
      .toEqual(["Full.md"]);
    expect(() => parseScriptureNoteReference("John.3-4")).toThrow();
    expect(() => parseScriptureNoteReference("John.3.18-16")).toThrow();
  });

  it("writes the complete range into newly generated study-note frontmatter and heading", () => {
    const markdown = newStudyNoteMarkdown(parseReference("John 3:16-18"));

    expect(markdown).toContain('scripture: "John.3.16-18"');
    expect(markdown).toContain("# John 3:16-18");
    expect(newStudyNoteMarkdown(parseReference("John 3:16"))).toContain('scripture: "John.3.16"');
  });
});
