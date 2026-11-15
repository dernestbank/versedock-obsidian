export const INSPECTOR_TABS = [
  "commentary",
  "lexicon",
  "references",
  "notes",
  "bookmarks",
  "history"
] as const;

export type InspectorTab = typeof INSPECTOR_TABS[number];

/** Obsidian's focus manager visits every native button even with tabindex=-1. */
export function inspectorTabElementTag(selected: boolean): "button" | "div" {
  return selected ? "button" : "div";
}

export function inspectorTabDomIds(scope: string, tab: InspectorTab): {
  panelId: string;
  tabId: string;
} {
  return {
    panelId: `${scope}-panel`,
    tabId: `${scope}-tab-${tab}`
  };
}

/** Returns the destination for the WAI-ARIA tab-list navigation keys. */
export function inspectorTabForKey(current: InspectorTab, key: string): InspectorTab | null {
  const currentIndex = INSPECTOR_TABS.indexOf(current);
  if (key === "Home") return INSPECTOR_TABS[0];
  if (key === "End") return INSPECTOR_TABS[INSPECTOR_TABS.length - 1];
  if (key === "ArrowRight") return INSPECTOR_TABS[(currentIndex + 1) % INSPECTOR_TABS.length];
  if (key === "ArrowLeft")
    return INSPECTOR_TABS[(currentIndex - 1 + INSPECTOR_TABS.length) % INSPECTOR_TABS.length];
  return null;
}
