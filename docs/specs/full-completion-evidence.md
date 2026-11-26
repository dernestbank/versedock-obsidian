# Full completion evidence and dependencies

Date: 2026-11-18. Active task ledger: tasks/completion-2026-11-18.md.
This is a chronological evidence record; later continuations supersede earlier
pending statements. Latest native evidence: native-acceptance-2026-11-18.md.

## Initial findings

- Native design before-capture found real passage-toolbar overlap and a Resources
  dock whose controls starved its content. Separate primary/study rows and a
  compact resource-picker/content layout are implemented and built. Native after
  verification is still pending because the app switched to a personal vault
  receiving user input. No personal-vault action was continued.
- A shared inspection boundary now validates physical Bible, Commentary and
  Dictionary schemas. Six focused tests cover source preservation, ranges,
  malformed coordinates, ambiguous headwords, cancellation and spoofed views.
  Actual publisher source inspection passes: KJV 31,102 records; JFB 21,114;
  Easton 3,965. No activation/conversion support is claimed from inspection alone.
- Interlinear acquisition/validation is in progress against the primary Berean
  dataset served by the Free Use Bible API. Source samples contain actual Hebrew
  and Greek forms, transliteration, parsing, positions and glosses. Exact KJV
  English word alignment remains distinct from the source's Berean alignment.

## Native verification and platform dependencies

The design-recovery native capture phase ended after recording the regression
and the personal-vault interruption. The isolated test-vault availability
question remains pending; read-only source work and tests continue meanwhile.
This is not a goal-level blocker while independent implementation remains.

All required release platforms and actual screen-reader announcements need
runtime evidence. Code-level compatibility and screenshot trees do not satisfy
those gates. Connected Windows tools exist but their machine availability,
isolated target setup and accessible native surface have not been established.
No statement about Windows, Linux, iOS or Android runtime success is justified yet.

## Source references

- https://www.mysword.info/modules-format
- https://www.mysword.info/download-mysword/bibles
- https://www.mysword.info/download-mysword/commentaries
- https://www.mysword.info/download-mysword/dictionaries
- https://bible.helloao.org/docs/reference/datasets/
- https://berean.bible/terms.htm

The Berean rights authority states a public-domain dedication. API metadata also
identifies the interlinear tables as public domain. This permits investigation
and a source-attributed implementation; it does not establish exact KJV English
alignment or prove that every record was acquired and validated.

## Completed source-corpus acquisition

The research process completed all 1189 chapters / 31102 verses / 443625 word
records (99,240,798 source JSON bytes), with no fetch failures or validator
issues. Language counts are 300668 Hebrew, 4826 Aramaic and 138131 Greek.
Every record has original-script text. Optional omissions are retained: 6038
Strong's IDs, 37047 glosses, 291 short parsing fields, 292 full parsing fields,
and 4 transliterations. Do not invent values for these omissions.

The primary publisher terms were read and confirm the public-domain dedication.
The full report and per-file SHA-256 inventory are retained in the ignored
`.research/interlinear/corpus-report.json`; chapter-coordinate comparison to the
bundled KJV is recorded separately. Acquiring a genuine interlinear corpus is
completed research, not completion of its installation, UI, RTL or KJV word
alignment gates.

## Installed study modules: current implementation evidence

The new shared dispatcher and Bible reading contract now connect validated study
sources to the transactional installer and Reader/full Comparison. Resources
uses actual installed commentary ranges and dictionary headwords. Retained
metadata and raw source text are bounded and validated before staging. See
decision 0009 for source-specific rendering policy and remaining limitations.

`node scripts/verify-study-installation.mjs` verifies the actual three pinned
SQLite research fixtures through install, content checks, source passage/query
access and a fresh service with downloads disabled. All 31,102 KJV / 21,114 JFB /
3,965 Easton records reopen. This is real filesystem transaction evidence, but
the downloader in this check reads acquired research fixtures: native network
download, switching and runtime focus/reload acceptance remain unproved.

The current suite has 268 passing tests in 42 files; TypeScript and production
build pass. The native test-vault deployment is updated without opening or
modifying the active personal vault. An observation-only CUA phase confirmed
that the personal vault remains active; no native test actions followed.

## Local-file import: current implementation evidence

The main import route now opens a complete local SQLite/gzip preview and explicit
install flow. All six resource kinds use the shared verified transaction; local
provenance and exact source records are retained, with filenames restricted to
basenames. Reader/source panels distinguish local files from catalogue editions.
The original advanced read-only Bible inspector remains separately reachable.

`node scripts/verify-local-imports.mjs` completed against all six actual corpora:
31,102 Bible, 21,114 commentary, 3,965 dictionary, 22 book, 745 devotional and 36
graphics entries. Raw/gzip inputs retain database identity, preview does not write,
stale tickets fail, all source records remain, and a fresh offline service verifies
and reopens all six. The ignored report records fingerprints/size identities.
Independent synthetic fixtures additionally exercise malformed/ambiguous schemas,
late/discarded previews, cancellation, failed staging and detached review objects.

Native file-picker, review/activation, keyboard focus and reload acceptance remain
open. No local original was modified or uploaded; actual import validation uses a
temporary filesystem. Management, exact alignment/interlinear, rich links and all
release-platform gates remain on the full ledger. See decision 0010.

## Version management and repair: current implementation evidence

Verified immutable management snapshots now persist explicit generation and
removal choices. A baseline precedes resource promotion, so uncommitted
generations cannot silently activate after restart. Reversible removal retains
the selected version; the default Bible is checked again immediately before the
removal commit. Damaged content/manifests repair into new verified generations,
with originals retained. Invalid selected content is unavailable until repaired
or a verified retained version is selected. Damaged/conflicting management records
produce recovery issues; complete loss of valid state requires explicit review.

`node scripts/verify-module-management.mjs` completed on real KJV records in a
temporary filesystem. It verifies older selection across restart, removal and
exact restore, damaged-copy preservation during repair, failure rollback and
31,102 reopened records, with the original SQLite input unchanged. The report is
`.research/modules/management-report.json` (ignored). All six local raw/gzip import
corpora still pass with the new management transaction layer.

Direct plugin-controller tests also reproduce and prevent two source races:
an earlier slow edition load replacing a later choice, and a stale stored
generation entering the Reader cache after a newer one loaded. The current gate
is 300 passing tests in 46 files, strict TypeScript and production build.

Native inspection was attempted again through CUA. Both `md.obsidian` and
`Obsidian` selection returned `cgWindowNotFound`; native launch is not exposed by
this surface. No UI input was sent, and the phase was closed with a completion
summary. The isolated test-vault build is updated. Native layout, controls,
switching, import and management acceptance remain unverified. Full retained-data
storage cleanup, interrupted-stage/resumable-network recovery and real abort are
still required, alongside interlinear, rich content and release-platform gates.

## Storage review and prepared-stage recovery: current implementation evidence

Storage now measures retained, removed, staged, control and unknown data as well
as active generations, including loose files. Incomplete measurement is explicit.
Opaque review tickets and exact file fingerprints guard cleanup/recovery. Active,
Restore and recent rollback data are protected. Eligible unused folders move to
recoverable vault Trash; unknown/unexpected data stays for manual review. Complete
prepared stages can be reviewed and recovered into the shared transaction. This
does not recover a partial HTTP transfer.

`scripts/verify-resource-storage.mjs` passes on real KJV/All of Grace data in a
temporary filesystem: a 22-entry stage recovers, an incomplete stage cannot
activate, two reviewed folders/four files move to recoverable Trash, and measured
managed-root size decreases by exactly 381,109 bytes. The 31,102-verse Bible and
book reopen offline; original SQLite inputs are unchanged. The ignored report is
`.research/modules/storage-report.json`.

Production-store tests use actual temporary files through a public-adapter shim.
They verify physical byte counts, reversible moves and refusal of external
symlinks/aliases/traversal. The virtual branch avoids desktop filesystem access.
New three-file manifests require a valid owner record; old two-file packages stay
compatible. Ownership damage is repairable. Native Obsidian Trash, mobile native
adapters and the new review screen still need runtime acceptance.

The current suite passes 310 tests across 48 files, with strict TypeScript and
production build. A mutation removing recovery's fingerprint comparison made the
valid-package substitution regression fail; it was restored. Existing module
management real-file checks still pass. See decision 0012 for the storage protocol.

HTTP transport remains logically cancellable only. The direct publisher probe
and installed requestUrl API evidence are in `docs/specs/download-transport-evidence.md`;
actual socket abort and validated partial-byte checkpoints/resume are next work.
All interlinear, rich-content, design/native and platform gates remain on the
full objective. An updated asynchronous question asks whether the isolated
test-vault window is open/visible after the prior CUA `cgWindowNotFound` errors.

## Native continuation — 2026-11-18

Native availability was restored after the user's confirmation. See
`native-acceptance-2026-11-18.md` for exact observations, limits and captures.
The additional Bible/commentary/dictionary download queue, source-specific
Reader switching, app-reload rediscovery, dictionary lookup, protected storage
preview and an actual reversible vault Trash move now have native evidence.
Selected-verse commentary and the single-column library hierarchy were corrected
and verified after deployment; async storage review focus restoration was also
verified by keyboard. This is partial completion of the original scope, not a
release/platform, interlinear, rich-content or transport-resume acceptance pass.

Latest checks: 312/312 tests in 48 files with one worker and a 15-second per-test
timeout, strict TypeScript, build, actual-source study installer verifier,
isolated deployment, runtime audit and preview clean-install/restart smoke.
Default five-second corpus-test timeouts under high machine load remain recorded
in STATUS; no assertion or test was removed to get the passing bounded run.

## Desktop cancellation and partial-byte resume continuation

Decision 0013 implements actual desktop request destruction, immutable validated
prefix snapshots, Range/If-Range validation, safe full restart and final source
pins. The actual HTTPS verifier saved 527,838 KJV bytes, recreated the downloader,
observed HTTP 206 at that exact offset, installed all six curated types and
reopened every module with network forbidden. The default HTTPS request path also
passes a real publisher download. Saved prefixes are measured in storage review,
remain distinct from prepared resources and support reviewed Trash cleanup.
Unknown-file/unmeasured automatic cleanup and post-stop retry regressions pass.

Native Obsidian reload, desktop capability copy and All of Grace reinstall/open
pass in the isolated test vault. Native Cancel/reload/resume interaction, damaged
repair, prepared-stage recovery and broader platform acceptance remain open.
Mobile uses the public requestUrl path and explicitly explains that cancellation
prevents installation but may not stop its transfer. No mobile behavior is claimed
from desktop tests. Greek/Hebrew interlinear and rich formatting/links remain
required in the unchanged goal.

Latest normal `npm run check`: 329/329 tests in 50 files, strict TypeScript and
327.5 KB production build. Vitest now uses two workers and a 15-second timeout for
the mixed corpus/SQLite/socket suite after high-load five-second timeouts; no
assertions or cases were removed. This config does not change the product's
60-second transport deadline or establish slower-device release acceptance.

## User-selected Berean companion continuation

The user chose “KJV with a clearly labelled Berean interlinear companion.” This
presentation is implemented and passes full source and native acceptance. All
443,625 words match every source field in the pinned 1,189-chapter corpus; all
31,102 records survive, including 17 records that explicitly supply no words.
Runtime pins, bounded lazy cache, rank/path/size/hash validation and stale-response
guards protect the reader. No Strong's-based alignment is inferred.

Native macOS Obsidian checks include Genesis 1:1, John 3:16, Daniel 2:4, Acts 8:37,
RTL keyboard navigation, dictionary/grammar, both source orders, saved rows/font/
size after reload, Reading/Interlinear toggling, default light/dark and narrow
panes. Native evidence exposed selected-KJV clipping; the correction is verified
after reload and advancing to Acts 8:39. See decision 0014 and the interlinear
specification. Actual assistive technology and other platform gates remain open.

Latest check: 335 tests / 52 files, strict TypeScript, 342.9 KB production build,
runtime audit zero, full-corpus comparison and 1,475-file clean-install/offline-
restart smoke. Current preview has 33,309,290 bytes; SHA-256
`7644cc875be1359be2312b4e7ef26a52159cbcbdd697e9e2d7704bda9b6d6dce`.
The broader active goal still includes remaining native import/management/recovery
acceptance, semantic rich content/links and the release matrix.

## Rich content and native import/management continuation

Rich imported formatting/references and bundled MHC OSIS now pass the complete
independent source oracles. Every one of 56,984 SQLite records retains raw source;
all 25,882 non-Bible ordinary-text projections match the independent oracle.
All 4,249 MHC sections, emphasis and citation labels match SWORD source; the
second export is byte-identical. Decisions 0015/0016 record bounds and unavailable
references rather than inventing mappings.

Native attachment recovered after the user's foreground confirmation. All six
local resource kinds pass native review/install/open/reload, including gzip Bible
and devotional, exact provenance and unchanged original files. Rich atlas,
dictionary, nested commentary/Bible links, RF notes and MHC multi-target previews
pass. Reader/Back/dialog focus and the five-action verse layout were corrected
and verified; source labels distinguish same-titled local/catalogue resources.
Catalogue book removal persists across native restart, Restore reopens it, the
current default Bible is protected, and older/current generation choices work
across reload. Detailed captures and remaining native gates are in
`native-acceptance-2026-11-18.md`.

Final Mac/Linux checks pass 362 tests / 58 files, strict TypeScript and the
379.5 KB production build. Linux ARM64 also passes actual six-source imports,
management rollback/non-overwriting repair and prepared-stage recovery/reversible
cleanup. The bundle matches Mac byte-for-byte and all 1,675 mounted inputs remain
unchanged. `linux-runtime-2026-11-18.md` states the container/native boundary.
Runtime audit has zero findings. The 1,475-entry clean-install/offline-restart
preview passes and two builds are identical at 34,955,652 bytes; SHA-256
`3fed587fa4ba273cbed7be392bea3d09aa8ed8d8a488bf7a5b203495627b7eda`.
Remaining native fault/cancel/recovery checks, broader themes, actual assistive
technology, native Windows/Linux/mobile and slower-device evidence keep the
original full goal active. No publication or personal-vault install occurred.

The subsequent native management pass verifies damaged-resource detection and
pinned repair without overwriting prior data, complete-stage recovery/incomplete-
stage refusal, retained/stage Trash cleanup (574,190 bytes / six files) and native
restart/opening. Actual JFB Cancel retains a verified 1,583,838-byte prefix across
reload, storage review explains it, and retry resumes at 1.5 MB before Ready
offline/open. This also exposed and fixed progress-driven Cancel detachment.
Three interaction regressions pass; full Mac/Linux checks now pass **365 tests /
59 files** and **379.8 KB**. Linux real-source workflows pass with all **1,676**
inputs unchanged and its bundle matching Mac byte-for-byte.

The current 1,475-entry preview passes clean-install/offline-restart smoke and two
identical builds at **34,955,781 bytes**, SHA-256
`7aecbf0a26d8046d766a3e4229bcff9a8c84dba9aab3597636832e7b906a41c8`.
Native failure/update/rich-edge/theme and actual platform/accessibility/performance
gates remain open in the completion ledger. No whole-goal completion is claimed.

The next native pass completes malformed/QA-encrypted rejection, invalidated/
closed-review handling and actual failed-save rollback/retry. Path-bearing errno
text found by that check now becomes actionable installer guidance; tests cover
the failure, prior-generation preservation and retry. Final native failure leaves
all 133 stored files unchanged with the original module-root mode restored.
Current Minimal Light/Dark wide/narrow Reader, rich MHC two-section continuation,
cross-chapter/invalid citations and devotional table/fragment checks pass. Empty
source-anchor focus now has an exact source-ID accessible name. Captures 62–79
and native-failure reports retain precise limits; actual VoiceOver remains pending.

Current final gate: **368 tests / 60 files**, TypeScript and **380.4 KB** build on
Mac/Linux; Linux's 1,678 inputs remain unchanged and its bundle matches Mac.
The 1,475-entry preview passes clean-install/offline-restart smoke and two identical
builds at **34,956,020 bytes**, SHA-256
`ddd2141537fbaa2946e7cae66dccfaf754ca1267aa469574f74b1cdd4ba1bb92`.
The completion ledger retains remaining update/failed-transfer, broader theme/
design, exact fresh native ZIP, actual assistive/platform/performance and final
release-audit gates. Goal status remains active; nothing was published or installed
in a personal vault.



### Things contrast and native package checkpoint

Things 2.2.6 exposed a real Light-mode Resources surface/heading/emphasis regression.
The scoped theme-text/surface fix passes native Light/Dark and citation/focus checks;
Default Light and the original test-vault layout are restored. Captures 80–84 retain
the before/after evidence. In the user-approved disposable package vault, the prior
ZIP’s clean first start passes; the current styles.css-only update/restarts have
all 1,475 extracted entries matching, six bundled resources ready, WEB/KJV switching
and labelled Berean Greek companion/preferences intact (captures 85–88). Native
networking remained enabled; final-ZIP literal first launch and native airplane-mode
startup remain distinct open gates.

Mac/Linux full checks pass **368/60**, TypeScript and the unchanged **389,503-byte**
bundle. The first Linux run timed out at 15 seconds in the 66-book KJV correctness
test; the failed report is retained. A bounded 60-second allowance keeps all content
assertions and checksums intact. Complete rerun/source workflows pass in 163.224
seconds with all 1,678 mounted inputs unchanged. Current preview smoke and two
identical builds pass at **1,475 entries / 34,956,184 bytes**, SHA-256
`f587e3ae29bd1fdbe2e3a88038aed8bf594a655ce6e637f68d9b1f9f7d5c2561`.
The release ledger keeps wider design, native update/failure, actual platform/
assistive/performance and final-release review gates open. The goal stays active.


### Installer shutdown cancellation checkpoint

Management/storage now share a lifecycle-guarded queue and cancellation signal;
post-stop or late-WASM local previews cannot create a review ticket. Uncommitted
management/recovery changes stop before activation. Cleanup retains completed
Trash moves and stops further moves with an explicit count. Six pre-fix failing
regressions plus a seventh partial-cleanup case cover retained files/choices/stages
and fresh-service reopening. Omitting lifecycle abort makes four cases fail; exact
source was restored. This is core/runtime evidence, not native unload acceptance.

Mac/Linux full checks pass **375/60**, TypeScript and **381.0 KB** build. The
390,119-byte bundle matches across platforms; Linux's 1,678 inputs remain unchanged
and real-source import/management/recovery workflows pass. Current preview smoke
and two identical builds pass at **1,475 entries / 34,956,486 bytes**, SHA-256
`263c24df1c392b63fc29829d4392d0666ec495f2e80f445b122d9ee0c3ee2ca7`.
Native attachment again fails with cgWindowNotFound after reattach, so no generated
QA settings/layout were reset. Older native package evidence is preserved against
fixed older ZIP copies. The current native clean/offline start/unload, source-update/
failed-transfer, wider design and actual platform/assistive/slower-device gates
remain open. The full goal stays active.


### Mac mini migration and root-boundary checkpoint — November 24

All 7,822 transferred files and Git state were verified before development resumed
on Nana’s Mac mini. The storage root/ancestor alias defect and a controlled
canonicalization race are fixed, preserving base-alias compatibility. All 380/60
Mac/Linux checks, real-source workflows, audits (zero findings), deterministic
1,475-entry packaging and offline smoke pass. Preview SHA-256:
`2a072bc847674899cd462748c597e60ac1ddcfe9c8ecf01ac56f7191520c8d6b`. The source Mac remains a backup.
`mac-mini-migration-2026-11-24.md` identifies the current paths, logs and precise
remaining native/UI/assistive/platform/performance/review gates. The full goal
remains active and no personal vault or publication was changed.

### Cooperative preparation checkpoint — November 24

Development continued on the Mac mini. Study-content preparation and imported
Bible decoding yield in batches, honor cancellation through their final batch,
stop on unload and recheck the installed generation before caching. Seventeen new
regressions and six detected/restored mutations pass. All six prepared corpus
JSON hashes and sizes match the pre-change baseline exactly. Stage timer gaps
improved with increased elapsed processing time; full-preview pauses remain.
See module-preparation-performance-2026-11-24.md for measurements and limits.

Current Mac/Linux checks pass 397/62 with matching 391,569-byte browser bundles.
Linux's 1,680 mounted inputs are unchanged; import/management/recovery workflows
pass. Mini real-source study installation also passes. Two identical preview
builds and clean/offline restart smoke pass at 1,475 entries / 34,956,933 bytes,
SHA-256 `8172a2bea7721abed8879c8fee4c61b308e8388018b10a3db168ebe875657c0c`.
Deployment is restricted to the project test-vault. Current native UI/assistive/
device/remaining update and release-review gates stay open; the goal stays active.

### Active local-preview cancellation — November 24

Service stop, discard and replacement now interrupt active preparation through an
owned preview controller. Caller abort, overlapping cleanup and stale-ticket
behavior are covered by six new cases (three failed before the fix) and three
detected/restored mutations. Twelve interruptions across four real source corpora
close both databases, preserve source hashes and perform no resource writes.
See local-preview-cancellation-2026-11-24.md for scope and cooperative limits.

Current Mini/Linux full checks pass 403/62, matching 392,027-byte bundles; 1,680
mounted Linux inputs are unchanged. Real-source workflows and deterministic
1,475-entry packaging/offline smoke pass. Current preview SHA-256:
`85eceb5ff138a78394ddf27c0ebad2b01c4b628227ccc0cc2a8c33031cdbbc2d`.
The isolated test-vault receives deployment; native UI/unload/device/assistive,
source-update/failure, broader design and release-review gates remain open.

### Late reading-image focus/scroll checkpoint — November 24

The production reading panel now leaves newer focus and scrolling alone when
images finish loading. Three pre-fix failing cases, seven passing cases and two
detected/restored mutations support the change. An isolated Chromium fixture
reproduces the old focus steal and passes six post-fix cases at 900/390 x 760
with preserved focus/visible paragraph position, clean console and no horizontal
page overflow. Artifacts are outside the repo in the sibling .sworddock-qa folder.

Current Mini/Linux full checks pass 410/63 with matching 392,161-byte bundles and
all 1,681 Linux inputs unchanged. Real-source workflows, deterministic preview and
offline smoke pass. Preview SHA-256:
`ede1a451c5b831d67321a07ffdcc5a9e3f22763b5a1a1b18b484616fb3e63240`.
Only the isolated test-vault is deployed. The eight-file source review is partial;
full accumulated review and all outstanding native/device/assistive/source-update/
failure/design/slow-device gates remain open. The full goal stays active.

### Reader/Resources view lifecycle checkpoint — November 24

Three confirmed state/lifetime faults are fixed: Resources preserves search/caret
and DOM identity across unrelated progress after a type switch; Reader respects
new focus during pending word rendering; obsolete openings do not attach resize
observers. Five pre-fix failing cases, nine passing cases and three detected/restored
mutations support these fixes. Ten isolated Chromium cases at 1100/390 x 900 also
verify real generation refresh and normal pinned-word focus. Console is clean and
there is no horizontal overflow in these fixtures. Host and WordDetails boundaries
are stubbed, so native acceptance remains separate. Settings download copy is fixed.

Full Mini/Linux 419/64 checks, matching 392,341-byte bundles, all 1,682 mounted
inputs unchanged and real-source workflows pass. Deterministic package/offline
smoke passes at 1,475 entries / 34,957,116 bytes, SHA-256
`a49eac353795ae64a715621cb590b474eb98e7366de8d7b9089369bea9b40e24`.
Only the isolated test-vault is deployed. Browser/review artifacts are outside the
repo in the sibling .sworddock-qa folder. The accumulated source review has covered
15 files and remains incomplete; all outstanding native/device/theme/assistive/
source-update/failure/slower-device/final-review gates stay open. Goal stays active.


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
