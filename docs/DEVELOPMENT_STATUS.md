# SwordDock Bible development checkpoint

Updated: 2026-11-15

## Current state

- Version: `0.1.5` local developer candidate
- Branch: `branding/sworddock-bible`
- Starting commit: `e5f95174c2ad25a825883bf3cf77c44229ed35b0`
- Plugin ID: `versedock` (compatibility contract; unchanged)
- GitHub: public repository `dernestbank/versedock-obsidian`; remote `main` and prerelease/tag `0.1.0` remain at `b5904a8`. No current pull request or SwordDock release was found.
- Worktree at recovery: clean

## Verified baseline

- `npm run check`: passed on 2026-11-15 for 0.1.5 (64 tests in 8 files, TypeScript, production build).
- `npm audit --json`: 0 known vulnerabilities across 113 dependencies.
- Package: `dist/SwordDock-Bible-0.1.5-offline-preview.zip` (local/unpublished), 76 allowlisted files, 1,750,706 bytes, SHA-256 `7504f4225d5ae6da83d07df2975a7e50b75c5654c9a3c5e71b9d254debec5978`. Two consecutive builds matched; clean-vault extraction and simulated offline restart passed.
- Updated full-corpus evidence: 31,103 WEB verses pass source round-trip enforcement; 71,821 recognized markers, seven inert HTML markers, 424 validated RX markers, zero unresolved markers and zero tag-issue verses.
- Live GUI: Obsidian 1.15.0 reloaded and enabled SwordDock Bible 0.1.5 in the isolated repository `test-vault`; the hostile HTML fixture stayed literal text, conversion remained blocked, and the RX diagnostic/versification warning rendered in the preflight result.

## Completed capabilities

- Offline 66-book/31,103-verse WEB reader, navigation, search, Markdown insertion, notes, bookmarks, and highlights.
- Theme-adaptive responsive desktop UI foundations and study/library views.
- Read-only `.bbl.mybible` SQLite inspection with strict schema/content bounds.
- Non-writing conversion preflight that blocks unsafe/unsupported content.
- Lossless GBF lexical scanning with exact UTF-16 offsets and inert HTML classification.
- Deterministic offline preview packaging and clean-install filesystem smoke tests.

## Current implementation priority

Begin Phase 2 Task 3 in `tasks/plan.md`: define a text-first semantic event model for supported typography/structural GBF tags using a failing test. Preserve raw tokens, keep HTML/CustomCSS/VerseRules inert, and keep conversion blocked. RX parsing now resolves the known `<RX 12.6.31—7:20>` corpus diagnostic while preserving raw text.

## Known blockers

- No verified semantic renderer for all GBF tags, translator notes, HTML, CustomCSS, or VerseRules.
- No rights/provenance workflow or reversible imported-module storage design.
- No conversion writer or installer.
- No authorized second translation/commentary fixture in the repository.
- No mobile, Windows, Linux, community-theme, automated accessibility, or slow-device validation.
- Naming/trademark clearance is not established.

## Publication status

Only the historical VerseDock `0.1.0` developer prerelease is public. Do not claim a stable release or Community Plugins eligibility. The verified 0.1.5 branch may be pushed for review; no release publication is authorized by technical validation alone.

## Next continuation instruction

Open `tasks/todo.md`, resume at the first unchecked acceptance criterion, preserve the plugin ID and existing settings, and do not implement a writer until semantic, safety, rights, storage, and rollback gates are all verified.
