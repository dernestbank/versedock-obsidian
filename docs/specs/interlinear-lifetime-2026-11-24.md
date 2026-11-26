# Companion loading and newer input

Date: November 24, 2026. Development runs on Nana’s Mac mini.

A companion navigation control could be restored after asynchronous loading even
when the user had already focused another input. Panel rendering now checks the
owner document’s current focus before replacing DOM. A requested navigation focus
is consumed once and restored only while focus remains on the document body.
Ordinary keyboard navigation still returns to the appropriate companion control.
The check precedes emptying the panel so removing a newer focused child cannot
be mistaken for unchanged document-body focus.

Reader’s companion-ready callback previously realigned the selected verse after
new scrolling or external focus, and ran again on preference changes. It now owns
one initial alignment context, captured after Reader’s normal render/focus work.
Only that unchanged render, scroll position and active element can be realigned.
The callback consumes the context; later display updates retain the user’s reading
position and restore their own display control through the existing update path.
No source words, ordering, glosses, passage numbering or preferences change.

Nine new unit cases pass: six fail before the changes, and four targeted mutations
are detected with exact source restoration. Focus/body compatibility, panel disposal,
newer focus inside/outside the panel, newer Reader scroll, initial alignment and
preference updates are covered. Logs/snapshots: .research/platform-mini/interlinear-lifetime.

Eight Chromium cases use the production Reader and panel, real pinned KJV/Berean
John 3 chapter data and a controlled loading delay at 1100/390 x 1000. Before,
loading moved focus from Workspace search to Next companion verse and moved a
new scroll from 2496 to 1198 in the wide fixture. A typeface update moved the
Reader from 2692 to 1128. After, newer focus/scroll remain, ordinary companion
navigation restores focus, and typeface updates retain their control/Reader position.
No console errors/warnings, framework overlay or horizontal page overflow occur.
Page identity, 36 rendered KJV verses, companion rows and screenshots are inspected.

Fixture code, pinned input fingerprints, before/after evidence and screenshots are
outside the repo under the sibling .sworddock-qa/interlinear-lifetime-2026-11-24.
Obsidian host/WordDetails/dictionary boundaries are controlled; this is not native
Obsidian or Hebrew/Aramaic/theme/assistive/device acceptance. Existing complete
corpus verification remains separate. The Browser plugin/skill is unavailable;
connected mini1 Playwright is used. Its QA server is stopped and port 56059 checked.

Focused correctness/readability/architecture/security/performance review: focus
ownership stays in the panel; Reader owns its alignment context. Both use the
owner document and existing render version. This adds constant-size state and no
new dependency, persistence format, external input or network/data path. Tests
reintroduce each guard failure independently. No further blocking finding is
identified in this focused fix; the accumulated release review remains incomplete.
Current full Mini/Linux/package results are in the platform reports and STATUS.md.

The first full check also discovered a saved baseline with a .test.ts suffix in
.research. The snapshot was renamed to .test.ts.snapshot with its bytes retained;
no test exclusion or test removal was added. The corrected full check passes all
447 actual tests in 67 files; the first log is retained as check-first.log.
