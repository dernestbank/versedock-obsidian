# VerseDock — Development QA Report

Version: **0.1.0 (Developer Preview)** · Date: **2026-11-12** · Internal project directory: `mysword+`

This independent project started under the internal name **MySword+**. Its public name is **VerseDock**, with no affiliation with the original MySword app.

## Verified on macOS / Obsidian 1.15.0

- **Build:** strict TypeScript `tsc --noEmit` passed, esbuild `main.js` generated successfully.
- **Automated tests:** 18/18 pass (book references, OSIS IDs, 66-book WEB dataset, local chapter reading and search).
- **Data:** 66 public-domain ENGWEBP book files, 31,103 verses, exact text preserved; provenance and checksum documented.
- **Actual GUI:** opened an isolated test vault in Obsidian; enabled the plugin; opened its Bible Reader from the native command palette.
- **Reader:** John 3:16 appeared with styled passage text, contextual actions, book/chapter controls and theme-aware dark UI.
- **Quick Jump:** entered `Ps 23` and saw accurate local preview; opening saved the reference `Ps.23`.
- **Markdown study note:** clicked selected verse's note action and created/opened `Bible Study/John/John 3-16.md` with correct frontmatter.
- **Quick Verse Insert:** inserted an attributed `Romans 8:28 (WEB)` callout into that note; verified the Markdown content on disk.
- **Highlight and bookmark:** toggled both for John 3:16 in GUI; verified persistent IDs in `data.json`.
- **New branding:** renamed manifest ID and product to VerseDock; reinstalled plugin in isolated vault and confirmed **VerseDock (Preview)** commands appear and Bible Reader opens.
- **Manual preview ZIP:** the archive includes `main.js`, `manifest.json`, `styles.css`, license, README and every offline WEB book, and passed ZIP integrity check.

## Test boundaries / not yet verified

- No GUI testing on Windows/Linux or mobile; this preview is marked desktop-only until mobile compatibility is validated.
- The native dark and light Moonstone schemes were visually verified in Obsidian; community themes remain untested.
- Standalone fresh manual ZIP installation in a second clean vault has not been visually tested; archive and contents checks passed.
- No automated UI harness, visual regression snapshots or accessibility audit yet.
- No public-domain commentary/lexicon installed; Inspector shows honest unavailable states.
- No MySword SQLite import, parallel translation support or interlinear tool yet.
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
5. Open the disposable `test-vault` in Obsidian and enable the VerseDock preview.
6. Test Reader → Quick Jump → selected verse → Study Note → Quick Verse Insert → bookmark/highlight.

## Next release gates

- [ ] Fresh install smoke test from published ZIP and verify offline operation after restart.
- [ ] Community theme and narrow pane testing; light/dark desktop theme rendering passed.
- [ ] Robust note insertion when editor selection has changed, keyboard focus and accessibility tests.
- [ ] MySword SQLite schema validation/import test fixtures with safe rendering.
- [ ] Decouple Bible module library storage from plugin folder, implement integrity checks and optional downloads.
- [ ] Second permitted translation and chapter-level linked comparison.
- [ ] iOS/Android test; adapt any incompatible UI APIs.
