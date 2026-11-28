import { parseOsis, type PassageReference } from "../core/references";

export const INSPECTOR_TABS = [
  "study",
  "parallel",
  "commentary",
  "lexicon",
  "references",
  "notes",
  "resource-info",
  "bookmarks",
  "highlights",
  "history"
] as const;

export type InspectorTab = typeof INSPECTOR_TABS[number];
export const INSPECTOR_TAB_CHANGED = "sworddock-inspector-tab-changed";
export const STUDY_SECTIONS = ["Commentary", "Cross-References", "My Notes"] as const;
export type StudySection = typeof STUDY_SECTIONS[number];

export function restoredInspectorPin(state: unknown): PassageReference | null {
  const value = state && typeof state === "object"
    ? (state as { pinnedReference?: unknown }).pinnedReference : undefined;
  if (typeof value !== "string" || value.length > 100) return null;
  try { return parseOsis(value); } catch { return null; }
}

export function restoredCollapsedSections(state: unknown): Set<StudySection> {
  const value = state && typeof state === "object"
    ? (state as { collapsedSections?: unknown }).collapsedSections : undefined;
  return new Set(STUDY_SECTIONS.filter(section => Array.isArray(value) && value.includes(section)));
}

export function restoredInspectorTab(state: unknown): InspectorTab {
  const tab = state && typeof state === "object" ? (state as { tab?: unknown }).tab : undefined;
  return INSPECTOR_TABS.includes(tab as InspectorTab) ? tab as InspectorTab : "study";
}

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
