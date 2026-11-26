export type LibrarySection = "get-started" | "installed" | "discover" | "downloads" | "import";

export const LIBRARY_SECTIONS: readonly LibrarySection[] = [
  "get-started",
  "discover",
  "installed",
  "downloads",
  "import"
];

/** Obsidian's focus manager visits every native button even with tabindex=-1. */
export function librarySectionElementTag(selected: boolean): "button" | "div" {
  return selected ? "button" : "div";
}

/** Returns the destination for the WAI-ARIA library tab-list navigation keys. */
export function librarySectionForKey(current: LibrarySection, key: string): LibrarySection | null {
  const currentIndex = LIBRARY_SECTIONS.indexOf(current);
  if (key === "Home") return LIBRARY_SECTIONS[0];
  if (key === "End") return LIBRARY_SECTIONS[LIBRARY_SECTIONS.length - 1];
  if (key === "ArrowRight") return LIBRARY_SECTIONS[(currentIndex + 1) % LIBRARY_SECTIONS.length];
  if (key === "ArrowLeft") return LIBRARY_SECTIONS[(currentIndex - 1 + LIBRARY_SECTIONS.length) % LIBRARY_SECTIONS.length];
  return null;
}
