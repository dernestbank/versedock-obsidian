# Mac mini development migration — November 24, 2026

Development now takes place on Nana’s Mac mini. The repository working directory is:
`/Users/nanabee_home/Documents/obsidian_vaults/my-plugins/mysword+/dev`. Design references remain in the sibling `../design/SwordDock-Bible-UI-Mockups`.
Use the mini1 terminal/filesystem tools for this workspace. The original Mac copy is
retained as a backup; its source is the pre-fix snapshot, rather than the active tree.

The Taildrop transfer contained **7,822 files**, including dirty/untracked source,
complete Git history, design references, source corpora, research/QA evidence, old
packages and the isolated test vault. Only node_modules and .DS_Store were excluded.
All archive/extracted bytes were verified. Git HEAD and complete porcelain status
matched the source before further development. No existing mini project was overwritten.
Transfer ZIP SHA-256: `b27462f3ba5468064bd7421f500c192cf936d879e191f1655c0b0fcc17cb4510`.
Receipt: `/Users/nanabee_home/Downloads/mysword+-transfer-2026-11-24/MIGRATION-RECEIPT.json`.

Dependencies were installed from the unchanged lockfile on ARM64, with lifecycle
scripts disabled. Native build runtime: Node 22.23.1 / npm 10.9.8 / Python 3.9.6.
Obsidian 1.8.10 is installed, but was not launched or used as native UI acceptance.
The chat controls development through the mini connector; no new chat was created.

## Continued work and proof

The three pending resource-root regressions reproduced on the mini. The storage
factory now validates existing ancestors before creation, binds the canonical root
to the real vault base, checks it before staging creation/discovery/loose-file listing,
and continues to support a vault opened through a base alias. Physical casing is
preserved and mobile adapters remain independent of desktop filesystem APIs.
A fourth failing case redirects an ancestor between lstat and canonicalization;
the final canonical-root boundary check rejects it before creating external files.
Removing that check makes its regression fail. Exact production source was restored.
The compatibility case and three earlier adapter tests also pass (eight focused cases).
Public adapter checks still do not provide descriptor-level atomicity against an
external actor replacing paths after validation.

**380 tests / 60 files**, strict TypeScript and production build pass on the mini
and in its isolated Linux ARM64 container. Linux uses Node v22.23.2,
image `sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32`, and completes in 63.87 seconds.
All **1678** mounted inputs remain unchanged, fingerprint
`a9510023c064c07b49ea7f23974a242e52b1263ecd284f4e5afab721b41814d3`. Browser bundles match byte for byte at
**391,123 bytes**, SHA-256 `39d31843fd56da6118e451141e512428eaba09810050420ab244cfb0e2cc0892`.

All six real-source import/offline-reopen, management and storage/recovery verifiers
pass on both runtimes. Full and runtime-only lockfile audits report zero findings.
Preview clean-install/offline-restart smoke and two identical package builds pass:
**1,475 entries / 34,956,811 bytes**, SHA-256 `2a072bc847674899cd462748c597e60ac1ddcfe9c8ecf01ac56f7191520c8d6b`.
The new build is deployed only into this project's isolated `test-vault`.
No native Obsidian startup, theme, accessibility or phone claim is inferred from these checks.

Authoritative logs/reports: `.research/platform-mini`, `.research/platform-linux`,
and `.research/modules/resource-root-mini-*`. Prior Linux reports and the original
transfer archive are retained. Older absolute Mac paths in evidence remain provenance,
rather than newly verified mini locations. No commit, push, publication or personal-vault
installation was performed.

## Remaining scope

Continue `tasks/completion-2026-11-18.md`: wider Reader/Study/Resources/Library theme
and narrow-pane acceptance; native failed-transfer rollback and reviewed source-changing
updates; final exact-ZIP native fresh/offline-start and unload; VoiceOver; native
Windows/Linux/mobile; representative slower-device performance; full accumulated-worktree
release audit. The approved KJV + labelled Berean companion decision remains unchanged.
Optional Copilot and Research work remains later scope. The full goal is active.

## Development continued on the mini

Profiling exposed two synchronous stages after SQLite inspection: study-content
transformation and imported Bible decoding. Both now yield in batches and honor
cancellation. Imported Bible decoding stops on unload and rechecks the installed
generation before caching. Seventeen regressions, six detected mutations and
six-corpus exact JSON parity support the change; 397 tests / 62 files pass.

See `module-preparation-performance-2026-11-24.md` for measurements, the increased
elapsed-time tradeoff and remaining full-import pauses. The full native device,
assistive and slower-device acceptance matrix stays open. Computer Use still
targets the original Mac; the requested Mini QA-only AppleScript exception has
not been answered. No native Mini window, permission or personal vault was changed.

The subsequent local-preview cancellation fix passes 403/62 Mini/Linux checks,
real-source workflows, twelve active-source interruption cases and current package
smoke. Preview SHA-256:
`85eceb5ff138a78394ddf27c0ebad2b01c4b628227ccc0cc2a8c33031cdbbc2d`.
Details: local-preview-cancellation-2026-11-24.md; authoritative current reports:
.research/platform-mini/report.json and .research/platform-linux/report.json.
Development remains on the mini and native Mini acceptance is still unverified.

The latest reading-image focus/scroll candidate passes 410/63 Mini/Linux checks
and package smoke. Browser fixtures at 900/390 x 760 verify the specific late-image
regression; native acceptance remains separate. Preview SHA-256:
`ede1a451c5b831d67321a07ffdcc5a9e3f22763b5a1a1b18b484616fb3e63240`.
Current reports/STATUS identify the exact candidate and partial review progress.

The current Reader/Resources lifecycle candidate passes 419/64 Mini/Linux checks,
real-source workflows and deterministic package smoke. Ten isolated Chromium
cases verify specific state/lifetime paths; native acceptance remains separate.
Preview SHA-256:
`a49eac353795ae64a715621cb590b474eb98e7366de8d7b9089369bea9b40e24`.
The current reports/STATUS identify the candidate and partial 15-file release review.


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
