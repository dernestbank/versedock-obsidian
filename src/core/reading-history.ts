import { parseOsis, referenceId, type PassageReference } from "./references";

export const MAX_READING_HISTORY = 50;
const MAX_PERSISTED_HISTORY_SCAN = 500;
const MAX_PERSISTED_REFERENCE_LENGTH = 64;

/**
 * Migrates persisted history into a bounded, canonical, most-recent-first list.
 * Invalid legacy/user-edited data is ignored without affecting other settings.
 */
export function normalizeReadingHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const normalized: string[] = [];
  const seen = new Set<string>();
  const scanLimit = Math.min(value.length, MAX_PERSISTED_HISTORY_SCAN);
  for (let index = 0; index < scanLimit && normalized.length < MAX_READING_HISTORY; index++) {
    const item = value[index];
    if (typeof item !== "string" || item.length > MAX_PERSISTED_REFERENCE_LENGTH) continue;
    try {
      const canonical = referenceId(parseOsis(item));
      if (!seen.has(canonical)) {
        seen.add(canonical);
        normalized.push(canonical);
      }
    } catch {
      // Ignore stale or user-edited values while preserving valid history entries.
    }
  }
  return normalized;
}

export function recordReadingHistory(
  previous: readonly string[],
  reference: PassageReference
): string[] {
  return normalizeReadingHistory([referenceId(reference), ...previous]);
}
