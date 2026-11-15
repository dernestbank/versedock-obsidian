# SwordDock Bible development checkpoint

Updated: 2026-11-15

## Current state

- Version: `0.1.9` local developer candidate
- Branch: `branding/sworddock-bible`
- Starting commit: `e5f95174c2ad25a825883bf3cf77c44229ed35b0`
- Verified implementation commit: `5a4f5b2` (`feat: validate MySword cross-reference semantics`)
- Verified semantic milestone commit: `3a50abb` (`feat: add safe GBF semantic inspection`)
- Verified accessibility checkpoint commit: `f4bae5a` (`fix: preserve inspector keyboard focus`)
- Verified performance checkpoint commit: `53a4da9` (`test: add bounded MySword benchmark`)
- Verified responsiveness checkpoint commit: `ef63eb2` (`perf: yield during MySword preflight`)
- Plugin ID: `versedock` (compatibility contract; unchanged)
- GitHub: public repository `dernestbank/versedock-obsidian`; branch `branding/sworddock-bible` is pushed and pull request [#1](https://github.com/dernestbank/versedock-obsidian/pull/1) targets `main`. The historical prerelease/tag `0.1.0` remains the only published release.
- Current accessibility checkpoint: keyboard and accessibility-tree verification complete; actual VoiceOver verification pending
- Current performance checkpoint: reproducible desktop full-corpus benchmark complete; slow-device/mobile profiling pending
- Current responsiveness checkpoint: cooperative 1,000-row UI preflight implemented and corpus-simulated; live Obsidian re-verification pending
- Current workflow checkpoint: bounded reading history implemented and migration-tested; live Inspector verification pending

## Verified baseline

- `npm run check`: passed on 2026-11-15 for 0.1.9 (97 tests in 13 files, TypeScript, production build). A deliberate 51-entry-cap mutation was caught by the focused history suite.
- `npm audit --json`: 0 known vulnerabilities across 113 dependencies.
- Package: `dist/SwordDock-Bible-0.1.9-offline-preview.zip` (local/unpublished), 76 allowlisted files, 1,753,388 bytes, SHA-256 `9f9abd18122758fecfc29b7b97e1bfc1e2910ca6317c0d6d2dd210b6a80e5e41`. Two consecutive builds matched; clean-vault extraction and simulated offline restart passed; stable ID `versedock` and version 0.1.9 were deployed to `test-vault`.
- Updated full-corpus evidence: 31,103 WEB verses pass source round-trip enforcement; 71,821 recognized markers, seven inert HTML markers, 424 validated RX markers, zero unresolved markers, 15,866 semantic-ready markup verses, seven opaque events, 1,126 translator notes and 169 titles. Conversion remains blocked.
- Live GUI: Obsidian 1.15.0 reloaded the 0.1.7 implementation in the isolated repository `test-vault`. Keyboard Tab order and Return activation worked; the hostile HTML fixture stayed literal; semantic inspection reported zero of one markup verses fully interpreted and one opaque event; conversion/installation remained blocked; diagnostics were exposed as plain accessibility text; and focus returned to the preflight button. Actual VoiceOver announcement/navigation remains pending.
- Full-corpus performance: a 25-run Node 22/darwin arm64 benchmark of the ignored 5.4 MiB publisher WEB fixture produced 98.873 ms combined median and 126.184 ms p95 after one warm-up, with stable 31,103-verse semantics and unchanged source SHA-256. Post-iteration process RSS was 95.078–99.766 MiB; this is not a mobile, slow-device or in-operation peak profile.
- Cooperative responsiveness: the same 31,103-verse report matched the synchronous baseline exactly while yielding 31 times. Its 32 measured work segments produced 5.127 ms p95 and 26.795 ms maximum on the tested Mac. This simulation excludes Obsidian rendering and is not a mobile guarantee.
- GitHub Actions: PR #1 is mergeable and `build-and-test` passed for responsiveness checkpoint commit `ef63eb2`. The following documentation-only status commit triggers the same validation again.

## Completed capabilities

- Offline 66-book/31,103-verse WEB reader, navigation, search, Markdown insertion, notes, bookmarks, and highlights.
- Theme-adaptive responsive desktop UI foundations and study/library views.
- Read-only `.bbl.mybible` SQLite inspection with strict schema/content bounds.
- Non-writing conversion preflight that blocks unsafe/unsupported content.
- Lossless GBF lexical scanning with exact UTF-16 offsets and inert HTML classification.
- Bounded GBF semantic events for supported typography/layout, translator notes and titles, plus an isolated fail-closed text-node renderer.
- Deterministic offline preview packaging and clean-install filesystem smoke tests.
- Bounded, non-writing full-corpus performance benchmark with stable-output and source-hash enforcement.
- Bounded canonical reading history with migration-safe settings normalization and Inspector navigation.

## Current implementation priority

Review the proposed [authorized-import specification](specs/authorized-mysword-import.md) and [storage ADR](decisions/0001-imported-module-storage.md). Do not plan or implement Task 7 until the storage root, rights acknowledgement, deletion confirmation and unbenchmarked generated-size cap questions are accepted or revised. The keyboard/accessibility-tree checkpoint is complete; actual VoiceOver verification remains open.

## Known blockers

- Semantic support is deliberately incomplete for lexical/interlinear tags, HTML, CustomCSS and VerseRules; the renderer refuses them.
- Proposed rights/provenance and reversible storage contracts exist, but they are not accepted or implemented.
- No conversion writer or installer.
- No authorized second translation/commentary fixture in the repository.
- No mobile, Windows, Linux, community-theme, automated accessibility, or slow-device validation.
- Naming/trademark clearance is not established.

## Publication status

Only the historical VerseDock `0.1.0` developer prerelease is public. PR #1 is reviewable, but it is not a release. Do not claim a stable release or Community Plugins eligibility; no release publication is authorized by technical validation alone.

## Next continuation instruction

Open `tasks/todo.md`, resume at the first unchecked acceptance criterion, preserve the plugin ID and existing settings, and do not implement a writer until semantic, safety, rights, storage, and rollback gates are all verified.
