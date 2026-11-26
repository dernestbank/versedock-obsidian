/** KJV Strong’s word tagging is not a full original-language interlinear alignment. */
export const KJV_DISPLAY_MODES = ["reading", "word-study", "interlinear"] as const;
export type KjvDisplayMode = typeof KJV_DISPLAY_MODES[number];

export function restoredKjvDisplayMode(value: unknown): KjvDisplayMode {
  return value === "reading" || value === "interlinear" ? value : "word-study";
}

export function showKjvTaggedControls(edition: string, mode: KjvDisplayMode): boolean {
  return edition === "kjv" && mode === "word-study";
}

export function showKjvInlineStrongs(edition: string, mode: KjvDisplayMode, enabled: boolean): boolean {
  return enabled && showKjvTaggedControls(edition, mode);
}
