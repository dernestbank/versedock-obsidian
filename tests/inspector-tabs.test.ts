import {describe, expect, it} from "vitest";
import {
  INSPECTOR_TABS,
  restoredInspectorTab,
  restoredInspectorPin,
  restoredCollapsedSections,
  inspectorTabDomIds,
  inspectorTabElementTag,
  inspectorTabForKey
} from "../src/ui/inspector-tabs";

describe("Inspector tab keyboard navigation", () => {
  it("restores a pinned range and rejects invalid pin state", () => {
    const pin = restoredInspectorPin({ pinnedReference: "John.3.14-16" });
    expect(pin?.book.osis).toBe("John");
    expect(pin?.verse).toBe(14);
    expect(pin?.endVerse).toBe(16);
    for (const state of [null, {}, { pinnedReference: 16 }, { pinnedReference: "John.3.0" }, { pinnedReference: "John.3.16-14" }])
      expect(restoredInspectorPin(state)).toBeNull();
  });
  it("exposes each Inspector destination once in the shared tab order", () => {
    expect(new Set(INSPECTOR_TABS).size).toBe(INSPECTOR_TABS.length);
    for (const tab of ["study", "parallel", "notes", "bookmarks", "highlights", "history"]) {
      expect(INSPECTOR_TABS).toContain(tab);
    }
  });
  it("restores only supported collapsed Study cards", () => {
    expect([...restoredCollapsedSections({ collapsedSections: ["My Notes", "Commentary", "Commentary", "bad", null] })])
      .toEqual(["Commentary", "My Notes"]);
    for (const state of [null, {}, { collapsedSections: "Commentary" }, { collapsedSections: [false, 1] }])
      expect(restoredCollapsedSections(state).size).toBe(0);
  });
  it("restores valid workspace tabs and defaults malformed state to Study", () => {
    for (const tab of INSPECTOR_TABS) expect(restoredInspectorTab({ tab })).toBe(tab);
    for (const state of [null, undefined, {}, "notes", { tab: "unknown" }, { tab: [] }])
      expect(restoredInspectorTab(state)).toBe("study");
  });
  it("includes a resource provenance surface alongside study tabs", () => {
    expect(INSPECTOR_TABS).toContain("resource-info");
    expect(inspectorTabForKey("notes", "ArrowRight")).toBe("resource-info");
  });

  it("moves through tabs and wraps at both ends", () => {
    expect(inspectorTabForKey("commentary", "ArrowRight")).toBe("lexicon");
    expect(inspectorTabForKey("history", "ArrowRight")).toBe("study");
    expect(inspectorTabForKey("study", "ArrowLeft")).toBe("history");
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
