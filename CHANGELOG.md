# Changelog

## 0.1.12 — Community installation

- The three Obsidian release assets carry the offline WEB library, Berean interlinear, dictionaries, cross-references, commentary and SQLite engine.
- The worldwide release omits the full tagged KJV. The Reader can show the Berean companion with WEB. Upgrades preserve existing user-installed editions, settings and notes.
- Added the SwordDock folio and bookmark identity, theme-aware ribbon icon and downloadable brand artwork.

## 0.1.11 — Developer Preview

### Live search and linked-note workflow verification (November 15, 2026)

- Verify Current chapter live against John 3, including John 3:16 and chapter-only result isolation; verify Selected book exposes the canonical book control and returns only Psalms for a Psalms query.
- Verify Any words live with `world shepherd`: John 3:16 matches through the present `world` term, absent `shepherd` is not highlighted, and the status reports the exact result count.
- Create the canonical John 3:15 study note through the Inspector, discover a second ordinary Markdown note through Obsidian's resolved backlink index, keep the primary first, label the backlink and open it successfully.
- Repair a live narrow-pane defect where the hidden Selected book label remained visible because its flex rule overrode native hidden presentation. A failing style-contract test now protects the scoped `display: none` rule; live computed styles switch between `none` and `flex` as the scope changes.
- Expand automated coverage to 134 tests across nineteen files; strict TypeScript, production build and dependency audit pass.
- Rebuild the 76-file offline preview twice with identical 1,757,882-byte output and SHA-256 `5e58b1938e9d7126b7df7e0af26bb0fe220546470d5d1cf5df65103921bd15a9`. All entries byte-match reviewed sources, the clean-install/restart smoke test passes, and the exact archive repeats the live search and linked-note checks with preserved settings and no captured Obsidian errors.

### Any-word Scripture search (November 15, 2026)

- Add an explicit **Any words** match option alongside Exact phrase and All words without adding a query language, regular expressions, an index or a network dependency.
- Match when at least one case-insensitive, whitespace-delimited literal term is present, independent of term order and duplicate input; retain the shared 16-term, 200-character and 200-result bounds.
- Highlight every present literal term while safely ignoring absent terms and preserving the canonical returned Scripture text.
- Expand automated coverage to 133 tests across nineteen files. Deliberately changing Any words to require every term fails both the direct matcher and bundled-corpus tests; TypeScript, production build and dependency audit pass.
- Rebuild the 76-file offline preview twice with identical 1,757,872-byte output and SHA-256 `d6c541932eef05e24fe6d411107f38e17ad391007a94d3c62e61bae39ad782a2`; archive integrity, clean extraction, byte comparison and simulated offline restart pass for all 66 books and 31,103 verses.

### Direct book search filter (November 15, 2026)

- Add a Selected book scope with an accessible 66-book selector so users can search another book without first navigating the Reader.
- Canonicalize the selected OSIS key through SwordDock's bundled inventory before loading; forged file identifiers, missing selections and unsupported books fail closed.
- Read only the selected canonical book while retaining phrase/all-word matching, cancellation, truncation and safe literal highlighting.
- Expand automated coverage to 131 tests across nineteen files. A caller-path mutation is caught by the focused corpus suite; TypeScript, production build and dependency audit pass.
- Rebuild the 76-file offline preview twice with identical 1,757,827-byte output and SHA-256 `c86a04bdff9be790fbb70f9b1976ea323f4324a943b8c34dcbbb34c1555bdb2e`; clean extraction and simulated offline restart pass for all 66 books and 31,103 verses.

### Obsidian study-note backlinks (November 15, 2026)

- Discover ordinary Markdown notes that Obsidian's resolved-link index identifies as linking to the passage's existing primary study note, without reading note bodies.
- Keep the exact primary note first even when it is older than other matches or its frontmatter was removed; retain recent-first ordering for all remaining frontmatter/backlink matches.
- Reject absent, zero and non-integer link counts, retain the existing 5,000-file/50-result bounds and label backlink matches in the Notes tab.
- Expand automated coverage to 130 tests across nineteen files. Zero-count and primary-order mutations are caught by focused suites; TypeScript, production build and dependency audit pass.
- Rebuild the 76-file offline preview twice with identical 1,757,695-byte output and SHA-256 `7e35dc1f77ebf3185df16e28ab75eea0cb66f6a9005c29f51bafe0d7d411d110`; clean extraction and simulated offline restart pass for all 66 books and 31,103 verses.

### Current-chapter Scripture search (November 15, 2026)

- Add a canonical Current chapter filter alongside Whole Bible, Current book and testament scopes without accepting a resource path or loading another book.
- Require a present, safe-integer chapter from 1–200 and report a truthful error when the selected canonical book does not contain it.
- Preserve the existing phrase/all-word semantics, cancellation checkpoints, 1–200 result bound and safe literal highlighting.
- Expand automated coverage to 128 tests across nineteen files. Reversing the chapter predicate is caught by the focused corpus test; TypeScript, production build and dependency audit pass.
- Rebuild the 76-file offline preview twice with identical 1,757,447-byte output and SHA-256 `ee7eb57067ebb1973f5a0ecec7e989c681e795dca349f295ad89b6b637b7cb52`; clean extraction and simulated offline restart pass for all 66 books and 31,103 verses.

### Range-safe Scripture study notes (November 15, 2026)

- Preserve complete verse ranges in new study-note frontmatter (`John.3.16-18`) and use endpoint-aware filenames so a range cannot collide with its starting verse.
- Reopen positively identified start-only range notes created by older previews without rewriting their contents, while refusing to treat a genuine single-verse note as that range.
- Match full-range note metadata exactly through the existing bounded metadata-cache index; general settings, history and bookmark OSIS formats remain unchanged.
- Expand automated coverage to 127 tests across nineteen files. A deliberate legacy-signature mutation is caught by both the recovery and collision tests; TypeScript, production build and dependency audit pass.
- Rebuild the 76-file offline preview twice with identical 1,757,303-byte output and SHA-256 `277c411f1bde51a94f705118d5eda112e19a6570b63b27c125d6f7ade634e350`; clean extraction and simulated offline restart pass for all 66 books and 31,103 verses.

### Scripture-linked note discovery (November 15, 2026)

- Discover notes whose `scripture` frontmatter exactly matches the active canonical OSIS reference, including a bounded array of references, without reading Markdown note bodies.
- Prioritize the stable `Bible Study/<Book>/...` primary note through Obsidian's indexed path lookup, then examine at most 5,000 metadata-cache entries and show at most the fifty most recently modified matches.
- Fail closed for malformed, oversized or non-string frontmatter; deduplicate the primary note by vault path and report partial scans or additional results truthfully.
- Upgrade the Study Inspector Notes tab with linked-note buttons, relative paths, a truthful empty state, primary-note create/open, copy and refresh actions. Existing note paths and contents remain unchanged.
- Expand automated coverage to 122 tests across nineteen files. Deliberately crossing the 5,000-entry boundary is caught by the focused adapter suite.

### Scoped offline Bible search (November 15, 2026)

- Add canonical Whole Bible, Current book, Old Testament and New Testament search scopes without accepting caller-supplied file paths.
- Add an explicit Exact phrase / All words match filter. All-word searches are case-insensitive, order-independent, duplicate-free and bounded to 16 entered words without changing returned Scripture text.
- Highlight every literal matched phrase/word in result verses using an atomic detached-fragment renderer, fixed `<mark>` elements and text nodes only. Overlaps merge without changing source text; regex punctuation and hostile-looking strings remain literal.
- Bound search phrases to 200 characters and result requests to 1–200 entries; scan only the selected canonical books and cancel superseded or closed searches between books and chapters.
- Report truncation only when an additional match actually exists, so exactly 80 matches display as `80 results` rather than `80+`.
- Keep the narrow-pane controls wrapped and keyboard accessible, focus the search field on open, and announce concise progress/result counts through a dedicated polite status region.
- Verify all four scopes live in the disposable Obsidian 1.15.1 vault, including John 3:16 scope inclusion/exclusion and a truthful 80+ Whole Bible result state. Expand automated coverage to 114 tests across seventeen files; deliberate truncation, all-to-any matching and literal-escaping mutations are caught by the focused suites.

### Obsidian focus-manager repair (November 15, 2026)

- Repair a live-only 0.1.10 regression where Obsidian's focus manager still visited every native Inspector tab button even when inactive buttons had `tabindex="-1"`.
- Keep the selected tab as the only native button and expose inactive choices as pointer-operable ARIA tabs. Arrow/Home/End selection rebuilds the destination as the selected button, focuses it, and scrolls it into view.
- Verify the repair in the isolated Obsidian 1.15.1 `test-vault`: End reaches the visible History edge, Right wraps to Commentary, Tab exits the tab list, and an older Romans 8:28 history entry reopens and moves ahead of Romans 8:27. The reference and reordered history survive an app reload.
- Expand automated coverage to 105 tests across fifteen files. The destructive clear-history action and actual VoiceOver remain separate approval-gated checks.
- Build the 76-file offline preview twice with identical 1,756,962-byte output and SHA-256 `8d08c569e59be442faf7e02e77b785c028f113f40775457fa320c91531c1c0c5`; clean extraction and simulated offline restart pass for all 66 books and 31,103 verses.
- Re-run the cooperative read-only preflight in Obsidian 1.15.1 against the ignored 31,103-verse publisher WEB fixture. The live report matches the established semantic totals, blocks conversion/installation, and leaves the 5,414,912-byte source at SHA-256 `d0605fb28dbb0aee37f078931fdc54925295f846b068b954da2d1923011b2bb5`.
- Refresh the provisional name-risk checkpoint against the live USPTO exact-wordmark search, official Obsidian community list, GitHub, npm and public-web results. No exact `SwordDock` collision was found, but similar/common-law/international and professional legal review remain required before a stable launch.
- Update the validation workflow to the official Node 24-based `actions/checkout@v7` and `actions/setup-node@v7`, and pin Ubuntu 24.04 instead of the migrating `ubuntu-latest` label. The resulting PR run passes check, packaging and clean-install smoke tests with zero annotations.
- Re-verify the 0.1.11 Reader and Study Inspector visually in Obsidian 1.15.1's native Light and Dark schemes. Editorial text, selection/accent treatment, contextual actions, narrow Inspector tabs and truthful empty states remain readable; the isolated vault is restored to its original Light setting with plugin data unchanged.
- Verify the same surfaces in both Light and Dark variants of Minimal 9.1.4, installed from Obsidian's official community-theme catalog. Reader typography, selected-passage treatment, contextual actions, Inspector tabs and unavailable-resource states remain readable; the isolated vault is restored to Default/Light with reference, history, bookmarks, highlights and appearance settings unchanged.
- Install the unmodified 0.1.11 package in a newly registered disposable vault, accept the local-author trust prompt, enable stable plugin ID `versedock`, launch the offline Reader at John 3:16, and confirm the workspace and Scripture restore after an Obsidian reload.
- Prevent missing or unreadable installed book files from exposing absolute vault/plugin paths through Reader, Search, copy, or integrity-check errors. Focused tests cover both chapter loading and the Module Library report; live missing-file and malformed-JSON cycles in the final-package vault verify the safe Reader state, three precise integrity diagnostics, restored 66/66 integrity and passage recovery.
- Replace developer-only missing-library instructions with package-level recovery guidance in the Reader, Module Library and startup notice. Missing and malformed WEB manifests now expose **Recheck offline library**; restoring the manifest recovers John 3:16 without an app reload while preserving vault notes and SwordDock settings.

## 0.1.10 — Local developer candidate (2026-11-15; unpublished)

### Inspector tab keyboard navigation (November 15, 2026)

- Give the Study Inspector a roving tab stop: only the selected resource tab participates in normal Tab order.
- Support Left/Right Arrow wrapping plus Home/End movement across Commentary, Lexicon, References, Notes, Bookmarks and History.
- Keep the newly selected tab focused and scroll it into view in narrow Inspector panes; connect each tab to its panel with explicit, instance-scoped ARIA relationships that remain unique if Obsidian restores duplicate Inspector leaves.
- Live-load 0.1.9 in the isolated Obsidian vault, verify the truthful empty History state, record Romans 8:28 through Quick Jump, observe the new entry and clear control, and confirm the reference/history values persisted across an app reload.
- Expand automated coverage to 101 tests across fourteen files. Live 0.1.10 verification later exposed the Obsidian focus-manager regression repaired in 0.1.11.

## 0.1.9 — Local developer candidate (2026-11-15; unpublished)

### Bounded reading history (November 15, 2026)

- Persist the fifty most recent canonical passage references as a most-recent-first list in the existing `versedock` plugin settings without changing bookmarks, highlights, appearance, or the current reference.
- Add migration-safe normalization that canonicalizes OSIS, removes duplicates, ignores invalid/user-edited values, caps stored entries at 50, and bounds legacy input scanning at 500 values with a 64-character per-entry limit.
- Add an honest History tab to the Study Inspector. Selecting a recent passage returns to the Reader and moves it to the front of the bounded history; an explicit clear action erases history without changing other settings.
- State the privacy boundary in the UI: SwordDock does not upload history, while vault/plugin settings may still be included by the user's chosen sync or backup system.
- Expand automated coverage to 97 tests across thirteen files. Live Obsidian verification remains pending.

## 0.1.8 — Local developer candidate (2026-11-15; unpublished)

### Cooperative conversion preflight (November 15, 2026)

- Refactor the existing read-only Bible preflight into a shared bounded scan state so synchronous CLI/benchmark results and cooperative UI results remain byte-for-byte equivalent as structured reports.
- Make the Obsidian inspector yield after each 1,000-row batch and cancel through the existing modal revision guard when the selected file or modal changes.
- Close sql.js statements and databases on setup, preparation, cancellation, yield, semantic, and finalization failures.
- Re-run the ignored 31,103-verse publisher WEB fixture: cooperative and synchronous diagnostics match exactly; 31 yields produced 32 work segments with 5.127 ms p95 and 26.795 ms maximum on the tested Mac. This is desktop evidence, not a mobile guarantee.
- Expand automated coverage to 93 tests across twelve files. Live Obsidian verification of the cooperative build remains pending.

## 0.1.7 — Local developer candidate (2026-11-15; unpublished)

### Full-corpus performance QA (November 15, 2026)

- Add a bounded, read-only local benchmark for MySword preview inspection and semantic conversion preflight, with warm-up exclusion, stable-result enforcement, source-byte hash verification, and coarse process-memory samples.
- Benchmark the ignored 5.4 MiB publisher WEB fixture for 25 measured runs on Node 22/darwin arm64: combined median 98.873 ms and p95 126.184 ms, with all 31,103 verse counts and semantic diagnostics stable.
- Keep the benchmark free of Scripture output, file writes, installation, and network access. Slower-device and actual mobile profiling remain separate release gates.
- Expand automated coverage to 90 tests across twelve files, including regression protection against disclosing an unreadable source path.

### Inspector keyboard accessibility (November 15, 2026)

- Preserve keyboard focus on the text-conversion preflight button after its asynchronous read-only analysis completes, while never stealing focus that moved to another control.
- Defer restoration until the next animation frame so Obsidian/Electron's keyboard click dispatch cannot move focus back to the document afterward.
- Verify the complete keyboard path in Obsidian 1.15.0 with a hostile HTML fixture: Tab order, Return activation, literal source display, blocked conversion diagnostics, accessibility-tree exposure, and retained button focus.
- Expand automated coverage to 86 tests. Actual VoiceOver announcement/navigation remains a separate manual checkpoint requiring user-approved OS assistive-setting changes.

## 0.1.6 — Local developer candidate (2026-11-15; unpublished)

### Safe GBF semantic inspection (November 15, 2026)

- Add a bounded, typed, source-preserving semantic event model for supported MySword GBF typography, paragraph/separator/poetry layout, and validated RX metadata.
- Extract balanced translator-note (`RF/Rf`) and title (`TS/Ts`) regions with exact source/content spans and optional inert labels/levels; reject mismatched or excessive nesting without losing source.
- Keep HTML, lexical/interlinear, malformed, unknown, and unsupported escape/entity syntax opaque and ineligible for complete semantic interpretation.
- Add an isolated, atomic safe-DOM renderer that uses only text nodes and fixed elements/classes, refuses opaque data before target mutation, and never follows RX references.
- Surface semantic-ready, opaque-event, translator-note, and title counts in read-only conversion preflight while keeping all markup conversion and installation blocked.
- Re-scan the publisher WEB fixture losslessly: 15,866 of 15,870 markup verses fully interpreted, seven opaque events, 1,126 translator notes, and 169 titles. Expand automated coverage to 81 tests.

## 0.1.5 — Local developer candidate (2026-11-15; unpublished)

### Safe cross-reference semantics (November 15, 2026)

- Parse documented MySword `RX` single-verse and same-chapter ranges into validated, non-rendering metadata while preserving exact source text and UTF-16 offsets.
- Support the publisher-observed cross-chapter form `<RX 12.6.31—7:20>` as 2 Kings 6:31–7:20 without following the link or claiming edition versification fidelity.
- Reject invalid, descending, out-of-canon and oversized ranges as unresolved tokens instead of guessing.
- Report validated and unresolved RX counts in conversion preflight and the inspection UI; keep conversion blocked for markup-bearing modules.
- Re-scan the publisher-hosted WEB fixture: 31,103 verses, 71,821 recognized GBF markers, 424 validated RX markers, zero unresolved markers and zero tag-issue verses. The module remains outside the repository and package.
- Add a durable recovery plan/status checkpoint and expand automated coverage to 64 tests.

## 0.1.4 — Local developer candidate (2026-11-14; unpublished)

- Adopt **SwordDock Bible** as the preferred product name and **SwordDock** as the short brand.
- Update user-facing labels, product documentation, prototype design sources, and preview packaging name.
- Preserve plugin ID `versedock` and installed data compatibility.
- Keep the existing GitHub repository and published 0.1.0 release URLs unchanged until release migration is explicitly planned.
- Preliminary exact-name screening found no obvious collision; comprehensive trademark clearance remains pending.


### GBF source-preservation foundation (November 14, 2026)

- Implement read-only General Bible Format (GBF) tokenizer that preserves every source character and UTF-16 offset and distinguishes documented poetry, reference, Strong's, note, red-letter, and title markers from inert HTML/unknown syntax.
- Scan all 31,103 verses in the publisher-hosted WEB MySword module with zero failed round-trips; preserve one unsupported cross-chapter citation rather than incorrectly rewriting it.
- Enhance module preflight reporting with recognized GBF markers, HTML markers, unknown tokens and per-verse tag issues; block module-defined VerseRules/CustomCSS from unreviewed interpretation.
- Add eleven GBF and safety regression tests (55 tests total). No conversion writer, public module ingestion, licensing inference or release.
- Confirm 0.1.4 GBF marker counts and blocked conversion in the isolated live Obsidian GUI; add documented tag family inventory and remaining semantic release blockers.

### Conversion safety and new-vault GUI verification (November 14, 2026)

- Verify an untouched 0.1.2 ZIP can be trusted and run in an entirely new isolated Obsidian vault, including offline Reader launch and correct SwordDock branding.
- Add non-destructive local conversion preflight to the MySword inspector and QA CLI. Block markup, unsupported Strong's tagging, right-to-left editions and out-of-canon chapter values rather than silently changing Bible wording.
- Confirm publisher-hosted WEB module is *not* eligible for plain-text conversion (15,870 markup-bearing verses); avoid any conversion or redistribution.
- Add seven conversion-preflight regression tests (44 total), preserving public-domain text and input bytes.
- Verify the 0.1.3 GUI preflight in a disposable Obsidian vault, correctly rejecting synthetic HTML-like verse content without installation.
- Record frequent MySword tags in the publisher-hosted WEB fixture (`pi3`, `ci`, `pf2`, `pf1`, `cm`, `fr`), to guide a future preservation-safe parser.

### MySword inspection foundation (November 14, 2026)

- Add offline read-only inspection of user-selected `.bbl.mybible` Bible databases with SQLite header, schema, record, reference and integrity checks. No module import/installation, network access or unsafe HTML rendering.
- Bundle sql.js MIT-licensed WebAssembly engine and license in the manual ZIP; verify in isolated packaging smoke tests.
- Add seven synthetic SQLite tests, including a full 31,103-verse generated corpus and empty-verse compatibility checks; document untested real-file scenarios and permissions requirements.
- Upgrade Vitest to a patched release and confirm zero known dependency-audit findings.
- Validate a publisher-hosted WEB MySword module using the production inspector locally: 66 books, 31,103 verses; module remains outside Git/distribution.
- Validate the GUI command, chooser and literal-text rendering in the isolated Obsidian test vault; add `qa:mysword` read-only developer inspection command.
- Add a publisher-style metadata and source-buffer preservation regression test (37/37 tests passing).

### Development improvements (November 14, 2026)

- Add a clean-vault ZIP extraction, integrity and simulated offline restart smoke test to CI, without touching a personal vault.
- Restrict build contents to an exact allowlist (76 files in current preview) and make ZIP metadata reproducible across consecutive builds.
- Make responsive Reader styles follow the Obsidian pane width using container queries; preserve Quick Jump on narrow panes.
- Preserve text selection when clicking Scripture and expose pressed state for bookmark/highlight actions.

- Make Quick Verse Insert non-destructive if the Markdown document or selection changes while the modal is open; copy fallback and multiline quotation formatting.
- Add accessible live reference preview announcements and repair Reader naming.
- Preserve verse keyboard focus across Reader rerenders.
- Provide on-demand SHA-256 and structural verification for installed WEB books.
- Add automated tests for note insertion and file integrity (29 tests in the local candidate).
- The earlier local candidate was 0.1.1; the current unpublished candidate is **0.1.3**. No GitHub release or plugin directory submission yet.

## 0.1.0 — Developer preview (2026-11-12)

### Added
- Theme-adaptive Bible Reader powered by public-domain World English Bible (ENGWEBP).
- 66-book offline library (31,103 verses), per-book lazy loading.
- Reference navigation, Quick Jump, offline search and reading typography.
- Verse copy, highlights, bookmarks, Markdown study notes, Quick Verse Insert.
- Native Study Inspector and Module Library views with truthful unavailable-resource states.
- 18 automated tests, reproducible build and complete manual-install ZIP.

### Limitations
- No other translations, commentaries, MySword imports, Strong's lexicons or parallel panes yet.
- Desktop macOS tested; mobile, community theme, sync and third-party themes require QA.
- The GitHub prerelease is for manual installation only and is **not** an Obsidian directory submission.
