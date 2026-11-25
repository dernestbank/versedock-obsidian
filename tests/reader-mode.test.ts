import { describe, expect, it } from "vitest";
import { isFocusEscape, readerVerseDirection, transitionReaderMode } from "../src/ui/reader-mode";

describe("reader focus mode", () => {
  it("accepts shifted uppercase J/K for range-extension navigation", () => {
    expect(readerVerseDirection("J")).toBe(1);
    expect(readerVerseDirection("K")).toBe(-1);
    expect(readerVerseDirection("j")).toBe(1);
    expect(readerVerseDirection("k")).toBe(-1);
    expect(readerVerseDirection("ArrowDown")).toBeNull();
  });
  it("returns to compact study after a Focus round trip", () => {
    const focused = transitionReaderMode({ mode: "compact" }, "toggle-focus");
    expect(focused.mode).toBe("focus");
    expect(transitionReaderMode(focused, "toggle-focus").mode).toBe("compact");
  });
  it("restores a persisted Focus return layout after restarting", () => {
    expect(transitionReaderMode({ mode: "focus", focusReturnMode: "compact" }, "toggle-focus").mode).toBe("compact");
    expect(transitionReaderMode({ mode: "focus" }, "toggle-focus").mode).toBe("classic");
  });
  it("remembers explicit layout choices made through Appearance or Settings", () => {
    const compact = transitionReaderMode({ mode: "focus", focusReturnMode: "classic" }, "compact");
    expect(transitionReaderMode(transitionReaderMode(compact, "focus"), "toggle-focus").mode).toBe("compact");
    const classic = transitionReaderMode(compact, "classic");
    expect(transitionReaderMode(transitionReaderMode(classic, "focus"), "toggle-focus").mode).toBe("classic");
  });

  it("recognizes Escape as the explicit focus exit key", () => {
    expect(isFocusEscape({ key: "Escape" })).toBe(true);
    expect(isFocusEscape({ key: "Esc" })).toBe(true);
    expect(isFocusEscape({ key: "Enter" })).toBe(false);
  });
});
