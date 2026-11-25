import type { InterlinearOrder } from "./interlinear";

export interface InterlinearPreferences {
  order: InterlinearOrder;
  transliteration: boolean;
  gloss: boolean;
  strongs: boolean;
  grammar: boolean;
  font: "system" | "serif";
  size: number;
}
export function restoredInterlinearPreferences(raw: unknown): InterlinearPreferences {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return { order: value.order === "english" ? "english" : "source",
    transliteration: typeof value.transliteration === "boolean" ? value.transliteration : true,
    gloss: typeof value.gloss === "boolean" ? value.gloss : true,
    strongs: typeof value.strongs === "boolean" ? value.strongs : true,
    grammar: typeof value.grammar === "boolean" ? value.grammar : false,
    font: value.font === "serif" ? "serif" : "system",
    size: typeof value.size === "number" && Number.isInteger(value.size) && value.size >= 18 && value.size <= 36 ? value.size : 24 };
}
