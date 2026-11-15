# SwordDock Bible continuation tasks

## Task 1: Parse validated MySword RX references

**Description:** Add a non-rendering parser for documented `b.c.v` and `b.c.v-tv` RX targets plus the observed `b.c.v—c:v` cross-chapter form. Attach parsed metadata to tokens while preserving the exact raw source and offsets.

**Acceptance criteria:**
- [x] Official single-verse and same-chapter ranges parse into bounded numeric endpoints.
- [x] The observed `<RX 12.6.31—7:20>` form parses as 2 Kings 6:31 through 7:20.
- [x] Invalid books, chapters, verses, descending ranges, and unsupported syntax remain lossless unresolved tokens.

**Verification:**
- [x] Focused test fails before implementation and passes afterward.
- [x] `npm run check` succeeds.

**Dependencies:** None.

**Files likely touched:**
- `src/core/canon.ts`
- `src/core/mysword-gbf.ts`
- `src/core/mysword-conversion-preflight.ts`
- `tests/mysword-gbf.test.ts`

**Estimated scope:** Medium.

## Task 2: Report RX semantic coverage

**Description:** Distinguish parsed and unresolved cross-reference markers in preflight and user-facing diagnostics without enabling navigation or import.

**Acceptance criteria:**
- [x] Preflight reports parsed and unresolved RX totals.
- [x] Inspection UI explains that parsed references are not proof of edition versification.
- [x] Existing markup and unsafe-rule blockers remain in force.

**Verification:**
- [x] Focused preflight tests pass.
- [x] Full `npm run check`, package, and smoke verification pass.

**Dependencies:** Task 1.

**Files likely touched:**
- `src/core/mysword-conversion-preflight.ts`
- `src/ui/mysword-inspect-modal.ts`
- `tests/mysword-conversion-preflight.test.ts`

**Estimated scope:** Small.

## Checkpoint: Cross-reference semantics

- [x] All automated tests pass.
- [x] Dependency audit has no unmitigated high/critical findings.
- [x] Reproducible package and clean-install smoke test pass.
- [x] Publisher WEB fixture scan remains exact and bounded.
- [x] Documentation and development status are current.

