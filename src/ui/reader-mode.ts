export type ReaderMode = "classic" | "compact" | "focus";

export function readerVerseDirection(key: string): 1 | -1 | null {
  if (key.toLowerCase() === "j") return 1;
  if (key.toLowerCase() === "k") return -1;
  return null;
}

export interface ReaderModeState {
  mode: ReaderMode;
  focusReturnMode?: "classic" | "compact";
}

/** Keep the pre-Focus layout in vault settings so exit also works after reload. */
export function transitionReaderMode(current: ReaderModeState, requested: ReaderMode | "toggle-focus"): Required<ReaderModeState> {
  const returnMode = current.focusReturnMode === "compact" ? "compact" : "classic";
  const mode = requested === "toggle-focus" ? (current.mode === "focus" ? returnMode : "focus") : requested;
  if (mode !== "focus") return { mode, focusReturnMode: mode };
  return { mode, focusReturnMode: current.mode === "focus" ? returnMode : current.mode === "compact" ? "compact" : "classic" };
}

export function isFocusEscape(event: Pick<KeyboardEvent, "key">): boolean {
  return event.key === "Escape" || event.key === "Esc";
}
