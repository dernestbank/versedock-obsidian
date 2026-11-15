# Implementation Plan: Safe MySword semantic inspection

## Overview

Continue the existing SwordDock Bible developer preview from the verified GBF lexical scanner and RX parser. The current work is a sequence of small, read-only semantic inspection slices. No module writer, installer, HTML execution, CustomCSS execution, VerseRules execution, or licensing inference is in scope until the corresponding safety and provenance gates are satisfied.

## Observed baseline

- Local branch `branding/sworddock-bible` entered Phase 2 at verified checkpoint `01f35b8`.
- `npm run check` passes: 10 test files and 81 tests, strict TypeScript, and the production bundle.
- `npm audit --json` reports zero known vulnerabilities.
- GitHub `dernestbank/versedock-obsidian` is public; PR #1 tracks this pushed branch. Only prerelease/tag `0.1.0` is published.
- Phase 2 now provides an inert semantic IR and an isolated safe-DOM rendering primitive; neither enables module conversion or installation.

## Architecture decisions

- Keep lexing and semantic interpretation separate. Tokens retain exact source text and UTF-16 offsets; optional parsed metadata never replaces `raw`.
- Put the 66-book canonical chapter map in a dependency-neutral core module so both preflight validation and cross-reference parsing use one source of truth.
- Represent reference endpoints numerically in MySword's 1-based book ordering. Rendering/navigation adapters can map them later, after edition-specific versification review.
- Reject invalid, descending, oversized, or undocumented reference forms as unsupported tokens. Never guess or silently normalize them.
- Treat all SQLite fields, GBF tokens, HTML, CSS, and module rules as untrusted. Parsing is bounded, non-executing, and offline.

## Task list

### Phase 1: Cross-reference semantics

- [x] Task 1: Parse validated MySword RX references without changing source text.
- [x] Task 2: Surface parsed/unresolved RX counts in conversion preflight and the inspection UI.

### Checkpoint: Cross-reference semantics

- [x] Focused RED/GREEN tests pass.
- [x] Full tests, typecheck, build, audit, package, and clean-install smoke test pass.
- [x] Full publisher WEB fixture retains 31,103/31,103 lossless scans and resolves the known cross-chapter RX form.

### Phase 2: Safe semantic intermediate representation

- [x] Task 3: Define a text-first semantic event model for supported typography and structural GBF tags.
- [x] Task 4: Add inert translator-note and title extraction with nesting/error limits.
- [x] Task 5: Add safe renderer tests that use DOM text APIs only and explicitly reject HTML tokens.

### Checkpoint: Semantic IR

- [x] Corpus source round-trip remains exact.
- [x] Unsupported tokens remain visible and conversion remains blocked.
- [ ] Keyboard and screen-reader behavior is manually verified in a disposable vault.

### Phase 3: Authorized opt-in import design

- [ ] Task 6: Specify provenance, rights acknowledgement, storage, rollback, and integrity metadata. Proposed spec and ADR await review.
- [ ] Task 7: Implement import preview for an authorized public-domain fixture only.
- [ ] Task 8: Implement a reversible writer only after semantic, performance, GUI, and rights gates pass.

## Threat model

- **Trust boundaries:** user-selected filenames and bytes; SQLite schema/rows; module metadata; GBF/HTML/CSS/regex-like strings; rendered Obsidian DOM; future storage paths.
- **Assets:** Scripture fidelity, vault contents, plugin settings, UI integrity, memory/CPU availability, and user privacy.
- **Primary abuse cases:** malformed SQLite causing resource exhaustion; crafted tags causing XSS; regex/CSS execution; misleading references; path traversal; silent text loss; import of content without rights.
- **Controls:** 24 MiB file limit, 100,000-row limit, bounded text fields, parameterized/static SQL, query-only SQLite, lossless token contract, strict reference grammar, text-node rendering, no module code/rules execution, no writer in this phase.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Publisher extensions differ from documented syntax | Medium | Accept only evidence-backed forms and keep all others unresolved and lossless. |
| Canonical chapter checks misrepresent alternate canons | High | Keep the current 66-book scope explicit and block unsupported schemes. |
| Parsed metadata is mistaken for faithful rendering | High | Label it inspection-only; retain conversion blockers and raw source. |
| Main-thread corpus analysis is slow on weaker devices | Medium | Keep O(n) scans, add corpus timing evidence, and defer writer/UI expansion pending profiling. |
| Rights are unclear | High | Never infer rights from technical validity; require explicit provenance review before installation. |

## Open questions

- Which authorized second real-world module can be retained as a regression fixture?
- What storage root and migration policy should imported modules use outside the plugin folder?
- Which HTML subset, if any, can be represented safely without changing Scripture semantics?

