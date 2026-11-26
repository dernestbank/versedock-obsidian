import { parseOsis, type PassageReference } from "./references";

export type ComparisonEdition = string;
export const comparisonEditionLabel = (edition: ComparisonEdition): string => edition === "kjv" ? "KJV" : edition === "webp" ? "WEB" : edition;
export function isComparisonEdition(value: unknown, installed: readonly string[] = ["webp", "kjv"]): value is ComparisonEdition {
  return typeof value === "string" && installed.includes(value);
}

/** Restore only known installed-source identifiers and canonical reference data. */
export function restoredComparisonState(value: unknown, preferred: ComparisonEdition, fallback: PassageReference,
  installed: readonly string[] = ["webp", "kjv"]): {
  leftEdition: ComparisonEdition; rightEdition: ComparisonEdition; reference: PassageReference;
} {
  const state = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const defaultEdition = isComparisonEdition(preferred, installed) ? preferred : "webp";
  const leftEdition = isComparisonEdition(state.leftEdition, installed) ? state.leftEdition : defaultEdition;
  const rightEdition = isComparisonEdition(state.rightEdition, installed) ? state.rightEdition : leftEdition === "kjv" ? "webp" : "kjv";
  let reference = fallback;
  if (typeof state.reference === "string") {
    try { reference = parseOsis(state.reference); } catch { /* Keep the current Reader reference. */ }
  }
  return { leftEdition, rightEdition, reference };
}

/** Numerical differences are evidence of a mismatch, never a semantic alignment map. */
export function comparisonNumberingNotice(leftLabel: string, left: readonly number[], rightLabel: string, right: readonly number[]): string | null {
  const leftSet = new Set(left), rightSet = new Set(right);
  const leftOnly = [...leftSet].filter(verse => !rightSet.has(verse)).sort((a, b) => a - b);
  const rightOnly = [...rightSet].filter(verse => !leftSet.has(verse)).sort((a, b) => a - b);
  if (!leftOnly.length && !rightOnly.length) return null;
  const details = [leftOnly.length ? leftLabel + " only: " + leftOnly.join(", ") + "." : "",
    rightOnly.length ? rightLabel + " only: " + rightOnly.join(", ") + "." : ""].filter(Boolean);
  return "Source verse numbers differ. " + details.join(" ") + " No verse remapping is applied.";
}
