# ADR-002: Bundle attributed cross-reference coordinates separately from Bible text

## Status

Accepted for the local development preview

## Date

2026-11-16

## Context

The Study dock had no working cross-reference content. A coordinate dataset can supply related passages while the installed WEB supplies all preview text. This does not require the proposed MySword importer or a runtime network integration.

[OpenBible.info](https://www.openbible.info/labs/cross-references/) publishes its downloadable coordinates and votes under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Its website's separately copyrighted Scripture quotations are excluded. The downloaded ZIP identifies its snapshot as 2026-11-16; SHA-256 is `b54a2a381e3eb587ca4ea34ba3f1d052923c49625d857014041f3254eb7c4f1e`.

## Decision

Ship immutable release assets in `library/crossrefs`, separate from `library/webp`. Generate one JSON file per canonical book, plus a manifest recording source, license, conversion counts and per-file SHA-256. Retain all valid source scores, including negative scores. Omit coordinates absent from bundled WEB and target ranges spanning chapters. Do not remap versification.

The 344,799-row snapshot yields 344,016 records; 651 cross-chapter targets and 132 rows with unavailable coordinates are omitted. Validation covers every verse of a retained target range. Coordinate existence is not evidence of equivalent versification.

The runtime validates the manifest and each lazily loaded book's checksum, structure and canonical targets, keeping at most two source books cached. A selected range deduplicates exact target coordinates by highest source vote. Study shows three targets and References shows twelve; preview text is excerpted from local WEB. Opening a target changes the Reader, while the existing Inspector Follow/Pin policy controls the right dock.

Display OpenBible.info attribution and the CC BY 4.0 link in the panel and library. Include `SOURCE-LICENSE.md` with the derived data and describe modifications there. No background fetch, source upload or MySword writer is introduced.

## Alternatives considered

### Fetch references from a website at runtime

Rejected because the dock must work offline, website quotations have separate permissions, and a remote request would disclose the selected passage.

### Include all target spans through implicit truncation

Rejected because the current passage model represents a range within one chapter. Showing only a range's beginning as if it were complete would misrepresent the source. Cross-chapter support requires a separate passage-model change.

### Import a MySword reference module

Deferred because that writer and resource lifecycle remain outside the accepted implementation contract. Bundled release assets use their existing lifecycle; user imports require the proposed separate store.

## Consequences

The preview ZIP gains about 1.5 MB compressed. Preview text changes with the installed WEB source; votes indicate community ranking, not theological authority. Commentary, lexical data, additional editions and a runtime download catalogue remain separate work.

Ordinary builds consume the checked-in generated files. To reproduce this snapshot, place the exact source ZIP at `.research/openbible-cross-references.zip` and run `npm run crossrefs:build`; the script pins both its archive hash and dated header and reads only the named text entry without extracting paths. The upstream download is mutable, so a later snapshot requires explicit source review, a new pinned hash/header and regenerated data. Release packaging and clean-install smoke checks include all 68 cross-reference files.
