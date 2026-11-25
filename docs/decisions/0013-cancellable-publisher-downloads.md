# Cancellable desktop publisher downloads and durable prefixes

Date: 2026-11-18. Status: implemented; broader native/device acceptance remains open.

## Problem and decision

The public Obsidian `requestUrl` interface in the installed SDK has no transfer
abort API. Racing its promise with cancellation prevents activation but leaves
the transfer running. Desktop installation now uses a lazy Node HTTPS request.
Cancellation and timeout destroy the active request immediately, including while
waiting for headers or writing a checkpoint. TLS certificate verification stays
enabled; no cookies, credentials, arbitrary user URLs or external service are
added. Mobile retains requestUrl and describes its cancellation limit honestly.
Desktop built-ins are required only on the desktop branch.

The transport follows at most three redirects on the original HTTPS origin.
Credentials, fragments, downgrades, other origins and oversized response headers
are refused. Identity encoding is requested; Node returns raw gzip bytes without
automatic inflation. Responses have a reviewed compressed-byte limit and a
60-second operation deadline. Unexpected lengths/encodings fail before buffering
the response. The complete compressed checksum must match before returning;
the shared installer independently verifies compressed and expanded database
checksums before normalization, staging or activation.

## Durable download state

`PartialDownloads` uses immutable `.stage-UUID` snapshots inside the existing
managed reading root. Each has an owner record with purpose `download` and a
target bound to source ID and the full compressed SHA-256; JSON content holds
base64 bytes, and a manifest binds the URL, both source hashes, expected length,
received length, prefix checksum, strong ETag and creation time. These are
download prefixes, never activatable reading resources.

The stream writes a checkpoint at roughly 512 KiB intervals and on interruption.
A new owner/content/manifest is written and read back before prior owned transient
snapshots are removed. A failed successor write leaves its prior complete prefix.
Incomplete/modified snapshots cannot resume. Automatic removal requires complete
measurement and only recognized files; unknown files or unavailable measurement
preserve the folder. Removing
obsolete transient download copies is distinct from generation cleanup, which
continues to use recoverable vault Trash. The shared production store retains its
real-path, immutable-write and file-size guards.

Retry discovers state from storage, not from a remembered promise. Only a strong
ETag can accompany Range/If-Range. A 206 response must have the same ETag and the
exact requested start, end and total. An ignored range (200) replaces the prefix
with a full response. An invalid range/changed validator triggers at most one
fresh full request. No unchecked response is concatenated. Complete-file pins
remain authoritative even when HTTP metadata appears compatible. Verified
success or checksum failure clears owned download checkpoints. A source pin
change cannot reuse an old source's checkpoint.

Storage review measures and identifies valid prefixes, explains Retry and the
effect of moving them to Trash, and never offers Recover as if they were a
prepared module. The install queue serializes review/cleanup with downloading.
Retry requested during cancelled checkpoint completion is queued instead of
silently ignored. Unloading/stopping the installer prevents that retry from
starting a new transfer. Progress retains the latest count but emits at most
roughly ten times per second, plus terminal size/state changes, to avoid rebuilding
the UI for every network chunk. Downloads reports received/total bytes and platform
capabilities through the shared install-service contract.

## Evidence and limits

Real loopback socket regressions prove request closure on cancellation/timeout,
restart resume, clean early-end recovery, bad validators/ranges, ignored ranges,
redirect restrictions, size bounds and changed-content rejection. Checkpoint
tests cover failed writes, corrupted bytes, source pin/ownership changes and
unrelated stage preservation. Storage tests distinguish prefixes from resources
and verify reviewed Trash cleanup. Retry has a reproducing regression.

`scripts/verify-download-transport.mjs` uses actual publisher HTTPS in a disposable
temporary filesystem: abort KJV after a partial prefix, recreate the downloader,
observe 206 for its exact range, verify the full source and install all six
curated kinds. A new service reopens all six with network access forbidden. The
ignored `.research/modules/transport-report.json` records bytes, requests and
record counts. Native testing and mobile public-API limitations are not erased
by that Node verification. No personal vault is involved.

Protocol references: [Node HTTP request destruction](https://nodejs.org/api/http.html#requestdestroyerror)
and [RFC 9110 If-Range and range semantics](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-range).
