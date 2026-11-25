import {describe, expect, it} from 'vitest';
import {assertCompleteRichCoverage} from '../scripts/rich-verification.mjs';

const coverage = overrides => ({
  entries: 2, sourceFieldsExact: 2, textExact: 2, fallbacks: [], ...overrides
});

describe('pinned rich-source verification coverage', () => {
  it('accepts complete projections for every rich resource kind and raw Bible coverage', () => {
    for (const kind of ['book','devotional','graphics','commentary','dictionary'])
      expect(() => assertCompleteRichCoverage(kind, coverage())).not.toThrow();
    expect(() => assertCompleteRichCoverage('bible', coverage({textExact: 0}))).not.toThrow();
  });

  it('rejects a parser fallback even when original source records are retained', () => {
    expect(() => assertCompleteRichCoverage('book', coverage({
      textExact: 1, fallbacks: ['Chapter one']
    }))).toThrow(/book.*parser fallback/i);
  });

  it('rejects a missing text comparison even without a recorded fallback', () => {
    expect(() => assertCompleteRichCoverage('dictionary', coverage({
      textExact: 1
    }))).toThrow(/dictionary.*text projection/i);
  });

  it('rejects incomplete retained-source coverage for Bible records', () => {
    expect(() => assertCompleteRichCoverage('bible', coverage({
      sourceFieldsExact: 1, textExact: 0
    }))).toThrow(/bible.*source record/i);
  });

  it('rejects incomplete retained-source coverage for rich records', () => {
    expect(() => assertCompleteRichCoverage('commentary', coverage({
      sourceFieldsExact: 1
    }))).toThrow(/commentary.*source record/i);
  });
});
