# Changelog

## Unreleased — 0.1.1 SwordDock Bible developer candidate

- Adopt **SwordDock Bible** as the preferred product name and **SwordDock** as the short brand.
- Update user-facing labels, product documentation, prototype design sources, and preview packaging name.
- Preserve plugin ID `versedock` and installed data compatibility.
- Keep the existing GitHub repository and published 0.1.0 release URLs unchanged until release migration is explicitly planned.
- Preliminary exact-name screening found no obvious collision; comprehensive trademark clearance remains pending.


### Development improvements (November 14, 2026)

- Make Quick Verse Insert non-destructive if the Markdown document or selection changes while the modal is open; copy fallback and multiline quotation formatting.
- Add accessible live reference preview announcements and repair Reader naming.
- Preserve verse keyboard focus across Reader rerenders.
- Provide on-demand SHA-256 and structural verification for installed WEB books.
- Add automated tests for note insertion and file integrity (29 tests in the local candidate).
- Advance package/manifest to 0.1.1; **no GitHub release or plugin directory submission yet**.

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
