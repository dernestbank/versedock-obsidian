# Linux runtime verification — November 18, 2026

This verifies the current core/build and filesystem workflows inside Linux ARM64
under Docker on the Mac. It does not establish native Linux Obsidian, Windows,
iOS/Android, community-theme, assistive-technology or slower-device acceptance.
The release ledger keeps those gates open.

## Reproduction and boundaries

Run `python3 scripts/verify-linux-runtime.py` with Docker and the existing
official `node:22-alpine` image. The six pinned acquired SQLite fixtures must be
under `.research/modules/`. The script does not pull an image or install host
dependencies. It inspects and runs the immutable local image ID, mounts an
explicit list of project inputs read-only, copies them into temporary container
storage and runs as UID/GID 1000. Personal vaults and plugin settings are not
mounted. The container has a read-only root filesystem, no extra capabilities,
no published ports, no privilege escalation, two CPU cores and a 2 GiB memory
limit. Its temporary `/tmp` is bounded to 1 GiB. The owned container is removed
when its command exits; its label/name and terminal exit status are recorded.

Dependency installation uses the lockfile with lifecycle scripts disabled:
`npm ci --legacy-peer-deps --ignore-scripts --no-fund --audit=false`. Registry
access is available during setup; no airplane-mode claim is made. The source
install/reopen verifiers explicitly reject downloader calls.

The wrapper fingerprints all mounted files before and after execution. It fails
if host inputs change or any required command fails. Its ignored authoritative
report and stdout are `.research/platform-linux/report.json` and `runtime.log`.
The report records exact input/image IDs, versions, terminal result and limits;
it is evidence for that snapshot, not for later untested code changes.

## Observed results — November 18 snapshot (historical)

The official image is Linux ARM64, image/digest
`sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402`.
Observed runtime: Node 22.23.3, V8 12.4.254.21-node.57, libuv 1.51.0,
OpenSSL 3.5.8, Linux kernel 6.10.14-linuxkit.

The full 375-test / 60-file suite, strict TypeScript and production build pass.
The Linux browser bundle matches the corresponding Mac build byte-for-byte.
All six real corpora preview raw/gzip, install reviewed snapshots and verify/
reopen with downloads forbidden. Management verifies older-version persistence,
reversible removal/restore, damaged-copy-preserving repair and failed-selection
rollback over 31,102 actual Bible records. Storage verifies prepared-stage
recovery, refusal of incomplete stages, protected cleanup and exact physical-byte
accounting. Original source files and all host inputs remain unchanged.

The reports identify earlier snapshots retained before subsequent native focus/
layout corrections. Final-candidate runs are recorded in STATUS and the current
report rather than treating an earlier green run as proof of every later change.
That final run includes stable download controls, friendly installer errors
and named source anchors, plus the Things contrast styles and installer lifecycle
cancellation. It completes in 53.118 seconds and fingerprints 1,678 unchanged host
inputs. Its production bundle is 390,119 bytes, SHA-256
`a973db2cef03400a8f774c1bd9f4525bafb0b6f3c00e3070d9faef35a933ca07`.

That input fingerprint is
`8221011ca0aa155e8d7e7db014a0ff4618feee289ac3b0dc63322944a5f53b11`.
The first Things-checkpoint run exceeded the 15-second limit in the full-corpus
KJV checksum test; 367 other tests passed. Its report/log are retained as
`things-contrast-checksum-timeout-*`. That correctness test now has a bounded
60-second allowance for its 66-book checksum/read and 31,102 verse assertions;
the assertions and global timeout are unchanged. The subsequent complete run
passes all checks and source workflows. Neither elapsed container time nor the
test allowance establishes native launch or representative slower-device speed.

Seven shutdown regressions cover post-stop/late-WASM previews, queued removal,
an uncommitted management change held during verification, cleanup/recovery held
during revalidation, and stopping cleanup after one completed Trash move. Each
checks retained data or restart state. These are core/runtime tests; native plugin
disable/unload acceptance is still pending. The pre-shutdown-fix Linux result is
retained separately as `before-installer-stop-*`.

## Other environment availability

Native Mac attachment initially returned `cgWindowNotFound`, then succeeded after
the user's foreground confirmation; the native acceptance record documents actual
GUI progress. Both connected Windows shell probes returned MCP internal service
errors. Local `xcrun simctl` reports no simulator utility, and no Android tooling
was found in the available command path. No platform success is inferred from
the mere presence of a tool name. Actual device/native environments remain needed.


## Current Mac mini snapshot — November 24

All 380 tests / 60 files, TypeScript, production build and the six-source import,
management and recovery workflows pass in the mini's Linux ARM64 container. Node
is v22.23.2; immutable image `sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32`.
The run completes in 63.87 seconds with all 1678 mounted inputs
unchanged, fingerprint `a9510023c064c07b49ea7f23974a242e52b1263ecd284f4e5afab721b41814d3`. The
391,123-byte browser bundle matches native Mac output, SHA-256
`39d31843fd56da6118e451141e512428eaba09810050420ab244cfb0e2cc0892`. This includes the resource-root
ancestor/canonicalization fix and all eight adapter cases. It does not prove native
Linux Obsidian or actual graphical/accessibility/slower-device acceptance.

## Cooperative preparation snapshot — November 24

The current candidate passes 397 tests / 62 files, strict TypeScript, build and
six-source import/offline-reopen, management and recovery workflows. The same
immutable Linux ARM64 image is used. Elapsed time is 123.936 seconds, with all
1,680 mounted inputs unchanged, fingerprint
`14fc458080f11077be0882a0aaaadab7cf0b20f9af173b2a0454eefabe27040e`.
The 391,569-byte browser bundle matches Mac, SHA-256
`62561f03bef9b6d427dfa1e789f0305c65d8564f413629d2d09b5f1ac88d8c5d`.
This includes cooperative study transformation/Bible opening and their unload/
generation guards. Actual native Linux/UI/assistive/slower-device acceptance
remains open. The prior root-boundary report and log are retained under
.research/platform-mini/cooperative-preparation/linux-before-*.

## Active preview cancellation snapshot — November 24

The current candidate passes 403 tests / 62 files, TypeScript/build and six-source
import/reopen, management and recovery checks in the same immutable ARM64 image.
Elapsed time: 67.118 seconds. All 1,680 mounted inputs are unchanged, fingerprint
`861d8e01d674227521093514ccb742b1dfe520faccf04b87c425270e6da752b8`.
Mac/Linux bundles match at 392,027 bytes, SHA-256
`cddcab4693ac3ee527f4b69ba0e4916a8fbdeccb845f043eea75d17d82ac6e45`.
The previous report/log are retained in
.research/platform-mini/preview-cancellation/*platform-linux*.before.
This is runtime evidence; native Linux/UI/assistive/slower-device gates stay open.

## Reading image focus snapshot — November 24

Current full check passes 410 tests / 63 files, TypeScript/build and real-source
import/management/recovery workflows in the unchanged immutable ARM64 image.
Elapsed time: 61.727 seconds. All 1,681 mounted inputs are unchanged,
fingerprint `611bc48f92050650cc913aa276c482980a2444a6cb42a509e71b51a0c510ad7d`.
Bundles match at 392,161 bytes, SHA-256
`1747e7a479ef05d5f1498f50a5647ba09137198639bb65d4df0d5d57670a1216`.
Native Linux/UI/assistive/slower-device acceptance remains open.

## Reader/Resources lifecycle snapshot — November 24

Current full check passes 419 tests / 64 files, TypeScript/build and real-source
import/management/recovery workflows in the same immutable ARM64 image.
Elapsed time: 73.024 seconds. All 1,682 mounted inputs are unchanged,
fingerprint `13f84c1c88e3da91fe24edb18b767bb7cf87600b62815a4bc6c37443019d498e`.
Mac/Linux bundles match at 392,341 bytes, SHA-256
`30f44915a8ce17f9d7a9b4f5ac2d431d7c4cff40190f25711e5179bdafbf1be8`.
Native Linux/UI/assistive/slower-device acceptance remains open.


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
