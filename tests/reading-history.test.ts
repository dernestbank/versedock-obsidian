import {describe, expect, it} from "vitest";
import {parseReference} from "../src/core/references";
import {
  MAX_READING_HISTORY,
  normalizeReadingHistory,
  recordReadingHistory
} from "../src/core/reading-history";

describe("reading history", () => {
  it("normalizes persisted OSIS entries, removes duplicates, and skips invalid values", () => {
    expect(normalizeReadingHistory([
      "John.03.016",
      "Ps.23",
      "John.3.16",
      "not-a-reference",
      42,
      "Gen.1"
    ])).toEqual(["John.3.16", "Ps.23", "Gen.1"]);
    expect(normalizeReadingHistory(null)).toEqual([]);
  });

  it("moves the selected reference to the front without mutating prior history", () => {
    const previous = ["Ps.23", "John.3.16", "Gen.1"];

    const next = recordReadingHistory(previous, parseReference("John 3:16"));

    expect(next).toEqual(["John.3.16", "Ps.23", "Gen.1"]);
    expect(previous).toEqual(["Ps.23", "John.3.16", "Gen.1"]);
  });

  it("keeps only the fifty most recent canonical references", () => {
    const previous = Array.from({length: MAX_READING_HISTORY}, (_, index) =>
      `John.3.${index + 1}`);

    const next = recordReadingHistory(previous, parseReference("Romans 8:28"));

    expect(next).toHaveLength(MAX_READING_HISTORY);
    expect(next[0]).toBe("Rom.8.28");
    expect(next.at(-1)).toBe("John.3.49");
  });

  it("bounds migration work for oversized or hostile persisted arrays", () => {
    const oversized = [
      ...Array.from({length: 500}, () => "x".repeat(500)),
      "John.3.16"
    ];

    expect(normalizeReadingHistory(oversized)).toEqual([]);
  });
});
