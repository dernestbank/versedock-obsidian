# Changelog

## Unreleased — 0.1.7 SwordDock Bible developer candidate

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
