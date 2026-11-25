# Reader control geometry and source evidence

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
