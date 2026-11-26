import type { WordToken } from "./library";
import { referenceId, type PassageReference } from "./references";

export interface WordSelection { ref: PassageReference; token: WordToken; index: number }
/** Only the installed tagged source may supply lexical selection metadata. */
export function taggedWordSelection(edition: "webp" | "kjv", ref: PassageReference, token: WordToken, index: number): WordSelection | null {
  if (edition !== "kjv" || !token.strongs?.length || !Number.isSafeInteger(index) || index < 0) return null;
  return { ref: { ...ref }, token, index };
}
export type WordDetailsTab = "overview" | "lexicon" | "occurrences";
export interface WordDetailsState { word: WordSelection | null; pinned: boolean; expanded: boolean; tab: WordDetailsTab }
type WordDetailsEvent = { type: "preview"; word: WordSelection } | { type: "pin"; word: WordSelection }
  | { type: "clear" } | { type: "toggle" } | { type: "tab"; tab: WordDetailsTab };
export function initialWordDetailsState(): WordDetailsState { return { word: null, pinned: false, expanded: false, tab: "overview" }; }
export function wordSelectionKey(word: WordSelection): string { return referenceId(word.ref) + ":" + word.index; }
export function transitionWordDetails(state: WordDetailsState, event: WordDetailsEvent): WordDetailsState {
  if (event.type === "clear") return initialWordDetailsState();
  if (event.type === "toggle") return { ...state, expanded: !state.expanded };
  if (event.type === "tab") return { ...state, tab: event.tab, expanded: true };
  if (event.type === "preview" && state.pinned) return state;
  if (state.word && wordSelectionKey(state.word) === wordSelectionKey(event.word) && state.pinned === (event.type === "pin")) return state;
  return { word: event.word, pinned: event.type === "pin", expanded: true, tab: "overview" };
}
export function synchronizeWordPin(state: WordDetailsState, pin: WordSelection | null): WordDetailsState {
  if (pin) return transitionWordDetails(state, { type: "pin", word: pin });
  return state.pinned ? initialWordDetailsState() : state;
}
