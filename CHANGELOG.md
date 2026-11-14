# Changelog

## Unreleased — 0.1.2 SwordDock Bible developer candidate

- Adopt **SwordDock Bible** as the preferred product name and **SwordDock** as the short brand.
- Update user-facing labels, product documentation, prototype design sources, and preview packaging name.
- Preserve plugin ID `versedock` and installed data compatibility.
- Keep the existing GitHub repository and published 0.1.0 release URLs unchanged until release migration is explicitly planned.
- Preliminary exact-name screening found no obvious collision; comprehensive trademark clearance remains pending.


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
- The earlier local candidate was 0.1.1; the current MySword preview candidate is **0.1.2**. No GitHub release or plugin directory submission yet.

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
