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

## Task 3: Define a text-first GBF semantic event model

**Description:** Convert the lossless GBF token stream into inert, typed events for plain text, supported typography, structural layout and validated cross-references. Preserve source spans for every event and represent HTML, malformed, unknown and not-yet-implemented semantics as opaque data.

**Acceptance criteria:**
- [x] `FI`, `FO`, `FR` and `FU` pairs produce typed format-open/format-close events without changing their source spans.
- [x] `CM`, `CI`, `PI0`–`PI7` and `PF0`–`PF7` produce inert structural events; validated RX metadata is retained.
- [x] HTML, malformed, unknown and lexical/interlinear tokens remain opaque and force `fullyInterpreted: false`; translator-note/title handling is deferred to Task 4.
- [x] Concatenating event `raw` values exactly reconstructs the source, including Unicode and hostile HTML-like strings.
- [x] Semantic interpretation rejects Scripture strings exceeding the existing 32,768-character boundary.

**Verification:**
- [x] Focused test fails before implementation and passes afterward.
- [x] Full `npm run check` succeeds.
- [x] Publisher WEB fixture remains source-lossless and conversion remains blocked.

**Dependencies:** Tasks 1–2.

**Files likely touched:**
- `src/core/mysword-gbf-semantics.ts`
- `tests/mysword-gbf-semantics.test.ts`
- `docs/GBF-compatibility.md`

**Estimated scope:** Medium.

## Task 4: Extract inert translator notes and titles

**Description:** Recognize balanced `RF/Rf` translator notes and `TS/Ts` titles as semantic regions with exact source/content spans. Preserve inner markup literally, expose optional note labels/title levels as data, and refuse complete interpretation when pairing or nesting is unsafe.

**Acceptance criteria:**
- [x] Balanced translator notes and titles produce typed open/close events and exact extracted regions.
- [x] Optional `RF q=...` labels and `TS1`–`TS9` levels are retained as inert metadata.
- [x] Inner HTML remains opaque and present in `contentRaw`; no markup executes or disappears.
- [x] Unmatched/mismatched annotation markers produce no false extracted region and force `fullyInterpreted: false`.
- [x] Pair nesting beyond 32 levels remains lossless but is refused as a complete interpretation.

**Verification:**
- [x] Focused test fails before implementation and passes afterward.
- [x] Full `npm run check` succeeds.
- [x] Mutation review proves the nesting boundary is covered.

**Dependencies:** Task 3.

**Files likely touched:**
- `src/core/mysword-gbf-semantics.ts`
- `tests/mysword-gbf-semantics.test.ts`

**Estimated scope:** Medium.

## Task 5: Render fully interpreted GBF through safe DOM APIs

**Description:** Add an atomic renderer for fully interpreted semantic documents. Module text must enter the DOM only through text nodes; tag names and classes must be hardcoded. Refuse HTML, unknown, malformed and unimplemented semantic events before mutating the target.

**Acceptance criteria:**
- [x] Supported text, format, title, note and structural events render through `createTextNode` and fixed DOM elements/classes.
- [x] HTML or any other opaque event is rejected before the target is cleared or changed.
- [x] Renderer never reads or writes `innerHTML`, never creates an element from module data, and never follows RX references.
- [x] Rendering is built in a detached fragment and committed atomically.

**Verification:**
- [x] Focused renderer test fails before implementation and passes afterward.
- [x] Full `npm run check` succeeds.
- [x] Source review and mutation test cover the rejection boundary.

**Dependencies:** Tasks 3–4.

**Files likely touched:**
- `src/ui/mysword-gbf-renderer.ts`
- `tests/mysword-gbf-renderer.test.ts`

**Estimated scope:** Medium.

## Checkpoint: Inspector keyboard accessibility

**Description:** Verify the read-only preflight through the same keyboard and accessibility surfaces used by an Obsidian user, without changing conversion or installation scope.

**Acceptance criteria:**
- [x] Tab order reaches the module chooser and text-conversion preflight controls.
- [x] Return activates the asynchronous preflight and focus returns to its button after completion without stealing focus moved elsewhere.
- [x] Hostile HTML remains literal and blocked diagnostics are present in the accessibility tree.
- [ ] Actual VoiceOver announcement/navigation is verified after explicit approval to change the macOS assistive setting.

**Verification:**
- [x] Focused RED/GREEN tests cover keyboard activation, deferred restoration, disconnected targets, and focus moved elsewhere.
- [x] Obsidian 1.15.0 live verification passes in the isolated `test-vault`.

**Dependencies:** Task 5.

**Estimated scope:** Small.

## Checkpoint: Full-corpus performance QA

**Description:** Make large-module preview and semantic-preflight latency reproducible without adding an importer or exposing Scripture.

**Acceptance criteria:**
- [x] Benchmark iterations are explicitly bounded from 3 through 25 and summarized with minimum, median, p95, maximum and mean.
- [x] Compilation, WASM initialization, file I/O, hashing and one warm-up pass are excluded and disclosed.
- [x] Every iteration verifies stable counts/references and the source SHA-256 before reporting success.
- [x] Output contains no Scripture text and the command performs no network access, file writes, conversion or installation.
- [x] Unreadable-file errors do not disclose the user-supplied absolute source path.
- [x] The ignored 5.4 MiB publisher WEB fixture completes 25 measured desktop runs with stable 31,103-verse results.
- [ ] Slow-device, mobile and UI long-task profiling passes on representative targets.

**Verification:**
- [x] Focused RED/GREEN tests cover odd/even statistics, non-mutation, invalid samples, defaults and iteration bounds.
- [x] Real-file benchmark reports preview, preflight, combined and coarse process-memory measurements.

**Dependencies:** Phase 2 semantic IR.

**Estimated scope:** Small.

## Task 6: Specify authorized, reversible module import

**Description:** Define the provenance, rights acknowledgement, storage, integrity, transaction, rollback, recovery and removal contract that must be accepted before any module writer is implemented.

**Acceptance criteria:**
- [x] Proposed spec defines explicit rights bases, acknowledgement language, provenance limits and legal/authenticity non-claims.
- [x] Proposed storage ADR separates user imports from replaceable plugin assets and compares alternatives.
- [x] Spec defines content-addressed IDs, staging/read-back/commit, separate activation, rollback, quarantine and guarded permanent deletion.
- [x] Manifest fields, hashes, resource bounds, unsupported types and initial eligibility gates are concrete.
- [x] Threat model, abuse cases, negative tests, commands and implementation boundaries are documented.
- [ ] User reviews and approves the proposed specification and ADR, or requests changes.

**Verification:**
- [x] Spec and ADR are internally consistent with the current `versedock` ID, inspector bounds and read-only safety contract.
- [ ] After approval, convert the accepted contract into Task 7 implementation slices; do not write importer code in the specification turn.

**Dependencies:** Phase 2 semantic IR; manual VoiceOver checkpoint remains separately open.

**Files touched:**
- `docs/specs/authorized-mysword-import.md`
- `docs/decisions/0001-imported-module-storage.md`
- `tasks/todo.md`

**Estimated scope:** Medium.

