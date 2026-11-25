# Full completion ledger — 2026-11-18

The active goal includes design recovery plus all six numbered remaining areas.
This ledger supersedes the historical read-only implementation boundary in the
older plan: the user has now explicitly authorized installation, import and
management. It does not authorize publishing, editing personal vaults, or
permanent user-data deletion. Existing work is preserved. Optional Copilot and
Research workspace remain explicitly tracked as later scope, not silently
substituted for the six required areas.

## 0. Design recovery (first)
- [x] Capture current native Resources/Reader before editing; inspect supplied references.
- [x] Restore non-overlapping passage navigation and separate study controls (native wide/narrow Reader captures in both themes, 2026-11-18).
- [x] Restore compact right-dock resource switching and content-first sizing (native book/atlas/study checks; passage-first installed commentary and library storage ordering corrected and observed).
- [ ] Keep all functions accessible with stable keyboard focus and no lost state.
- [ ] Review Reader, Study, Resources and Library in both themes and narrow panes.
- [ ] Save accepted before/after native captures; inspect content, clipping and hierarchy.

## 1. Bible / commentary / dictionary installation
- [x] Inspect supported physical schemas and real fixtures for each type (inspectStudyModule; 6 tests; full publisher KJV/JFB/Easton checks).
- [x] Connect all three kinds to the shared transaction and verify actual pinned fixtures through installation, integrity checks and offline rediscovery (`scripts/verify-study-installation.mjs`; temporary store only).
- [x] Download, verify, stage, activate and reopen all three kinds (native Install selected queue for KJV/JFB/Easton; Ready offline and persisted inventory/content after app reload; no airplane-mode claim).
- [x] Switch installed Bible editions without losing passage or source metadata (native MySword KJV → CrossWire tagged KJV at Proverbs 5:3; edition menu identifies both sources).
- [x] Native source-specific commentary and dictionary access: MHC/JFB follow the selected passage; JFB coordinate links preview their own source entry without changing Reader; catalogue/local JFB and Easton choices remain distinct. Easton exact headword links preserve the query, navigate Pledge → Loan and Back, and focus the restored heading. Built-in Greek/Hebrew lookup is covered by the companion acceptance.
- [x] Core offline reopen with network forbidden, native app restart, malformed/QA-encrypted rejection, actual native Cancel/reload/resume and failed-save rollback/retry. Native airplane-mode and failed-transfer acceptance remain separate release gates; no vendor DRM support is claimed.

## 2. General local-file import
- [x] Prepare all six kinds from local SQLite/gzip, retain provenance and source records, reject stale reviews, and verify installation/offline rediscovery with synthetic fixtures plus all six real corpora (`scripts/verify-local-imports.mjs`, temporary store).
- [x] Native file-picker and preview for all six kinds: gzip Bible/devotional and raw SQLite book/commentary/dictionary/graphics; physical type detection plus explicit Devotional/Graphics choices.
- [x] Native metadata, source notice, fingerprints, samples, sizes and test-vault destination review; the optional QA source note and exact selected-file/database fingerprints persist. Preview creates no local resource or stage.
- [x] Install all six reviewed local types through the shared transaction, open their readers and rediscover all six after app reload. Read-only checks verify every content hash, expected record count, original source and QA provenance; original SQLite/gzip inputs remain unchanged. No airplane-mode claim.
- [x] Source-specific coordinates remain exact in the full-source checks; native imported Bible retains Genesis 1:4 and its separate RF translator note. Unsupported/encrypted formats have explicit copy and rejection regressions; native rejection/failure acceptance remains below.
- [x] Synthetic format fixtures plus all six real source corpora, Linux temporary-filesystem verification and native successful import/restart coverage beyond the original three reading resources.
- [x] Native malformed SQLite and QA-encrypted input rejection (not vendor DRM), wrong-type review invalidation, closed-review discard, real save-permission failure with unchanged prior data, same-review retry after permissions return and path-free guidance in modal/Downloads. Full stored-file hashes and original directory mode verified.

## 3. Module management
- [x] Implement measured storage review, protected reversible cleanup, prepared-stage recovery and filesystem path guards; synthetic regressions and real-source temporary-filesystem checks pass (`scripts/verify-resource-storage.mjs`). Native recovery/Trash and desktop resume acceptance are itemized below.
- [x] Implement and verify persistent version choices, reversible removal/restore, default protection, failed-state rollback and non-overwriting repair using synthetic regressions plus real-source temporary-filesystem checks (`scripts/verify-module-management.mjs`). Native cases are itemized below.
- [x] Native catalogue All of Grace older-generation selection, persistence through app reload and reactivation of current rich generation; exact content hashes and Active markers retained. Core snapshot restart checks also pass.
- [x] Native damaged catalogue book rejection and pinned-source repair to a new verified generation; damaged bytes and older valid copies preserved, book reopens. Exact QA backup restored afterward. Core failed-selection/write rollback also passes.
- [x] Native failed-save rollback preserves all 127/133 stored files and prior active generation; retry succeeds after restoring original directory permissions. Core failed-selection/write rollback also passes.
- [x] Shutdown rejects new/queued library changes and late local previews; lifecycle cancellation reaches uncommitted management/recovery and further cleanup. Six regressions failed before the fix; a seventh partial-Trash regression also fails when lifecycle abort is removed; prior choices, source notes, prepared stages and remaining folders survive. Native unload acceptance remains open.
- [x] Active local-preview preparation stops on service shutdown, discard and replacement; caller abort and overlapping/stale requests remain correct. Six regression/compatibility cases, three detected mutations and twelve real-source interruption cases verify early exit, database closure and unchanged inputs. Native unload remains open.
- [ ] Native failed-transfer rollback acceptance while preserving prior valid data; actual cancellation and preserved prior copies pass separately.
- [ ] Review and apply updates with explicit source changes. Core/callback coverage now verifies distinct reviewed fingerprints, explicit activation, retained versions, cancellation/failure rollback and fresh offline service reopen using controlled SQLite/gzip and temporary storage. Native/publisher update acceptance remains unverified.
- [x] Native reversible removal/restore: catalogue All of Grace remains removed across reload, retains its exact generation and reopens after Restore; catalogue KJV also removes/restores. Current local default KJV is separately labelled as default and removal is disabled. Broader failure/race cases remain in management coverage.
- [x] Implement desktop partial-byte checkpoints and validated HTTP resume after recreating the downloader; actual publisher 206, complete pinned checksums, all six installs/offline reopen, failed checkpoint writes, malformed range/validator and unknown-file preservation pass (`scripts/verify-download-transport.mjs`, decision 0013).
- [x] Native complete prepared-stage recovery, incomplete-stage rejection, exact recovered generation persistence across reload and opening; original local generation retained. This simulates interruption after preparation.
- [x] Native JFB transfer Cancel, inactive cancelled state, verified 1,583,838-byte saved prefix, persistence across app reload, measured storage review, resumed progress at 1.5 MB, Ready offline/open and checkpoint cleanup. Actual HTTP 206 is separately established by the CLI transport verifier; native UI does not expose response headers.
- [x] Stable Downloads Cancel target across progress updates; terminal action handlers/focus and background focus covered by three regressions, native Cancel/Retry passed after deployment.
- [x] Native retained-generation/stage cleanup: two prepared stages and one eligible old generation moved to recoverable vault Trash, exactly 574,190 bytes / six files; active/recent rollback copies protected. All 18 resources reopen after reload. Earlier two-management-snapshot Trash move also passes. Trash was never emptied.
- [x] Cancellable desktop transport and actual socket-abort semantics, including cancellation before headers and timeout. Mobile public requestUrl still cannot abort a transfer; its installation-only cancellation limit is exposed in Downloads and remains part of mobile acceptance.

## 4. Greek / Hebrew interlinear
- [x] Research and validate attributed alignment datasets and their permitted use (complete Berean API corpus, primary public-domain terms; KJV word mapping remains a separate unchecked gate).
- [x] Resolve edition presentation with the user: on November 18 they chose “KJV with a clearly labelled Berean interlinear companion.” Preserve exact Berean verse/word ranks; no Strong's join or exact KJV English alignment is claimed.
- [x] Display original words, transliteration, glosses, identifiers and supplied grammar, with remembered row/order/font/size controls and original-source dictionary selection.
- [x] Handle RTL, absent rows, numbering differences and source attribution. All 17 empty source verse records remain explicit; KJV Scripture stays separate and visible.
- [x] Verify Greek/Hebrew/Aramaic against every source field and native rendering: 1,189 chapters / 31,102 records / 443,625 words; Genesis 1:1, John 3:16, Daniel 2:4 and Acts 8:37; narrow/light/dark, keyboard and reload acceptance. See decision 0014 and `docs/specs/interlinear.md`.

This completes the user-selected companion presentation, not an exact KJV English
word alignment. Platform and actual screen-reader gates below remain open.

## 5. Rich resource content
- [x] Bounded semantic model for supported formatting, paragraphs, lists, tables, anchors and references (`resource-content.ts`, decision 0015).
- [x] Inert allowlisted DOM rendering; no source HTML parser, scripts/CSS/unsafe URLs/remote image requests. Hostile HTML, inherited prototype names, duplicate anchors/hrefs and resource bounds pass regressions.
- [x] Internal Journal/source-ID, dictionary/headword and commentary-coordinate links; exact fixed-edition passage preview, cross-chapter paging, explicit Reader action and Back navigation. Missing/ambiguous/foreign source targets remain explained.
- [x] Retain original source, disclose unsupported content and fall back to the full plain projection on parser limits. Imported Bible notes/headings are separate from Scripture, with original GBF retained.
- [x] Full pinned-source corpus verification: 56,984 source records exact; all 25,882 non-Bible ordinary-text projections match an independent Python HTMLParser oracle. No parser-bound fallback in these fixtures.
- [x] Native book contents/back/emphasis and devotional index/fragment; atlas contents/topic/map/back, larger view and disabled image controls on image-free entries. Local atlas images also render after import/reload.
- [x] Native dictionary headword/Back with saved query; JFB exact commentary-coordinate preview and nested Bible link, Escape restoration; imported Bible RF annotation and complete original GBF disclosure.
- [x] Native explicit Reader focus after current rendering (Quick Jump and multi-target citation), dictionary Back heading focus, and source-note dialog Close focus/return. Four new regressions cover delayed/superseding render, user-moved focus and chapter focus.
- [x] Native five-action selected-verse toolbar in wide/narrow Default Light/Dark; intrinsic layout prevents Source notes from covering Scripture. Temporary split closed after verification.
- [x] Native devotional Index table containment, keyboard horizontal scroll to its final column, wrapped day links, month fragment/Back with preserved date/time and named source-anchor focus. Native cross-chapter/invalid-coordinate previews are covered by the shared MHC cases below.
- [ ] Finish broader narrow/theme flows and wider design audit. Earlier `cgWindowNotFound` was resolved after the user's foreground confirmation.
- [x] Retain bounded Journal source metadata, including abbreviation, for own-module-prefixed addresses. Regression proves resolution after normalization and rejects foreign modules/oversized stored metadata. Older packages need reinstall/reimport; no title/alias guessing.
- [x] Extend bundled Matthew Henry to exact retained OSIS, supported emphasis and clickable qualified citations with multiple-target selection. All 4,249 sections/text projections, 199,876 emphasis markers and 62,374 citation labels match the independent SWORD/Python oracle. The second 68-file export is byte-identical. Legacy plain assets remain readable. Decision 0016 records limits and unavailable source addresses.
- [x] Native MHC rich headings/italic/small-caps/superscript, quotation disclosure, original OSIS, twenty-block continuation focus, single and four-target citation previews, explicit Reader action and default light/dark right-dock rendering. Captures 30–33 record these paths.
- [x] Native MHC whole-chapter two-section continuation: Genesis 1 appends 1:6–8 / 1:9–13, remaining count 8 → 6, first appended section receives focus. Minimal Light/Dark rich rendering and current Reader wide/narrow/action-overflow checks pass; original theme/single-pane layout restored.
- [x] Native MHC Psalms 88:1–89:52 cross-chapter preview/paging through verse 52 with final bounds, and actual source typo Jas.9.7 reported as unavailable without substitution. Escape restores source focus and Reader selection. Broader theme/actual assistive acceptance remains below.

## 6. Release verification
- [ ] Finish the macOS theme/design matrix beyond the verified flows below.
- [x] Current-feature Default and installed Minimal Light/Dark Reader wide/narrow actions, overflow navigation, rich MHC and Library error/storage readability; source selection/state retained and original theme/single pane restored. Further community themes remain open.
- [x] Things 2.2.6 Light/Dark source readability: explicit Resources surface, normal-color headings/emphasis with semantic formatting and link colors retained; exact passage preview/Escape focus return. Default Light restored. Captures 80–84.
- [x] Approved new QA-vault startup from the prior ZIP, then exact current CSS-only ZIP update/restart: all 1,475 extracted entries match, all six bundled resources ready, WEB → KJV and labelled Greek companion/preferences survive restart. Captures 85–88; native networking was not disabled.
- [ ] Actual screen-reader navigation/announcements; approved assistive settings if necessary.
- [ ] Windows and Linux native Obsidian evidence. Linux ARM64 Node 22.23.2 now passes all 497 tests/typecheck/build and real six-source import, management, storage/recovery checks in an isolated container; its browser bundle matches the Mac build byte-for-byte. This is core/runtime evidence, not native Linux Obsidian. Both November 24 Windows connector rechecks return MCP -32603 Internal error.
- [ ] Actual iOS/Android runtime evidence; responsive layouts alone do not prove this.
- [ ] Representative slower-device performance and responsiveness. M1 Node profiling and cooperative-stage improvements are documented; native UI and slower-device proof remain open.
- [x] Full 497-test/72-file Mac/Linux checks, typecheck, zero runtime audit findings, production build and deterministic 1,475-entry clean-install/offline-restart package smoke. This is the current automated package gate.
- [ ] Exact final ZIP fresh native-vault installation/offline-start acceptance and actual platform/assistive/performance matrix.
- [x] Focused correctness/readability/architecture/security/performance review of current native fixes, regressions and runtime evidence; scope/limits recorded in `.research/modules/native-fixes-review.md`. Full accumulated-worktree release review remains separate.
- [ ] Final requirement-by-requirement completion audit and reviewable release artifacts.

## Later (explicitly optional in objective)
- [ ] Copilot native tab and privacy/source-selection contract.
- [ ] Reversible configurable Research workspace.

No item becomes complete based solely on a passing policy test or a prior chat
claim. Each checked implementation gate must have current tests or runtime
capture evidence. External platform availability is a verification dependency,
not a reason to reduce the goal.

Latest automated runtime/package checkpoint: 497 tests / 72 files, strict TypeScript,
385.1 KB build and Linux real six-source import/reopen, management/recovery pass.
Linux: 1,692 unchanged inputs; fingerprint `4dc5701f72d1afe2bc27a7ffdc67b9d4f96e652aac6c070c651c3d65802e4a58`.
Transport report now invalidates old success before build/network work. Two isolated
failure regressions and a detected/restored mutation pass. Fresh actual publisher
HTTPS cancels at 527,838 bytes, resumes with 206, then installs/reopens all six kinds.
All 1,475 existing preview entries still match current bytes; retain the prior two
identical builds and clean-install/offline-restart data smoke. Bundle SHA-256
`27e1a4314441cde1437971301be88b2ea16238636ab8b40dce6dd381b49e19b1`; preview SHA-256
`b0082ad7a80b6293faefcdbf2eb60f85e3c80f8a3b357bb030b117f2c56dcfe5` (34,957,843 bytes).
No new packaging/deployment or browser run is needed for verifier/test-only changes.
All 72 test files plus shared fixture inspected. Full-corpus evidence is bound to
unchanged current runtimes/source pins. All 68 ledger criteria are classified in
requirement-audit-2026-11-24.json; current native/full UI matrix, update/transfer-
failure/final ZIP/platform/theme/assistive/slower-device acceptance remains open.
Mini QA-only AppleScript exception is unanswered. See transport-verifier-evidence-
2026-11-24.md and current scoped/platform reports. The full goal remains active.

The prior CSS-only candidate has native new-vault update/restart evidence.
The newer shutdown-fix candidate passes 375 Mac/Linux tests and package smoke,
but native attachment again returns cgWindowNotFound. Its literal first native
launch, unload behavior, actual network-isolated startup and remaining device/
assistive matrix are not inferred from prior captures. No QA preferences/layout
were reset. The earlier ZIPs and their native evidence are retained separately.


November 24 migration checkpoint: primary development is now on Nana’s Mac mini at
`/Users/nanabee_home/Documents/obsidian_vaults/my-plugins/mysword+/dev`. All 7,822 snapshot files and original Git state matched before edits.
The root/ancestor alias defect is fixed and verified with real temporary filesystem
cases, a controlled canonicalization race and mutation testing. Mac/Linux 380/60,
real-source workflows, full/runtime audits and deterministic package smoke pass.
See `docs/specs/mac-mini-migration-2026-11-24.md`. Earlier native captures are
prior-build evidence; current native acceptance remains unchecked.


November 24 continued-development checkpoint: cooperative study preparation and
Bible decoding, unload cancellation and generation revalidation now pass 397/62
Mac/Linux checks and current deterministic package smoke. All 17 new regressions,
six mutation checks and six-corpus exact JSON parity are retained in
.research/platform-mini/cooperative-preparation. Native Mini automation awaits the
requested QA-only AppleScript exception; no Mini Obsidian window has been operated.


November 24 active-preview checkpoint: stop/discard/replacement interrupt actual
preparation, with caller cancellation retained and overlapping/stale requests
guarded. Six new cases (three originally failing), three detected mutations and
twelve pinned-source interruption cases pass, along with 403/62 Mac/Linux checks
and current package smoke. Native Mini acceptance remains unchecked.


November 24 image-loading checkpoint: late images retain focus/visible content
after new input. Seven unit cases, two mutations and six rendered Chromium cases
pass. Current full check/package gate is 410/63 on Mini/Linux. The focused source
review is part of the still-incomplete accumulated-worktree release audit; native
Mini UI, source-update/failure, actual platform/assistive/slower-device gates remain open.


November 24 view-lifecycle checkpoint: Resources query/caret/focus/entry survive
unrelated progress after a type switch, while actual source generations refresh.
Reader late rendering respects new external focus, and obsolete openings cannot
attach observers. Nine unit cases, three mutations and ten browser cases pass;
full Mini/Linux/package gate is 419/64. Settings network copy is corrected. The
15-file accumulated review is partial and all outstanding native release gates
remain unchecked. See the current reports and sibling .sworddock-qa evidence.


November 24 retained-generation/reference checkpoint: current Mini/Linux/package
gate is 426/65. Both integrity directions and full Psalm 119 saved selections pass;
seven new cases, two mutations and real KJV source checks are retained. Source
review covers 46 files and remains partial. All outstanding native release gates
and the unanswered Mini QA-only AppleScript exception remain open.


November 24 Comparison/Resources checkpoint: the 438/67 Mini/Linux/package gate
passes. Twelve cases, three mutations and eight rendered cases support local
Comparison history and deferred requested-module opening. These scoped behavior
checks are recorded with host-shim limits; the accumulated release review and all
outstanding native/source-update/failure/device/assistive acceptance remain open.


November 24 companion-lifetime checkpoint: 447/67 Mini/Linux/package gate passes.
Nine cases, four mutations and eight rendered cases verify newer focus/scroll
ownership, ordinary navigation and preference stability. The 89-source/four-build
review is incomplete; all remaining native/update/failure/device/assistive gates
remain open. See current reports and interlinear-lifetime-2026-11-24.md.


November 24 source-lifetime checkpoint: the 467/68 Mini/Linux/package gate passes.
Twenty cases, six mutations and twenty-two rendered cases verify source consistency,
measurement and UI opening/revision ownership. All 107 production TS files have been
inspected; broader review and all outstanding native release gates remain open.
No simulator was launched and no native Mini UI was operated.


November 24 availability/import checkpoint: 467/68 Mini/Linux/package gate passes.
Twenty controlled browser cases verify disabled affordances, primary-button token
contrast and navigation from advanced inspection to the implemented importer.
The obsolete inactive rights form/future-writer copy is removed. Full completion
and all outstanding native release gates remain open.


November 24 verifier checkpoint: 472/69 Mini/Linux checks pass. Rich-source
verification cannot claim completeness after a skipped projection or retain prior
success after startup failure. All development scripts have source inspection;
full evidence review and every outstanding native release gate remain open.


November 24 management-context checkpoint: 488/70 Mini/Linux checks, deterministic
package/data smoke and isolated deployment pass. Focus/disclosure/scroll and modal
opening ownership have focused unit/mutation/browser evidence; the full native
release matrix and complete accumulated test/evidence review remain open.


November 24 catalogue-update coverage checkpoint: 495/71 Mini/Linux checks pass.
Seven controlled contract cases and three detected/restored defects verify the
existing changed-source update flow. Package/deployed bytes are unchanged. The
full test/evidence review and every outstanding native release gate remain open.
