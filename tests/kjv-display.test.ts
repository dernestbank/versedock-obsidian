import { describe, expect, it } from "vitest";
import { KJV_DISPLAY_MODES, restoredKjvDisplayMode, showKjvTaggedControls } from "../src/core/kjv-display";

describe("KJV display mode", () => {
  it("restores reading, word study and the attributed interlinear companion separately", () => {
    expect(KJV_DISPLAY_MODES).toEqual(["reading", "word-study", "interlinear"]);
    expect(restoredKjvDisplayMode("reading")).toBe("reading");
    expect(restoredKjvDisplayMode("word-study")).toBe("word-study");
    expect(restoredKjvDisplayMode("interlinear")).toBe("interlinear");
    expect(showKjvTaggedControls("kjv", "interlinear")).toBe(false);
    for (const bad of [null, 10, "foobar", {}])
      expect(restoredKjvDisplayMode(bad)).toBe("word-study");
  });
  it("only gives tagged words interactive controls in the KJV word study mode", () => {
    expect(showKjvTaggedControls("kjv", "word-study")).toBe(true);
    expect(showKjvTaggedControls("kjv", "reading")).toBe(false);
    expect(showKjvTaggedControls("webp", "word-study")).toBe(false);
    expect(showKjvTaggedControls("webp", "reading")).toBe(false);
  });
});

it("shows optional identifiers only in tagged KJV word-study mode", async () => {
  const { showKjvInlineStrongs } = await import("../src/core/kjv-display");
  expect(showKjvInlineStrongs("kjv", "word-study", true)).toBe(true);
  expect(showKjvInlineStrongs("kjv", "word-study", false)).toBe(false);
  expect(showKjvInlineStrongs("kjv", "reading", true)).toBe(false);
  expect(showKjvInlineStrongs("webp", "word-study", true)).toBe(false);
});
