# Local preview cancellation checkpoint — November 24, 2026

The installer previously invalidated review tickets on shutdown, discard or a
replacement file, but passed only the caller's signal into active preparation.
A service-level action could leave obsolete SQLite/normalization work running to
completion. Three regressions confirmed all 501 source records were still read.

## Change

Each preparation now owns an AbortController. Starting another preview or
discarding the active one aborts that controller; shutdown already uses the
same discard path. The optional caller signal relays cancellation to it.
Source bytes are still copied before waiting for WASM. Cancelled/replaced work
is checked again before inspection begins after WASM becomes available.
Only the latest request can create a review ticket.

The relay listener is removed in a finally block. That block clears the active
controller only if it still belongs to the finishing request, so an older
request cannot disable cancellation of its replacement. A stale completed-review
ticket cannot discard a newer active preparation. Saved resource transactions
and their controllers remain independent.

Cancellation is cooperative at existing preparation yields. An in-progress
synchronous SQLite call or individual transformation cannot be preempted.
Shared WASM initialization can finish; obsolete work does not begin inspection
after that wait. The source format, size limits and stored output are unchanged.

## Evidence

Six new regression/compatibility cases cover service stop, discard, replacement,
caller abort, overlapping cleanup and stale-ticket discard. Three failed on the
original code by reading all 501 rows. The focused 26-case import suite passes.
Removing active-preview abort makes four cases fail; removing the caller relay
or controller ownership guard each makes its respective regression fail.
Every mutation restores exact production bytes afterward.

The pinned-source verifier exercises stop/discard/replacement on all three study
types and the larger devotional fixture (12 cases). It observes 101 SQLite steps
out of 31,102 Bible, 21,114 commentary and 3,965 dictionary rows; devotional stops
at 26 of 745. One extra step occurs before the existing loop cancellation check.
Both physical-schema and inspection databases close. No preview resource writes
or network calls are permitted by its store/downloader. All source hashes remain
unchanged; each replacement Book preview is ready successfully.

This is actual core/runtime evidence, not native plugin-unload or UI acceptance.
The smaller Book/Graphics paths and all six successful import/reopen workflows
are covered by the general source verifiers; no active mid-work cancellation
claim is made for those two fixtures.

Full checks pass 403 tests / 62 files, TypeScript and production build on Mini/Linux.
The 392,027-byte bundles match; all 1,680 mounted Linux inputs are unchanged.
Real six-source workflows, deterministic 1,475-entry packaging and offline smoke
pass. Current package hashes and native acceptance limits are recorded in STATUS.
Evidence and reproduction script are in
`.research/platform-mini/preview-cancellation`; run
`node .research/platform-mini/preview-cancellation/verify-real-preview-cancellation.mjs`.
The previous candidate's source and runtime reports are retained there.
