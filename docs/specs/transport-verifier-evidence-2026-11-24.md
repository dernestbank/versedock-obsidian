# Transport verification evidence — November 24, 2026

Development remains on Nana’s Mac mini. The transport verifier previously wrote
its report only on success. An existing `complete: true` result survived both a
startup build failure and a controlled HTTPS failure. The verifier now writes
`complete: false` before build/network/assertion work and publishes success only
after cancellation, resume, pinned installation and offline-service checks pass.
No product code, dependency, UI or packaged asset changed.

## Regression and isolation

Two child-process tests reproduce the stale report. Both failed before the fix.
The tests create disposable report trees, copy the actual verifier there and
share only read-only source/dependency links. One tree deliberately lacks source;
the other replaces Node HTTPS with a controlled failing request, so neither test
makes a public network call. Both inspect the resulting report and the expected
failure diagnostic, preventing a different early error from satisfying the test.

The initial Mac fixture left the script in the repository while changing its
working directory, so its relative runtime import could load a pre-existing
repository bundle. Linux lacked that artifact and correctly rejected the fixture.
The corrected fixture keeps script and generated runtime in the same isolated
tree. The failed Linux report/log is retained, without a product-bug claim.
Removing early invalidation makes the corrected tests fail; the exact fixed
script is restored afterward. Full Mini/Linux checks pass after this correction.

## Current real-network proof

A fresh `node scripts/verify-download-transport.mjs` run uses the actual publisher
HTTPS endpoint with TLS verification and the unchanged catalogue source pins.
It closes the cancelled request after **527,838 bytes**, persists that prefix,
recreates the downloader and receives **HTTP 206** at `bytes=527838-`.
After checksum validation it installs/reopens Bible (31,102), commentary (21,114),
dictionary (3,965), book (22), devotional (745) and graphics (36) resources.
A fresh offline service forbids downloads; the default production HTTPS request
path is separately exercised. All persistence is a disposable temporary store,
removed by the verifier. This is Node/transport proof, not native failure UX,
actual app networking isolation, publisher-update or device acceptance.

The current exact transport runtime is hash-bound to this fresh report. The
current rich runtime also exactly matches retained full-oracle verification;
all six physical database hashes still match catalogue pins. The retained rich
report covers **56,984 source records / 25,882 non-Bible projections**, no fallback.
The prior interlinear/commentary field-oracle bindings remain applicable.

## Current automated checkpoint

Mini/Linux **497 tests / 72 files**, strict TypeScript/build and real six-source
import/reopen, management/storage recovery pass. Linux: **69.35 seconds**,
**1,692 inputs unchanged**, fingerprint
`4dc5701f72d1afe2bc27a7ffdc67b9d4f96e652aac6c070c651c3d65802e4a58`.
Bundle SHA-256: `27e1a4314441cde1437971301be88b2ea16238636ab8b40dce6dd381b49e19b1`.
All **1,475** existing preview entries still exactly match current project bytes.
Retain the prior two identical builds and clean-install/offline-restart data smoke;
no redundant packaging, deployment or UI rerun is claimed for QA-only changes.
Preview: **34,957,843 bytes**, SHA-256
`b0082ad7a80b6293faefcdbf2eb60f85e3c80f8a3b357bb030b117f2c56dcfe5`. Isolated test-vault core files still match.
HEAD and dependency lock remain unchanged; no publication or personal-vault edit.

All **68** numbered completion-ledger criteria now have explicit current-scope
assessments and hash-bound evidence in sibling
.sworddock-qa/requirement-audit-2026-11-24.json. Fifteen automated-scope criteria
and the user-selected companion contract have current proof. Thirty-nine checked
rows contain historical native or partial current evidence; thirteen open rows
still lack the complete required proof. These counts do not change ledger scope
or imply 39 historical checks failed. Source/script/test inspection is complete;
full current release acceptance is not.

Current native Mini design/focus/theme flows, actual publisher-update/native
failed-transfer paths, exact final native ZIP/offline start, Windows/native Linux/
mobile, actual screen reader and slower-device acceptance remain open. The
manifest still correctly declares this a desktop developer preview; browser host
flags do not establish mobile support. Mini QA-only AppleScript approval remains
unanswered; no native Mini interaction or OS setting was changed. The full goal
remains active. Optional Copilot/Research remains later scope.

Evidence: .research/platform-mini/transport-evidence (red/green/mutation/check/
Linux logs, failed-fixture report, current HTTPS/rich bindings and checkpoint).
