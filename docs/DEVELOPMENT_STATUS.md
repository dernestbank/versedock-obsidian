# SwordDock Bible development checkpoint

Updated: 2026-11-15

## Current state

- Version: `0.1.11` local developer candidate
- Branch: `branding/sworddock-bible`
- Starting commit: `e5f95174c2ad25a825883bf3cf77c44229ed35b0`
- Verified implementation commit: `5a4f5b2` (`feat: validate MySword cross-reference semantics`)
- Verified semantic milestone commit: `3a50abb` (`feat: add safe GBF semantic inspection`)
- Verified accessibility checkpoint commit: `f4bae5a` (`fix: preserve inspector keyboard focus`)
- Verified performance checkpoint commit: `53a4da9` (`test: add bounded MySword benchmark`)
- Verified responsiveness checkpoint commit: `ef63eb2` (`perf: yield during MySword preflight`)
- Verified workflow checkpoint commit: `7dba619` (`feat: add bounded reading history`)
- Verified narrow-pane checkpoint commit: `4913dcb` (`feat: improve inspector keyboard navigation`)
- Verified focus-manager repair commit: `30c7065` (`fix: repair inspector roving focus`)
- Plugin ID: `versedock` (compatibility contract; unchanged)
- GitHub: public repository `dernestbank/versedock-obsidian`; branch `branding/sworddock-bible` is pushed and pull request [#1](https://github.com/dernestbank/versedock-obsidian/pull/1) targets `main`. The historical prerelease/tag `0.1.0` remains the only published release.
- Current accessibility checkpoint: keyboard and accessibility-tree verification complete; actual VoiceOver verification pending
- Current performance checkpoint: reproducible desktop full-corpus benchmark complete; slow-device/mobile profiling pending
- Current responsiveness checkpoint: cooperative 1,000-row UI preflight implemented, corpus-simulated and re-verified live against the full-sized fixture in Obsidian 1.15.1
- Current workflow checkpoint: bounded reading history navigation, MRU promotion and reload persistence are verified live; destructive clearing remains approval-gated
- Current narrow-pane checkpoint: Inspector tab roving focus and arrow/Home/End navigation are verified live after the 0.1.11 Obsidian focus-manager repair

## Verified baseline

- `npm run check`: passed on 2026-11-15 for 0.1.11 (102 tests in 14 files, TypeScript, production build). Deliberate history-cap and Inspector ArrowRight mutations were caught by their focused suites; the new focused test rejects inactive native tab buttons.
- `npm audit --json`: 0 known vulnerabilities across 113 dependencies.
- Package: `dist/SwordDock-Bible-0.1.11-offline-preview.zip` (local/unpublished), 76 allowlisted files, 1,753,882 bytes, SHA-256 `f7292b1ce94d1bfa8bb6f770d5705e1dc2b4737bc5993f4bd7fc2b1a2e382a43`. Two consecutive builds matched; clean-vault extraction and simulated offline restart passed for all 66 books and 31,103 verses. Redeployment preserved stable ID `versedock`, `reference: "Rom.8.28"`, history `['Rom.8.28', 'Rom.8.27']`, bookmarks, highlights and appearance settings.
- Updated full-corpus evidence: 31,103 WEB verses pass source round-trip enforcement; 71,821 recognized markers, seven inert HTML markers, 424 validated RX markers, zero unresolved markers, 15,866 semantic-ready markup verses, seven opaque events, 1,126 translator notes and 169 titles. Conversion remains blocked.
- Live GUI: Obsidian 1.15.1 loaded 0.1.11 in the isolated repository `test-vault`. Live 0.1.10 first exposed that Obsidian still tabbed through inactive native buttons despite `tabindex="-1"`; 0.1.11 keeps only the selected tab native. End reached and revealed History, Right wrapped to Commentary, and Tab exited the tab list. Selecting the older Romans 8:28 history entry promoted it ahead of Romans 8:27; the Reader reference and reordered history survived reload. The clear action and actual VoiceOver remain pending because both require explicit approval at action time.
- Full-corpus performance: a 25-run Node 22/darwin arm64 benchmark of the ignored 5.4 MiB publisher WEB fixture produced 98.873 ms combined median and 126.184 ms p95 after one warm-up, with stable 31,103-verse semantics and unchanged source SHA-256. Post-iteration process RSS was 95.078–99.766 MiB; this is not a mobile, slow-device or in-operation peak profile.
- Cooperative responsiveness: the same 31,103-verse report matched the synchronous baseline exactly while yielding 31 times. Its 32 measured work segments produced 5.127 ms p95 and 26.795 ms maximum on the tested Mac. This simulation excludes Obsidian rendering and is not a mobile guarantee.
- Live full-corpus preflight: Obsidian 1.15.1 inspected the ignored 5,414,912-byte publisher WEB fixture and completed the cooperative read-only report with the established totals: 71,821 recognized markers, seven HTML markers, 424 validated RX markers, 15,866 semantic-ready markup verses, seven opaque events, 1,126 translator notes and 169 titles. Conversion/installation remained blocked, the UI reported no writes or uploads, and source SHA-256 remained `d0605fb28dbb0aee37f078931fdc54925295f846b068b954da2d1923011b2bb5`.
- GitHub Actions: PR #1 is mergeable and `build-and-test` passed for focus-manager repair commit `30c7065` in run `43715770795`. The following documentation-only status commit triggers the same validation again.

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
- Roving, WAI-ARIA-linked Inspector tabs with Arrow/Home/End navigation and narrow-pane reveal.

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
