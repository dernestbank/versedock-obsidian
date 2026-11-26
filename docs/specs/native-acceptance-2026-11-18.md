# Native acceptance — 2026-11-18

The user confirmed that the isolated `dev/test-vault` was visible. CUA attached
to `SwordDock Bible Reader - test-vault - Obsidian 1.15.1`; all native input in
this check stayed in that vault. No personal vault, publication or OS assistive
settings were changed.

## Observed before the latest fixes

- Reloading loaded the previously deployed Reader/Resources recovery. Passage
  navigation and the separate tagged-KJV study strip no longer overlap. The
  compact Resources selectors leave room for the Exodus atlas image.
- All of Grace opens with its prior bookmark. Next advances from “To You” to
  “What Are We At?” independently of the Reader's Proverbs 5:3 selection.
- Selecting KJV, JFB and Easton in Discover and choosing Install selected runs
  the native queue. All three reach Ready offline, bringing the library to 11
  resources. Their new manifests account for three files each.
- The installed KJV opens Proverbs 5:3 in Resources, then in Reader. Switching
  back to the CrossWire tagged KJV preserves Proverbs 5:3 and exposes its study
  controls. Edition choices distinguish the two source editions.
- JFB opens the selected verse together with its chapter/book introductions.
  The book introduction incorrectly precedes the passage note and fills the
  narrow dock. This is a confirmed content-hierarchy defect.
- Easton search for Aaron returns Aaron/Aaronites; selecting Aaron opens the
  full entry. After an actual app reload its query and selection reopen.
  JFB also reopens after reload. Network access was not disabled during this
  check, so this is native restart evidence, not an airplane-mode test.
- Storage review measures the three existing reading resources at 11.3 MB / six
  files. They are protected; cleanup controls are disabled. This check did not
  move any resource to Trash or recover a staged resource.
- A temporary native Split right creates a narrow Reader/library arrangement.
  Tagged KJV navigation/study controls fit in both light and dark themes. The
  temporary duplicate library was closed afterward. The narrow library's large
  storage card appears before its primary content, another confirmed hierarchy
  defect.

One Discover transition in the original library lost its subtree in CUA's AX
snapshot while remaining visible. The duplicate library exposed Discover and
Downloads correctly, and installation was completed through those AX controls.
Rebinding the app after an asynchronous render later restored the complete
commentary tree. This suggests snapshot/binding staleness but does not prove its
cause or establish a screen-reader acceptance pass. Coordinate dragging/scrolling also returned
CUA `windowNotFoundAtPosition`; the native Split right command supplied the
narrow-pane check instead.

## Resulting changes to verify

Passage-specific commentary is rendered first. Introduction entries remain
available as collapsed Book/Chapter introduction disclosures in the same bounded
eight-entry pagination; source records and relative order within each group are
unchanged. An introduction alone does not imply a passage-specific note exists.
The narrow library follows document order, placing storage after its collection.
Async storage review requests focus restoration without stealing focus from an
existing control.

Synthetic regressions cover selected ranges, chapter selection, introduction-only
results, no matches, source identity and non-mutation. Changing the introduction
classification from OR to AND makes both new regressions fail; the correct guard
was restored. The real-source installation verifier now checks that Proverbs
5:3 yields its one actual note and both introductions separately.

## Native after-change acceptance

After deployment and app reload, the full Proverbs 5:3 note is visible above
collapsed Book/Chapter introduction controls. Chapter introduction opens by AX
click and closes with Space at keyboard focus. This is observed in the native
light theme and the restored dark theme. Reader selection stays Proverbs 5:3.
The library collection now appears directly below its tabs at the single-column
breakpoint; storage is after the collection.

Opening storage review with Return initially focuses Close, then restores visible
focus to Refresh review after measurement. Native review measures 62.1 MB / 27
files, including six active modules and four management records. It makes only
the oldest two records selectable; all active resources and the two recent
records are protected. Selecting eligible data previews two folders / 1.3 KB.
Move selected to vault Trash succeeds and the refreshed review reports 21 files,
two remaining management records and all six active resources. Focus returns to
Refresh review. No active resource, original import or note was moved.

A read-only filesystem check confirms both exact old snapshot directories now
exist under `test-vault/.trash`, with all six files totalling 1,360 bytes, and are
absent from the managed root. Six resource directories and both recent snapshots
remain. The report is `.research/design-recovery/native-trash-report.json`.
Trash was not emptied. Native retained-generation/stage cleanup and recovery
still need separate coverage.

This document does not establish mobile/Windows/Linux, community-theme,
screen-reader or slower-device release acceptance, nor completion of the full
goal.

## Captures

Local ignored captures are under `.research/design-recovery/`: `02-after-reader-
resources-dark.png`, `03-after-book-dark.png`, `04-storage-protected-dark.png`,
`05-native-three-study-downloads.png`, `06-narrow-tagged-kjv-dark.png`,
`07-narrow-reader-light.png`, `08-commentary-introduction-before.png`, and
`09-installed-dictionary-light.png`. They are native CUA screenshots, not HTML
reconstructions.

After-change captures: `10-commentary-passage-first-light.png`,
`11-library-content-first-light.png`, `12-storage-keyboard-focus.png` and
`13-native-trash-completed.png` in that same local ignored directory.

## Desktop transport continuation

The deployed desktop transport build loads after a verified test-vault app reload.
Manage All of Grace → Publisher reinstall source shows the same reviewed/pinned
publisher hash. Reinstall / repair progresses from Downloading to Resource
library updated; Downloads shows Ready offline and the desktop network-abort /
saved-prefix capability explanation. Open reopens the book at its previous
“What Are We At?” entry.

The new prepared generation retains source text and uses the current three-file
format (`mysword-all-of-grace-5a37d7c0626dd384`, 380,085 content bytes). Its older
two-file generation remains selectable (`mysword-all-of-grace-b40ea61ec89cbf32`,
191,361 content bytes). A read-only filesystem check verifies both content hashes
and their 22-entry manifests. This was a verified publisher reinstall, not a
deliberately corrupted-resource repair test. No prior generation was overwritten.
Captures `14-native-stream-reinstall.png` and
`15-native-desktop-downloads-ready.png` are in the same ignored capture directory.

No native Cancel press, saved-prefix display or native cancel/reload/resume
interaction was observed in this pass. Actual socket cancellation, persistent
prefix resume and real publisher HTTP 206 are established separately by the
transport tests/verifier. The final subsequent cleanup-measurement and stopped-
queue guards pass automated regressions and are included in the refreshed build;
their native fault paths remain separate acceptance work. No personal vault was
used. The CUA phase ended with its completion summary.

## Berean companion continuation

The user selected a labelled Berean companion beside KJV. The final build has
observed Hebrew/Greek/Aramaic, source absence, dictionary/grammar, recorded order,
keyboard, saved typography/reload, light/dark and narrow-pane acceptance. A native
selection-clipping issue was fixed and verified after reload. Temporary duplicate
Reader panes were closed. Captures 16–24 and the complete scope/limits are recorded
in `docs/specs/interlinear.md`; no exact KJV English alignment or broad platform
acceptance is inferred. The CUA phase ended with its completion summary.

## Rich resource continuation

Publisher reinstall in the isolated vault produces new Book, Devotional and Atlas
generations with retained exact Journal source IDs. Their prior generations remain;
all seven saved generation hashes verify in the read-only report
`.research/modules/rich-native-generations.json`.

All of Grace reopens the prior reading entry and displays source italic emphasis.
Contents displays a numbered list with live topic links. To You opens the exact
entry with heading focus; Back returns to Contents and disables when empty. The
title page retains centered bold/italic text and line breaks. Romans 5:20 opens a
bounded offline preview explicitly naming All of Grace and CrossWire KJV 3.1;
the explicit Reader action selects Romans 5:20 while keeping the source entry.
That action exposed focus restoration to the source link; closing the preview
before opening Reader is implemented, but native revalidation remains pending.

Morning and Evening reopens November 18 Evening with date/period retained. Index
opens its month table and daily links. Keyboard Tab navigation reaches November;
Return focuses its unique named anchor and scrolls the November section into view.
Wrapped table-link click bounds exposed awkward word breaks; table cells now keep
words intact with horizontal overflow. That final CSS correction also awaits
native revalidation. Atlas reinstall succeeds, but its new contents/map/back path
has not yet been observed.

Captures in `.research/design-recovery/`: `25-rich-book-contents.png`,
`26-rich-passage-preview.png`, `27-rich-devotional-november-anchor.png`. These
predate the final focus/table fixes. The 351-test build was deployed to the
same test vault. The subsequent 352-test build also retains Journal abbreviation
metadata; native reinstallation/revalidation for that addition remains open.
CUA then returned `cgWindowNotFound` for both the prior binding
and a fresh `getApp('md.obsidian')`, although inventory lists Obsidian running.
No further native input was sent, and the CUA phase ended with a completion
summary. Atlas, dictionary/commentary links, imported Bible Source notes,
corrected focus and narrow/light/dark remain open; passing core/corpus checks
does not close those UI gates.

## Bundled Matthew Henry rich-source continuation

Fresh CUA `getApp('md.obsidian')` again returns `cgWindowNotFound`. The failed
attachment sent no native input; the CUA phase ended with its completion summary.
The source/code work continued independently, with the full goal left active.

The refreshed build adds retained OSIS, supported source emphasis, qualified
citation links, a selector for citations with multiple targets, original-source
disclosures and legacy plain-asset support. Native verification has not observed
these new controls. Required next checks: John 3:16 matching section, italic/bold/
superscript/small-caps rendering, collapsed quotation text, twenty-block and
two-section continuation focus, one-target and multiple-target citation previews,
invalid/missing coordinates, explicit Reader action, source/selection retention,
narrow panes and both default themes. Actual screen-reader acceptance remains
separate. No screenshot or native completion claim is inferred from the corpus
verifier or production build. Decision 0016 and its ignored reports document the
automated evidence.

## Restored native access, rich resources and all-six local imports

The user brought `test-vault` to the foreground, restoring CUA attachment. The
current build was reloaded only in that vault. Atlas Contents → Exodus map →
Larger view → Escape → Back works; Contents disables image-only actions. The
map/contents controls retain keyboard context. No personal-vault input was sent.

MHC Romans 5:6–21 displays the rich source heading and small caps; its quotation
disclosure retains superscript verse markers. Continue reading appends the final
paragraph and focuses it. Original source exposes literal OSIS. The source link
for Romans 5:6–8 opens an explicitly attributed KJV preview. Genesis 1:9's
four-address Psalm citation offers all four targets; choosing Psalms 69:15 changes
only the preview until Open in Reader is pressed. Default light and dark right-
dock rendering are observed. Two-section continuation and invalid/cross-chapter
native targets still need coverage.

The Reader action initially focused the window root. `ReaderView.focusPassage`
now awaits the latest render and focuses the selected verse or chapter region
only while the Reader is active; user-moved focus is preserved. Four regressions
failed before the method existed, then passed. After reload, both Quick Jump and
the four-target citation focus their exact selected Reader verse. The library's
outdated MHC flattening description was also corrected.

Easton Pledge → LOAN focuses the Loan heading and retains query Pledge. Back
restores Pledge; its former unlabeled-region focus was corrected to the heading
and verified after reload in the local dictionary. JFB Colossians 3:6 → its
Ephesians 5:6 commentary entry → Ephesians 5:3 Bible preview preserves the Reader
passage. Two Escapes return to the original source link. Imported Genesis 1:4
Source notes shows the RF Hebrew translator note separately from Scripture and
retains the complete original WH/FI/RF verse source. A focused Close button was
added and verified; Escape restores Source notes.

Native local import now covers all six source kinds. Public acquired fixtures
under `.research/native-import/` use gzip for Bible/devotional and raw SQLite for
the other four. Every review shows the detected/chosen kind, counts, source
metadata, basename, selected/expanded/prepared sizes, fingerprints, source notice,
samples and explicit test-vault destination. Book detection retains Spurgeon-
Grace abbreviation; Devotional/Graphics are explicit user choices for Book
containers. Graphics reports 36 entries and 32 embedded images. The QA source
note is retained with each resource. Preview creates no local resource/stage.

Every type reaches Ready offline and opens its appropriate reader, with Local
file labels distinguishing it from the catalogue copy. The Bible opens Genesis
1:4 with verse focus; the devotional opens November 18 Morning with its actual
date/period; the imported Patriarchs map renders. An app reload rediscovers all
six local modules, bringing the total collection to 18 resources; local Bible
edition/Genesis 1:4 and the selected atlas map persist. Network access was not
disabled, so this is native restart evidence, not an airplane-mode test.

Read-only verification of all six saved generations checks content size/hash,
record counts, selected-file/database fingerprints, basename/compression, exact
QA note, retained source/Journal IDs and unchanged original inputs. No stages
remain. Reports: `.research/native-import/sources.json`,
`bible-preview-storage.json`, `native-installed-report.json`. Existing catalogue
generations remain. Native invalid-file/stale-review/failure paths and broader
management recovery remain open. The CUA phase ended with its completion summary.

Additional captures under `.research/design-recovery/`: 28 atlas larger view,
29 atlas contents, 30 MHC citation preview, 31 quotation, 32 multiple citations,
33 dark Reader focus, 34 dictionary linked entry, 35 JFB source entry, 36 imported
Bible source notes, 37 gzip Bible review, 38 local atlas map, 39 post-reload library.

The imported Bible adds a fifth selected-verse action (Source notes). The old
fixed reserved width could let this toolbar cover Scripture in a wide Reader.
An intrinsic three-column grid now measures the verse number, text and actions;
the narrow layout keeps actions below the text. Native wide/narrow checks in
Default Light and Dark show all five controls without obscured verse text.
Captures 40–42 record wide Dark and narrow Dark/Light. The temporary split was
closed and the original single Reader and Default Light scheme restored. The CUA
phase ended with “Verified unobstructed Reader action layouts”.

## Native reversible management continuation

The catalogue All of Grace copy (content `90f2bec2`, source `c66ccf0d`) was
removed through Manage resources. It disappeared from My library while the
dialog retained its source/content fingerprints and Restore action. After a
native app reload it remained removed, with the same retained generation.
Restore returned the collection from 17 to 18 resources, made that generation
active again and reopened its Title Page with formatted text and Romans 5:20.
The catalogue KJV copy was also removed/restored; the distinct local KJV remained
the default throughout. Managing the local KJV reports Current default Bible and
disables removal with “Select another Bible before removing this default.”

Captures 43–45 show catalogue book removal, removal after reload and restoration
(the historical filenames say local-book; the recorded fingerprints establish
the actual catalogue copy). Capture 46 shows default local Bible protection.
The CUA phase ended with “Verified resource removal and restoration”.

This exposed identical titles in the management selector/library rows for local
and catalogue copies. Both now show Local file/Catalogue labels, verified after
deployment and native reload. The reload briefly displayed Obsidian's long-plugin-load notice before
recovering; no precise launch-time measurement or slower-device claim is made.
Retained-version reactivation, damaged repair, update review, staged recovery,
cleanup and actual download cancel/resume acceptance remain open.

Native retained-version selection now passes for catalogue All of Grace. The
9:44 generation `5a37d7c0` was reviewed and activated in place of the 11:00
generation `90f2bec2`. Its 371.2 KB library row and Active marker persisted across
app reload; the book remained readable. The current `90f2bec2` rich generation
was then reviewed/reactivated, restoring its 371.9 KB row and formatted Title Page
with a clickable Romans 5:20 citation. No stored generation was overwritten.
Captures 47–49 show older Active, older Active after reload and current reactivated.
The CUA phase ended with “Verified retained version restart persistence”.

## Native damaged-resource repair

Only the isolated catalogue book's `90f2bec2` content file was deliberately
damaged, after preserving an exact backup under `.research/native-management/`.
Native Rescan storage removed that invalid active choice, reported the failed
verification/unavailable selection and preserved older verified choices. The
publisher reinstall disclosure showed the pinned source hash. Reinstall / repair
downloaded and activated the new `545f1e51` generation (22 entries), and its
formatted Title Page opened successfully. The repaired generation retains source
metadata added since the earlier generation, so its content hash legitimately
differs while the pinned source hash remains `c66ccf0d`.

Read-only file verification confirms the damaged bytes remained untouched by
repair, the new payload matches its manifest/hash, and older valid copies remain.
After establishing that evidence, the exact original backup was restored to the
QA-damaged file; the new repaired generation remains active. No permanent data
loss was introduced. Reports: `damage-record.json`, `repair-report.json` under
`.research/native-management/`. Captures 50/51 show detected damage/source review
and the repaired Active marker. The CUA phase ended with “Verified damaged
resource repair”. Actual failed-transfer/write rollback remains separate.

## Native prepared-stage recovery and retained cleanup

Prepared one complete local-book stage using the production promotion/ownership
format, then moved it back to its recorded stage name to simulate interruption.
An owner-only incomplete stage was added separately. Existing active resources
were left intact. Native Storage and staged recovery showed 22 entries, exact
source/content hashes and the QA provenance for the complete stage; only that
stage offered Recover. The incomplete stage offered cleanup without recovery.

Recover activated local-book generation `722ccb6e`, retained the original local
generation and kept the stage for reviewed cleanup. The user-facing review
protected active/recent rollback resources. Only the two stages and the eligible
old catalogue book `b40ea61e` were selected; native cleanup reported three folders,
560.7 KB moved to vault Trash. Independent file accounting confirms exactly
574,190 bytes / six files at their recoverable Trash paths, with no Trash emptied.
The recovered content hash matches its manifest and all 22 entries remain.
After native app reload, all 18 resources remain installed and the recovered
generation retains its Active marker and opens its formatted Title Page.

Reports: `.research/native-management/stages.json`, `stage-cleanup-report.json`.
Captures 52–55 show source review, selected cleanup, completion and recovered
Active after reload. The CUA phase ended with “Verified staged recovery and
cleanup”. This simulates a prepared-stage interruption; it does not establish
actual network cancellation or saved-prefix resume.

## Download control stability regression

A native catalogue JFB download was cancelled and showed Cancelled/Retry with
17 resources, retaining the removed old commentary. Reload did not activate the
cancelled installation. That cancellation preceded payload bytes, so it created
no saved prefix. A subsequent transfer showed 538.9 KB progress but completed
before the automation could activate the transient Downloads Cancel control.
Another showed 437.3 KB and exposed the same control detachment. Neither later
attempt is counted as cancellation/resume evidence; both finished Ready offline.

The Downloads renderer recreated every row/button on each progress notification.
It now retains rows, live status nodes and same-action buttons across byte
updates, replacing only when the action changes. This preserves a pressed Cancel
target and keyboard focus; detaching the old button on terminal transitions also
prevents an in-flight Cancel click from opening a completed resource. Two focused
regressions failed before the change; all three tests now pass, covering target
identity/activation, terminal handlers/focus, background focus and unsubscribe.
The full Mac and Linux checks pass 365 tests / 59 files and a 379.8 KB build.
The Linux bundle matches Mac byte-for-byte, with all 1,676 mounted inputs
unchanged. Two preview builds match at 34,955,781 bytes and the clean-install/
offline-restart smoke passes; SHA-256
`7aecbf0a26d8046d766a3e4229bcff9a8c84dba9aab3597636832e7b906a41c8`.

Post-fix native cancellation succeeds without stale-control errors. An atomic
observation/Cancel call saw Downloading 7.7 KB; by abort/checkpoint completion the
verified stored prefix was 1,583,838 bytes of 5,494,192. Its strong publisher ETag,
source/database pins and prefix checksum were retained. The source was not
activated; native reload retained the exact prefix. Storage review explained
Saved 1.5 MB of 5.2 MB and offered reviewed Trash cleanup. Retry after reload
showed Downloading 1.5 MB of 5.2 MB, then Ready offline and 18 resources; Open
rendered the exact JFB Genesis 1:4 entry. Read-only verification confirms the
21,114-entry payload/source pins and removal of completed download checkpoints.
Native response headers were not captured; actual HTTP 206 is separately proven
by the transport CLI verifier, not inferred as a UI observation.

Reports: `.research/native-management/native-cancel-prefix.json`,
`native-resume-report.json`. Captures 56–58 show cancelled states (57 did not
retain a prefix; 58 is the successful partial-prefix case), 59 persisted storage
review, 60 resumed progress and 61 completed/open commentary. The CUA phase ended
with “Verified native cancellation reload and resume”.

## Native local import rejection and failed-save recovery

Native file-picker checks reject a deliberately malformed SQLite header/database
and a QA AES-encrypted copy of the public book fixture. The latter establishes
opaque encrypted-input refusal, not support/testing of vendor DRM. Neither offers
Install. A valid Book preview changed to Dictionary clears the preview/Install
action and reports the schema/type mismatch; returning to Book creates a fresh
review. These paths change none of the 127 stored files, confirmed by full hashes.

Only test-vault's module-root directory was temporarily made read-only to test a
real save failure; its original mode was recorded and restored immediately after
the observed failure. A distinct QA citation ensures a new generation is needed.
The failed save preserves all 127 files and the previous active copy. With normal
permissions restored, the same reviewed snapshot retries successfully to Ready
offline. Exact source files remain untouched. Captures 62–64 show rejection and
type invalidation; 65 captures the initial raw errno/path, and 66 successful retry.
The CUA phase ended with “Verified import rejection and save recovery”.

The initial errno leaked an absolute path in both dialog and Downloads. A shared
installer error mapper now replaces storage permission/full-disk/unavailable
errors with actionable path-free guidance, preserving validation/cancellation
messages. A regression reproduces the raw EACCES failure, proves prior-generation
preservation and retries the same snapshot; the new mapper cases also cover
serialized errors. Post-deploy native recheck shows “Unable to save the resource.
Check this vault’s write permission, then retry.” in both import and Downloads,
which offers Review local file again. Original directory permissions are restored;
all 133 stored files remain byte-identical. A fresh valid Book review was then
closed; reopening starts with No file chosen and no Install action, confirming
discard without activation. Capture 67 shows corrected guidance, 68 empty reopened
review and 69 the safe Downloads error. `native-failure-report.json` records the
limits and unchanged-file evidence. The Reader is restored to local KJV Genesis
1:4, with selected-verse focus and catalogue JFB Genesis 1:4 in Resources.
The CUA phase ended with “Verified safe import failure recovery”.

The final correction passes 368 tests / 60 files, strict TypeScript and a
380.3 KB production build on Mac/Linux. The preview passes clean-install/offline-
restart smoke and two identical 1,475-entry builds at 34,956,012 bytes; SHA-256
`ce2031cc5d6b7986cce36e4b925e6fa6d5e2dbb42e025caf29b578859c42a0be`.

## Current Minimal light/dark and narrow layout acceptance

The already installed Minimal theme was selected through test-vault Appearance.
Minimal Light shows the imported KJV selected verse with all five actions clear
of Scripture, plus readable JFB Resources. Whole-chapter Genesis 1 opens MHC with
two sections; More sections appends Genesis 1:6–8 and 1:9–13, changes remaining
count 8 → 6 and focuses the first newly appended section. This is the requested
native two-section continuation check, separate from twenty-block continuation.

Minimal Dark preserves rich MHC typography, section state and source disclosures;
the Library Downloads error/review action and measured storage remain readable.
A temporary Split right provides two narrow Readers. In both Minimal Dark and
Light, all five verse actions fit below the selected text. The narrow overflow
menu explicitly exposes Quick Jump, Appearance, Study links and other actions.
The temporary split is closed, leaving the original single local-KJV Reader on
Genesis 1:4. Appearance is restored to Default Light with the original purple
accent; the settings window is closed. MHC Genesis 1:3–5 remains in Inspector.

Captures 70–75 record Minimal Light Reader/Resources, MHC continuation, Dark rich
commentary, Dark Library Downloads and narrow Dark/Light. The CUA phase ended
with “Verified Minimal light and dark layouts”. This adds current-feature Minimal
evidence; further community themes and actual assistive/device gates remain open.

## Native cross-chapter/unavailable references and devotional table

MHC 1 Chronicles 6:31–53's “88th and 89th psalms” citation opens Psalms
88:1–89:52 with explicit current local-KJV/MySword preview attribution. Next
source chapter opens Psalm 89, paged 1–25, 26–50 and 51–52 of 52 verses. Both final
Next controls are disabled; verse 52 is complete. Escape restores the source link
and keeps Reader 1 Chronicles 6:31 selected. MHC Genesis 9:1–7's visible label
“Jas. iii. 7” actually carries `Jas.9.7`; the native preview reports James 9:7
unavailable with no substituted passage or Open in Reader action. Escape restores
that source link and leaves Genesis 9:1 selected. Captures 76/77 record these bounds.

The local devotional's Index table stays inside a horizontally scrollable source
region. Native pointer scrolling is unavailable on this CUA surface, but Tab
focuses its named source-table region and four Right presses reveal April/August/
December in its final column; the day links wrap inside the dock. Capture 78
records keyboard focus/scroll. November navigates to the exact source fragment;
Back first restores Index, then the dated 18 AM Nov reading. Date 2026-11-18 and
Morning stay unchanged. The CUA phase ended with “Verified citation bounds and
devotional scrolling”.

The fragment destination was visually correct but its empty source anchor was
unnamed in AX. Source anchors now receive a group role and exact “Source location:
<source ID>” name. This adds no guessed Scripture mapping or new visible source
content. After deployment/reload, November lands on the named AX group “Source
location: Nov”; capture 79 records it. Back twice restores 18 AM Nov with the
same date/time, and Quick Jump restores the original local-KJV Genesis 1:4 with
selected-verse focus. Default Light and the single Reader remain restored; no
modal is open. The CUA phase ended with “Verified named source-anchor focus”.

Current final check remains 368 tests / 60 files, strict TypeScript and a 380.4 KB
build on Mac/Linux, with all 1,678 mounted inputs unchanged and identical bundles.
The 1,475-entry preview passes clean-install/offline-restart smoke and two builds
are identical at 34,956,020 bytes; SHA-256
`ddd2141537fbaa2946e7cae66dccfaf754ca1267aa469574f74b1cdd4ba1bb92`.

## Things contrast and packaged native startup

The official Obsidian catalogue supplied Things 2.2.6. Its Light rendering
exposed a gray inherited Resources surface and pale global heading/emphasis
colors. Captures 80–81 retain Light/Dark before correction. Resources now pairs
its surface with the theme's normal text color; scoped heading/emphasis variables
retain semantic weight/italics without importing document decoration colors.
Explicit links and status colors retain their own rules. Captures 82–84 show
readable Things Light/Dark; the exact Song of Solomon 4:12 preview opens with
the selected local KJV wording, and Escape restores source-link focus. The
original Default Light theme, purple accent and single Reader are restored.
No numerical contrast ratio or complete accessibility-conformance claim is made.

A new disposable vault, `.research/qa/package-native-2026-11-18`, was populated
from the exact prior `ddd21415…` ZIP, with every extracted entry checked byte for
byte. No prior plugin settings, installed resources or enabling configuration
were copied. The user approved trust/enabling for this QA vault only. Native
trust and plugin enable controls were used, then bundled WEB opened at John
3:16 with the Study Inspector. Capture 85 records that clean first launch.

The current ZIP differs in **styles.css only**. Its update was applied in that
same approved QA vault, and all **1,475 extracted entries** match the current ZIP
before and after native restarts. Bundled WEB switches to KJV; the explicitly
labelled Berean companion renders Greek words/glosses in Original order, with
KJV Scripture separately above. All six bundled resources appear ready in the
Library. KJV and companion preferences survive a further native app reload.
Captures 86–88 and `.research/qa/package-native-2026-11-18-evidence.json` record
the current candidate's startup/restart boundary. Native networking was **not**
disabled; literal first launch of the final ZIP and native airplane-mode startup
remain distinct from this update check and automated offline smoke.

Mac/Linux full checks pass **368 tests / 60 files**, TypeScript and the unchanged
389,503-byte production JavaScript bundle. Linux's current 1,678 mounted inputs
remain unchanged. A 15-second full-corpus checksum-test timeout was preserved
and corrected with a bounded 60-second allowance; all content assertions remain
intact, and the complete rerun passes. Current preview smoke and two identical
builds pass: **1,475 entries / 34,956,184 bytes**, SHA-256
`f587e3ae29bd1fdbe2e3a88038aed8bf594a655ce6e637f68d9b1f9f7d5c2561`.

Both Windows connector probes still returned MCP internal errors. Actual
VoiceOver permission remains unanswered. Native other-platform, assistive and
representative slower-device gates remain open, as do the wider design audit
and native update/failed-transfer cases. The goal remains active; only isolated
QA vaults were changed and no publication/commit/permanent Trash removal occurred.


## Shutdown-fix candidate: native attachment unavailable

The subsequent code review found queued management work and late local previews
could outlive plugin shutdown. The lifecycle fix and seven data-preservation
regressions pass on Mac/Linux (375 tests / 60 files); details and commit boundaries
are in decisions 0011/0012 and .research/modules/installer-stop-review.md.

The current ZIP is **1,475 entries / 34,956,486 bytes**, SHA-256
`263c24df1c392b63fc29829d4392d0666ec495f2e80f445b122d9ee0c3ee2ca7`.
It passes automated clean-install/offline-restart smoke and deterministic builds,
but native cgWindowNotFound recurred, including after reattaching. No generated
settings/layout were moved or reset. Native startup/unload, actual native network-
isolated startup and other-platform/assistive/performance gates remain unverified
for this candidate. The foreground QA-window request is pending.

The prior approved and CSS-only ZIP copies are retained, and their JSON evidence
now points to those fixed copies rather than the newly rebuilt dist filename.
Captures 80–88 remain evidence for their precise previous build/UI boundaries;
they do not establish native acceptance of the lifecycle fix. Only dev/test-vault
received the new files. Its previous native selection/layout was not manipulated.


## Mac mini continuation — November 24

The project, designs, complete Git state and QA evidence were transferred and
verified on Nana’s Mac mini. The resource-root defect is fixed and all 380 tests
pass on native Node and isolated Linux; details are in
`mac-mini-migration-2026-11-24.md`. These filesystem/CLI results do not constitute
new native Obsidian UI acceptance. Obsidian 1.8.10 is installed on the mini but
was not opened for this checkpoint. Prior captures retain their original build
and host boundaries. Actual new-host startup/unload/theme/assistive acceptance
and the remaining release matrix stay open.

## Current mini candidate — November 24

Development moved to Nana’s Mac mini with all 7,822 transferred files verified.
The current Reader/Resources lifecycle candidate passes 419/64 Mac/Linux automated
checks, real-source workflows and deterministic clean/offline package smoke.
Its preview SHA-256 is
`a49eac353795ae64a715621cb590b474eb98e7366de8d7b9089369bea9b40e24`.
Only the isolated dev/test-vault is deployed; core bytes match the tested build.

No native Obsidian UI was operated on the mini. The Computer Use bridge still
targets the original Mac. The user has not answered the proposed QA-only
AppleScript automation exception; no OS permission or assistive setting was
changed. Earlier foreground/trust approvals and captures refer to their original
Mac QA vault/build. Native fresh/offline start, unload, UI/theme, update/failure,
assistive and actual device acceptance remain unchecked for this candidate.

Six isolated Chromium fixture cases at 900/390 x 760 verify that late images do
not steal search focus or reset the visible reading content after scrolling.
The fixture uses the production reading panel, renderer and CSS with Obsidian
DOM shims; it does not replace any native acceptance gate above.

The newer Reader/Resources fixtures reproduce lost Resources search/caret, late
Reader word-focus theft and post-close observer attachment. Ten post-fix cases
pass at 1100/390 x 900. The host and WordDetails widget are boundary stubs; these
cases do not close native startup/unload or the wider design/assistive matrix.


Latest retained-generation/reference candidate: **426 tests / 65 files** pass on
Mini and Linux, with matching 392,363-byte production bundles. The preview passes
clean-install/offline-restart smoke and two byte-identical builds: 1,475 entries,
34,957,121 bytes, SHA-256
`5de3e93c5a62bfccb5de6ce85325421b250a4fc22b5a6eef2d354f2f487d6e9a`.
Integrity binds to displayed generations and complete Psalm 119 selections persist.
See generation-integrity-and-long-selections-2026-11-24.md, current reports and
STATUS.md. The 46-file source review is partial; native Mini, final native ZIP and
remaining theme/platform/assistive/slower-device acceptance remain open. No native
Mini UI action was performed; the QA-only AppleScript exception is unanswered.


Latest Comparison/Resources candidate: **438 tests / 67 files** pass on Mini/Linux,
with identical 393,283-byte production bundles. Two byte-identical previews pass
clean-install/offline-restart smoke: 1,475 entries, 34,957,368 bytes, SHA-256
`d7512742edef9f58b50d4653fa8390fc77dea99a607326a51b42817bf5129947`.
Comparison owns its bounded transient passage history; requested Resources wait
for deferred loading. Twelve unit cases, three mutations and eight browser cases
with host/WordDetails shims support these scoped fixes. See
comparison-navigation-and-resources-opening-2026-11-24.md and current reports.
The 46-file accumulated review is partial. Native Mini, final native ZIP and all
remaining theme/platform/assistive/slower-device/source-update/failure gates remain
open; the QA-only AppleScript exception is unanswered. No native Mini UI was used.


Latest companion-lifetime candidate: **447 tests / 67 files** pass on Mini/Linux,
with identical 393,463-byte production bundles. Two identical 1,475-entry previews
(34,957,441 bytes) pass clean-install/offline-restart smoke, SHA-256
`82112ca933adc1bba5e219c5807992a0aeb17b87560e230ce8a9f4b009913038`.
Newer focus/scroll and display preferences survive companion readiness; nine unit
cases, four mutations and eight Chromium cases use pinned John 3 data with host
shims. See interlinear-lifetime-2026-11-24.md and current reports. Source review
covers 89/107 files plus four build files and remains partial. All native/release
gates remain open; the Mini QA-only AppleScript exception is unanswered.


Latest source-lifetime candidate: **467 tests / 68 files** pass on Mini/Linux,
with identical 394,010-byte bundles. Two identical 1,475-entry previews (34,957,605
bytes) pass clean-install/offline-restart smoke, SHA-256
`55505752da2f728f9082d9ebf0315b559546eb58c52b9a41839628e412e21389`.
Search/Quick Insert retain source consistency; partial storage and closed/reopened
operation ownership are corrected. Twenty new cases, six mutations and twenty-two
browser cases support the scoped fixes with host/fake-editor/storage shims. All
107 production TS files have received inspection; broader review and native release
gates remain open. See source-lifetimes-2026-11-24.md and current reports. The Mini
QA-only AppleScript exception remains unanswered; no native Mini UI was operated.


November 24 availability/import continuation: development remains on the mini.
Current candidate passes 467/68 Mini/Linux checks, six-source workflows and two
identical 1,475-entry previews (34,957,307 bytes), SHA-256
`a601c9e78724a68091bd5f928c3abcbcc04c738361bd0b6a9c75c6a52de01d76`.
Matching bundle SHA-256: `93ee77baba265984529402ec0cb749d9834a7b730bcb01c7666abc360455cd25`.
20 controlled browser cases cover unavailable controls, primary button text tokens
and advanced-inspection/import navigation. No native Mini/device/theme/assistive
acceptance is inferred. Exact scope is in availability-and-import-copy-2026-11-24.md
and current reports; all outstanding native/final release gates remain open.


November 24 verifier continuation: 472/69 Mini/Linux checks pass. The source-rich
verifier now rejects skipped projections/fallbacks and invalidates prior success
before startup work. All 56,984 sources and 25,882 non-Bible projections pass the
full pinned-corpus comparison. All packaged/deployed bytes remain unchanged; the
previous deterministic ZIP/data smoke evidence is retained after verifying every
entry matches current files. All scripts have source inspection; full evidence
review and outstanding native release gates remain open. See
rich-verifier-coverage-2026-11-24.md and current reports for exact scope.


November 24 management-context continuation: 488/70 Mini/Linux checks pass. Current
bundle SHA-256 `27e1a4314441cde1437971301be88b2ea16238636ab8b40dce6dd381b49e19b1`;
preview SHA-256 `56c9f8db2c4c9c3840125a0d985ada10b12b2bd4b1bacf214aad84586dd61253`.
Two identical 1,475-entry builds and clean-install/offline-restart data smoke pass;
only isolated dev/test-vault is deployed. Sixteen new cases, five mutations and
24 controlled browser cases verify context/opening ownership. No native acceptance
is inferred. Full evidence review and outstanding release gates remain open. See
management-context-2026-11-24.md and current reports for exact scope and limits.


November 24 catalogue-update coverage: 495/71 Mini/Linux checks pass. Seven new
controlled callback/service/filesystem cases verify source review, explicit update,
offline reopen and rollback; three deliberate defects are detected and restored.
No production/package/deployed byte changes; every current ZIP entry was compared.
The test/support source audit covers 20 of 72 files. Native/publisher-update/device/
assistive and full accumulated evidence acceptance remain open. See
catalogue-update-coverage-2026-11-24.md and current reports for scope and limits.


November 24 Reader control continuation: 495/71 Mini/Linux checks, 91 controlled
browser cases, two identical previews and offline data smoke pass. All 71 test
files plus shared fixture inspected; full release acceptance remains open. See
reader-control-sizes-2026-11-24.md and current platform/scoped reports for current
package hashes, corpus bindings and native/platform/theme/assistive/device limits.


November 24 transport/evidence audit: 497/72 Mini/Linux checks pass after isolating
the new verifier regression fixture. Stale success is invalidated before build/
network work; two failure cases and a deliberate mutation verify the fix. Fresh
actual publisher HTTPS cancels/saves/resumes at 527,838 bytes with 206 and installs/
reopens all six kinds offline. Current source/runtime/corpus bindings and all
1,475 unchanged packaged entries preserve prior package/data evidence. All 68
ledger criteria are classified; current native/platform/theme/assistive/slower-
device/final native ZIP/update/failure gates remain open. See transport-verifier-
evidence-2026-11-24.md and the current requirement audit for exact limits.
