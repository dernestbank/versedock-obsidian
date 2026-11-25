# Reviewed storage cleanup and prepared-stage recovery

Date: 2026-11-18. Status: implemented in candidate; native evidence and remaining gates are tracked in `tasks/completion-2026-11-18.md`.

Resource storage now separates read-only measurement/review from mutation.
The review covers active, removed, retained and damaged generations, management
records, staged installations, unknown folders and loose root files. Incomplete
measurement is labelled as such. Unknown data and folders containing unexpected
files are retained for manual review. Active generations, selected removed copies
needed by Restore, the newest record and two verified rollback records with their
referenced generations are protected from cleanup.

Cleanup uses an opaque review ticket with detached display data. The backend
rescans management state, verifies selected paths remain eligible, compares exact
content/manifest/owner fingerprints and rechecks immediately before each move.
All mutations share the installer queue. Selected unused folders move to the
vault's recoverable Trash through the public DataAdapter API; this reduces managed
root size, not physical disk consumption while Trash is retained. A partial move
failure reports how many folders moved and keeps remaining files. No cleanup
operation permanently removes a resource generation or personal original.

New transactions write and verify an owner record before content. New resource
and management manifests declare three files; their owner purpose/target must
match during readback/reuse/recovery. Legacy two-file packages remain supported.
This establishes evidence for incomplete transaction folders, while complete
legacy packages can still be recognized from validated manifests and checksums.
Ownership records never contain an original absolute source path.

Complete prepared resource stages can be explicitly reviewed and recovered.
The review shows source identity, notice, entries and fingerprints. Recovery
rechecks its ticket, validates the full prepared package, seeds a management
baseline, promotes a verified generation and commits activation. The original
staging copy remains for cleanup review. Incomplete/changed stages cannot activate;
an owned incomplete stage can be moved to Trash. This recovers prepared stages,
not partial HTTP transfers; byte-level download resume remains separate work.

The production resource store now resolves desktop filesystem paths against the
real resource root before reads/mutations. Symlinks, aliases and escaping paths
are refused. Only a newly-created staging folder can be written/promoted, staged
files are immutable, and permanent removal is limited to transient stages created
by transactions. Reversible resource cleanup uses Trash. The virtual-adapter
branch does not request desktop filesystem access; Node built-ins load lazily on
desktop only. Tests exercise actual temporary files through a shim of the public
Obsidian adapter, including external symlink refusal. They do not prove a native
Obsidian/phone runtime or the real vault Trash UI.

`scripts/verify-resource-storage.mjs` uses the real 31,102-record KJV and 22-entry
All of Grace corpus in a temporary filesystem. It recovers a complete staged book,
refuses to activate an incomplete owner-only stage, moves two reviewed folders to
recoverable Trash, and reopens both resources offline. Measured root size falls
by the exact measured bytes / four files recorded for that candidate, matching
the moved data; originals remain unchanged. Its ignored report is
`.research/modules/storage-report.json`.

Regression coverage includes stale cleanup reviews, newly-protected versions,
unexpected data, loose files, incomplete measurement, damaged ownership repair,
and substitution of a different otherwise-valid prepared package after review.
Temporarily removing the recovery fingerprint comparison made the substitution
regression fail; the check was restored. Native macOS review/focus/Trash,
prepared-stage recovery/reload and partial-network Cancel/reload/resume now have
specific evidence in `docs/specs/native-acceptance-2026-11-18.md`. Actual native
offline-start, remaining platform/assistive/performance acceptance and the complete
original goal remain open.

Shutdown now passes the installer's lifecycle signal through cleanup/recovery.
Recovery checks it before promotion and management activation; cleanup checks it
immediately before each Trash call. A Trash call already submitted may complete:
its folder stays recoverable, and the next cancellation error reports the number
already moved. No later selected folder is moved. Regressions hold revalidation
across shutdown, verify unchanged retained files/stages, and stop after one real
in-memory Trash move while preserving the remaining folder and active generation.


## Resource-root boundary correction — November 24

The old adapter accepted a pre-existing root alias and could create staging or
ancestor directories through a redirected root before detecting it. On the mini,
real filesystem regressions reproduced those writes. Root initialization now
validates existing ancestors before mkdir, preserves their physical casing, and
binds the canonical root to the real vault base. Root checks precede staging mkdir,
directory discovery and loose-file listing. A base alias remains supported; aliases
below it are refused. A controlled ancestor swap during canonicalization is also
rejected before external creation. The mobile virtual namespace remains independent
of Node APIs. Eight focused adapter cases and full Mac/Linux checks pass. This is
not descriptor-level protection against a concurrent external check/use path swap.
