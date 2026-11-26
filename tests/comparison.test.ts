import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { comparisonNumberingNotice, restoredComparisonState } from "../src/core/comparison";
import { parseReference, referenceId } from "../src/core/references";

describe("parallel source selection and numbering", () => {
  const fallback = parseReference("John 3:16");
  it("starts with the Reader edition and another installed source", () => {
    expect(restoredComparisonState(null, "kjv", fallback)).toMatchObject({ leftEdition: "kjv", rightEdition: "webp" });
    expect(restoredComparisonState({}, "webp", fallback)).toMatchObject({ leftEdition: "webp", rightEdition: "kjv" });
  });
  it("restores explicit source choices and the independent reference", () => {
    const state = restoredComparisonState({ leftEdition: "webp", rightEdition: "webp", reference: "Rom.14.24-26" }, "kjv", fallback);
    expect(state).toMatchObject({ leftEdition: "webp", rightEdition: "webp" });
    expect(referenceId(state.reference)).toBe("Rom.14.24-26");
  });
  it("rejects unknown resources and malformed saved references", () => {
    const state = restoredComparisonState({ leftEdition: "../../private", rightEdition: 42, reference: "bad" }, "kjv", fallback);
    expect(state).toMatchObject({ leftEdition: "kjv", rightEdition: "webp", reference: fallback });
  });
  it("restores only installed additional Bible editions and uses the Reader source by default", () => {
    const ids = ["webp", "kjv", "mysword-kjv"];
    expect(restoredComparisonState(null, "mysword-kjv", fallback, ids)).toMatchObject({leftEdition:"mysword-kjv",rightEdition:"kjv"});
    expect(restoredComparisonState({leftEdition:"mysword-kjv",rightEdition:"removed"}, "webp", fallback, ids))
      .toMatchObject({leftEdition:"mysword-kjv",rightEdition:"kjv"});
    expect(restoredComparisonState(null, "removed", fallback, ids)).toMatchObject({leftEdition:"webp"});
  });
  it("does not claim a mismatch when source verse numbers agree", () => {
    expect(comparisonNumberingNotice("WEB", [1, 2, 2, 3], "KJV", [3, 2, 1])).toBeNull();
  });
  it("reports omissions on either side without guessing verse mappings", () => {
    const notice = comparisonNumberingNotice("WEB", [1, 3, 5], "KJV", [1, 2, 3]);
    expect(notice).toContain("WEB only: 5");
    expect(notice).toContain("KJV only: 2");
    expect(notice).toContain("No verse remapping is applied.");
  });
  it("warns for the actual Romans 14 source difference", () => {
    const numbers = (edition: string): number[] => {
      const book = JSON.parse(readFileSync(`library/${edition}/ROM.json`, "utf8"));
      return book.chapters.find((chapter: { chapter: number }) => chapter.chapter === 14).verses.map((verse: { verse: number }) => verse.verse);
    };
    expect(comparisonNumberingNotice("WEB", numbers("webp"), "KJV", numbers("kjv")))
      .toBe("Source verse numbers differ. WEB only: 24, 25, 26. No verse remapping is applied.");
  });
});
