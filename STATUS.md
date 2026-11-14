# SwordDock Bible — Development QA Report

Version: **0.1.2 (local developer candidate)** · Date: **2026-11-14** · Internal project directory: `mysword+`

This independent project started under the internal name **MySword+**. Its original public name was **VerseDock**; its current preferred name is **SwordDock Bible**, with no affiliation with the original MySword app.

> **Branding update (2026-11-12):** Visible branding changed to **SwordDock Bible** while keeping the installed plugin ID `versedock` and the existing GitHub repository URL stable. The historical GUI checks below were performed before the rename; rerun the GUI check for final verification. Official trademark clearance is pending.


## MySword import research & preview — 2026-11-14

- Implemented a read-only desktop file picker that inspects user-selected `.bbl.mybible` Bible SQLite databases in memory using an offline, MIT-licensed sql.js WebAssembly engine (bundled with its license). **No Bible conversion or installation is claimed.**
- Validates file signature and 24 MiB limit, actual `Details`/`Bible` tables, required columns, SQLite quick-check, verse count, reference numeric bounds, duplicate rows and metadata record count. Imported HTML/CSS/versification is not interpreted, stored or rendered; sample verses use safe text nodes.
- Seven synthetic SQLite tests validate the happy path, malformed or mismatched modules, duplicate verses, invalid references, invalid metadata, and a full 31,103-verse generated corpus. The full-size test found five valid empty WEB verse entries; these are accepted and flagged for review. **36 total automated tests pass** (6 test files).
- Updated Vitest to 4.1.12 and re-ran dependency auditing: zero known npm audit findings on this development checkout (as of this date).
- Preview was **not yet smoke-tested inside a freshly restarted Obsidian GUI** and has not been validated against an authorized real-world MySword file. Large-file performance and WASM memory behavior remain release gates.

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
- Current local 0.1.2 candidate is **not released**; prior graphical smoke evidence applies to the historical 0.1.0 build, not these new controls.

## Verified on macOS / Obsidian 1.15.0

- **Build:** strict TypeScript `tsc --noEmit` passed, esbuild `main.js` generated successfully.
- **Original QA tests:** 18/18 passed (book references, OSIS IDs, 66-book WEB dataset, local chapter reading and search). **Current developer candidate:** 36 automated tests cover naming compatibility, offline reading, captured editor selection safety, content hashing and whole-library file verification.
- **Data:** 66 public-domain ENGWEBP book files, 31,103 verses, exact text preserved; provenance and checksum documented.
- **Actual GUI:** opened an isolated test vault in Obsidian; enabled the plugin; opened its Bible Reader from the native command palette.
- **Reader:** John 3:16 appeared with styled passage text, contextual actions, book/chapter controls and theme-aware dark UI.
- **Quick Jump:** entered `Ps 23` and saw accurate local preview; opening saved the reference `Ps.23`.
- **Markdown study note:** clicked selected verse's note action and created/opened `Bible Study/John/John 3-16.md` with correct frontmatter.
- **Quick Verse Insert:** inserted an attributed `Romans 8:28 (WEB)` callout into that note; verified the Markdown content on disk.
- **Highlight and bookmark:** toggled both for John 3:16 in GUI; verified persistent IDs in `data.json`.
- **Original 0.1.0 test:** renamed manifest ID and product to VerseDock; reinstalled the plugin in an isolated vault and confirmed **VerseDock (Preview)** commands appeared and Bible Reader opened. That historical GUI test predates the SwordDock Bible rebrand.
- **Manual preview ZIP:** the archive includes `main.js`, `manifest.json`, `styles.css`, license, README and every offline WEB book, and passed ZIP integrity check.

**Current local package:** `SwordDock-Bible-0.1.2-offline-preview.zip` contains 76 approved files, the independent offline library, SQLite WebAssembly engine, third-party license, and brand documentation; clean-vault ZIP smoke tests pass. It is a local developer candidate, **not a published GitHub release**; new in-app GUI flows still need hands-on verification before release.

## Test boundaries / not yet verified

- No GUI testing on Windows/Linux or mobile; this preview is marked desktop-only until mobile compatibility is validated.
- The native dark and light Moonstone schemes were visually verified in Obsidian; community themes remain untested.
- Standalone fresh manual ZIP installation in a second clean vault has not been visually tested; archive and contents checks passed.
- No automated UI harness, visual regression snapshots or accessibility audit yet.
- No public-domain commentary/lexicon installed; Inspector shows honest unavailable states.
- MySword SQLite **preview inspection** is available; full import/conversion, parallel translations and interlinear tools are not yet implemented.
- Not listed in the Obsidian Community Plugins directory; release is a **GitHub developer prerelease** only.

## Storage and cleanup

Development source: `Repository root`

Disposable GUI test vault: `test-vault`

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
- [ ] Fresh **GUI** install, interactive restart and plugin command reload validation from an eventual published ZIP.
- [ ] Community theme and narrow pane testing; light/dark desktop theme rendering passed.
- [ ] Robust note insertion when editor selection has changed, keyboard focus and accessibility tests.
- [x] Preview-only MySword SQLite schema validation with synthetic fixtures and literal-text rendering (36 tests).
- [ ] Validate an authorized real MySword module, profile memory limits, then implement opt-in conversion/import with rights review.
- [ ] Decouple Bible module library storage from plugin folder, implement integrity checks and optional downloads.
- [ ] Second permitted translation and chapter-level linked comparison.
- [ ] iOS/Android test; adapt any incompatible UI APIs.
