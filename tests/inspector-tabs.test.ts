import {describe, expect, it} from "vitest";
import {
  INSPECTOR_TABS,
  inspectorTabDomIds,
  inspectorTabElementTag,
  inspectorTabForKey
} from "../src/ui/inspector-tabs";

describe("Inspector tab keyboard navigation", () => {
  it("moves through tabs and wraps at both ends", () => {
    expect(inspectorTabForKey("commentary", "ArrowRight")).toBe("lexicon");
    expect(inspectorTabForKey("history", "ArrowRight")).toBe("commentary");
    expect(inspectorTabForKey("commentary", "ArrowLeft")).toBe("history");
    expect(inspectorTabForKey("notes", "ArrowLeft")).toBe("references");
  });

  it("moves directly to the first or last tab", () => {
    expect(inspectorTabForKey("notes", "Home")).toBe(INSPECTOR_TABS[0]);
    expect(inspectorTabForKey("notes", "End")).toBe(INSPECTOR_TABS.at(-1));
  });

  it("leaves unrelated keys to the tab button and host application", () => {
    expect(inspectorTabForKey("bookmarks", "Tab")).toBeNull();
    expect(inspectorTabForKey("bookmarks", "Enter")).toBeNull();
  });

  it("creates instance-scoped ARIA IDs for duplicate Inspector views", () => {
    expect(inspectorTabDomIds("inspector-1", "history")).toEqual({
      panelId: "inspector-1-panel",
      tabId: "inspector-1-tab-history"
    });
    expect(inspectorTabDomIds("inspector-2", "history"))
      .not.toEqual(inspectorTabDomIds("inspector-1", "history"));
  });

  it("keeps only the selected tab as a native Obsidian focus target", () => {
    expect(inspectorTabElementTag(true)).toBe("button");
    expect(inspectorTabElementTag(false)).toBe("div");
  });
});
