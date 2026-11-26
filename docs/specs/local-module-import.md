# General local MySword import

Status: implementation in progress, within the active full-completion goal.

Accept user-selected unencrypted SQLite databases and gzip-compressed databases,
bounded to 64 MiB for both selected and expanded input. Detect physical Bible,
Commentary, Dictionary or Journal tables from content; filename extensions never
establish a type. Reject ambiguous schemas, virtual/view substitutes, corrupt or
encrypted inputs and unsupported archive formats with a useful explanation.
Journal containers can be explicitly opened as books, devotionals or graphics;
the chosen reader must satisfy its actual dates/assets schema.

Preview performs complete preparation and validation without writes. Show title,
type, record/image coverage, source notice, samples, selected/expanded sizes and
both fingerprints. Source-specific numbering is retained. Store only the source
basename, never an absolute source path. Let the user record an optional local
source/permission citation. An explicit Install action activates the reviewed
prepared snapshot; changing the selected file/type invalidates that snapshot.
Closing/cancelling a preview releases it and cannot later activate stale results.

Local module identifiers derive from kind and database fingerprint. They cannot
replace bundled or curated identifiers. The manifest/content retain local-file
origin, filename, selected-file hash, database hash, compression and citation.
Local origin is text, never an invented publisher link or license declaration.
Imported resources use the existing six reader routes and survive offline
restart. Source files are never modified or uploaded. No source regex, CSS,
scripts or remote images execute during inspection or reading.

Verify all six types with independent synthetic SQLite fixtures, raw/gzip
equivalence, renamed files, malformed sources, cancellation, stale snapshots,
storage failures, retained provenance and fresh offline discovery. Also run the
actual six source corpora through local import in a temporary filesystem. Native
file-picker, preview, activation, switching and reload verification remains an
explicit acceptance gate, alongside design and platform checks in the full ledger.
