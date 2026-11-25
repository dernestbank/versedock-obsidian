# Reviewed local-file imports

Date: 2026-11-18. Status: current candidate; native acceptance pending.

Local import reuses the shared six-type normalizer and verified generation
transaction. The selected file and expanded database are each bounded to 64 MiB.
Gzip is detected by magic and decoded with the existing bounded stream. Physical
table inspection detects Bible, Commentary, Dictionary or Journal containers;
ambiguous schemas and virtual/view substitutes are rejected. Journal users can
choose book, devotional or graphics readers, which must satisfy their dates or
embedded-asset requirements. No extension alone establishes a file type.

Preparation owns the bytes before awaiting WASM and produces a complete package
without writes. The service retains one prepared snapshot behind an opaque review
ticket, returning detached metadata and samples to the modal. New selection,
failed preparation, cancellation or discard invalidates the old review. The
explicit install action uses that snapshot, accepts a bounded local citation and
enters the same serial transaction queue. Installation failure/cancellation keeps
the inventory unchanged and staging is removed by the existing transaction.

`local-{kind}-{database fingerprint prefix}` identities are independent from
bundled/catalogue IDs. Raw and gzip inputs for one database share an identity.
Original and database fingerprints, basename, compression and optional citation
are retained as validated local provenance. Absolute source paths are discarded.
The origin is displayed as local text, with no publisher link or license invented.
All new Book-container conversions also retain original entry source strings.

Imported titles and Scripture text create a new Markdown boundary. Scripture
insertion and reflection generation now escape imported text, preventing source
HTML, image embeds or link syntax from becoming active Markdown. Reflection
filenames remove paths/control characters and remain bounded. No source file is
modified, uploaded, executed or bundled into the preview package.

Independent synthetic fixtures cover all six schemas, renamed files, gzip/raw
identity, ambiguous/invalid inputs, source ownership during WASM initialization,
stale/failed reviews, detached review data, cancellation, failed storage and
offline restart. Disabling the ticket comparison temporarily made the stale
review regression fail; the guard was restored. `scripts/verify-local-imports.mjs`
exercises all six actual research corpora through raw/gzip preview, explicit
installation and fresh offline discovery in a temporary filesystem, retaining all
source records. Its ignored report is `.research/modules/local-import-report.json`.

Native file selection, focus, activation and restart have not yet been exercised
for this modal. Active-generation selection, repairs, removal and interrupted
recovery remain module-management work: discovery currently chooses the latest
stored generation timestamp; an explicit persisted activation record is needed
to support selecting an already-existing older generation reliably. This decision
does not claim completion of either the import acceptance or full project goal.

Follow-up: decision 0011 implements explicit verified management snapshots,
version selection, reversible removal and non-overwriting repair. Its native
acceptance and remaining management gates are tracked separately.
