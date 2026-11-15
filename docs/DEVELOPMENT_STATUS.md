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
- Verified brand-screening checkpoint commit: `1189bbe` (`docs: refresh provisional brand screening`)
- Verified CI maintenance checkpoint commit: `9e37087` (`ci: pin the validation runner`; following `587d1c1` official action upgrades)
- Verified native-theme checkpoint commit: `75a4ba0` (`docs: verify native theme rendering`)
- Verified community-theme checkpoint commit: `dbe3266` (`docs: verify Minimal community theme`)
- Verified package-recovery checkpoint commit: `fd83d7d` (`fix: redact offline resource paths`)
- Verified offline-library recovery checkpoint commit: `c90cd67` (`fix: add offline library recovery flow`)
- Verified scoped-search implementation commit: `8bf46b4` (`feat: add scoped offline Bible search`)
- Verified search-match implementation commit: `018c656` (`feat: add offline search match modes`)
- Verified search-highlighting implementation commit: `08b9cb9` (`feat: highlight offline search matches`)
- Verified current-chapter search implementation commit: `ef275da` (`feat: search within the current chapter`)
- Verified selected-book search implementation commit: `1d3991d` (`feat: search a selected Bible book`)
- Verified any-word search implementation commit: `fd93103` (`feat: add Any words Bible search`)
- Verified search-control visibility repair commit: `1d7739d` (`fix: hide inactive selected-book search control`)
- Verified linked-note implementation commit: `31819b0` (`feat: discover Scripture-linked notes`)
- Verified range-note implementation commit: `f078b24` (`fix: preserve study note ranges`)
- Verified note-backlink implementation commit: `030c62c` (`feat: discover study note backlinks`)
- Plugin ID: `versedock` (compatibility contract; unchanged)
- GitHub: public repository `dernestbank/versedock-obsidian`; branch `branding/sworddock-bible` is pushed and pull request [#1](https://github.com/dernestbank/versedock-obsidian/pull/1) targets `main`. The historical prerelease/tag `0.1.0` remains the only published release.
- Current accessibility checkpoint: keyboard and accessibility-tree verification complete; actual VoiceOver verification pending
- Current performance checkpoint: reproducible desktop full-corpus benchmark complete; slow-device/mobile profiling pending
- Current responsiveness checkpoint: cooperative 1,000-row UI preflight implemented, corpus-simulated and re-verified live against the full-sized fixture in Obsidian 1.15.1
- Current workflow checkpoint: bounded reading history navigation, MRU promotion and reload persistence are verified live; destructive clearing remains approval-gated
- Current narrow-pane checkpoint: Inspector tab roving focus and arrow/Home/End navigation are verified live after the 0.1.11 Obsidian focus-manager repair
- Current brand checkpoint: 2026-11-15 exact-name screening found no `SwordDock` record in the live USPTO wordmark search, Obsidian community name/ID, npm registry or exact public-web results; comprehensive similar/common-law/international and professional review remain outstanding
- Current theme checkpoint: 0.1.11 Reader and Inspector rendering are visually verified in Obsidian 1.15.1 native Light/Dark and official-catalog Minimal 9.1.4 Light/Dark; the test vault is restored to Default/Light and broader community-theme coverage remains open
- Current package checkpoint: the complete 0.1.11 ZIP passes a new-vault trust/enable/Reader/reload cycle; missing and malformed-book errors are privacy-safe, and missing or malformed WEB manifests show install/recheck guidance and recover in-app after restoration
- Current search checkpoint: Whole Bible, Current chapter, Current book, Selected book, Old Testament and New Testament scopes support bounded Exact phrase / All words / Any words matching with literal text-node highlighting, remain cancellable and truthful about truncation, and are all verified live in the narrow Obsidian search pane. A runtime-found hidden-control flex defect is repaired and regression-tested.
- Current notes checkpoint: the Inspector discovers exact `scripture` frontmatter and resolved backlinks to the primary study note through Obsidian's metadata cache only, keeps the primary first, caps scanning at 5,000 files/results at 50 and reports truncation without proprietary storage. New range notes preserve both endpoints in metadata and paths; positively identified legacy range notes reopen unchanged without colliding with genuine single-verse notes. Primary-note creation, two-note discovery, backlink labeling and linked-note opening are verified live.

## Verified baseline

- `npm run check`: passed on 2026-11-15 for 0.1.11 (134 tests in 19 files, TypeScript, production build). Deliberate history-cap, Inspector ArrowRight, note-index scan-cap, zero-count backlink, primary-order, legacy range-signature, offline-library availability, current-chapter predicate, selected-book caller-path, search-truncation, all-to-any match, any-to-all match, hidden-control CSS removal and literal-escaping mutations were caught by their focused suites; focused resource-failure coverage rejects absolute-path disclosure and verifies package-level recovery guidance.
- `npm audit --json`: 0 known vulnerabilities across 113 dependencies.
- Package: `dist/SwordDock-Bible-0.1.11-offline-preview.zip` (local/unpublished), 76 allowlisted files, 1,757,882 bytes, SHA-256 `5e58b1938e9d7126b7df7e0af26bb0fe220546470d5d1cf5df65103921bd15a9`. Two consecutive builds matched; archive integrity, clean-vault extraction, source byte comparison and simulated offline restart passed for all 66 books and 31,103 verses. The exact archive was reloaded into the final disposable GUI vault without changing `data.json`; its search and linked-note workflow checks passed with no captured Obsidian errors. The previously verified upgrade path preserved stable ID `versedock`, `reference: "Rom.8.28"`, history `['Rom.8.28', 'Rom.8.27']`, bookmarks, highlights and appearance settings.
- Updated full-corpus evidence: 31,103 WEB verses pass source round-trip enforcement; 71,821 recognized markers, seven inert HTML markers, 424 validated RX markers, zero unresolved markers, 15,866 semantic-ready markup verses, seven opaque events, 1,126 translator notes and 169 titles. Conversion remains blocked.
- Live GUI: Obsidian 1.15.1 loaded 0.1.11 in the isolated repository `test-vault`. Live 0.1.10 first exposed that Obsidian still tabbed through inactive native buttons despite `tabindex="-1"`; 0.1.11 keeps only the selected tab native. End reached and revealed History, Right wrapped to Commentary, and Tab exited the tab list. Selecting the older Romans 8:28 history entry promoted it ahead of Romans 8:27; the Reader reference and reordered history survived reload. The clear action and actual VoiceOver remain pending because both require explicit approval at action time.
- Native themes: the same 0.1.11 Reader and Inspector are visually readable in Obsidian 1.15.1 Light and Dark schemes, including editorial Scripture, selected-passage/accent treatment, contextual actions, narrow tabs and unavailable-resource states. The isolated vault was restored to `moonstone` Light with reference, history, bookmarks, highlights and appearance settings unchanged.
- Community theme: official-catalog Minimal 9.1.4 was installed only in the isolated `test-vault` and exercised in Light and Dark. The Reader and Inspector retained readable typography, selection/accent treatment, contextual actions, narrow tabs and truthful unavailable-resource states. The vault was restored to Default/`moonstone` Light; `reference: "Rom.8.28"`, history `['Rom.8.28', 'Rom.8.27']`, bookmarks, highlights and all plugin appearance settings remained unchanged. Minimal remains installed but inactive only in the disposable vault.
- Fresh GUI package: the final reproducible 0.1.11 ZIP was extracted into ignored `.research/qa/clean-gui-011-final`, registered through Obsidian 1.15.1, trusted as a locally authored vault and enabled as `versedock`. The offline Reader opened at John 3:16 and restored after app reload. An earlier disposable cycle first reproduced an absolute-path disclosure; the final packaged library boundary reports only a fixed missing/unreadable-book message. A malformed-JSON cycle produced file-size, SHA-256 and JSON integrity issues without a path; restoring `JOH.json` returned verification to 66/66. Missing and malformed manifest cycles displayed package-level guidance, and restoring the exact manifest plus **Recheck offline library** recovered John 3:16 without an app reload.
- Live scoped search and notes: the same disposable vault exposed labeled scope/input controls and a concise live status in a narrow right pane. John 3:16 appeared for Whole Bible, New Testament, Current book and Current chapter scopes, disappeared for Old Testament, and Selected book returned only Psalms for `shepherd`. Any words matched `world shepherd` in John 3 through `world`, highlighted no absent term and reported three exact results. The Selected book control now computes to `none` outside its scope and `flex` inside it. The Inspector created the canonical John 3:15 note, discovered a second ordinary Markdown note as a resolved backlink, kept the primary first, labeled the backlink and opened it successfully.
- Full-corpus performance: a 25-run Node 22/darwin arm64 benchmark of the ignored 5.4 MiB publisher WEB fixture produced 98.873 ms combined median and 126.184 ms p95 after one warm-up, with stable 31,103-verse semantics and unchanged source SHA-256. Post-iteration process RSS was 95.078–99.766 MiB; this is not a mobile, slow-device or in-operation peak profile.
- Cooperative responsiveness: the same 31,103-verse report matched the synchronous baseline exactly while yielding 31 times. Its 32 measured work segments produced 5.127 ms p95 and 26.795 ms maximum on the tested Mac. This simulation excludes Obsidian rendering and is not a mobile guarantee.
- Live full-corpus preflight: Obsidian 1.15.1 inspected the ignored 5,414,912-byte publisher WEB fixture and completed the cooperative read-only report with the established totals: 71,821 recognized markers, seven HTML markers, 424 validated RX markers, 15,866 semantic-ready markup verses, seven opaque events, 1,126 translator notes and 169 titles. Conversion/installation remained blocked, the UI reported no writes or uploads, and source SHA-256 remained `d0605fb28dbb0aee37f078931fdc54925295f846b068b954da2d1923011b2bb5`.
- GitHub Actions: PR #1 is mergeable and `build-and-test` passed on pinned Ubuntu 24.04 with `actions/checkout@v7` and `actions/setup-node@v7` for Any words search checkpoint commit `45d781d` in run `43728565474` (job `132855746619`). The run completed with zero annotations.

## Completed capabilities

- Offline 66-book/31,103-verse WEB reader, navigation, bounded canonical chapter/current-book/selected-book/testament exact/all-word/any-word search with safe literal highlighting, Markdown insertion, notes, bookmarks, and highlights.
- Theme-adaptive responsive desktop UI foundations and study/library views.
- Read-only `.bbl.mybible` SQLite inspection with strict schema/content bounds.
- Non-writing conversion preflight that blocks unsafe/unsupported content.
- Lossless GBF lexical scanning with exact UTF-16 offsets and inert HTML classification.
- Bounded GBF semantic events for supported typography/layout, translator notes and titles, plus an isolated fail-closed text-node renderer.
- Deterministic offline preview packaging and clean-install filesystem smoke tests.
- Fresh Obsidian package installation/reload evidence and privacy-safe missing-resource recovery.
- Bounded, non-writing full-corpus performance benchmark with stable-output and source-hash enforcement.
- Bounded canonical reading history with migration-safe settings normalization and Inspector navigation.
- Roving, WAI-ARIA-linked Inspector tabs with Arrow/Home/End navigation and narrow-pane reveal.
- Bounded Scripture-linked Markdown note discovery through Obsidian's metadata cache, with exact canonical references and truthful partial-result states.
- Range-safe study-note creation with exact full-range metadata, non-colliding filenames and read-only compatibility recovery for positively identified legacy notes.
- Bounded resolved-backlink discovery for the exact primary study note, with primary-first ordering and no note-body reads.

## Current implementation priority

Review the proposed root-level [offline reading-workflow capability map](../CAPABILITY-MAP-reading-workflows.md) before its catalog, progress or study-session module is specified. Separately review the proposed [authorized-import specification](specs/authorized-mysword-import.md) and [storage ADR](decisions/0001-imported-module-storage.md). Do not plan or implement Task 7 until the storage root, rights acknowledgement, deletion confirmation and unbenchmarked generated-size cap questions are accepted or revised. The keyboard/accessibility-tree checkpoint is complete; actual VoiceOver verification remains open.

## Known blockers

- Semantic support is deliberately incomplete for lexical/interlinear tags, HTML, CustomCSS and VerseRules; the renderer refuses them.
- Proposed rights/provenance and reversible storage contracts exist, but they are not accepted or implemented.
- No conversion writer or installer.
- No authorized second translation/commentary fixture in the repository.
- No mobile, Windows, Linux, broader community-theme matrix, automated accessibility, or slow-device validation.
- Naming/trademark clearance is not established.

## Publication status

Only the historical VerseDock `0.1.0` developer prerelease is public. PR #1 is reviewable, but it is not a release. Do not claim a stable release or Community Plugins eligibility; no release publication is authorized by technical validation alone.

## Next continuation instruction

Open `tasks/todo.md`, resume at the first unchecked acceptance criterion, preserve the plugin ID and existing settings, and do not implement a writer until semantic, safety, rights, storage, and rollback gates are all verified.
