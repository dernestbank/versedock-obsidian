# SwordDock Bible — Development QA Report

The [November 26 acceptance review](docs/specs/acceptance-2026-11-26.md) covers all 68 required entries. The [release and mobile report](docs/specs/mobile-and-release-2026-11-26.md) identifies the final 0.1.11 ZIP and records physical iPad performance, desktop startup, CI and Orca checks. The [desktop report](docs/specs/native-desktop-2026-11-26.md) records the theme matrix, publisher update and managed-storage failure cases.

Version: **0.1.11 (local developer candidate)** · Date: **2026-11-16** · Internal project directory: `mysword+`

This independent project started under the internal name **MySword+**. Its original public name was **VerseDock**; its current preferred name is **SwordDock Bible**, with no affiliation with the original MySword app.

> **Branding update (2026-11-12):** Visible branding changed to **SwordDock Bible** while keeping the installed plugin ID `versedock` and the existing GitHub repository URL stable. The historical GUI checks below were performed before the rename; rerun the GUI check for final verification. Official trademark clearance is pending.

## Current UI continuation — 2026-11-15

### Dock correction — 2026-11-16

- Parallel follow-up: full Comparison now has independent WEB/KJV selectors, canonical saved passage/source choices, keyboard controls and selected-coordinate highlighting. Native QA verified both selectors, retained focus, unaffected-pane scroll, saved choices and a pinned independent passage after reload. Actual Romans 14 numbering reports WEB-only 24–26 without remapping. Roughly 400 CSS-pixel controls were checked in both themes. Six policy tests cover restored state and actual source-number differences.
- Comparison now also renders actual tagged KJV words and local Word / Lexicon / Occurrences details. Native QA verified pinning, Right / Enter, unpin, contextual full-study modal, G2889's 152 displayed tagged verses and pagination, both-WEB gating, Read tagged KJV and chapter-change clearing. Reader remained WEB / John.3.16 throughout those comparison actions. Labelled verse groups expose the tagged controls in the native accessibility tree. See decision 0006 and `design-qa-comparison-word-study.jpg`.
- Typography follow-up: both Appearance and plugin Settings now support line height 1.15–2.00 in 0.01 steps; the earlier 1.55 floor prevented the reference's dense reading style. Defaults and saved values remain unchanged. Native keyboard QA set exactly 1.30, then restored 1.68. Escape now dismisses the Appearance popover with focus returned to its button. In Focus mode, Escape from its Reset typography button preserved Focus; a second Escape restored both docks. Evidence: `design-qa-focus-appearance-escape.png`. Native test-vault verification subsequently resumed and completed the checks described above.
- Dock density follow-up: all five bundled resources now fit together as compact rows with native detail tooltips. Reduced Study card padding and a three-line overview commentary excerpt keep Commentary, Cross-References and My Notes together in the tested window, with credits retained. Reader stays selected in navigation while Study or docked Parallel has focus. Saved current dark/light captures: `design-qa-study-density.png`, `design-qa-study-density-light.png`. Native theme and word-selection checks pass; exact reference viewport remains unverified.
- Linked-note cards now show the indexed title, bounded plain-text excerpt and modification time. Metadata events refresh relevant cards after edits, additions, renames and deletion. Discovery remains metadata-based; only the first three Study cards or five Notes cards read their displayed file, with a 256 KiB file cap. Native QA confirmed live excerpt refresh, opening/reusing an ordinary Markdown tab, and removing the disposable fixture from the index. New notes record the selected edition.
- Focus now collapses both native docks while a central Reader is active and restores each original collapse flag independently. Switching to Markdown restores the workspace; returning to Reader reapplies Focus. The snapshot survives reload. Native QA covered an asymmetric starting state, reload, both docks open, and Quick Jump Escape isolation followed by Reader Escape restoration. The floating navigator reserves space below Scripture. Captures: `design-qa-focus-dark.png`, `design-qa-focus-restored.png`, `design-qa-note-preview.png`, `design-qa-study-current.png`.
- Latest gate: **33 test files / 221 tests**, strict TypeScript, production build and test-vault deployment pass. The preview package uses the explicit 284-file asset inventory and clean-install/offline-restart smoke check. Current native Comparison checks are complete; final Reader evidence is `design-qa-study-verified.jpg`, with both native docks open and actual study content. Exact pixel matching and mobile-device behavior are not claimed.
- Final offline preview: `dist/SwordDock-Bible-0.1.11-offline-preview.zip`, 284 entries / 21,909,773 bytes, SHA-256 `ad7ac3ade33c6ad164204fcdaec6adaa2871fee012dd2ef4cf10a750f01f11d8`. Clean installation, all bundled assets and restart reads pass. No commit or publication was made.
- The populated Reader footer is now a compact Word / Lexicon / Occurrences panel, with source headword, documented Robinson grammar, a short definition and visible dictionary attribution. Pointer previews update only this footer; clicking or Enter pins a word. Explicit Unpin clears it. A manual collapse now survives unrelated Reader renders instead of reopening automatically.
- Occurrences now returns exact matching displayed-tagged-verse totals and all results via 25-row pages. Native G25 QA traversed 1–25, 26–50, 51–75, 76–100 and 101–109, with keyboard focus retained and the final Next control disabled. These are KJV displayed-tagged-verse counts, not a claim about total Greek word occurrences.
- Native QA also confirmed hover preview at John 3:15 while Reader selection stayed John 3:16, pinning the preview, keyboard tab navigation, unpinning, manual collapse after a reversible bookmark update, both themes and a roughly 360 CSS-pixel Reader. A pane-width observer now keeps the selected verse visible during reflow; it ignores height-only footer changes. Saved captures: `design-qa-word-details-dark.png`, `design-qa-word-details-light.png`, `design-qa-word-details-narrow.png`, `design-qa-word-occurrences.png`. Dark theme and the original dock width were restored.
- Prior word-study gate: 30 test files / 197 tests, strict TypeScript and production build pass. Word-state tests cover hover/pin stability, manual collapse, clearing and tab changes; morphology tests cover documented verb/nominal forms and refusal of unknown combinations; real-data tests verify the exact G25 count and non-overlapping pages. Full reference fidelity is still open.

- Tagged KJV and actual Strong’s dictionaries now power Instant Details and the Lexicon dock. Reader edition selection persists; copy, Quick Jump, insertion and text search use that edition. KJV red-letter and added-word markup are retained. Source morphology is displayed as codes, with Greek forms from the source rather than invented alignment to WEB.
- Native QA selected John 3:16 “loved” → G25 / ἀγαπάω / agapao / V-AAI-3S; Right moved focus to the next tagged phrase. Full word study returned the first fifty tagged verses, beginning Matthew 5:43. Genesis 1:1 “God” → H430 showed the actual Hebrew dictionary entry. Reload preserved KJV, and both Parallel surfaces showed distinct WEB/KJV text.
- Current evidence: `design-qa-word-study-dark.png`, `design-qa-word-study-light.png`, `design-qa-parallel-kjv.png`. Both theme captures show the left module navigation, right Study cards, red-letter Reader and populated bottom word details. Original dark theme was restored. Library/Storage report five resources / 275 measured files / 90.4 MB / zero missing. These checks supersede the older missing-lexicon/second-edition statements below; full reference fidelity is still unproven.
- Gate: strict TypeScript, 29 test files / 188 tests and production build pass. Re-exporting the pinned sources produced identical checksums for all 72 KJV/dictionary assets. Native final reload confirmed KJV as the current default and WEB as a separate offline resource; the Reader was left on John 3:16 with G25 details populated. The explicit 284-entry preview package passes clean-install and offline restart verification.

- Commentary is now backed by the bundled public-domain CrossWire MHC 2.2 complete edition. The Study card shows the actual matching source section, and Read more opens paginated headings, quotations and paragraphs. A selection spanning sections returns both once; opening a commentary passage preserves its complete range in the Reader.
- The source conversion uses the installed SWORD 1.9.0 C API at build time, validates each returned OSIS coordinate against the requested WEB coordinate, and groups identical adjacent entries within a chapter. The plugin ships no SWORD binary or runtime dependency. All 66 regenerated book checksums were identical on a second build.
- Coverage: 4,249 sections / 31,096 WEB coordinates. The source has no usable entry for Josh.18.1, 1Sam.25.1, 2Sam.22.1 or Prov.11.20; KJV coordinate resolution does not match WEB's Rom.14.24–26. These seven are listed in the manifest and source notice, and are never remapped.
- Native QA read all 46 blocks of John 3:1–21 using the continuation button by keyboard, opened that complete range in the Reader, pinned it while moving to John 4, then unpinned and loaded John 4's four source sections. More sections revealed the last two with correct focus. The Library and Storage views report three resources / 203 measured files / 47.7 MB / zero missing.
- Saved native evidence: `design-qa-commentary-dark.png` and `design-qa-commentary-light.png`; both show actual commentary, cross-references and the linked note. Original dark mode was restored after the light check. Current gate: 28 files / 180 tests, TypeScript, production build and a 212-entry clean-install/restart package check pass. Lexical/tagged-word content and full visual fidelity remain unfinished.
- Populated narrow-card and full-text captures are saved in `design-qa-commentary-narrow.png` and `design-qa-commentary-detail-narrow.png`. The full-text check exposed the long leading Scripture quotation; it now sits in a native disclosure so the commentary is immediately readable. Expansion/collapse was verified in Obsidian, with the quoted source text retained in full.
- Visual-density pass: removed the duplicate native Reader title/action header, reduced its toolbar to 44px, tightened Study section spacing, added icons to the three right-dock tabs, and made the three inline cross-reference previews two lines each. Detailed References retains the longer excerpts.
- Compact study now has distinct verse spacing and is available in Appearance alongside Classic and Focus. Native reload retained Compact study with size 17, leading 1.68 and width 65. Both line-height controls now use a 0.01 step so the default 1.68 is represented accurately.
- Focus now stores the previous Classic/Compact layout. Command, menu, Appearance, Escape and Exit use one transition path. Native testing entered Focus from Compact study, reloaded and used Exit; Appearance confirmed Compact study and unchanged typography. Mode changes now recenter the selected verse instead of retaining an incompatible pixel scroll position.
- Saved current evidence: `design-qa-study-desktop.png` and `design-qa-study-narrow.png`, both 2940 × 1846 unmodified native captures. The narrow capture shows a roughly 240 CSS-pixel Inspector with all three tabs visible; Right opened Parallel and Home restored Study with correct keyboard focus. Gate: 27 files / 173 tests, TypeScript and production build pass.
- Cross-References now uses a bundled, attributed OpenBible.info CC BY 4.0 coordinate snapshot: 344,016 retained records from 344,799 source rows. Conversion omitted 651 targets spanning chapters and 132 unavailable coordinates; it does not remap versification or include website Scripture quotations.
- Study displays three local WEB excerpts; References displays up to twelve deduplicated targets ranked by source votes. Native navigation John 3:16 → Romans 5:8 retained a pinned John 3:16 Inspector; unpinning updated the related passages to Romans 5:8. Library and Storage show both actual resources, 135 measured data files, 10.2 MB and no missing files.
- Native evidence is saved in `design-qa-crossrefs.png`. Full checks pass at 27 files / 171 tests, strict TypeScript and production build; the 144-entry offline preview passes clean-vault installation and restart reads. Commentary/lexicon content and full reference fidelity remain outstanding.
- Navigation content now scrolls above a fixed footer so the additional active resource cannot push Settings and Help out of view. Native post-reload evidence confirms the utilities remain visible. Selected range continuation rows no longer reserve blank action-rail space.
- The Inspector header now toggles Follow/Pinned. A pinned passage drives the Study, Parallel and Notes content and actions independently of Reader navigation, persists with endpoints in workspace state and falls back to Follow for malformed state.
- Native test pinned Notes to John 3:16, navigated Reader to John 4, reloaded and observed John 3:16 retained in the Inspector. Unpinning immediately updated Notes to John 4. Pin restoration/range validation is unit-covered; current gate is 26 files / 164 tests.
- Notes now presents its list directly beneath the three primary dock tabs, without the redundant secondary resource strip. Discovery details are an optional disclosure. Markdown note opening reuses an existing note leaf when available.
- Native verification opened the indexed John 3:16 note from Notes twice and observed one note tab; returning through Bible Reader restored John 3:16 while keeping the Notes dock available. All 163 automated tests, TypeScript and build/deploy gates still pass.
- Study/Parallel/Notes are now actual primary right-dock tabs with semantic tab panels, roving focus, arrow/Home/End navigation and persisted selection. Parallel renders the current WEB passage or selected range inside the dock with Copy, edition details and explicit full-comparison/library routes. A second uninstalled edition is identified honestly.
- Native verification selected Parallel at John 3:14–16, confirmed all three local verses in the dock while the Reader remained central, used ArrowRight to reach Notes and Home to return to Study with focus restored. Keyboard policy is unit-covered. Current gate: 26 files / 163 tests, TypeScript, build and test deployment pass.
- Left-dock utility controls now open Settings and Help. The settings modal reuses the native plugin-settings renderer and persisted settings; the guide links to Settings and Study Desk and explains navigation, selection, notes, dock resizing and installed-resource availability. Native Help → Settings navigation passed.
- Fixed uppercase keyboard values produced by Shift+J/K. Native verification selected John 3:14, then Shift+J selected 14–15 and a second Shift+J selected 14–16, with the Inspector following both changes. The case-handling regression is unit-covered.
- Current gate: 26 files / 162 tests, strict TypeScript, production build and isolated test-vault deployment pass.
- Reader composition follow-up: Classic/Compact now use a small left-aligned chapter heading; Focus keeps the centered editorial masthead. Removed repeated edition/provenance lines from the study heading (edition remains in the toolbar and resource surfaces).
- Selected passage actions now show Copy, Note, Bookmark and a native More menu. Insertion, Highlight, Commentary, Study Inspector and Compare remain reachable through the menu. Native John 3:16 verification confirmed the compact rail, menu entries, note discovery and the left-aligned John 3 chapter heading.
- Study-card collapse choices now persist in workspace state, remain stable on passage changes and restore after reload. Unknown stored card names are ignored. Native verification collapsed Commentary, navigated Romans 11 → 12 and reloaded; Commentary remained closed while Cross-References and My Notes stayed open.
- Native dock resizing reviewed a roughly 420-CSS-pixel Reader and 240-CSS-pixel right dock. Reader toolbar controls reflowed into two rows; Study/Parallel/Notes and card actions remained visible with wrapping text. The test vault was returned to balanced desktop widths.
- Current automated gate: 26 files / 161 tests, TypeScript and production build pass; deployed to the isolated test vault.
- Toolbar follow-up: secondary Reader actions now use a native Obsidian overflow menu; navigation/history, edition, link group, Quick Jump and Appearance fit a single desktop row. Narrow panes retain Quick Jump and typography, wrap into deliberate rows and provide 44-pixel action targets. Removed positional CSS that silently hid controls.
- Native verification opened the Reader actions menu, entered Focus mode from its checked menu command, and used Exit to restore the toolbar and desktop Instant Details bar. Full gate remains 26 files / 160 tests with production build and test-vault deployment passing.
- Follow-up: Inspector tabs now restore from Obsidian workspace state; malformed state falls back to Study. Left navigation responds to Inspector tab changes through a plugin DOM event instead of synthesizing a native workspace event.
- Desktop Reader now exposes the Instant Details bottom bar as well as narrow panes. Its expansion survives Reader rerenders, and Focus mode hides it. The panel reserves layout space rather than covering Scripture.
- Fitting the test window to its display removed the previously captured right-edge cutoff. Native capture now shows the complete Study/Parallel/Notes controls and card boundaries. Expanding desktop Instant Details and restoring the selected Notes tab after app reload both passed native testing.
- Current automated gate: 26 files / 160 tests, strict TypeScript, production build and test-vault deployment pass.
- Added a dedicated native left navigation view with Reader, Search, Module Library, Parallel Compare, Notes, Highlights, Bookmarks, History, active WEB resource and workspace actions.
- Reader opens the left navigation and right Study dock; Study Desk repairs old plugin-owned side placements, reopens full-page tools centrally and restores Reader focus.
- Added a combined right Study overview with collapsible Commentary, Cross-References and My Notes, plus Study/Parallel/Notes navigation. Highlights now has a working Inspector route.
- Native Obsidian light/dark verification covered both docks, full-height right Study sections after upgrade migration, central Search, Highlights routing and reload. Full fidelity is still under review as recorded in `design-qa.md`.
- Automated verification: 26 files / 159 tests, strict TypeScript and production build passed; three migration tests cover state preservation, existing central leaves and failure recovery.

- The current local UI pass now includes a native chapter-level Comparison view, persistent Reader/Comparison Study Link assignments with Follow or Pinned behavior, colored link indicators, and a measured Storage & resources review surface.
- The Module Library exposes the design-plan navigation order **Get started → Discover → My library → Downloads → Import**, with truthful no-catalogue, external-source and read-only MySword inspection states.
- Reader Focus mode now quiets plugin chrome, keeps a compact floating Previous / Next / Exit chapter navigator discoverable, exposes an accessible pressed-state toggle, provides an explicit Escape exit path, and preserves the active passage while controls are restored.
- Study Link assignments are normalized on load, malformed persisted state fails closed to Unlinked/Follow, and valid assignments survive an Obsidian reload in the isolated test vault.
- The read-only MySword review now surfaces source bytes, SHA-256, chapter coverage, inspection time, planned storage layout, unsaved rights/provenance fields and an explicit `Eligible for write: No` state; it still creates no staging directory or imported module.
- Reader range selection now remains a first-class passage: every verse in a selected range receives the visible and accessible selection state, the action rail appears at the range start, and copy/highlight/bookmark/note actions retain both endpoints through reload and study links.
- Reader verse actions now include a direct Commentary route that opens the Inspector on the Commentary tab; the desktop action rail reserves space for all contextual controls and collapses into a stacked rail in narrow panes.
- The Library Discover route now opens a dedicated read-only WEB edition detail modal with verified provenance rows, source link, checksum, measured local footprint and explicit Reader/Library actions.
- Narrow Reader panes now expose a collapsed, keyboard-operable Instant Details surface whenever a verse is selected; it explains the missing lexicon state and routes to the Inspector without fabricating lexical data.
- Reader selection can now be extended directly with Shift-click or Shift+Enter; the shared reference helper normalizes forward, backward and no-op extensions, and the new range behavior is covered by the references suite.
- Shift+J and Shift+K now extend the same selected passage through the Reader's existing keyboard verse navigation; the settings shortcut copy documents the gesture.
- Open Bible Study Desk is now an explicit controller workflow: it opens Reader and Inspector together, then returns active focus to the Reader for the next study action.
- Offline passage loading now rejects incomplete ranges when the requested endpoint is absent from the chapter; range previews no longer silently truncate invalid references.
- Search now follows Reader context while the pane remains open: Current chapter/book labels and the selected-book control update from the active reference, and active context-scoped queries refresh without moving focus.
- Search preserves a manually chosen Selected book while Reader navigation continues; only context-following scopes update their book context automatically.
- Repeated Shift+J/Shift+K now grows an existing range from its forward/backward edge instead of repeatedly reselecting the first adjacent verse; endpoint behavior is covered by the references suite.
- Quick Jump now presents an explicit offline-loading state between a valid reference parse and its passage preview, avoiding a blank modal during local file reads.
- Quick Jump now closes before applying a parsed passage and isolates modal Enter/click events from the underlying Reader, while preserving native Escape-to-close handling; the range preview is verified, and automated native activation remains called out as a verification limitation in `design-qa.md`.
- Full verification for this pass: **25 test files / 154 tests**, strict TypeScript, production build, deployment to the isolated test vault and `git diff --check` all pass. Native Obsidian verification covered the link indicator, reload persistence, Comparison shell, Focus-mode restore, Library tab keyboard navigation, Resource Info and the protected Storage & resources row.
- Remaining intentional boundaries: no network catalogue/download writer, no MySword conversion/install writer, no second translation, and no provider-backed commentary/lexicon data. Bundled OpenBible cross-references are now available as described above. The proposed import/storage contract in `docs/specs/authorized-mysword-import.md` remains separate from these bundled release assets.

## Obsidian study-note backlinks — 2026-11-15

- The Notes tab now includes ordinary Markdown notes that Obsidian's resolved-link index identifies as linking to the existing primary study note. It still reads no note bodies and creates no proprietary backlink store.
- The exact primary note remains first even when older than other matches or missing Scripture frontmatter; other frontmatter/backlink matches remain recent-first and path-deduplicated.
- Resolved-link counts fail closed unless they are positive safe integers. Existing 5,000-file and 50-result bounds, partial-state reporting, range compatibility and normal note opening remain intact.
- Full verification passes at 134 tests across nineteen files, strict TypeScript, production build and zero dependency findings. Zero-count and primary-order mutations fail as required. Live Obsidian QA created the canonical John 3:15 note, discovered a second ordinary Markdown note as a resolved backlink, retained primary-first ordering and opened the backlink successfully.

## Range-safe Scripture study notes — 2026-11-15

- New range notes preserve both endpoints in canonical frontmatter (for example `John.3.16-18`) and use endpoint-aware filenames, preventing collision with the starting verse's note.
- Positively identified range notes generated by older previews reopen at their existing start-only path without content changes. A genuine single-verse note at that path is never reused or overwritten for a range.
- Discovery continues to use only Obsidian's bounded metadata cache. General settings, bookmarks and reading history retain their existing OSIS representation.
- Full verification passes at 127 tests across nineteen files, strict TypeScript, production build and zero dependency findings. Reversing the legacy heading-signature check fails both recovery and collision tests as required.

## Scripture-linked note discovery — 2026-11-15

- The Study Inspector Notes tab now discovers exact canonical OSIS links in Obsidian's cached `scripture` frontmatter plus resolved backlinks to the primary note, and opens the resulting normal Markdown files. Note bodies are never read for discovery.
- The established primary-note path is looked up directly and prioritized. Remaining discovery examines at most 5,000 indexed Markdown files, displays at most fifty recent matches and truthfully reports partial scans/additional results.
- Scalar or bounded-array frontmatter is validated fail-closed; invalid, oversized and non-string values are ignored. Same-path primary entries are deduplicated even if Obsidian returns different object identities.
- The UI retains create/open and copy behavior, adds refresh, relative-path context and honest empty/partial states, and does not introduce proprietary note storage.
- Full verification passes at 134 tests across nineteen files, strict TypeScript, production build and zero dependency findings. Scan-bound, backlink-count and primary-order mutations fail as required; the primary-create, two-note discovery and linked-note opening flow passes live in the disposable vault.

## Scoped offline Bible search — 2026-11-15

- Added canonical Whole Bible, Current chapter, Current book, Selected book, Old Testament and New Testament filters. Searches remain offline, accept no caller-controlled resource path, cap phrases at 200 characters and results at 200, and stop superseded/closed work between books and chapters.
- Current chapter requires a safe canonical chapter context, scans only that chapter in the active book and reports missing chapters truthfully. Automated corpus coverage and a reversed-predicate mutation pass; live John 3 search returned only John 3 results, including John 3:16.
- Selected book exposes the bundled 66-book inventory, canonicalizes the selection by OSIS and loads only that book. Forged resource identifiers, missing selections and unsupported books fail closed; live Psalms selection returned only Psalms results.
- Added Exact phrase, All words and Any words matching. Word modes ignore order and duplicate terms; All words requires every whitespace-delimited term while Any words requires at least one. Both refuse more than 16 entered words.
- Result verses now highlight all literal matches through a fixed `<mark>` and DOM text nodes only. Ranges are case-insensitive, overlapping ranges merge, regex punctuation is escaped, and the target changes only after the detached fragment is complete.
- Result counts now distinguish exactly-at-limit results from genuine truncation by reading at most one extra match. A focused mutation from `>` to `>=` fails on the exact-limit regression.
- The narrow search pane wraps its controls, focuses the phrase field on open, exposes labeled scope/input controls, and announces progress/counts through a separate polite status region. Live QA exposed and repaired a flex-specific defect that kept the hidden Selected book label visible outside that scope; computed display now switches between `none` and `flex` correctly.
- Live Obsidian 1.15.1 checks in ignored `.research/qa/clean-gui-011-final` cover every scope and all three match modes. John 3:16 appears in Whole Bible, New Testament, Current book and Current chapter, is excluded from Old Testament, Selected book isolates Psalms, and Any words matches `world shepherd` through `world` while highlighting only present terms. The `80+` state appears only when an additional match proves truncation.
- Full verification passes at 134 tests across nineteen files, strict TypeScript, and the production build. Deliberately reversing the chapter predicate, trusting a selected-book resource identifier, weakening All words to Any word, strengthening Any words to All words, removing the hidden-control CSS contract or treating literal input as regex fails the focused suites. This remains a bounded filter slice, not a claim of boolean, regex, morphological or indexed search.

## Fresh 0.1.11 installation and resource recovery — 2026-11-15

- Extracted the final reproducible 76-file 0.1.11 preview ZIP into a new ignored `.research/qa/clean-gui-011-final` vault, opened it through Obsidian's native vault picker, accepted the local-author trust prompt, and enabled **SwordDock Bible 0.1.11** under stable plugin ID `versedock`.
- The ribbon opened the offline Reader at John 3:16. Obsidian's **Reload app without saving** command restored the Reader workspace and the same passage using only the extracted plugin and WEB resources.
- An earlier disposable `.research/qa/clean-gui-011-fresh` cycle temporarily moved only its `JOH.json` and exposed the file's absolute vault path in the otherwise truthful **Chapter unavailable** state. A focused failing test reproduced the privacy bug before the library boundary was repaired.
- The repaired build reports only `The installed offline Bible data for John is missing or unreadable.` Loading, Search, copy and Reader consumers now receive the same safe failure, while the Module Library integrity report uses a fixed problem description. Restoring `JOH.json` and reloading returned John 3:16 without altering a personal vault.
- Replaced only the final disposable vault's John file with malformed JSON. The packaged Reader retained the safe error, while **Verify installed Bible** reported file-size mismatch, SHA-256 mismatch and invalid JSON without a path. Restoring the original file returned the integrity report to 66/66 and John 3:16 after reload.
- Missing and malformed `library/webp/manifest.json` cycles now show package-level recovery guidance instead of builder/test-vault instructions. Restoring the original manifest and choosing **Recheck offline library** recovered John 3:16 without an app reload; the manifest matched the repository source afterward and no backup remained.
- Full verification passes at 134 tests across nineteen files. The current 76-file package remains reproducible; clean extraction and simulated offline restart still cover all 66 books and 31,103 verses.

## Inspector tab keyboard navigation — 2026-11-15

- Added a roving tab stop for the seven Study Inspector tabs, including Resource Info. Left/Right Arrow wraps, Home/End moves to the edge, and unrelated keys remain available to the tab button or Obsidian.
- Selecting a tab by pointer or keyboard rebuilds the panel with the destination tab focused and scrolled into view, addressing narrow-pane overflow without forcing the tab strip to wrap.
- Each tab now owns an instance-scoped ID and `aria-controls` relationship; the shared `tabpanel` names its active tab through `aria-labelledby` without duplicate IDs if Obsidian restores more than one Inspector leaf.
- Live 0.1.10 testing exposed that Obsidian's focus manager still visited inactive native buttons despite `tabindex="-1"`. The 0.1.11 repair keeps only the selected tab as a native button while inactive choices remain pointer-operable ARIA tabs.
- Focused RED/GREEN tests and deliberate ArrowRight/native-element mutations cover the navigation policy, focus-manager repair and duplicate-view IDs. The current full verification passes at 134 tests across nineteen files.
- Live 0.1.11 QA in the isolated Obsidian 1.15.1 vault confirmed End navigation and far-edge reveal, Right wraparound, destination focus, and Tab exiting the tab list. The History tab remained visible and selected in the narrow pane.
- Selecting the older Romans 8:28 history entry returned the Reader to it, promoted it ahead of Romans 8:27, and preserved both the current reference and reordered history across an app reload. Destructive clear-button execution remains approval-gated and unverified.

## Bounded reading history — 2026-11-15

- Added a migration-safe, most-recent-first reading history with a hard 50-reference storage cap, 500-entry migration scan cap and 64-character per-entry bound. Stored values are canonical OSIS; invalid, duplicate and user-edited legacy values are ignored without touching other settings.
- Every valid Reader selection records the passage through the same settings save used by current-reference restoration. Existing bookmark, highlight, appearance and stable plugin-ID contracts are unchanged.
- Added a Study Inspector History tab with truthful empty state and local-settings privacy language. Selecting an item reopens it in the Reader and promotes it to most recent; an explicit clear action erases only reading history.
- Automated coverage at this checkpoint was 97 tests across thirteen files. History navigation, MRU promotion and reload persistence were subsequently verified live as described above; the destructive clear action, sync-tool and mobile behavior remain pending.

## Cooperative conversion preflight — 2026-11-15

- The Obsidian inspector now runs the existing read-only semantic scan in 1,000-row batches, yielding to the event loop between batches and cancelling through the modal revision guard when the file or modal changes.
- Synchronous CLI/benchmark and cooperative UI paths share one scan state and finalizer. Tests prove identical reports, bounded yield counts, cancellation, source-byte preservation and rejected batch sizes; statements/databases close through every failure path.
- The ignored 31,103-verse publisher WEB fixture produced identical cooperative and synchronous diagnostics. On Node 22/darwin arm64, the cooperative simulation yielded 31 times; its 32 work segments measured 5.127 ms p95 and 26.795 ms maximum, including the initial preview-validation segment.
- Automated coverage at this checkpoint was 93 tests across twelve files. The cooperative implementation was subsequently re-verified in Obsidian 1.15.1 against the ignored 31,103-verse publisher WEB fixture: the live report matched the established marker/reference/semantic totals, blocked conversion and installation, and left the source checksum unchanged. Slow-device/mobile profiling and actual UI long-task tracing remain pending.

## Inspector keyboard accessibility — 2026-11-15

- The read-only conversion-preflight button now restores keyboard focus on the next animation frame after its asynchronous analysis completes, but only when focus settled on the document. Focus deliberately moved to another control is never reclaimed.
- Obsidian 1.15.0 verification in the isolated `test-vault` confirmed chooser-to-preflight Tab order, Return activation, retained focus, literal hostile HTML, blocked conversion, and plain accessibility-tree diagnostics.
- At this checkpoint, automated coverage was 86 tests across eleven files. Actual VoiceOver announcement/navigation remains pending because changing the macOS assistive setting requires explicit user approval.

## Full-corpus performance QA — 2026-11-15

- Added `npm run qa:mysword:benchmark -- /absolute/path/module.bbl.mybible [iterations]`, a read-only, bounded 3–25 iteration benchmark with one untimed warm-up. It excludes file I/O, hashing, bundling and sql.js/WASM initialization from operation timings.
- A 25-run Node 22/darwin arm64 pass over the ignored 5,414,912-byte publisher WEB fixture measured preview median/p95 at 25.344/27.440 ms, semantic conversion-preflight median/p95 at 73.228/99.287 ms, and combined median/p95 at 98.873/126.184 ms.
- Every iteration retained the fixture SHA-256, 66-book/31,103-verse counts and all semantic totals. The command outputs no Scripture, writes no files and cannot install a module. Process RSS sampled after iterations rose from 95.078 MiB baseline to at most 99.766 MiB; this is not an in-operation peak or device-wide profile.
- Automated coverage is now 90 tests across twelve files, including unreadable-path redaction. These measurements are desktop evidence only; slow-device, mobile and UI long-task profiling remain pending.

## Safe GBF semantic inspection — 2026-11-15

- Added a bounded, lossless semantic event layer for supported GBF typography, paragraph/separator/poetry structure, validated RX metadata, translator notes, and titles. Exact raw text and UTF-16 source spans remain authoritative.
- HTML, lexical/interlinear, malformed, unknown, excessive nesting, and unsupported escape/entity syntax remain visible but make a verse ineligible for complete semantic interpretation.
- Added an isolated fail-closed DOM renderer primitive. It uses detached fragments, text nodes, and fixed tag/class allowlists; opaque or inconsistent events fail before target mutation. It is not connected to module conversion, installation, or the Reader.
- The read-only preflight now reports semantic diagnostics. The ignored publisher WEB fixture remains exact across 31,103 verses: 15,866 of 15,870 markup verses fully interpreted, seven opaque events, 1,126 translator notes, 169 titles, and conversion still blocked.
- Automated coverage is 81 tests across ten files; strict typecheck/build, zero-vulnerability dependency audit, and mutation checks pass. The reproducible 0.1.6 package and clean-install/restart smoke test pass. No writer, installer, or public release was added.

## Safe RX cross-reference semantics — 2026-11-15

- Added strict, non-rendering parsing for documented MySword `RX` single-verse/range forms and the publisher-observed cross-chapter form. Parsed endpoints are bounded to the existing 66-book scope; invalid, descending and oversized targets remain exact unresolved source tokens.
- Re-scanned the ignored publisher WEB module: 31,103 verses, 71,821 recognized GBF markers, seven inert HTML markers, 424 validated RX markers, zero unresolved markers and zero tag-issue verses. Conversion remains blocked for all 15,870 markup-bearing verses.
- Conversion preflight and the inspector UI now distinguish validated from unresolved RX markers and state that coordinates are not followed and do not verify edition versification.
- Automated coverage is 64 tests across eight files. The deterministic 0.1.5 package and clean-install/restart smoke test passed; live Obsidian 1.15.0 inspection in the isolated `test-vault` kept hostile HTML literal, blocked conversion and displayed the new RX diagnostics. No importer, writer, HTML renderer or public release was added.


## GBF tokenizer and full-corpus validation — 2026-11-14

- Implemented pure, non-rendering GBF lexer at `src/core/mysword-gbf.ts`: preserves original token bytes-as-text and precise UTF-16 source offsets. Recognizes documented inline/pair markers, paragraph and poetry directives, notes, cross-reference coordinates, Strong's and morphology markers; distinguishes inert HTML and unrecognized tokens. **No Scripture conversion, mutation, installation or publication.**
- Scanned all **31,103 verses** from the publisher-hosted WEB MySword SQLite QA fixture: **31,103 source round-trips succeeded and 0 failed**. Found **71,820 known GBF markers**, **7 HTML markers**, and **1 unsupported citation** in Hebrews 11:34 (MySword reference pattern `<RX 12.6.31—7:20>`); the original reference is preserved verbatim for later chapter-spanning interpretation, not discarded or falsely auto-translated.
- The conservative conversion preflight still blocks all **15,870 markup-bearing verses** and now reports the lexical diagnostics without rendering or executing markup. Nonempty module-defined `VerseRules` and `CustomCSS` also explicitly block conversion until safe, documented rendering rules exist.
- Automated unit tests expanded to **55 passing tests** across eight test files; updated package remains an **unpublished development candidate**. The new lexical diagnostics were verified live in Obsidian 1.15.0 in the disposable `clean-gui-012` vault after upgrading it to 0.1.4: the intentionally hostile HTML fixture appeared literally, the report showed one inert HTML marker, zero recognized GBF markers, and conversion was blocked. Live full-sized QA in the GUI, performance on slow devices, note/cross-reference fidelity, and legal content permissions are pending.

## New fresh-vault GUI and conversion-preflight QA — 2026-11-14

- Installed the unmodified **0.1.2 ZIP** into a new disposable `.research/qa/clean-gui-012` vault using Obsidian **Open folder as vault**, accepted the *local* author-trust prompt, and verified **SwordDock Bible 0.1.2** appears as the enabled community plugin with stable ID `versedock`. The built-in command palette opened the SwordDock Bible Reader and showed John 3:16 from installed offline WEB data in dark mode. No other vault was altered or restarted; evidence screenshots are retained only in ignored QA.
- Added **read-only text-conversion preflight**, separate from MySword inspection. The UI button reports canonical chapter mismatches, Strong's/RTL restrictions, HTML/escape markup, empty verses, and licensing/versification review requirements. It never creates, installs or exports any Bible. A pure-text technical candidate is **not** clearance to install.
- Tested the official publisher-hosted WEB `.bbl.mybible` with this stricter preflight: **15,870 of 31,103 verses contain markup-like content**, so conversion is blocked rather than stripping tags and changing Scripture wording. Canonical book/chapter checks found zero mismatches. The publisher-hosted text uses MySword tags including `pi3`, `ci`, `pf2`, `pf1`, `cm`, `fr`, `rf`, and `rx`; these **must not be stripped** without a semantics-preserving parser. This third-party QA module stays outside the repository and package.
- Seven new conversion tests assert text-only candidate analysis, markup/Strong's/RTL and out-of-canon rejection, empty verse diagnostics, byte preservation, and matching canonical chapter counts. **44/44 tests passed** (seven test files) and the 0.1.3 preview package passed deterministic build and isolated offline-file smoke tests.
- The **0.1.3 preflight button was live-tested** in the separate disposable `clean-gui-012` Obsidian vault after updating only that vault from the 0.1.3 offline ZIP. The synthetic malicious-markup example correctly displayed **Automatic plain-text conversion blocked**, with the markup count, rights notice and versification warnings; its source was displayed as literal text. No module was written or installed. The GUI preflight still runs on the main thread and needs slow-machine memory/latency profiling. No general-purpose MySword markup parser, licensed conversion or writer exists yet.

## MySword import research & preview — 2026-11-14

- Implemented a read-only desktop file picker that inspects user-selected `.bbl.mybible` Bible SQLite databases in memory using an offline, MIT-licensed sql.js WebAssembly engine (bundled with its license). **No Bible conversion or installation is claimed.**
- Validates file signature and 24 MiB limit, actual `Details`/`Bible` tables, required columns, SQLite quick-check, verse count, reference numeric bounds, duplicate rows and metadata record count. Imported HTML/CSS/versification is not interpreted, stored or rendered; sample verses use safe text nodes.
- Eight synthetic SQLite tests validate the happy path, malformed or mismatched modules, duplicate verses, invalid references, invalid metadata, and a full 31,103-verse generated corpus. The full-size test found five valid empty WEB verse entries; these are accepted and flagged for review. **37 total automated tests pass** (6 test files).
- Updated Vitest to 4.1.12 and re-ran dependency auditing: zero known npm audit findings on this development checkout (as of this date).
- The inspector has now been **GUI smoke-tested inside the existing isolated Obsidian test vault** after disabling and reenabling only that plugin (no full Obsidian restart or personal-vault changes). Command palette branding and the read-only file chooser work; an intentionally hostile HTML snippet remained plain text inside the resulting verse preview. A fully clean **0.1.2 GUI** vault installation has subsequently been tested, as recorded above.
- Downloaded the publisher-hosted public-domain World English Bible MySword module for **local read-only QA only** (August 4, 2025 source, 5,414,912 bytes uncompressed, SHA-256 `d0605fb28dbb0aee37f078931fdc54925295f846b068b954da2d1923011b2bb5`). The production inspector recognized 66 books and 31,103 verses; the reproducible 25-run desktop benchmark is recorded above. The file remains in ignored `.research/qa/` only, **not in Git or the release ZIP**; no rights for other modules are inferred. GUI use with this full-sized file, slow-device/mobile profiling and in-operation peak-memory tracing remain future acceptance criteria.
- Added a reproducible developer command `npm run qa:mysword -- /absolute/path/module.bbl.mybible`; it prints SHA-256, metadata and sample reference coordinates without printing the verse text or writing data to disk. One more synthetic test verifies publisher-style metadata and byte-for-byte input preservation.

## Additional QA continuation — 2026-11-14

- Earlier automated ZIP install into a disposable vault succeeded for the independent 0.1.1 package; all 74 original entries and 66 books were extracted and checked. All 31,103 verses verified on initial and simulated offline restart reads. This is a filesystem/packaging smoke test, **not** an Obsidian fresh-GUI installation test.
- Replaced viewport-dependent Reader breakpoints with pane-width container queries; narrowed controls retain Quick Jump. Verse text selection no longer triggers a rerender, and bookmark/highlight buttons announce their pressed state.
- Existing live Obsidian test-vault window still showed the cached `VerseDock (Preview)` command prefix after replacing the plugin files, although installed `manifest.json` says SwordDock Bible 0.1.1. A complete Obsidian restart or deliberate plugin reload is required for honest GUI re-verification. Do **not** count this old in-memory command as a successful 0.1.1 UI test; other open vaults were left running.
- GitHub Actions no longer hardcodes the old 0.1.0 ZIP name and calls the new offline package smoke command.
- Preview ZIP builder now enforces an exact allowlist and deterministic timestamps/permissions; two consecutive builds produced matching SHA-256 checksums. This guards against accidentally distributing private data or stray files.

## Development continuation — 2026-11-14

- Replaced modal insertion with captured-note and selection guards: a moved cursor, changed document or closed Markdown editor cannot be overwritten; clipboard fallback is attempted safely.
- Normalized multiline Scripture Markdown with WEB attribution; added live preview announcement.
- Corrected duplicate SwordDock Bible Reader label and preserved keyboard focus when navigating verses in a rerendered reader pane (GUI keyboard test still pending).
- Added on-demand Module Library integrity verification of all 66 book files using recorded SHA-256 hashes, file lengths and structural counts. Hashes in the original manifest intentionally exclude a single trailing newline added when writing each JSON file.
- Full integrity integration test checks the shipped data and a simulated missing book; other tests cover corruption and insertion selection drift.
- Current local 0.1.4 candidate is **not released**. The GBF lexical-diagnostics UI has passed a live test in a disposable Obsidian vault; full import, fresh 0.1.4 installation and restart, broader theme/mobile QA, and public naming clearance remain pending.

## Verified on macOS / Obsidian 1.15.0–1.15.1

- **Build:** strict TypeScript `tsc --noEmit` passed, esbuild `main.js` generated successfully.
- **Original QA tests:** 18/18 passed (book references, OSIS IDs, 66-book WEB dataset, local chapter reading and search). **Current developer candidate:** 134 automated tests across nineteen files cover those foundations plus range-safe Scripture frontmatter/backlink discovery, chapter/current-book/selected-book/testament-scoped cancellable exact/all-word/any-word search, conditional-control layout, safe literal highlighting, input safety, privacy-safe resource failures and recovery, module inspection, semantic interpretation, performance statistics, persistence bounds and Inspector keyboard navigation.
- **Data:** 66 public-domain ENGWEBP book files, 31,103 verses, exact text preserved; provenance and checksum documented.
- **Actual GUI:** opened an isolated test vault in Obsidian; enabled the plugin; opened its Bible Reader from the native command palette.
- **Reader:** John 3:16 appeared with styled passage text, contextual actions, book/chapter controls and theme-aware dark UI.
- **Quick Jump:** entered `Ps 23` and saw accurate local preview; opening saved the reference `Ps.23`.
- **Markdown study note:** clicked selected verse's note action and created/opened `Bible Study/John/John 3-16.md` with correct frontmatter.
- **Quick Verse Insert:** inserted an attributed `Romans 8:28 (WEB)` callout into that note; verified the Markdown content on disk.
- **Highlight and bookmark:** toggled both for John 3:16 in GUI; verified persistent IDs in `data.json`.
- **Original 0.1.0 test:** renamed manifest ID and product to VerseDock; reinstalled the plugin in an isolated vault and confirmed **VerseDock (Preview)** commands appeared and Bible Reader opened. That historical GUI test predates the SwordDock Bible rebrand.
- **Manual preview ZIP:** the archive includes `main.js`, `manifest.json`, `styles.css`, license, README and every offline WEB book, and passed ZIP integrity check.

**Current local package:** `SwordDock-Bible-0.1.11-offline-preview.zip` contains 76 approved files, the independent offline library, SQLite WebAssembly engine, third-party license, and brand documentation. Two consecutive builds produced identical 1,757,882-byte archives with SHA-256 `5e58b1938e9d7126b7df7e0af26bb0fe220546470d5d1cf5df65103921bd15a9`; clean-vault extraction, source byte comparison and simulated offline restart pass for all 66 books and 31,103 verses. A separate fresh GUI vault passed trust, enablement, offline Reader launch, Obsidian reload, missing/malformed-book integrity recovery, missing/malformed-manifest in-app recheck, every search scope and match mode, conditional Selected-book control layout, and two-note resolved-backlink discovery/opening under stable ID `versedock`; the exact package preserved settings and produced no captured Obsidian errors during the final workflow. The established upgrade vault preserved `reference: "Rom.8.28"`, history `['Rom.8.28', 'Rom.8.27']`, bookmarks, highlights and appearance settings. It remains a local developer candidate, **not a published GitHub release**. Full release validation (mobile, broader community-theme coverage, interrupted-install recovery, destructive history clearing and actual VoiceOver) remains pending.

## Test boundaries / not yet verified

- No GUI testing on Windows/Linux or mobile; this preview is marked desktop-only until mobile compatibility is validated.
- The 0.1.11 Reader and Study Inspector were visually re-verified in Obsidian 1.15.1's native Light and Dark schemes and in both Light and Dark variants of official-catalog Minimal 9.1.4. Editorial text, selected-passage/accent treatment, contextual actions, narrow Inspector tabs and truthful empty states remain readable. The isolated vault was restored to Default/Light with plugin data unchanged; a broader community-theme matrix remains open.
- Fresh 0.1.11 ZIP installation was visually verified in a newly registered GUI vault, including local-author trust, plugin enablement, offline Reader launch, app reload, privacy-safe missing/malformed-book failures, integrity diagnostics, missing/malformed-manifest guidance and recovery through an in-app recheck. The older 0.1.2/0.1.3 checkpoints remain historical evidence rather than current release gates.
- No automated end-to-end UI harness or visual regression snapshots yet; focused unit coverage and a manual keyboard/accessibility-tree checkpoint now pass, while actual VoiceOver remains pending.
- No public-domain commentary/lexicon installed; Inspector shows honest unavailable states.
- MySword SQLite **preview inspection** is available; full import/conversion, parallel translations and interlinear tools are not yet implemented.
- Not listed in the Obsidian Community Plugins directory; release is a **GitHub developer prerelease** only.

## Storage and cleanup

Development source: `Repository root`

Disposable GUI test vaults: `test-vault` plus ignored `.research/qa/clean-gui-011-fresh` and `.research/qa/clean-gui-011-final`

The GUI test vault contains temporary screenshots, one test Markdown note and plugin state. These are **not committed** and no personal vault files were modified.

The public installation ZIP contains the source-independent offline WEB library in the plugin-local folder, so users must extract the **complete ZIP**, not merely the 3 normal Obsidian assets. Later work should add first-install resource delivery and sync controls.

## Reproduce

1. `npm ci --legacy-peer-deps`
2. `npm run check`
3. `npm run deploy:test`
4. `npm run package:preview`
5. Open the disposable `test-vault` in Obsidian and enable SwordDock Bible (legacy ID: `versedock`).
6. Test Reader → Quick Jump → selected verse → Study Note → Quick Verse Insert → bookmark/highlight.

## Next release gates

- [x] Extract current unpublished ZIP in a fresh temporary vault and verify all offline data and WASM packaging.
- [x] Fresh **0.1.2 package GUI** install, author trust, command palette and offline Reader launch in disposable new vault.
- [x] Verify the 0.1.3 conversion-preflight GUI in an updated disposable vault: markup blocked with explanatory diagnostics.
- [x] Repeat fresh first-run and reload testing with the current 0.1.11 ZIP; verify missing and malformed-book failures, integrity diagnostics, missing and malformed-manifest guidance, and recovery without exposing an absolute path or requiring an app reload after restoration.
- [x] Native Light/Dark desktop and narrow-pane rendering pass in 0.1.11/Obsidian 1.15.1.
- [x] One maintained official-catalog community theme is tested separately in both schemes: Minimal 9.1.4.
- [ ] Broader community-theme rendering matrix.
- [x] Robust note insertion guards and inspector keyboard-focus regression tests; manual Tab/Return and accessibility-tree verification pass.
- [ ] Actual VoiceOver announcement/navigation verification after user-approved assistive-setting change.
- [x] Preview-only MySword SQLite schema validation with synthetic fixtures and literal-text rendering (37 tests); isolated live GUI and publisher-WEB local CLI checks now pass.
- [x] Validate read-only inspection of the publisher-hosted WEB MySword module locally without redistributing it.
- [x] Conservative conversion-readiness preflight rejects markup/unsupported structures without writing data (44 tests).
- [x] Implement lossless **GBF lexical scanner** and report unknown references without discarding any source text; scan the full publisher WEB fixture.
- [x] Parse bounded documented and observed cross-chapter `RX` references as inert metadata; report 424 validated and zero unresolved markers in the publisher WEB fixture.
- [ ] Validate GBF **formatting semantics**, cross-chapter reference mapping, translator notes, HTML sanitization, provenance and slower-device performance before any opt-in import/conversion.
- [ ] Decouple Bible module library storage from plugin folder, implement integrity checks and optional downloads.
- [ ] Second permitted translation and chapter-level linked comparison.
- [ ] iOS/Android test; adapt any incompatible UI APIs.

## November 18, 2026 — Resource dock, KJV display, and Discover catalogue continuation

This checkpoint incorporates the new user-supplied mockups at
../design/SwordDock-Bible-UI-Mockups/, especially KJV Proverbs 5 Word Study,
the Resource Library/Download Wizard and Commentary Resource Switcher screens.

**Implemented in the local working tree (not released):**
- Added sworddock-resources as a separate native right-sidebar tab,
  registered alongside the unmodified Study Inspector with Study/Parallel/Notes.
  Navigation and command palette actions can open it; getRightLeaf(false)
  preserves the existing right-dock tab stack. View state restores category,
  installed module selection and optional pinned reference.
- Resources type choices include Bible, Commentary, Dictionary, Book,
  Devotional and Graphics. Only verified bundled WEB/KJV, Matthew Henry, and
  Strong’s Greek/Hebrew lexicons appear as installed. Other types have honest
  empty states, not imaginary installed modules. Original Inspector tabs remain.
- KJV Reader now has persisted Reading vs Word Study display mode.
  Reading hides interactive word buttons; Word Study retains tagged lookup.
  The title follows the actual selected Bible edition. Full interlinear is
  visibly disabled pending trusted original-language word alignment; Strong’s
  numbers must not be represented as that complete alignment.
- Module Library > Discover now shows six preloaded publisher-hosted direct
  download links, searchable by type/title/source, plus external exploration
  websites. Links say **Download file** and **Publisher page**, never Install.
  No mirroring, automatic downloading, module installation or license claims.
  The existing local Bible-only read-only inspection flow is preserved.
- Style additions scoped to .versedock; tests cover catalogue metadata and
  filtering, installed module selection, state restore and KJV mode semantics.

**Verification:** npm run check passed 231 tests in 36 suites; typecheck and
production esbuild passed. git diff --check passed. npm run deploy:test
copied the latest bundle and offline resources to the isolated test-vault,
with matching main.js SHA-256. The currently running Obsidian test-vault
window still displayed its previously loaded plugin instance when inspected;
a clean plugin reload and visual interaction QA of the new views are **not yet
verified**. This must be a gate before release.

**Preservation:** Prechange source copies and tracked patch were saved in
../design/backups/resources-dock-prechange-2026-11-18/. Existing extensive
unstaged work was not reset or committed; no GitHub push, DNS, personal vault
or production plugin installation was performed.

**First remaining acceptance criteria:**
1. Restart/reload the isolated test-vault plugin and perform live keyboard,
   theme, narrow-pane and right-dock tab persistence tests; confirm no focus
   regression or error logs.
2. Develop and verify a rights-compliant download, safe extraction, format
   conversion, transactionally staged install, cancellation/retry/rollback and
   integrity-checked storage workflow. Do not activate a misleading Install
   button before this pipeline works. Independently support commentary,
   dictionary, books, devotionals and graphics with format-appropriate readers.
3. Implement a genuinely independent Copilot native tab once its data/privacy
   design and safety requirements are decided. Do not replace Inspector/Resources.
4. Acquire and validate an attributed Hebrew/Aramaic/Greek word-alignment
   dataset before enabling full interlinear. Verify alignment beyond Strong’s
   code equality and preserve source-specific translation/gloss provenance.
5. Preserve each dock's state and provide first-install options; run full
   package, clean-vault, accessibility, Windows/Linux and mobile QA as relevant.

## November 18, 2026 — Inline Strong’s and retained resource lookups

Continued from the pasted Module Library / Word Study brief. This completes
another part of the existing-resource stage; the installation pipeline and
readers for the other three resource types remain open scope.

- KJV Word study has a persisted H/G toggle for inline source Strong’s IDs.
  Reading mode removes both lexical buttons and visible identifiers; returning
  to Word study restores the saved display preference. Settings exposes the
  same preference. Mode/toggle changes return keyboard focus to their control.
- Resources retains each category’s installed module choice and separate
  bounded Greek/Hebrew queries in native view state. Passage notifications
  retain query text/results; a focused query input retains its caret. A lookup
  sequence guard discards late responses from older queries. Unknown saved
  modules are excluded; no arbitrary installed-module claims are added.
- Shortened the Resources follow/pin controls and footer, removed a dangling
  separator when a dictionary lemma is empty, and tightened narrow Reader
  display controls. Source definitions remain unchanged.

Verification: strict TypeScript and production build pass. All 233 tests in
36 files pass with `npm test -- --maxWorkers=1 --testTimeout=30000`.
The default concurrent run timed out on full-bundle KJV reads under host load;
no assertion failures were observed in the final serial run. The new focused
cases first failed, then passed; removing inline-toggle gating makes its test
fail again. The latest build was deployed only to test-vault.

Native checks in the isolated vault loaded the new modes and Resources view.
Reading removed tagged controls; Word study restored them. Inline Hebrew IDs
were visibly rendered with focus retained on the toggle. Resources opened
alongside the existing Inspector, listed all six categories, displayed bundled
commentary, and resolved Greek G25 and Hebrew H2451 offline. A Reader chapter
change retained the H2451 query and result. The passage was returned to
Proverbs 5:4. The final shorter labels/density changes were built/deployed,
but the app switched to the user's other vault before their final reload check;
input stopped there. Native reload persistence, full category round trips,
light-theme/width checks and console verification remain required. The state
restoration tests establish the policy, not those uncompleted UI checks.

Not implemented by this continuation: true aligned Hebrew/Greek interlinear;
transactional catalogue installs/cancel/retry; Book/Devotional/Graphics import
and readers; Copilot. No source files were downloaded, notes edited, personal
vault plugin installed, commit made or release published.

Final preview package: 284 entries / 21,915,118 bytes. SHA-256:
`59f0a9e89941042a56dfd26d59584f92c7813825c754c0e58c5cb4e4a5fcc5ec`.
Clean-install and offline restart smoke checks pass. Deployed main.js and
styles.css match their build outputs byte-for-byte.

## November 18, 2026 — Automatic reading-module installs

Implemented the requested catalogue-to-reader path for three inspected,
publisher-hosted Book-container resources: All of Grace, Morning and Evening,
and The Complete Sunday School Atlas. Discover offers individual/batch Install;
Downloads tracks queued/download/verification/preparation/save/ready states,
cancellation and retry. Successful installs become available immediately in
My library and the independent Resources tab.

The importer checks pinned compressed and SQLite SHA-256 values, accepts both
raw gzip and HTTP-stack-decompressed responses, caps gzip expansion, validates
physical Details/Journal/Data tables and normalizes content into inert text and
embedded raster assets. It never mounts source HTML, scripts, CSS or external
images. Packages are read-back verified in staging and promoted by a directory
rename into an immutable generation; failed/cancelled work is not activated.
Startup re-verifies each installed package before adding it to the inventory.
Source downloads are not included in the preview ZIP.

Books provide contents, full-content search, previous/next, bookmarks and saved
entry/scroll position. Devotionals provide annual date/Today, morning/evening,
and an explicit Markdown reflection action. The inspected source supplies 732
dated readings including leap day; its remaining index entries are retained in
the stored package. Graphics provides the 32 atlas maps, thumbnail browsing,
fit/zoom/scroll panning and an explicit larger modal viewer. Reading modules
are independent of passive Bible navigation. Installing another resource kind
does not rerender an already-open reading module. Storage totals include the
three verified additions (active generations only).

Native test-vault verification installed all three with one batch action.
Initial transport checksum failures exposed Obsidian's handling of the server's
Content-Encoding: x-gzip; the corrected dual-fingerprint path then installed all
three successfully. Book Next/Bookmark worked; reload restored To You with its
bookmark and all three installed resources. Devotional Morning→Evening selected
the matching November 18 source entry. Write reflection created an ordinary
Markdown note in the test vault and opened it centrally, with Scripture and the
Resources view preserved. Atlas image display was verified beside KJV. Saved
captures: design-qa-installed-book.jpg, design-qa-installed-devotional.jpg,
design-qa-installed-atlas.jpg. Larger-view/final runtime checks continue below.

Local source conversion checks read the original files directly: 22 book
sections; 745 devotional entries, of which 732 have supported source dates;
36 atlas entries, of which 32 reference embedded maps. Synthetic tests cover
SQLite/schema failures, external images/scripts, gzip limits, traversal, corrupt
content, staged-write/rename failures, cancellation, queue behavior and both
transport forms. The database-checksum mutation is rejected by its regression
test. Full suite: 247 tests / 39 files, strict TypeScript and production build.

Limits: this is a curated installer for the three named resources, not arbitrary
MySword installation. Bible/Commentary/Dictionary candidates remain outbound
file links. Source formatting is normalized; executable/internal source links
are flattened to their labels. The Obsidian transport cannot stop an already
started HTTP transfer: Cancel releases the queue and prevents preparation and
activation, while that transfer may finish in the background. Updates require
reviewed catalogue pins; no background auto-update runs. Mobile-device and
Windows/Linux runtime verification remain unperformed. No personal vault plugin
was installed, existing note edited, Git commit made or release published.

Final native completion: the larger atlas modal rendered the full embedded map;
Zoom in changed its scale, horizontal scroll was exercised, Fit restored it,
and Close returned focus to Larger view in the dock. Thumbnail selection moved
to The Period of the Exodus. The final workspace remains KJV / Proverbs 5:3,
with the independently selected atlas and the original Inspector still present.
`design-qa-installed-atlas-large.jpg` records the larger viewer. The reflection
QA note is `Bible Study/Reflections/Morning and Evening- Daily Readings - 18 PM Nov.md`
in the isolated test vault; existing notes were not edited.

Final review added a regression for a corrupted manifest write. Content and
manifest are now both read-back verified before directory promotion; a bad
manifest removes staging and never becomes installed. This final storage-only
check is covered by the regression suite, with the success flow already checked
through the three live installs. Runtime dependency audit: zero known findings.

Final gate: 248 tests across 39 files, strict TypeScript, production build,
test-vault deployment, clean-install/offline-restart smoke checks and
`git diff --check` pass. Preview: 284 entries / 21,926,052 bytes; SHA-256
`712e9f7177546e850e65d37559ddcc6786b723a2ee9417918bc09b9673e8e69d`.

## Active full-completion goal — 2026-11-18

The user reported degraded design and explicitly authorized all six remaining
areas. Full scope and proof gates are tracked in tasks/completion-2026-11-18.md;
the goal remains active. Optional Copilot/Research work is retained as later
scope. Historical read-only approval gates do not override current authorization.

This goal turn made concrete progress:
- Captured the current native design regression: Reader controls overlap its
  passage breadcrumb; Resources controls/thumbnail grid starve the content area.
- Rebuilt the Reader with separate primary navigation and KJV study-control
  rows, compact overflow access on narrow panes, and Focus-mode isolation.
  Rebuilt Resources with a compact two-column picker, subordinate context and
  bounded thumbnail/content regions. Existing actions remain reachable. Built
  and deployed to isolated test-vault; native after-capture is not yet verified.
- Native work stopped when the app switched to a personal vault receiving user
  input; a test-vault availability question is pending. No personal-vault content
  was edited. Before capture/notes: .research/design-recovery/.
- Added inspectStudyModule for physical Bible/Commentary/Dictionary validation,
  source-preserving records, bounded cooperative processing and cancellation.
  Six focused tests cover malformed data and spoofed views. Actual source checks
  pass: KJV 31102 records, JFB 21114, Easton 3965. This is a validated import
  foundation; those three installers/readers are not yet wired or activated.
- Acquired and validated the complete primary-source Berean interlinear corpus:
  1189 chapters, 31102 verses, 443625 words, 99240798 raw JSON bytes. All 66 books
  have identical verse-coordinate sets to bundled KJV after explicit code
  aliases; this is not a claim of KJV word alignment. Primary terms confirm the
  public-domain dedication. Greek/Hebrew/Aramaic and missing optional rows were
  audited and recorded in .research/interlinear/ and the evidence specification.

Current gate: 254 tests / 40 files, strict TypeScript, production build,
test-vault deployment and git diff --check pass. New design/native acceptance,
all installation/import/management integrations, interlinear presentation and
all release-platform gates remain open. See docs/specs/full-completion-evidence.md.
No goal completion, public release, commit or deployment to a personal vault is
claimed. All source acquisition processes completed; no background job is left
running by this checkpoint.

## Installed study-module integration — 2026-11-18

The full goal remains active. This continuation connected the validated Bible,
commentary and dictionary records to the same pinned download, preparation,
read-back verification, generation promotion and restart-discovery path already
used by books, devotionals and graphics. Discover now exposes all six curated
installers. The new code is deployed only to the isolated test vault.

Installed Bibles implement a shared reading contract used by Reader, search,
insertion, resource details and full Comparison. Edition selectors include
installed Bibles. Source metadata and actual coverage replace hard-coded WEB,
public-domain and 66-book assumptions; notes safely quote the selected edition
in their frontmatter. Requested ranges with internal source gaps fail rather
than returning an apparently complete passage. Imported lexical tags remain
retained; interactive word details continue to use the bundled CrossWire source.

Resources now routes installed JFB and Easton content to their own panels,
instead of falling through to bundled MHC or Strong's data. Commentary uses
source ranges and book/chapter introductions with bounded pages. Dictionaries
offer paged headword lookup, saved per-module query and entry selection, and
original source text in an inert disclosure. Bible navigation does not rerender
an independent installed dictionary lookup.

Actual full-source installation checks use temporary filesystem storage, then
recreate the service with downloads disabled: KJV 31,102 records / 16,208,746
prepared bytes; JFB 21,114 / 30,587,899; Easton 3,965 / 6,530,300. All three
verify, discover and reopen. The script is `scripts/verify-study-installation.mjs`;
research fixtures stay excluded from the package. Full-corpus evidence caught
independently overlapping red-letter/added-word switches in three publisher
verses; decoding preserves their words. The 175 unsupported marker diagnostics
remain visible rather than being silently discarded. Unclosed annotations fail
preparation; exact original records and source metadata are retained.

Review covered source routing, retained metadata validation, duplicate
coordinates, unknown markup, partial coverage and frontmatter encoding. A
temporary mutation disabling duplicate-coordinate rejection made its regression
fail; the guard was restored and the full suite passed. Current gate: **268 tests
across 42 files**, strict TypeScript, production build, isolated deployment,
runtime dependency audit (zero findings) and `git diff --check` pass.

Native after-verification remains open: a fresh CUA observation found the
personal vault active, so no input was sent. The test-vault availability question
remains pending. No personal note, vault setting or plugin was changed. The native
network install, edition/passage switching, dictionary keyboard/focus behavior,
reload and repaired-design acceptance must still be exercised. This is not a
claim that goal area 1, design recovery or the overall goal is complete.

Current preview ZIP: 284 entries / 21,932,734 bytes; SHA-256
`008d129db4287315e23747717ffc6251ee2b2cd22daa168da10710e629ca6dad`.
General local import, repair/update/removal/recovery, real transport abort,
interlinear presentation/alignment, rich links and release-platform verification
remain on the full ledger. No commit, publication or public release was made.

## General local-file import — 2026-11-18

This continuation added the next authorized capability without narrowing the
full goal. Module Library and the existing import command now open a local
SQLite/gzip preview and explicit install action. All six resource kinds use the
shared normalizer and verified storage transaction. The advanced read-only Bible
inspector remains separately reachable.

Preparation detects physical schemas independently of filenames, rejects
ambiguous/unsupported/encrypted inputs, bounds selected/expanded/prepared data
to 64 MiB and keeps all source records. Book containers permit an explicit book,
devotional or graphics reader, validated against supplied dates/assets. The
preview shows source metadata, language/abbreviation when supplied, samples,
record/image counts, notice, sizes, both fingerprints and the destination vault.
An optional local provenance citation is saved only on explicit installation.

Prepared snapshots stay private behind a review ticket. Changing or failing a
selection invalidates old reviews; late/discarded previews cannot activate, and
edits to the detached preview object cannot change the prepared package. The
service owns bytes before WASM initialization. Install cancellation and storage
failure leave inventory unchanged in the covered transaction paths. A mutation
removing the ticket comparison made the stale-review regression fail; the guard
was restored and the suite passed.

Local identities derive from type/database hash, keeping raw/gzip copies together
and independent from bundled/catalogue modules. Source basename, original and
database SHA-256, compression and citation survive offline discovery. Reader and
Resources distinguish local origin; credits never invent a publisher link or
license. Scripture insertion and reflection generation escape imported text so
source markup/embeds stay inert. Reflection filenames are bounded and remove
path/control characters. Source files remain unchanged and are never uploaded.

`scripts/verify-local-imports.mjs` exercises every actual research corpus through
raw/gzip preview, ticket validation, installation, integrity checks and a fresh
offline service: Bible 31,102, commentary 21,114, dictionary 3,965, book 22,
devotional 745 and graphics 36 records. All original source strings are retained.
The ignored `.research/modules/local-import-report.json` records the complete
file/database fingerprints and measured sizes. This uses a temporary filesystem,
never a personal vault. The existing three-source catalogue installation verifier
also still passes after the shared changes.

Current gate: **288 tests across 44 files**, strict TypeScript, production build,
isolated test-vault deployment, runtime dependency audit (zero findings) and
`git diff --check` pass. The preview ZIP has 284 entries / 21,935,421 bytes, SHA-256
`a9b0c8e9fb37bde673a1a8108836c3c536c1790a8e1ea0c74bd1f7369b3275ef`.
The current package's clean-install/offline-restart smoke check also passes.

Native file-picker, review/activation, focus, switching and reload acceptance
remain pending, along with repaired-design captures. No native UI input was sent
in this continuation; the earlier test-vault availability question is still
unanswered. No personal vault was edited, commit made or release published.

Next management work must persist explicit active-generation choices (including
reactivating an already stored older generation), rather than relying on latest
generation timestamps. Repairs, updates, reversible removal, interrupted recovery,
storage cleanup and transport abort remain required. Exact interlinear alignment
and presentation, rich formatting/links and the full release-platform matrix are
also still open; the full goal remains active.

## Persistent version management and repair — 2026-11-18

The next goal continuation implemented verified selection snapshots instead of
timestamp-only activation. Reusing an older stored generation now persists that
exact choice through restart. A baseline is committed before new resource
promotion, and activation is a separate verified snapshot: a promoted resource
whose activation fails stays retained and inactive. Removal is a reversible
library choice, keeping files and reading state; Restore reactivates its selected
version. The current default Bible is protected at entry and before commit.

Reinstall/repair reads the actual stored manifest and content before reuse. A
damaged canonical directory is retained; a fresh `-r-` generation is verified and
activated instead. Subsequent identical repairs reuse the valid repaired copy.
Generation directory prefixes bind to the content checksum. Source metadata is
also checked against the stored manifest rather than trusting card labels.

Management is accessible from additional-resource cards and Storage. Its modal
shows stored versions, source notices and fingerprints; users can explicitly
select versions, remove/restore, reinstall/repair publisher modules, review a
changed catalogue fingerprint, or reopen local import for repair. The active
Reader refreshes on generation changes. Two direct controller regressions prove
that an earlier slow edition or stale generation cannot override a newer choice.
Native UI behavior remains unverified.

Management record damage is surfaced. A previous verified snapshot can restore
earlier choices, with an explicit issue that version/removal decisions may have
rolled back. If no unambiguous state remains, normal changes require an explicit
reviewed rebuild. Interrupted stages are listed and preserved; stage/network
resume and full retained-storage cleanup are still subsequent required work.

`scripts/verify-module-management.mjs` passes against real KJV records in a
temporary filesystem: older selection after restart, reversible removal/restore,
non-overwriting repair, failed-state rollback, 31,102 reopened records and an
unchanged original SQLite source. Two verified generations plus the damaged copy
remain accounted for in its ignored report. All six actual local raw/gzip import
corpora still pass the public preview/install/offline-reopening path.

Review added regressions for partial state damage, total state loss, inactive
orphan generations, failed state writes, protected-default timing and manifest
repair. Temporarily removing the final protection callback made its timing test
fail; the guard was restored and the full suite passed. Current gate: **300 tests
in 46 files**, strict TypeScript, production build, isolated test-vault deployment,
runtime dependency audit (zero findings) and `git diff --check` pass.

The preview ZIP contains 284 entries / 21,939,895 bytes; SHA-256
`c1682f68eeaf91b1e5d2791346c3308900d52639136acf5c0759a000eaf3f748`.
Its clean-install/offline-restart package smoke check passes.
No commit, personal-vault installation or publication was made.

A fresh native CUA attempt returned `cgWindowNotFound` for Obsidian under both
name and bundle ID. Native launch is unavailable on this surface. No native UI
input was sent; the phase ended with its completion summary. This is an observed
native verification dependency, not whole-goal completion or a reason to drop
the remaining design/platform checks. The full completion ledger stays active.

## Storage review and prepared-stage recovery — 2026-11-18

This continuation implemented the next required management capabilities. Storage
and Manage resources now open a review covering active, removed, retained,
damaged, staged and management data, plus unknown folders/loose files. Measurement
comes from the adapter's actual file statistics; incomplete measurement is
labelled. Unknown/unexpected data stays for manual review. Active, Restore and
recent rollback data are protected from cleanup.

Users explicitly select eligible unused folders to move to vault Trash. Cleanup
rechecks exact content/manifest/owner fingerprints, eligibility and protection
before moving anything and before each move. Stale reviews cannot remove a newly
selected generation. Trash remains recoverable and still consumes disk space
until emptied separately; the UI describes managed-root reduction accurately.
No resource cleanup permanently deletes a generation or original import file.

Complete prepared stages expose source identity, entries, notice and fingerprints
for review, then can recover through the same verified generation/activation
transaction. The staging copy remains for cleanup review. Changed/incomplete
stages cannot activate. New transactions write a verified owner record first;
three-file manifests require that record to match. Legacy two-file resources
remain readable. Damaged ownership records repair into fresh copies.

The production store resolves desktop paths against the real resource root and
refuses symlinks, aliases and traversal before reads/mutations. Staged files are
immutable, promotion cannot overwrite an existing target, and permanent removal
is restricted to transient transaction stages. The virtual-adapter branch avoids
desktop Node access. Actual temporary-filesystem adapter tests prove those
guards and reversible moves through a shim of the public Obsidian adapter; they
do not substitute for native Obsidian/phone verification.

`scripts/verify-resource-storage.mjs` passes with actual KJV and All of Grace
records: a complete 22-entry stage recovers; an incomplete stage stays inactive;
two folders/four files move to recoverable Trash. Managed-root size changes from
16,973,103 to 16,591,994 bytes, matching exactly 381,109 moved bytes. Both the
31,102-verse Bible and book reopen offline; original inputs are unchanged. The
ignored report is `.research/modules/storage-report.json`. The existing real-file
management verifier also passes after these changes.

Current gate: **310 tests across 48 files**, strict TypeScript, production build,
isolated test-vault deployment, runtime dependency audit (zero findings) and
`git diff --check` pass. Temporarily removing recovery's fingerprint comparison
made the valid-package substitution regression fail; the guard was restored and
the complete suite passed. Native review, focus, actual Trash and recovery
acceptance remain pending; no native UI input or personal-vault edits occurred.

Current preview: 284 entries / 21,944,871 bytes; SHA-256
`961ca0dcee7012a871f003d940ce9aee89d39dfe2661ebdd7ed4e5b5246406f2`.
No commit, publication or personal-vault installation was made.

Transport research confirms the KJV publisher redirect advertises byte ranges
and x-gzip, without an Access-Control-Allow-Origin response for Obsidian's origin.
The installed public requestUrl API has no abort signal. Actual network abort and
partial-byte checkpoint/resume are still unimplemented; prepared-stage recovery
must not be described as network resume. Evidence and the next implementation
requirements are in `docs/specs/download-transport-evidence.md`.

An updated asynchronous question asks whether the isolated test-vault window is
open and visible after the prior CUA `cgWindowNotFound` errors. No answer is assumed;
independent code work continues. Interlinear, rich formatting/links, native design
acceptance and the release-platform matrix remain required. The full goal stays
active with its original scope.

## Native study installation, layout acceptance and Trash — 2026-11-18

The user confirmed the isolated test-vault window was visible. Native CUA then
attached to Obsidian 1.15.1 with a verified test-vault title. Reloading confirmed
the previously deployed passage/study-toolbar separation and compact Resources
switcher. Wide and narrow tagged-KJV Reader checks in both themes show no toolbar
overlap. Book Next preserves the Reader passage; atlas content has usable space.
Native Install selected downloaded KJV, JFB and Easton in sequence; all reached
Ready offline. The installed KJV opened Proverbs 5:3 in Resources and Reader;
switching back to the clearly identified CrossWire edition preserved that
passage. Dictionary Aaron search/entry selection and commentary reopened after
app reload. Network was not disabled, so no airplane-mode acceptance is claimed.

This native pass found two further hierarchy defects and fixed them: installed
commentary placed a long book introduction ahead of the selected verse, and the
single-column library placed its large storage card ahead of the collection.
Commentary now presents passage notes first, retaining introductions as collapsed
disclosures in the same bounded pagination. Synthetic tests preserve source
identity/order, overlapping ranges and introduction-only/no-match behavior. The
real-source verifier checks the actual Proverbs 5:3 note plus both introductions.
Native after-deployment captures show the note first in light/dark; the chapter
introduction opens and closes with Space. Library content now precedes storage.

Storage review now restores keyboard focus after asynchronous measurement. A
native keyboard-open check confirms the visible Refresh review focus ring. The
review protected all six active resources and the two recent rollback records,
and offered only two obsolete snapshots for cleanup. A reviewed Trash move
succeeded: 1,360 bytes / six files / two folders. Native totals changed from 27 to
21 files. Read-only filesystem verification confirms the exact files remain
recoverable in `test-vault/.trash`; all active resources and both recent records
remain in place. No Trash was emptied. Retained-generation/stage native cleanup,
staged recovery, removal/restore and repair still require separate acceptance.

Current verification: **312 tests across 48 files pass** with
`npm test -- --maxWorkers=1 --testTimeout=15000`; strict TypeScript, production
build (320.3 KB), real-source study install/reopen checks, isolated deployment,
runtime dependency audit (zero findings), diff whitespace check and preview
clean-install/restart smoke pass. The default five-second parallel run timed out
four existing corpus tests, and a two-worker run timed out one occurrence scan;
the machine's observed load average was 23.88. No assertions were removed or
tests skipped. The passing single-worker result does not establish the open
slower-device performance gate. Temporarily changing introduction classification
from OR to AND made both new regressions fail; the correct guard is restored.

Current preview: 284 entries / 21,945,023 bytes; SHA-256
`b704cb8b2fa74aad575089b2d152527c62047b283e399779fe7612048f77bd12`.
The complete six-source local-import report also postdates mandatory owner-record
verification and records all six offline reopen checks as passed.
No commit, publication or personal-vault installation was made.

Detailed native observations and capture locations are in
`docs/specs/native-acceptance-2026-11-18.md`. CUA phases ended with completion
summaries; the temporary split was closed and the original dark theme restored.
Some asynchronous AX snapshots became stale; rebinding the app restored the
complete tree. Actual screen-reader acceptance is still open. The next code
milestone remains actual transport cancellation/partial-download resume, followed
by full attributed interlinear and rich content. All original goal areas remain
tracked in `tasks/completion-2026-11-18.md`.

## Actual desktop cancellation and partial-download resume — 2026-11-18

Desktop publisher installs now use a lazy Node HTTPS byte stream instead of
requestUrl. Cancel and timeout destroy the active request, including before
headers. Redirects stay on the original HTTPS origin and are limited to three;
credentials/downgrades/unsupported encodings and unexpected sizes are refused.
Complete compressed SHA-256 is checked before returning; the shared installer
still verifies the expanded database before preparation and activation.

Strong-ETag partial bytes are written to immutable owned staging snapshots.
Source ID, URL, compressed/database pins, lengths and prefix checksum bind each
checkpoint. The next retry discovers and verifies it after downloader recreation,
sends Range/If-Range and accepts only the exact expected 206 range/validator.
Ignored ranges replace the prefix with a full response; invalid range/validator
responses trigger a bounded full restart. A failed successor write preserves its
prior prefix. A small clean early end also saves its received bytes. Verified
success or checksum failure clears measured known transient checkpoints.
Unexpected files/unavailable measurements preserve the folder for manual review.

Saved prefixes now appear in storage review with measured bytes and Retry/Trash
explanations; they never become activatable resources. Retry requested during
cancelled checkpoint completion is honored. Stopping/unloading prevents that
queued retry from starting another transfer. Received counts stay current while
UI notifications are bounded to roughly ten per second plus final state/size
updates. Downloads explains desktop capabilities and mobile limitations.
Mobile still uses Obsidian’s public requestUrl API: cancellation prevents
installation, but can leave its transfer finishing, and Retry starts again.
Actual mobile-device transport acceptance remains open.

`scripts/verify-download-transport.mjs` passes against the actual publishers in a
temporary filesystem. KJV aborts after **527,838 bytes**, saves that exact prefix,
recreates the downloader, resumes with HTTP **206** at that offset and verifies
the complete pinned source. All six curated kinds then install and reopen with
network forbidden: KJV 31,102, JFB 21,114, Easton 3,965, book 22, devotional 745,
atlas 36 records. A separate call verifies the default HTTPS request path. Its
ignored report is `.research/modules/transport-report.json`; research inputs and
personal vaults are not changed.

Native Obsidian reload and All of Grace publisher reinstall succeed through the
new desktop branch. Downloads shows Ready offline and the capability copy; Open
preserves its prior reading entry. The current three-file generation and older
two-file generation both remain with verified content hashes. Native Cancel /
saved-prefix display / reload / resume interaction remains unchecked, as do
deliberately damaged repair and prepared-stage recovery. Details and captures are
in `docs/specs/native-acceptance-2026-11-18.md`.

Latest normal `npm run check` passes **329 tests in 50 files**, strict TypeScript
and the **327.5 KB** production build. The final cleanup and stopped-queue guards
are included. Vitest now bounds the pool to two workers and uses a 15-second test
timeout for corpus, SQLite and real-socket checks. Five-second unbounded parallel
runs timed out under load; no assertion/case was removed, and the product’s
60-second network deadline is unchanged. This does not establish slower-device
acceptance. Removing the ETag comparison made the changed-validator regression
fail; the comparison was restored before the final full check.

The latest build is deployed only to the isolated test vault. Runtime audit has
zero findings and diff whitespace checks pass. Current preview: 284 entries /
**21,947,711 bytes**, SHA-256
`ce45ad75a5228e105f228db7b261fbca0b2c2f773d930518796f87b126e1271a`.
The clean-install/offline-restart preview smoke passes for its 284-file bundled
package. No commit, publication or personal-vault installation was made.
Decision 0013 documents the protocol.
The full goal remains active, including native management/import acceptance,
Greek/Hebrew interlinear, rich formatting/links and the full release matrix.

## Berean interlinear companion — November 18, 2026

The user chose KJV with a clearly labelled Berean interlinear companion. KJV now
offers an active Interlinear toggle. It displays the selected verse's original
Hebrew, Aramaic or Greek words, supplied Berean glosses, transliteration, raw
Strong's IDs and grammar. Rows, recorded source/English order, original font and
size persist. Selecting a source word opens its grammar and dictionary without
fabricating KJV alignment. No exact KJV English word alignment is claimed.

The pinned deterministic offline corpus contains all 1,189 chapters / 31,102
source records / 443,625 words; every field compares exactly to the acquired raw
source. Seventeen empty source records stay explicit. Pinned manifest/chapter
hashes, path/rank/size validation, a two-chapter cache and stale-load guards pass
regressions. Dropping the chapter checksum check makes the same-length-tampering
test fail; the guard is restored. No dependency was added.

Native isolated-vault checks pass Genesis 1:1, John 3:16, Daniel 2:4 and Acts 8:37,
RTL keyboard focus/selection, repeated IDs, absent fields, dictionary, grammar,
source orders, reload persistence (grammar / English order / Serif / 25 px),
Reading/Interlinear toggles, default light/dark and narrow panes. A native KJV
selection-clipping issue after panel expansion is corrected and verified. Source
word details scroll into view. Captures 16–24 and limits are in the interlinear
specification. The temporary split is closed; no personal vault was modified.

Current `npm run check`: **335 tests / 52 files**, strict TypeScript and **342.9 KB**
production build. Runtime audit: zero findings. Corpus verifier and clean-install/
offline-restart smoke pass. Preview: **1,475 entries / 33,309,290 bytes**, SHA-256
`7644cc875be1359be2312b4e7ef26a52159cbcbdd697e9e2d7704bda9b6d6dce`.
Decision 0014 records the source/presentation contract. The selected companion
gate is complete; the full goal remains active for native import/management/
recovery acceptance, richer formatting/internal links and release verification.

## Rich resource content — November 18, 2026

Installed books, devotionals, atlases, commentary and dictionaries now render
supported headings, emphasis, lists, quotations, tables, code, embedded raster
images and named anchors from retained source. A bounded inert parser constructs
an allowlisted semantic tree; source scripts, CSS, event handlers, unsafe URLs
and remote image requests cannot execute through this renderer. Resource limits
produce a complete plain fallback with an explanation. Original source remains
available as text, including exact GBF notes/headings beside imported Bible text.

New Journal preparations retain exact source IDs and shared bounded publisher
metadata. Topic addresses use those IDs rather than display-title guesses;
own-module prefixes can use the retained abbreviation. Dictionary and commentary
addresses resolve against their own headword/coordinate indexes. Missing,
ambiguous, foreign and invalid addresses stay explicitly unavailable. Bible links
open a fixed-edition offline preview, one chapter and 25 visible verses at a time;
Reader navigation is an explicit action. Resource navigation retains search and
selection with Back controls. Devotional/atlas contents and index entries are now
available alongside readings/maps. Legacy Journal packages need reinstall or
reimport to gain source IDs/abbreviation metadata.

The independent SQLite/HTMLParser verifier confirms all **56,984 original records**
and all **25,882 non-Bible ordinary-text projections**. No real entry exhausts
parser bounds. All 3,696 devotional topic links, 64 atlas links and 624 Easton
headword links resolve. The book's source typo, 23 unavailable/foreign JFB entry
targets, 33 unsupported JFB links and three missing Easton fragments remain
reported rather than guessed. Imported Bible source exposes 7,716 annotations.
The pinned sources themselves are unchanged.

Native isolated-vault checks establish Book publisher reinstall, remembered
entry, emphasis/contents, exact topic navigation/Back, source-labelled KJV passage
preview, and Devotional index plus keyboard fragment navigation. Atlas reinstall
also succeeds; old generations are retained and their hashes verify. The Reader
action's focus ordering and month-table word wrapping were corrected afterward.
Their revalidation, atlas navigation, dictionary/commentary links, Source notes,
and final narrow/light/dark checks remain open because CUA reattachment returns
`cgWindowNotFound`. Native evidence and captures 25–27 are recorded in
`docs/specs/native-acceptance-2026-11-18.md`; no personal vault was modified.

Occurrence pagination no longer scans all 66 Bible files for every page. A bounded
two-key cache stores verified coordinates; later pages load displayed books only.
Reinitialization clears the cache and rejects stale scans/loads. Read-count and
stale-initialization regressions pass. This fixes a measured redundant-work path;
it does not establish representative slower-device performance.

Current **352 tests / 56 files**, strict TypeScript and **371.5 KB** production
build pass. The source-abbreviation regression failed before the fix, then passed
with bounded stored metadata validation. Runtime audit: zero vulnerabilities.
Full corpus verification, diff whitespace check and clean-install/offline-restart
package smoke pass. All six real SQLite/gzip fixtures also pass reviewed local
installation, integrity verification and offline rediscovery in a disposable
store after the shared metadata change. The latest build is deployed only to the
isolated test vault.
Preview: **1,475 entries / 33,320,358 bytes**, SHA-256
`a6debafdb40a7d7f86ef1229be07d815a17ee7d87bc915a5e8f6591a397fe898`.

Decision 0015 records the model and link boundary. The full completion ledger
remains active. Bundled Matthew Henry still has its existing plain projection;
native import/management/recovery, the remaining rich UI checks and the full
platform/theme/screen-reader/slower-device matrix are unfinished. No commit or
publication was made.

## Bundled Matthew Henry rich-source continuation — November 18, 2026

The bundled commentary now preserves original OSIS and supported headings,
italic/bold/superscript/small-caps/underline, paragraph/poetry boundaries and
clickable qualified source citations. Its existing quoted-Scripture disclosures,
twenty-block continuation and two-section pagination remain. A citation containing
several addresses offers each source target in the fixed-edition offline preview.
The original OSIS is available for every section. Unsupported/missing coordinates
are explained without context inference or nearest-verse substitution. A missing
far chapter is rejected before displaying a truncated range.

Schema 2 replaces the flattened asset projection with exact source strings,
48,606,288 book bytes in total; the largest book is 3,844,856 bytes. The runtime
verifies size/hash/ranges, retains two raw books, and parses only displayed
sections with a four-section cache. Legacy schema 1 text remains readable, with
untrusted extra rendering fields discarded. Stale reads/initializations cannot
repopulate a refreshed library. No runtime dependency was added.

The same pinned MHC 2.2 archive and SWORD 1.9.0 public C API reproduce all 4,249
sections / 31,096 covered coordinates with the same four absent and three
unmatched coordinates. The independent Python HTMLParser oracle confirms every
source hash, complete ordered text block, 199,876 emphasis markers and 62,374
citation labels. All sections fit parser bounds. A second export makes all 68
files byte-identical. Separate book/chapter introduction keys remain excluded as
recorded in the source notice.

Of the 62,374 source citations, 62,302 have supported qualified syntax (including
explicit known book aliases), with 241 multiple-target citations. The remaining
72 contain incomplete/unsupported addresses, including out-of-canon books. Among
supported addresses, 227 lack at least one endpoint in bundled KJV, and 237 in WEB.
Those source errors/edition differences remain explicit; syntax support does not
establish verse availability. The ignored report is
`.research/modules/mhc-rich-report.json`.

The final full check passes **358 tests / 57 files**, strict TypeScript and the
**378.7 KB** production build. Regressions cover source semantics, multiple/invalid
references, known aliases, hostile markup/duplicate attributes, bounds, legacy
node stripping, same-length source tampering, stale work and absent far chapters.
Disabling checksum enforcement makes the source-tampering regression fail; it is
restored before the final check. Runtime audit has zero findings; whitespace
checks and clean-install/offline-restart preview smoke pass.

The latest build is deployed only to the isolated test vault. Current preview:
**1,475 entries / 34,955,306 bytes**, SHA-256
`ae8b71efac09dfc6109b6e690d1e322cc3c45c43cec47844ccbebca3f1912e93`.
Decision 0016 supersedes the old commentary flattening decision. Native reattach
again returns `cgWindowNotFound`, so no new native acceptance is claimed. Rich
commentary rendering/citation/focus/theme checks, broader import/management
acceptance and the platform/accessibility/slower-device release matrix remain
open. The full goal remains active; no commit, publication or personal-vault
installation was made.

## Native six-source imports, Reader focus and management — 2026-11-18

Native Obsidian attachment now works after the user's foreground confirmation.
All six local source types passed native review, installation, opening and app
restart in test-vault, bringing its library to 18 resources. Bible/devotional
inputs were gzip; the others SQLite. Read-only checks verify all saved content,
source fingerprints, metadata, source notices, exact QA citation, raw records and
unchanged original inputs. Local atlas images render. This is native restart
evidence; network was not disabled. Invalid/stale-review/failure flows remain.

Native rich checks now include atlas contents/map/larger view, Easton links/Back
with saved query, nested JFB commentary/Bible references, imported Bible RF notes
and full original GBF, and MHC rich text/quotation/continuation/source plus single
and four-target citations. Reader navigation now waits for the latest render and
focuses the selected verse/chapter without stealing user-moved focus. Four new
regressions pass. Dictionary Back and source-note modal focus/return were repaired
and verified. Intrinsic selected-verse layout fits all five actions without
obscuring Scripture in wide/narrow Default Light/Dark.

Catalogue book removal persists across app reload and Restore reopens its exact
generation. Catalogue KJV also removes/restores; the distinct local default Bible
is protected. An older book generation remains selected across restart, and the
current rich generation reactivates. Local file/Catalogue labels now distinguish
same-titled copies in library and management. All 18 resources remain installed.
Captures 28–49 and precise limits are in the native acceptance specification.
One reload briefly showed Obsidian's long-plugin-load notice and then recovered;
launch-time profiling and representative slower-device acceptance remain open.

Final Mac check: **362 tests / 58 files**, strict TypeScript and **379.5 KB**
production build; runtime audit has zero findings. Linux ARM64 Node 22.23.3 passes
the same full check plus real all-six imports/offline rediscovery, retained-version
management/repair/rollback and stage recovery/reversible cleanup. All **1,675**
mounted inputs remain unchanged. The Linux bundle equals the Mac bundle:
388,622 bytes, SHA-256
`c653aa226a5bfe50bd47edf363ac618ff3f523633e6fbf6b450b1fcebf59ddff`.
See `docs/specs/linux-runtime-2026-11-18.md`; this does not prove native Linux
Obsidian. Windows connector probes returned service errors; phone runtimes are
unavailable. VoiceOver remains pending explicit confirmation.

The current preview passes clean-install/offline-restart smoke and two identical
builds: **1,475 entries / 34,955,652 bytes**, SHA-256
`3fed587fa4ba273cbed7be392bea3d09aa8ed8d8a488bf7a5b203495627b7eda`.
Deployment remains isolated to test-vault. The full goal stays active for native
failure/repair/cancel/resume/staging/cleanup, remaining rich/theme/accessibility
flows and actual native platform/slower-device release evidence. No commit,
publication or personal-vault installation was made.

## Native repair, staged recovery and real cancel/resume — 2026-11-18

Native management acceptance now includes detecting a deliberately damaged
catalogue book and reinstalling from its pinned publisher source. Repair creates
a verified active generation and preserves the damaged bytes/older valid copies;
the exact QA backup was then restored. Prepared-stage recovery activates a
verified 22-entry local book, rejects an incomplete owner-only stage and persists
through native reload. Reviewed cleanup moves only two stages and one eligible
old generation to vault Trash: **574,190 bytes / six files**, independently
accounted. Active/recent rollback data and all 18 installed resources remain.
No Trash was emptied. Captures 50–55 and ignored native-management reports record
the actual test boundaries.

Real JFB transfer cancellation exposed unstable Downloads controls: every byte
update recreated buttons. The renderer now retains same-action controls/status
nodes and safely replaces terminal actions while preserving keyboard focus.
Two regressions failed before the change; all three now pass. Post-deploy native
Cancel works, saving **1,583,838 bytes of 5,494,192** with the publisher's strong
validator and verified prefix hash. Native reload preserves those exact bytes;
storage review explains the saved download. Retry starts at **1.5 MB**, completes
Ready offline and opens JFB Genesis 1:4. Completed download stages are cleared.
The retained/full payload has 21,114 entries and exact source/content hashes.
Actual HTTP 206 is CLI transport evidence; native response headers were not
captured. Captures 58–61 and `native-resume-report.json` record the successful
native sequence. Earlier attempts without a retained prefix are not resume proof.

Final Mac/Linux gate: **365 tests / 59 files**, strict TypeScript, **379.8 KB**
production build and zero runtime audit findings (dependencies unchanged).
The final Linux run also passes all real-source import/management/storage checks,
with **1,676 inputs unchanged**, and matches Mac at **388,924 bytes**, SHA-256
`34fae353092cc423e022d473920d73ff5b79194da02c5a9e103fd5bc897003cb`.
Current preview passes clean-install/offline-restart smoke; two identical builds
contain **1,475 entries / 34,955,781 bytes**, SHA-256
`7aecbf0a26d8046d766a3e4229bcff9a8c84dba9aab3597636832e7b906a41c8`.

The full goal remains active. Remaining work includes native malformed/stale/
failed local-import paths, failed-write/transfer rollback and update-source review,
remaining rich-content edge/theme flows, broader design/theme acceptance, actual
VoiceOver (pending explicit confirmation), native Windows/Linux/iOS/Android and
representative slower-device/launch performance. The recent long-load notice is
not dismissed by passing core tests. The current GUI is test-vault's Downloads
Ready offline with JFB Genesis 1:4 in Resources, Default Light; no modal is open.
No commit, publication or personal-vault installation was made.

## Import failure recovery, rich edges and current theme checks — 2026-11-18

Native malformed SQLite and QA AES-encrypted input rejection, wrong-reader-type
review invalidation and closed-review discard now pass. A real temporary
read-only module-root failure preserves all stored files and the prior active
generation; restoring its original permissions lets the same snapshot retry to
Ready offline. The first failure exposed raw errno/path text. The shared installer
now maps permission/full-disk/unavailable storage errors to actionable guidance
in both modal and Downloads, retaining source validation/cancellation messages.
Regression coverage reproduces EACCES, verifies rollback and retries. The final
native failed-save check leaves all **133 files byte-identical**, restores mode
**0755**, and reopening a closed fresh review starts with no file/Install action.
Captures 62–69 and `native-failure-report.json` record this acceptance.

Current Minimal Light/Dark checks pass for wide/narrow five-action Reader layouts,
overflow access to Quick Jump/Appearance/Study links, rich MHC and Library
error/storage readability. Native whole-chapter MHC adds two sections with correct
remaining count/focus. Its Psalms 88–89 reference pages through verse 52 with final
bounds and Escape restoration. Actual erroneous Jas.9.7 remains unavailable
without substitution. The devotional Index table stays contained and keyboard-
scrolls to its final column; day links wrap, month fragments and Back preserve
date/time. Empty anchor focus was named from the exact source ID, and native
verification confirms “Source location: Nov”. Captures 70–79 document these paths.

Final Mac/Linux checks pass **368 tests / 60 files**, strict TypeScript and a
**380.4 KB** build. All **1,678** Linux-mounted inputs remain unchanged. Linux and
Mac bundles match at **389,503 bytes**, SHA-256
`a6421fa98e2273b2bac8efb409b5774fa56b02f3fc4c9bb68a0128213d9f9550`.
Runtime audit remains zero with unchanged dependencies. Current preview passes
clean-install/offline-restart smoke and two identical builds: **1,475 entries /
34,956,020 bytes**, SHA-256
`ddd2141537fbaa2946e7cae66dccfaf754ca1267aa469574f74b1cdd4ba1bb92`.
The focused review in `.research/modules/native-fixes-review.md` records its
scope and evidence; it does not approve the entire accumulated worktree/release.

The single Reader is restored to local KJV **Genesis 1:4**, with selected-verse
focus, local devotional **18 AM Nov / 2026-11-18 / Morning** in Resources, Default
Light and the original purple accent. Settings/modal windows are closed; no
stages remain and module-root permissions are restored. All 18 resources remain
installed. The full goal stays active for actual update/failed-transfer cases,
additional community-theme/wider design acceptance, exact final-ZIP fresh native
installation, actual VoiceOver (still pending explicit confirmation), native
Windows/Linux/mobile and representative slower-device/launch profiling, followed
by the final release audit. No commit, publication, personal-vault installation
or permanent Trash removal was made.


## Things contrast and packaged native checkpoint — November 18, 2026

Fixed the Things 2.2.6 Light readability regression: Resources now has an explicit
reading surface, and headings/emphasis use normal theme text colors while retaining
weight, italics and distinct links. Things Light/Dark, exact linked-passage preview
and Escape focus return pass native checks (captures 80–84). Default Light, purple
accent, local-KJV Genesis 1:4 and the dated local devotional remain restored in the
foreground test-vault; settings and dialogs are closed.

The user approved only the new disposable package QA vault. Its first native start
used the exact approved prior ZIP with fresh plugin settings. The current ZIP
changes only styles.css; all 1,475 extracted entries match it after native update
and restarts. WEB → KJV, labelled Berean Greek companion, six bundled ready resources
and saved edition/companion preferences pass there (captures 85–88). Networking was
not disabled. The prior ZIP’s first clean launch and current ZIP’s native update
are recorded separately; literal final-ZIP first launch/airplane-mode proof remains
open, alongside other release matrix gates.

Current Mac/Linux checks pass **368 tests / 60 files**, TypeScript and **380.4 KB**
production build. The first 2-CPU Linux attempt hit the full-corpus KJV checksum
test’s 15-second limit; its failed report is retained. That test now allows a bounded
60 seconds with all checksums and 31,102 verse assertions unchanged; the complete
rerun passes in **163.224 seconds**, with **1,678 mounted inputs unchanged** (input
SHA-256 `932ec7bf05b337704b9fe46be0e29e80504ed31cc3c5e79bdd657394216b44ef`).
JavaScript remains **389,503 bytes**, SHA-256
`a6421fa98e2273b2bac8efb409b5774fa56b02f3fc4c9bb68a0128213d9f9550`,
identical on Mac/Linux. Dependencies are unchanged from the zero-runtime-audit
checkpoint. Preview clean-install/offline-restart smoke and two identical builds
pass: **1,475 entries / 34,956,184 bytes**, SHA-256
`f587e3ae29bd1fdbe2e3a88038aed8bf594a655ce6e637f68d9b1f9f7d5c2561`.

The goal remains active for native update/failed-transfer cases, wider design/theme
acceptance, final native clean/offline-start, actual VoiceOver (approval pending),
native Windows/Linux/mobile, representative slower-device/launch performance and
final accumulated-worktree release review. Both Windows connector probes still
return service errors. No personal-vault installation, commit, publication or
permanent Trash removal occurred.


## Installer shutdown cancellation checkpoint — November 18, 2026

Review found that queued management actions and late local previews could still
run after plugin shutdown. A single lifecycle signal now protects management
selection/removal/restore/reconstruction, staged recovery and further cleanup;
queued work and new/late-WASM previews reject once the service stops. Existing
transaction checks preserve prior active choices when an uncommitted stage is
cancelled. A submitted filesystem rename/Trash call may complete; completed Trash
moves stay recoverable, and cancellation stops subsequent selected folders with
an explicit completed-folder count. No source format or dependency changed.

Six regressions failed before the fix. A seventh checks partial cleanup after one
completed Trash move; omitting lifecycle abort makes four cancellation cases fail,
including that case. Exact source was restored. Full **375-test / 60-file** Mac and
Linux checks, TypeScript and **381.0 KB** production build pass. Linux's 1,678 mounted
inputs remain unchanged, input SHA-256
`8221011ca0aa155e8d7e7db014a0ff4618feee289ac3b0dc63322944a5f53b11`.
Its real-source import/management/recovery workflows pass in **53.118 seconds**.
Mac/Linux JavaScript matches at **390,119 bytes**, SHA-256
`a973db2cef03400a8f774c1bd9f4525bafb0b6f3c00e3070d9faef35a933ca07`.
Current preview clean-install/offline-restart smoke and two identical builds pass:
**1,475 entries / 34,956,486 bytes**, SHA-256
`263c24df1c392b63fc29829d4392d0666ec495f2e80f445b122d9ee0c3ee2ca7`.
The build is deployed only to dev/test-vault. Focused five-axis review, red/green/
mutation logs and package evidence are under .research/modules/installer-stop-*
and .research/qa/installer-stop-package-evidence.json.

Native attachment again returns cgWindowNotFound, including after reattach. No
QA preferences/layout were reset. Current native startup/unload acceptance awaits
a visible QA window; earlier native ZIPs, extracted bytes and captures are retained
as evidence of their own snapshots, not this new candidate. A Windows fallback
connector also returns MCP internal error. Actual VoiceOver approval is pending.
The goal remains active for the native update/failure/clean-offline cases, wider
design audit, actual platform/assistive/slower-device proof and full release review.
No personal-vault change, publication/commit or permanent Trash removal occurred.


## Mac mini is the primary development host — November 24, 2026

The user requested migration and continued development. All 7,822 transferred files
and the original dirty/untracked Git state were verified before editing. Active repo:
`/Users/nanabee_home/Documents/obsidian_vaults/my-plugins/mysword+/dev`. Designs, corpora, QA vault and all prior evidence/history are retained.
The original Mac source remains a backup. Dependencies were rebuilt on the mini
from the unchanged lockfile with lifecycle scripts disabled.

The pending root-symlink defect is fixed on the mini: pre-creation ancestor validation,
canonical vault boundary, root checks before staging/discovery, physical casing and
base-alias compatibility. Four negative regressions failed before their fixes; the
new boundary mutation is detected and exact source restored. All eight adapter
cases and the full **380-test / 60-file** Mac/Linux checks pass. Linux's 1678
inputs remain unchanged. Three real-source workflow verifiers and both full/runtime
audits pass; zero dependency findings. Production bundle: **391,123 bytes**,
SHA-256 `39d31843fd56da6118e451141e512428eaba09810050420ab244cfb0e2cc0892`. Deterministic preview and offline smoke:
**1,475 entries / 34,956,811 bytes**, SHA-256 `2a072bc847674899cd462748c597e60ac1ddcfe9c8ecf01ac56f7191520c8d6b`.

Current host/reproduction/evidence details are in `docs/specs/mac-mini-migration-2026-11-24.md`.
Only the isolated project test-vault received deployment. Native Obsidian on the mini
(1.8.10) was not opened, and native UI/assistive/platform/slower-device and remaining
update/failure/release-review gates stay open. Goal status remains active. No commit,
publication, personal-vault change or permanent user-data deletion occurred.


## Cooperative preparation checkpoint — November 24, 2026

Continued development on the Mac mini found synchronous study-content preparation
and imported Bible decoding. Both now yield every 250 records and honor abort
signals, including the final batch. The plugin aborts Bible decoding on unload and
rechecks its installed generation before caching. Seventeen new regressions and
six detected/restored mutations cover responsiveness, cancellation and cache races.
All six real-corpus prepared JSON hashes and sizes are byte-identical to baseline.

On this M1/16 GiB Node runtime, maximum warm stage timer gaps fell from 337.475 to
10.234 ms for Bible preparation, 246.6 to 11.043 ms for commentary and 368.016 to
13.939 ms for Bible opening. Yielding increases elapsed processing time. Full import
validation/serialization still has longer gaps. This is Node evidence; native UI,
assistive and representative slower-device gates remain open. Details and precise
measurement limits: docs/specs/module-preparation-performance-2026-11-24.md.

Full Mac/Linux **397-test / 62-file** checks, TypeScript and build pass. Linux's
1,680 mounted inputs remain unchanged, fingerprint
`14fc458080f11077be0882a0aaaadab7cf0b20f9af173b2a0454eefabe27040e`;
it completes in 123.936 seconds. Four Mini real-source verifiers and Linux six-source
import/management/recovery workflows pass. Browser bundles match at **391,569 bytes**,
SHA-256 `62561f03bef9b6d427dfa1e789f0305c65d8564f413629d2d09b5f1ac88d8c5d`.
Preview smoke and two identical builds pass: **1,475 entries / 34,956,933 bytes**,
SHA-256 `8172a2bea7721abed8879c8fee4c61b308e8388018b10a3db168ebe875657c0c`.
Only the isolated project test-vault is deployed, with its core bytes verified.

Evidence: .research/platform-mini/cooperative-preparation and current
.research/platform-linux reports. Earlier candidate reports/packages are retained.
The current Computer Use bridge targets the original Mac; the Mini QA-only
AppleScript exception question remains unanswered. No native Mini UI, assistive
setting, personal vault, commit, publication or permanent user-data deletion occurred.
The full completion goal remains active.


## Active local-preview cancellation checkpoint — November 24, 2026

Shutdown, discard and replacement now abort active local preparation, rather than
only suppressing its final review ticket. Each preview owns a controller, relays
caller cancellation and releases its listener; old cleanup cannot clear a new
request's controller. Stale tickets cannot discard newer preparation.
Three original regressions read all 501 rows; all six new regression/compatibility
cases pass. Three targeted mutations are detected and exact source restored.

Twelve real-source cases (stop/discard/replace for Bible, commentary, dictionary and
devotional) interrupt after 101/26 SQLite steps, close both databases and make no
resource writes. Source hashes are unchanged and replacement Book previews work.
Shared WASM initialization and individual synchronous operations remain uninterruptible.
See docs/specs/local-preview-cancellation-2026-11-24.md for precise limits.

Mac/Linux **403-test / 62-file** checks, TypeScript and **382.8 KB** build pass,
as do Mini study installation and six-source import/management/recovery workflows.
Linux takes **67.118 seconds** with all **1,680** inputs unchanged, fingerprint
`861d8e01d674227521093514ccb742b1dfe520faccf04b87c425270e6da752b8`.
Bundles match at **392,027 bytes**, SHA-256
`cddcab4693ac3ee527f4b69ba0e4916a8fbdeccb845f043eea75d17d82ac6e45`.
Preview smoke and two identical builds pass: **1,475 entries / 34,957,019 bytes**,
SHA-256 `85eceb5ff138a78394ddf27c0ebad2b01c4b628227ccc0cc2a8c33031cdbbc2d`.
Only the isolated project test-vault is deployed; core bytes match the tested build.

Evidence: .research/platform-mini/preview-cancellation and current Linux reports.
Previous source/reports/packages are retained. No native UI/assistive/device
acceptance is inferred; the Mini QA-only AppleScript choice remains unanswered.
No personal vault, permission, commit, publication or permanent deletion changed.
The full completion goal stays active.


## Reading image focus/scroll checkpoint — November 24, 2026

Late image completion could refocus a source anchor after the user moved to search,
or reset newer scrolling. Restoration now checks the current entry, scroll and
anchor-focus context before applying the original position. Three regressions
failed before the fix; all seven new cases pass. Removing either new guard fails
the corresponding tests and exact source is restored.

An isolated Chromium fixture uses the production reading panel/renderer and a
controlled delayed image response. Before: image completion moved focus from the
search box to the source anchor. After: six rendered cases pass at 900/390 x 760,
covering search focus, scrolling after a source link and ordinary-entry scrolling.
The same paragraph and viewport-relative position stay visible; browser scroll
anchoring may change absolute scrollTop as an image gains dimensions. No console
errors/warnings or horizontal page overflow occur in these fixtures. Screenshots
and browser evidence are outside the repo at /Users/nanabee_home/Documents/obsidian_vaults/my-plugins/.sworddock-qa/reading-image-focus-2026-11-24.
This does not establish native Obsidian/theme/assistive/device acceptance.

Full Mini/Linux **410-test / 63-file** checks, TypeScript and **383.0 KB** build pass.
Linux completes in **61.727 seconds**, all **1681** mounted inputs unchanged,
fingerprint `611bc48f92050650cc913aa276c482980a2444a6cb42a509e71b51a0c510ad7d`. Real-source import/management/recovery workflows pass.
Matching browser bundles: **392,161 bytes**, SHA-256
`1747e7a479ef05d5f1498f50a5647ba09137198639bb65d4df0d5d57670a1216`.
Preview smoke and two identical builds pass: **1,475 entries / 34,957,059 bytes**,
SHA-256 `ede1a451c5b831d67321a07ffdcc5a9e3f22763b5a1a1b18b484616fb3e63240`.
Only the isolated project test-vault is deployed; core bytes match the tested build.

Fresh Windows terminal/desktop probes both return MCP -32603 Internal error.
The accumulated-worktree review has inspected eight source files and remains
incomplete; its evidence is outside the repo under .sworddock-qa. Native Mini UI
automation/assistive approvals and the remaining release gates are unchanged.
No personal-vault change, permission change, commit, publication or permanent
user-data deletion occurred. The full completion goal stays active.


## Reader/Resources view lifecycle checkpoint — November 24, 2026

The Resources inventory baseline now follows every render, preventing an unrelated
module progress event after a type/open-module switch from rebuilding the search.
Query, caret, focus, DOM identity and reading entry remain intact; genuine source
generation changes still refresh and retain the saved entry. Reader now verifies
its opening subscription still belongs to it before attaching a resize observer.
Pinned-word/verse focus uses one owner-document guard and respects newer external
input. Settings no longer incorrectly claims publisher downloads are disabled.

Five pre-fix failing cases and all nine new regression/compatibility cases pass.
Three mutations fail the intended tests; exact source is restored. Production
Reader/Resources browser fixtures reproduce all three old defects and pass ten
cases at 1100/390 x 900 with a clean console, meaningful rendered content and no
horizontal page overflow. Obsidian host and WordDetails boundaries are stubbed;
this is not native Obsidian, theme or assistive/device acceptance. Browser artifacts,
reproduction code and focused review live outside the repo at /Users/nanabee_home/Documents/obsidian_vaults/my-plugins/.sworddock-qa/view-lifecycle-2026-11-24.

Full Mini/Linux **419-test / 64-file** checks, TypeScript and **383.1 KB** build pass.
Linux completes in **73.024 seconds**, all **1682** inputs unchanged,
fingerprint `13f84c1c88e3da91fe24edb18b767bb7cf87600b62815a4bc6c37443019d498e`. Real-source import/management/recovery workflows pass.
Matching browser bundles: **392,341 bytes**, SHA-256
`30f44915a8ce17f9d7a9b4f5ac2d431d7c4cff40190f25711e5179bdafbf1be8`.
Preview smoke and two identical builds pass: **1,475 entries / 34,957,116 bytes**,
SHA-256 `a49eac353795ae64a715621cb590b474eb98e7366de8d7b9089369bea9b40e24`.
Only the isolated project test-vault is deployed; core bytes match the tested build.

The accumulated source review now covers 15 files and remains incomplete. Current
reports and release ledger retain all native/source-update/failure/device/theme/
assistive/slower-device gates. The Mini QA-only AppleScript exception remains
unanswered. No native Mini UI, personal vault, OS permission, commit, publication
or permanent user-data deletion changed. The full completion goal stays active.


## Retained Bible integrity and long selections — November 24, 2026

Integrity now verifies the displayed imported Bible generation after a version
switch. Reader selections such as Psalm 119:1–176 survive history, bookmarks and
highlights; ascending same-chapter coordinates retain the 1–200 bounds. Seven new
cases pass (five failed before); both deliberate regressions are detected and
source restored. The real 31,102-entry KJV import passes both integrity directions
and all 176 ordered Psalm 119 verses with persistence; input bytes are unchanged.

Full Mini/Linux **426-test / 65-file** checks and strict TypeScript/build pass.
Linux takes **72.907 seconds**, with all **1,683** inputs unchanged, fingerprint
`81e9e9b48edd33a2851ca69ca33e133b1634dc4483cb5a84864048b213f90876`.
Real-source import/reopen/management/recovery checks pass; identical Mac/Linux
bundles are **392,363 bytes**, SHA-256
`b24d264ed6d8476645e257503f9422b5a9b265db19ad9e297319baafd8c9e298`.
Two identical previews and clean-install/offline-restart smoke pass:
**1,475 entries / 34,957,121 bytes**, SHA-256
`5de3e93c5a62bfccb5de6ce85325421b250a4fc22b5a6eef2d354f2f487d6e9a`.
Only the isolated project test-vault is deployed; its three core files match.

See docs/specs/generation-integrity-and-long-selections-2026-11-24.md and current
Mini/Linux reports. The accumulated source review covers 46 files and remains
incomplete. Native Mini/theme/platform/assistive/slower-device, source-update and
final native ZIP gates remain open. The Mini QA-only AppleScript exception remains
unanswered. No native UI, personal vault, OS permission, commit, publication or
permanent user-data deletion changed. Development remains on the mini and the
full completion goal remains active.


## Comparison history and Resources opening — November 24, 2026

Comparison Back/Forward now follows its own chapter, linked and pinned-word passage
history. Unlinked/pinned navigation leaves Reader unchanged. Identical link echoes
are ignored, new navigation clears forward history, state restoration resets it,
and the latest 100 transitions are retained. Resources now loads a deferred leaf
before selecting a requested installed module. No-target opening preserves choice.

All twelve new unit cases pass; seven originally failed. Three deliberate defects
are caught and exact source restored. Eight rendered cases pass at 1100/390 x 900,
with no console errors/warnings or horizontal page overflow. Production opening
and view classes use controlled content and host/WordDetails shims; simplified
glyphs and screenshots are fixture evidence, not native Obsidian acceptance.
Browser artifacts/focused review are outside the project under the sibling
.sworddock-qa/comparison-navigation-2026-11-24. Its server is stopped/port closed.

Full Mini/Linux **438-test / 67-file** checks, strict TypeScript and **384.1 KB**
build pass. Linux takes **72.566 seconds**, all **1,685** inputs unchanged, fingerprint
`1929fdfaa4d05d11d39e781490861bd8e843eeafd77d13810f33daa90a6cc2b4`.
Six-source import/reopen, management and recovery pass; matching production bundles
are **393,283 bytes**, SHA-256
`e02b6b5a686534c2dd9d7cb6eb04ceeaafff3cbdf88c7420cfca2109dcafe67c`.
Two identical previews and clean-install/offline-restart smoke pass:
**1,475 entries / 34,957,368 bytes**, SHA-256
`d7512742edef9f58b50d4653fa8390fc77dea99a607326a51b42817bf5129947`.
Only the isolated project test-vault is deployed; core bytes match the build.

See docs/specs/comparison-navigation-and-resources-opening-2026-11-24.md and current
Mini/Linux reports. The 46-file accumulated source review remains incomplete; these
two scoped behavior checks are recorded with their host-shim limits. Native Mini,
source-update/failure, final ZIP, theme/platform/assistive/slower-device gates stay
open. The QA-only AppleScript exception is unanswered. No native UI, personal vault,
OS permission, commit, publication or permanent user-data deletion changed. Primary
development remains on the mini; the full completion goal remains active.


## Companion loading and newer input — November 24, 2026

Late interlinear rendering now respects newer focus before replacing DOM and
consumes the requested navigation restoration once. Reader aligns a ready companion
only once while its initial render, scroll and active element remain unchanged.
New typing, scrolling and preference-control interaction no longer lose their
context. Ordinary companion navigation still restores its control; source data and
the labelled KJV/Berean distinction remain unchanged.

Nine new cases pass (six failed before); four mutations fail their intended tests
and source is restored exactly. Eight production Reader/panel Chromium cases pass
at 1100/390 x 1000 using pinned KJV/Berean John 3 data and controlled loading. Newer
focus/scroll and preference controls remain, with a clean console and no page
overflow. Host/WordDetails/dictionary shims limit this evidence; no native/theme/
assistive/device acceptance is inferred. Screenshots/reproduction are outside the
repo under .sworddock-qa/interlinear-lifetime-2026-11-24; port 56059 is closed.

Full Mini/Linux **447-test / 67-file** checks, strict TypeScript and **384.2 KB**
build pass. The initial Mini run found a QA snapshot with a test suffix; its bytes
were retained under .snapshot, then the complete check passed. No tests/exclusions
were removed. Linux takes **82.872 seconds**, all **1,685** inputs unchanged, fingerprint
`53a47af8a5d5e92f5565d02627c6e50eefb31fd4780ee1f5c454394f3531543d`.
Six-source import/reopen, management and recovery pass. Matching bundles:
**393,463 bytes**, SHA-256
`88c27d202beec5fdf4bc20322f7aeb7a19e7a8d051db0e99551af06b85cddda8`.
Two identical previews pass clean-install/offline-restart smoke:
**1,475 entries / 34,957,441 bytes**, SHA-256
`82112ca933adc1bba5e219c5807992a0aeb17b87560e230ce8a9f4b009913038`.
Only isolated dev/test-vault is deployed; core files match the tested build.

See docs/specs/interlinear-lifetime-2026-11-24.md and current platform reports.
The source review now covers **89 of 107** production files plus four build files,
and remains incomplete. Eighteen UI files, CSS, other scripts and accumulated
test/evidence coverage remain. Native Mini, exact final ZIP, source-update/failure,
theme/platform/assistive/slower-device gates remain open; the QA-only AppleScript
exception is unanswered. No native UI, personal vault, OS permission, commit,
publication or permanent user-data deletion changed. Development remains on the
mini and the full completion goal remains active.


## Source generations and UI lifetimes — November 24, 2026

Search now detects replacement of a Bible resource under the same edition ID and
refreshes through its existing cancellation/query path. Short-query cancellation
clears aria-busy. Quick Jump/Insert refreshes preview text, source metadata and hint
together; a source change invalidates pending old-source insertion. Fresh reviewed
insertion still works. Library reports measured partial collections and binds its
recheck’s final UI to the requesting opening. Cleanup/recovery completion refreshes
only its initiating dialog revision while the authorized operation may finish.

Twenty new cases pass (fourteen failed before), and six deliberate defects fail
the intended tests with exact source restoration. Twenty-two production UI browser
cases pass at 1100/390 x 950 with actual ImportedBibleResource decoding/search and
controlled source, host, fake-editor and storage-task boundaries. No real note or
Trash operation occurs in those fixtures. Page/console/interaction/overflow and
screenshot checks pass; port 56060 is closed. Evidence and fixture code live outside
the project under .sworddock-qa/source-lifetimes-2026-11-24. These checks do not prove
native source-update/failure acceptance.

Full Mini/Linux **467-test / 68-file** checks, strict TypeScript and **384.8 KB**
build pass. Linux takes **87.659 seconds**, all **1,687** inputs unchanged, fingerprint
`9894972692be97316fc01199e6e8de262bcf3dab755e7b5453c2acdd98b7610b`.
Six-source import/reopen, management and recovery pass. Matching bundles:
**394,010 bytes**, SHA-256
`1cc6356f2bc5c05ca9f543ca63c472b2388476ff26ed2cc284af581d76560b9b`.
Two identical previews pass clean-install/offline-restart smoke:
**1,475 entries / 34,957,605 bytes**, SHA-256
`55505752da2f728f9082d9ebf0315b559546eb58c52b9a41839628e412e21389`.
Only isolated dev/test-vault is deployed; core files match the tested build.

All **107 production TypeScript files** have received source inspection, plus four
build files. The broader CSS/script/test/evidence review and legacy advanced-copy
clarification remain open, along with all native/final ZIP/source-update/failure/
theme/platform/assistive/slower-device acceptance. The Mini QA-only AppleScript
exception is unanswered. Read-only mobile inventory finds eleven shutdown iOS
simulators, zero installed Obsidian simulator apps and no Android SDK/tools; none
were launched or installed. No native UI, personal vault, OS permission, commit,
publication or permanent user-data deletion changed. Development remains on the
mini and the full completion goal remains active. See source-lifetimes-2026-11-24.md
and current platform reports for the precise evidence and limits.


## Unavailable controls and advanced inspection — November 24, 2026

Development continues on Nana’s Mac mini. Unavailable buttons/fields now have an
explicit scoped affordance; disabled controls no longer receive active hover
styling. Aria-disabled loading controls retain their existing keyboard focus and
action guard, and unavailable source prose stays readable. Primary action text
now retains the host text-on-accent token despite the later generic button rule.
Controlled light/dark normal/hover contrast measures 5.95–10.57:1.

Advanced Bible inspection is clearly read-only and offers Open module import to
the implemented SQLite/gzip importer. Obsolete future-writer/layout copy and an
unsaved inactive rights form are removed. Source warnings, literal samples,
integrity information and structure analysis remain. The real importer retains
its source notice and optional provenance note; its installation logic is unchanged.

Twenty production-UI Chromium cases pass at 1100/390 x 1000 with controlled light/
dark host variables and data. Identity, nonblank content, overlays, console,
keyboard/pointer actions, navigation and overflow checks pass. This is browser
fixture evidence, not native Obsidian, community-theme, device or screen-reader
acceptance. Its server is stopped and port 56061 is closed. Artifacts and fixture
code are outside the repo under .sworddock-qa/availability-copy-2026-11-24.
No new unit cases were added for this CSS/copy/standard-navigation change.

Full Mini/Linux **467-test / 68-file** checks and strict TypeScript/build pass.
The Mini check precedes the final CSS-only CTA specificity adjustment; final browser
and Linux checks include it. Linux takes **76.631 seconds**,
all **1,687** inputs unchanged, fingerprint
`1b031f555a13981ef1ad7306f7d274ff2c8489c94735c73d730318bcda583c46`. Six-source import/reopen, management and recovery pass.
Matching bundles are **392,949 bytes**, SHA-256
`93ee77baba265984529402ec0cb749d9834a7b730bcb01c7666abc360455cd25`.
Two identical **1,475-entry / 34,957,307-byte** previews
pass clean-install/offline-restart data smoke, SHA-256
`a601c9e78724a68091bd5f928c3abcbcc04c738361bd0b6a9c75c6a52de01d76`.
Only isolated dev/test-vault is deployed and its core files match. HEAD and lockfile
are unchanged. No native Mini UI, personal vault, OS permission, commit, publication
or permanent user-data deletion changed.

All 107 production TS files, styles.css, four build files and nine development
scripts have received source inspection. Remaining scripts, accumulated test/
evidence review and all open native/source-update/failure/final ZIP/platform/
theme/assistive/slower-device gates remain incomplete. The QA-only AppleScript
exception is unanswered. See docs/specs/availability-and-import-copy-2026-11-24.md,
current reports and the scoped release review. The full completion goal stays active.


## Strict rich-source verification — November 24, 2026

The release review found and reproduced a verifier false pass: one forced parser
fallback left all 22 book source records retained but only 21 text projections
compared, while the command exited zero and reported complete. The shared script
policy now requires every retained source record and, for non-Bible resources,
zero parser fallbacks and a complete text-comparison count. Bible records continue
to use their separate GBF reader; no Bible HTML-projection claim is introduced.
The verifier marks its report incomplete before oracle/build/validation work, so
startup failures cannot leave a prior success as the current report.

Five persistent unit cases pass; the actual defect reproduced before the helper
existed. Initial unit RED was missing-module collection, not five behavioral
failures. Removing each of the three policy guards fails its intended tests and
exact helper source is restored. Two full-corpus negative cases exit nonzero and
leave incomplete reports. A controlled oracle-startup failure also clears a seeded
prior success; removing that initialization in an isolated script copy preserves
the stale success and is detected. Production parser/source inputs are unchanged.

The positive full pinned-corpus comparison passes: **56,984** exact source records,
**25,882** non-Bible text projections, **zero fallbacks**. Existing unresolved
source links/anchors remain explicit. A successful report does not assert that
those source addresses are valid. Evidence is retained under
.research/platform-mini/verifier-review, including the false-success report,
negative cases, unit/mutation logs and final full-rich report summary.

Full Mini/Linux **472-test / 69-file** checks, strict TypeScript and build pass.
Linux takes **67.593 seconds**, with **1,689** inputs unchanged,
fingerprint `b67204b11020a73bbf7da17597966ea7ff74854c83ca1196cb939e294083d210`.
Six-source import/reopen, management and recovery checks pass. Production remains
**392,949 bytes**, SHA-256
`93ee77baba265984529402ec0cb749d9834a7b730bcb01c7666abc360455cd25`.
Every entry of the existing **1,475-entry / 34,957,307-byte** preview
matches current project bytes; its prior two identical builds and clean-install/
offline-restart data smoke evidence remain valid. ZIP SHA-256:
`a601c9e78724a68091bd5f928c3abcbcc04c738361bd0b6a9c75c6a52de01d76`.
No redundant package/UI run is claimed for this QA-script-only change. The isolated
test-vault core files remain identical; no deployment change is needed.

All **107 production TS files, styles.css, 25 scripts and esbuild.config.mjs** now
have source inspection. Full accumulated test/evidence coverage and all open
native/source-update/failure/final ZIP/platform/theme/assistive/slower-device
acceptance remain incomplete. Fresh read-only Windows probes timed out before a
command ran. The Mini QA-only AppleScript exception remains unanswered. No native
Mini UI, personal vault, OS permission, commit, publication or permanent user-data
deletion changed. Primary development remains on the mini and the goal is active.


## Management context and operation openings — November 24, 2026

Resource management now retains the current resource’s expanded source panels,
scroll and scoped keyboard focus through completion or inventory changes. Newer
Close focus, source summaries and publisher links remain in context. A source link
that is still reloading falls back to its containing summary; it does not jump
later. External typing remains untouched. Normal initiating-action restoration
still works. Selecting a different resource starts its own closed disclosures;
when a reviewed resource disappears, Close remains available and focused.

Operation completion is bound to its requesting opening. Closing/reopening the
same modal permits a new operation, and old success/failure callbacks cannot
refresh that opening or clear its newer busy state. The existing shared module
transactions and data protections are unchanged.

Sixteen new cases pass; twelve fail against the exact pre-fix source. Five
independent context/opening/resource-scope mutations fail their intended tests
and source is restored. The fixture was extended to model dataset attributes,
details, ancestor lookup and animation frames; an initial strict-check failure
from loose fixture typing was retained and corrected before the full green run.
Six browser baseline cases reproduce actual focus loss/collapsed details. The
initial Tab probe’s inaccurate Close label is retained separately; the final
baseline tabs until Close is actually focused.

Twenty-four production-modal Chromium cases pass at 1100/390 x 1000 with controlled
light/dark host variables, inventory and delayed operations. Page identity, nonblank
content, overlays, console, keyboard/actions, screenshots and overflow checks pass.
The fixture supplies a scrolling content area and performs no real management
writes or native Obsidian actions. This is not native/theme/device/assistive proof.
Artifacts and reproduction code are outside the repo under sibling
.sworddock-qa/management-context-2026-11-24. The QA server is stopped/56062 closed.

Full Mini/Linux **488-test / 70-file** checks, strict TypeScript and build pass.
Linux takes **98.136 seconds**, all **1,690** inputs unchanged,
fingerprint `d0b924f651dbed33494cfe4cfcc0749e5057229e5af2c9d533f68e4700f28ac0`.
Six-source import/reopen, management and recovery pass. Matching bundles:
**394,340 bytes**, SHA-256
`27e1a4314441cde1437971301be88b2ea16238636ab8b40dce6dd381b49e19b1`.
Two identical **1,475-entry / 34,957,736-byte** previews pass clean-install/
offline-restart data smoke, SHA-256
`56c9f8db2c4c9c3840125a0d985ada10b12b2bd4b1bacf214aad84586dd61253`.
Only isolated dev/test-vault is deployed; its core files match. HEAD and dependency
lock remain unchanged. No native Mini UI, personal vault, OS permission, commit,
publication or permanent user-data deletion changed.

All 107 production TS files, styles.css, 25 scripts and esbuild.config.mjs have
source inspection. Full accumulated test/evidence review and all open native/
source-update/failure/final ZIP/platform/theme/assistive/slower-device acceptance
remain incomplete. The Mini QA-only AppleScript exception remains unanswered.
Development stays on the mini and the full completion goal is active.


## Catalogue source-update contract coverage — November 24, 2026

Seven new existing-behavior tests compose controlled changed-source fingerprints,
the actual management modal callback, real SQLite/gzip normalization, installation
and a temporary filesystem. Catalogue pin changes alone preserve the chosen
edition after offline restart. The modal shows distinct current/reviewed source
hashes and a reviewed-source link before the explicit Install reviewed update
control publishes a new generation. Both generations remain readable; the exact
selected source persists through offline restart and explicit rollback/reselection.

Altered and stale artifacts fail without changing any prior stored byte. Active
update cancellation reaches the downloader signal and preserves the prior readable
selection. Management-save failure retains the prior selection and original bytes;
the new verified but uncommitted generation remains available without silently
activating on restart. All temporary stores are owned by the tests and removed.

The existing implementation passes. No production bug or behavioral RED is claimed:
initial setup failures came from the fixture’s unaccepted publisher-source URL.
The controlled source now respects the unchanged publisher-source validation;
its download function remains a stub and performs no public network request.
Three deliberate defects (missing update activation, omitted source-pin checks,
and a false current-source fingerprint in the review) fail the tests. Both
production files are restored exactly. No production source, UI styling, real
catalogue pin or dependency changed.

Full Mini/Linux **495-test / 71-file** checks, strict TypeScript and build pass.
Linux takes **79.797 seconds** with **1,691** unchanged inputs,
fingerprint `73752fcb9384e3bfd5073af46c3e2f38e911712621e28b4b633e014d2c5f51bc`.
Real six-source import/reopen, management and recovery also pass. Production stays
**394,340 bytes**, SHA-256
`27e1a4314441cde1437971301be88b2ea16238636ab8b40dce6dd381b49e19b1`.
All **1,475** entries of the existing **34,957,736-byte** ZIP match current project
bytes, retaining the prior two identical builds and clean-install/offline-restart
data smoke evidence. ZIP SHA-256:
`56c9f8db2c4c9c3840125a0d985ada10b12b2bd4b1bacf214aad84586dd61253`.
No redundant package or deployment run is claimed. The isolated test-vault core
files remain identical. HEAD and dependency lock remain unchanged.

The source/evidence audit now covers **19 of 71 test files plus the shared UI
fixture** (20 of 72 test/support files). Transaction, import, storage, loopback
transport, production filesystem guards and study-preparation boundaries were read
in full, along with prior focused UI-lifetime/rich-verifier cases. Test doubles and
source/runtime limits are explicit in the scoped review; no full evidence audit
or native acceptance follows from these counts. Production TS/CSS/scripts already
have source inspection; remaining test/evidence coverage and all open native/
source-update/failure/final ZIP/platform/theme/assistive/slower-device gates remain.
The Mini QA-only AppleScript exception is unanswered. No native UI, personal vault,
OS permission, commit, publication or permanent user-data deletion changed.
Development remains on the mini and the full completion goal stays active.


## Reader control sizes and source/test audit — November 24, 2026

Primary development remains on Nana’s Mac mini. Rendered verification found that
later compact CSS rules reduced mobile-flagged Reader buttons/selects below the
44px stylesheet policy: icons were 30x34, chapter selectors 28px wide, study buttons
26px tall, and companion selects 28px tall. Scoped mobile Reader rules now retain
44px minimum text/icon-button and select dimensions. Toolbar/study controls wrap
at narrow widths. Inline Scripture-word buttons retain their existing sizing.
The branding test now describes its actual declaration-only coverage; no new unit
case or production JavaScript change is claimed for this CSS fix.

Controlled Mini Chromium passes **91 cases**: 75 mobile-flagged geometry cases,
15 desktop baseline comparisons and one actual keyboard/chapter/display-mode flow.
Widths: 320, 390, 640, 768, 1100; Classic/Compact/Focus; Reading/Word study/Interlinear.
Measured toolbar, focus navigation, study buttons, footer buttons and companion
selects meet 44px bounds without overlaps or horizontal page overflow. Console and
page errors are empty. Desktop geometry matches the pre-fix CSS after resetting
fixture scroll to the same origin; initial mobile onOpen scroll differed with the
larger controls and was not a desktop style change. Wide/light and narrow/dark
screenshots were inspected. Pinned KJV/Berean data and controlled host/WordDetails
boundaries establish browser coverage, not native/device/theme/touch acceptance.

All **71 test files plus the shared UI fixture** have now been source-inspected
and hash-bound. Production TS/CSS/scripts have source inspection. Retained complete
interlinear verification is bound to identical current runtime bytes and all
1,189 pinned chapter hashes (443,625 words, 31,102 records, 17 empty verses).
Retained commentary-oracle evidence is bound to identical current runtime and the
pinned source archive. KJV remains paired with a labelled Berean companion; exact
KJV English word alignment is not claimed. This is scoped evidence review, not
completion of the accumulated requirement/release audit.

Mini/Linux **495 tests / 71 files**, strict TypeScript/build and real six-source
import/reopen, management/recovery pass. Linux takes **83.637 seconds**,
with **1,691 unchanged inputs**; fingerprint
`da9f880df94055a70d73bf6c869543c79d8f5efc2b6b730eb71df87d3658e00f`.
Bundle remains **394,340 bytes**, SHA-256
`27e1a4314441cde1437971301be88b2ea16238636ab8b40dce6dd381b49e19b1`.
Two byte-identical **1,475-entry / 34,957,843-byte** previews and
clean-install/offline-restart data smoke pass. ZIP SHA-256:
`b0082ad7a80b6293faefcdbf2eb60f85e3c80f8a3b357bb030b117f2c56dcfe5`.
Only isolated dev/test-vault was deployed; its three core files match. HEAD and
lock remain unchanged. Evidence: .research/platform-mini/source-content-review;
browser artifacts: sibling .sworddock-qa/reader-control-sizes-2026-11-24.

Full accumulated evidence, current native Mini/final native ZIP, Windows/native
Linux/mobile, community themes, actual screen reader and slower-device acceptance
remain open. The Mini QA-only AppleScript exception is unanswered; no native Mini
UI or OS permission was changed. No personal vault, commit, publication or permanent
user-data deletion changed. The full completion goal remains active.


## Transport verification evidence — November 24, 2026

Development remains on Nana’s Mac mini. The transport verifier previously wrote
its report only on success. An existing `complete: true` result survived both a
startup build failure and a controlled HTTPS failure. The verifier now writes
`complete: false` before build/network/assertion work and publishes success only
after cancellation, resume, pinned installation and offline-service checks pass.
No product code, dependency, UI or packaged asset changed.

## Regression and isolation

Two child-process tests reproduce the stale report. Both failed before the fix.
The tests create disposable report trees, copy the actual verifier there and
share only read-only source/dependency links. One tree deliberately lacks source;
the other replaces Node HTTPS with a controlled failing request, so neither test
makes a public network call. Both inspect the resulting report and the expected
failure diagnostic, preventing a different early error from satisfying the test.

The initial Mac fixture left the script in the repository while changing its
working directory, so its relative runtime import could load a pre-existing
repository bundle. Linux lacked that artifact and correctly rejected the fixture.
The corrected fixture keeps script and generated runtime in the same isolated
tree. The failed Linux report/log is retained, without a product-bug claim.
Removing early invalidation makes the corrected tests fail; the exact fixed
script is restored afterward. Full Mini/Linux checks pass after this correction.

## Current real-network proof

A fresh `node scripts/verify-download-transport.mjs` run uses the actual publisher
HTTPS endpoint with TLS verification and the unchanged catalogue source pins.
It closes the cancelled request after **527,838 bytes**, persists that prefix,
recreates the downloader and receives **HTTP 206** at `bytes=527838-`.
After checksum validation it installs/reopens Bible (31,102), commentary (21,114),
dictionary (3,965), book (22), devotional (745) and graphics (36) resources.
A fresh offline service forbids downloads; the default production HTTPS request
path is separately exercised. All persistence is a disposable temporary store,
removed by the verifier. This is Node/transport proof, not native failure UX,
actual app networking isolation, publisher-update or device acceptance.

The current exact transport runtime is hash-bound to this fresh report. The
current rich runtime also exactly matches retained full-oracle verification;
all six physical database hashes still match catalogue pins. The retained rich
report covers **56,984 source records / 25,882 non-Bible projections**, no fallback.
The prior interlinear/commentary field-oracle bindings remain applicable.

## Current automated checkpoint

Mini/Linux **497 tests / 72 files**, strict TypeScript/build and real six-source
import/reopen, management/storage recovery pass. Linux: **69.35 seconds**,
**1,692 inputs unchanged**, fingerprint
`4dc5701f72d1afe2bc27a7ffdc67b9d4f96e652aac6c070c651c3d65802e4a58`.
Bundle SHA-256: `27e1a4314441cde1437971301be88b2ea16238636ab8b40dce6dd381b49e19b1`.
All **1,475** existing preview entries still exactly match current project bytes.
Retain the prior two identical builds and clean-install/offline-restart data smoke;
no redundant packaging, deployment or UI rerun is claimed for QA-only changes.
Preview: **34,957,843 bytes**, SHA-256
`b0082ad7a80b6293faefcdbf2eb60f85e3c80f8a3b357bb030b117f2c56dcfe5`. Isolated test-vault core files still match.
HEAD and dependency lock remain unchanged; no publication or personal-vault edit.

All **68** numbered completion-ledger criteria now have explicit current-scope
assessments and hash-bound evidence in sibling
.sworddock-qa/requirement-audit-2026-11-24.json. Fifteen automated-scope criteria
and the user-selected companion contract have current proof. Thirty-nine checked
rows contain historical native or partial current evidence; thirteen open rows
still lack the complete required proof. These counts do not change ledger scope
or imply 39 historical checks failed. Source/script/test inspection is complete;
full current release acceptance is not.

Current native Mini design/focus/theme flows, actual publisher-update/native
failed-transfer paths, exact final native ZIP/offline start, Windows/native Linux/
mobile, actual screen reader and slower-device acceptance remain open. The
manifest still correctly declares this a desktop developer preview; browser host
flags do not establish mobile support. Mini QA-only AppleScript approval remains
unanswered; no native Mini interaction or OS setting was changed. The full goal
remains active. Optional Copilot/Research remains later scope.

Evidence: .research/platform-mini/transport-evidence (red/green/mutation/check/
Linux logs, failed-fixture report, current HTTPS/rich bindings and checkpoint).


## Fresh native-package preparation — November 24, 2026

The exact current preview is prepared in a new disposable Mini vault:

`/Users/nanabee_home/Documents/obsidian_vaults/my-plugins/.sworddock-qa/fresh-native-2026-11-24-b0082ad7/vault`

Package SHA-256: `b0082ad7a80b6293faefcdbf2eb60f85e3c80f8a3b357bb030b117f2c56dcfe5`.
All **1,475** extracted plugin files / **158,264,826 expanded bytes** match both
the ZIP and current project bytes. The package manifest retains plugin ID
`versedock`, version `0.1.11` and `isDesktopOnly: true`. There is no community-plugin
enablement file, saved plugin state or existing workspace in this fresh vault.
No native launch or plugin activation was performed. The package was never opened
through a GUI and this preparation is not fresh-install runtime acceptance.

Sibling `import-inputs` contains all six pinned real databases. Bible/devotional
copies are deterministic gzip wrappers; their expanded hashes match the original
pinned SQLite. Other copies remain raw SQLite. Selected and database fingerprints,
byte sizes and provenance are recorded in `receipt.json`. Two named controlled
malformed/opaque inputs prepare rejection checks without claiming vendor DRM
coverage. Source inputs and the existing dev/test-vault remain unchanged.

`QA-START.md` provides the current build's exact command names and native startup,
wide/narrow/theme/focus, KJV/Berean, six-type import, management/failure/recovery,
rich-link, app-restart, network-isolation and assistive acceptance steps. No step
is marked passed from extraction or from core tests. All existing release gates
remain in tasks/completion-2026-11-18.md and the 68-criterion audit.

## Current access evidence

The native bridge reports host `Mac`, home `/Users/user`, target `mac`; it still
does not target the Mini. Codex handoff metadata exposes only `local` and forbids
the calling thread from moving itself; no handoff was attempted. Both Windows
shell connectors and the separate Windows native window connector remain
unavailable; remote command execution is not confirmed. Raw connection endpoints
or keys are not retained. Mini CoreDevice read-only discovery reports zero known
physical devices. Earlier shutdown-simulator inventory found no installed Obsidian
simulator application. No native iOS/Android/slower-device proof follows.

The existing Mini QA-only AppleScript exception is unanswered. The Computer Use
skill requires node_repl for UI interactions unless an alternative technology is
specifically requested. This prevents substituting shell-driven Mini GUI actions.
Actual assistive settings and enabling a new package through a GUI remain separate
confirmation boundaries. No GUI input, system setting, personal vault, commit,
publication or permanent data deletion occurred.

The previous Reader-control and transport-verifier goal turns recorded this same
missing approved Mini native path while completing independent code/evidence work.
That work, the 68-criterion classification and this fresh reviewable artifact are
now complete. Remaining current acceptance needs approved native execution and
available actual target platforms/hardware; more unchanged core-test runs cannot
satisfy those requirements. The full goal is unachieved.

Receipt: sibling .sworddock-qa/fresh-native-2026-11-24-b0082ad7/receipt.json.
Access evidence: sibling .sworddock-qa/verification-access-2026-11-24.json.
Current code tests remain **497 / 72 files** on Mini/Linux; no code or packaged
asset changed, so no redundant tests/package/deployment run is claimed.


## Git development checkpoint — November 25, 2026

The user explicitly requested syncing and pushing development progress to Git.
Verified development checkpoints now commit and push to the current feature branch;
the repository AGENTS.md records this standing preference. Primary development
remains on the Mac mini. This authorization supersedes the previous session's
no-commit/no-push boundary; it does not authorize merging, tagging or publishing
a release. Earlier fixed-HEAD evidence remains a historical snapshot.

The branch is `branding/sworddock-bible` at
`https://github.com/dernestbank/versedock-obsidian`.

- Attributed offline study data: `65499d814c15cc476794015adff89dba5d2224c0`.
- Install/import/management, source-aware study UI and workflow implementation:
  `48b324da1f2283be5cd1da9b53626eb60613d507`.
- Documentation and curated isolated-vault design QA are saved in the accompanying
  documentation checkpoint. Raw research, test vaults, private imports, dependency
  caches, compiled main.js and preview ZIPs remain ignored.

A new checkout made entirely from the Git index contains **1,771 tracked files**.
It passes a fresh lockfile install, **497 tests / 72 files**, strict TypeScript,
production build, preview packaging and clean-install/offline-restart data smoke.
It does not depend on ignored research fixtures or the development test vault.
The production bundle matches the verified candidate exactly. Its **1,475-entry /
34,957,843-byte** preview is byte-identical, SHA-256
`b0082ad7a80b6293faefcdbf2eb60f85e3c80f8a3b357bb030b117f2c56dcfe5`.
Three newly added test files had an extra EOF blank line removed for Git's staged
whitespace check; their assertions and behavior are unchanged. This fresh check
covers the exact staged source/test tree after that cleanup. Dependency versions,
lockfile, product code and packaged assets were not changed for Git synchronization.

The 68-criterion release audit and native/platform/theme/screen-reader/slower-device
acceptance limits still apply. This checkpoint does not claim final native ZIP
startup or completion of the full product goal. Prior current-source Linux and
real HTTPS/corpus evidence remain scoped to their recorded inputs; the GitHub PR
will separately validate this pushed tree. No release or merge is performed.

Local sync receipts and fresh-check logs stay in sibling
.sworddock-qa/git-sync-2026-11-25, outside version control. Remote synchronization
is verified against the exact branch-head SHA after push.

## Resources dictionary focus — November 26, 2026

Following the Reader could move typing into a sibling Resources pane, collapse
a selected Strong’s identifier to a caret, or lose focus in a pop-out. Each pane
now checks its own query input against its document’s active element and restores
both selection offsets and the selection direction. Three reproductions failed
before the change and pass afterward. Chromium independently reproduced all
three outcomes with production Resources views and a second document realm.

The full Mini check passes 500 tests across 73 files, TypeScript and production
build. The 1,475-entry preview passes the clean-install and offline data-reopen
smoke check. Its SHA-256 is
`944815779e5a7688d4ad35a1cf3bdc334aab6b89f5ce159ec6bb8c99e72c825d`.
The earlier package opened in an isolated Obsidian 1.15.1 profile on macOS
26.6.2 and reached its first-run vault trust prompt. Exact-build plugin startup,
native focus and the remaining release criteria still need verification.

## Native desktop package verification — November 26, 2026

The same 94481577 preview opened in Obsidian 1.15.1 on macOS 26.6.2
and Debian 12 ARM64. On macOS, all six local files reached review without
changing the installed count, then installed with 31,102 Bible verses, 21,114
commentary records, 3,965 dictionary entries, 22 book entries, 745 devotional
entries and 36 graphics entries. Open resource selected the matching installed
ID every time. Both controlled invalid inputs showed a rejection before install.
All original fixture hashes were unchanged. The chooser was driven through
Electron’s file-selection event. Other native picker and restart checks are separate.

On Debian, the official ARM64 Obsidian ran with its Chromium sandbox inside a
fresh VM. A kernel network namespace with only loopback and no external route
covered both native launches. In a fresh vault the trust prompt and plugin switch
worked, WEB rendered John 3:16, and Library listed six bundled resources.
The KJV action opened a separate labelled Berean companion with 25 Greek words.
Word selection opened the offline Strong’s definition. After terminating and
starting a new application process, KJV, the companion, the definition and the
chosen Berean English order were available. The full 68-criterion matrix remains open.

Run `node scripts/verify-native-desktop.mjs <obsidian-executable> <preview-zip>`
in a desktop session to repeat that startup and restart check. The script creates
its own vault and profile and retains the restarted Reader capture. Network
isolation is supplied by the caller. Windows CI now builds and exercises the
native application from a digest-pinned installer. LF checkout rules preserve
the bytes of packaged text even when Git's Windows newline conversion is enabled.

## Theme contrast, screen reader and Windows — November 26, 2026

The first stylesheet adjustment reached 4.461:1 across the 20 measured Mac samples after correcting for the display profile. The subsequent stylesheet reached 4.998:1 for red-letter text and 5.719:1 for the measured Library controls. Current native captures cover Reader, Study, Resources and Library across five themes, two appearances and narrow and wide docks. Orca announced Library navigation and Greek word details in the Linux application. Package identity, publisher update and rollback, source checks and curated captures are in [native desktop verification](docs/specs/native-desktop-2026-11-26.md).

## November 26 — Native publisher interruption and retry

The three catalogue resources installed together in the disposable Mac vault. JFB resumed from the publisher after an Obsidian restart with HTTP 206. A separate socket drop during repair left the previous commentary readable and Retry succeeded. Fixed the raw “aborted” error and added a real socket regression. The new 501-test preview and native evidence are recorded in [the November 26 desktop report](docs/specs/native-desktop-2026-11-26.md).
