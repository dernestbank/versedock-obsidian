# SwordDock Bible development checkpoint

Updated: 2026-11-15

## Current state

- Version: `0.1.6` local developer candidate
- Branch: `branding/sworddock-bible`
- Starting commit: `e5f95174c2ad25a825883bf3cf77c44229ed35b0`
- Verified implementation commit: `5a4f5b2` (`feat: validate MySword cross-reference semantics`)
- Verified semantic milestone commit: `3a50abb` (`feat: add safe GBF semantic inspection`)
- Plugin ID: `versedock` (compatibility contract; unchanged)
- GitHub: public repository `dernestbank/versedock-obsidian`; branch `branding/sworddock-bible` is pushed and pull request [#1](https://github.com/dernestbank/versedock-obsidian/pull/1) targets `main`. The historical prerelease/tag `0.1.0` remains the only published release.
- Worktree at recovery: clean after the semantic milestone checkpoint

## Verified baseline

- `npm run check`: passed on 2026-11-15 for 0.1.6 (81 tests in 10 files, TypeScript, production build).
- `npm audit --json`: 0 known vulnerabilities across 113 dependencies.
- Package: `dist/SwordDock-Bible-0.1.6-offline-preview.zip` (local/unpublished), 76 allowlisted files, 1,751,999 bytes, SHA-256 `0cbbb5ab0dbe87e03996a4a09ae3188c19c584b77e584124c552049a40082fa4`. Two consecutive builds matched; clean-vault extraction and simulated offline restart passed.
- Updated full-corpus evidence: 31,103 WEB verses pass source round-trip enforcement; 71,821 recognized markers, seven inert HTML markers, 424 validated RX markers, zero unresolved markers, 15,866 semantic-ready markup verses, seven opaque events, 1,126 translator notes and 169 titles. Conversion remains blocked.
- Live GUI: Obsidian 1.15.0 reloaded 0.1.6 in the isolated repository `test-vault`. The hostile HTML fixture stayed literal; semantic inspection reported zero of one markup verses fully interpreted and one opaque event; conversion/installation remained blocked. The diagnostics were exposed as plain accessibility text, but a full VoiceOver/keyboard audit remains pending.
- GitHub Actions: PR #1 `build-and-test` passed for semantic milestone commit `3a50abb`; the documentation checkpoint triggers the same validation again.

## Completed capabilities

- Offline 66-book/31,103-verse WEB reader, navigation, search, Markdown insertion, notes, bookmarks, and highlights.
- Theme-adaptive responsive desktop UI foundations and study/library views.
- Read-only `.bbl.mybible` SQLite inspection with strict schema/content bounds.
- Non-writing conversion preflight that blocks unsafe/unsupported content.
- Lossless GBF lexical scanning with exact UTF-16 offsets and inert HTML classification.
- Bounded GBF semantic events for supported typography/layout, translator notes and titles, plus an isolated fail-closed text-node renderer.
- Deterministic offline preview packaging and clean-install filesystem smoke tests.

## Current implementation priority

Review the proposed [authorized-import specification](specs/authorized-mysword-import.md) and [storage ADR](decisions/0001-imported-module-storage.md). Do not plan or implement Task 7 until the storage root, rights acknowledgement, deletion confirmation and unbenchmarked generated-size cap questions are accepted or revised. The separate VoiceOver/keyboard checkpoint remains open.

## Known blockers

- Semantic support is deliberately incomplete for lexical/interlinear tags, HTML, CustomCSS and VerseRules; the renderer refuses them.
- Proposed rights/provenance and reversible storage contracts exist, but they are not accepted or implemented.
- No conversion writer or installer.
- No authorized second translation/commentary fixture in the repository.
- No mobile, Windows, Linux, community-theme, automated accessibility, or slow-device validation.
- Naming/trademark clearance is not established.

## Publication status

Only the historical VerseDock `0.1.0` developer prerelease is public. PR #1 is reviewable, but it is not a release. Do not claim a stable release or Community Plugins eligibility; no release publication is authorized by technical validation alone.

## Next continuation instruction

Open `tasks/todo.md`, resume at the first unchecked acceptance criterion, preserve the plugin ID and existing settings, and do not implement a writer until semantic, safety, rights, storage, and rollback gates are all verified.
