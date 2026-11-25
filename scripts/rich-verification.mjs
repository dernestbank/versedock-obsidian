import assert from 'node:assert/strict';

/** Pinned corpora must cover every source record and every supported rich projection. */
export function assertCompleteRichCoverage(kind, stats) {
  assert.equal(stats.sourceFieldsExact, stats.entries, kind + ': incomplete source record coverage');
  // Bible source records use their separate GBF reader; this oracle compares rich HTML resources.
  if (kind === 'bible') return;
  assert.equal(stats.fallbacks.length, 0, kind + ': parser fallback skipped a text projection');
  assert.equal(stats.textExact, stats.entries, kind + ': incomplete text projection coverage');
}
