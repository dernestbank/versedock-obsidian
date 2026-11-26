# Persistent resource choices and reversible removal

Date: 2026-11-18. Status: implemented in candidate; native evidence and remaining gates are tracked in `tasks/completion-2026-11-18.md`.

The previous discovery rule selected the generation with the latest stored
timestamp. Reusing an already-stored older generation could therefore appear
successful until restart. Resource choices now live in immutable management
snapshots, independent of generation timestamps. Each snapshot contains bounded
ID/directory/removal entries, a monotonic revision, a content fingerprint and a
separate manifest. Content and manifest are read back before directory promotion.
No existing state file is overwritten; directory rename is the commit point.

Legacy verified resources seed a baseline before the first managed mutation.
Installation writes that baseline before promoting a new resource generation,
then commits its activation separately. A promoted generation whose activation
fails remains retained and inactive. Removal records a reversible library choice;
source files, resource generations and reading state remain available. Restore
reactivates the exact selected stored version. The current default Bible is
protected both when removal begins and immediately before publication.

Discovery validates management records and resource content independently. A
damaged selected generation is unavailable until a verified version is chosen or
repaired; it does not silently become another version. A corrupt newest management
record falls back to an earlier verified record and reports that version/removal
choices may have rolled back. If all records are damaged or the newest revision
conflicts, normal changes are blocked and an explicit reviewed rebuild is needed.
Previously removed resources may reappear after that rebuild. Unknown directories
are untouched, and interrupted staging is listed for subsequent recovery work.

Reinstallation reuses only a valid stored manifest and content, including their
actual metadata. If the canonical generation is damaged, preparation promotes a
fresh `-r-` repair generation while retaining the damaged original. A valid repair
is reusable on the next reinstall. Generation directory prefixes bind to their
content hash. Factory storage paths permit only these generations, owned staging
directories and management snapshots inside the existing resource root.

Management is reachable from additional-resource cards and Storage. Users can
review retained versions and source notices, explicitly select a version, remove
or restore, reinstall a pinned publisher resource, or reopen local import for
repair. A changed reviewed catalogue fingerprint is shown against the current
source before its install action; arbitrary publisher changes still fail checks.
All storage mutations share the installer queue. Reader providers refresh after
version changes, and stale asynchronous edition/provider loads cannot replace a
newer selection. Two direct controller regressions prove those races.

`scripts/verify-module-management.mjs` uses real KJV source records in a temporary
filesystem. Local citations create two reviewed generations without changing
publisher wording/version metadata. It proves older selection after restart,
remove/restore, fresh repair with the damaged copy retained, failure rollback,
31,102 reopened source records and unchanged original input. Synthetic regressions
cover default-protection timing, corrupt management recovery, no automatic orphan
activation, failed management writes, manifest repair and idempotent repair reuse.
Removing the final protection callback temporarily made its regression fail.

Native macOS evidence now covers older selection/reload, removal/restore, default
protection, damaged-copy-preserving repair, failed-save rollback/retry, prepared
recovery, measured Trash cleanup and actual Cancel/reload/resume. Exact boundaries
are in `docs/specs/native-acceptance-2026-11-18.md`. Native source-changing updates,
failed-transfer rollback, adapter rename durability, vault-sync conflicts and the
remaining platform/runtime matrix still need release evidence. This supersedes
decision 0010's timestamp-based selection follow-up without marking the full
management goal complete.

## Shutdown cancellation

The installer is single-use for one plugin lifecycle. Shutdown rejects new or
queued management/storage work and local previews. A lifecycle AbortSignal reaches
version selection, removal, restore, management reconstruction and staged recovery.
Existing transaction checks refuse an uncommitted management promotion after the
signal aborts; owned transient stages are rolled back and prior choices remain.
Local preparation checks lifecycle state before and after WASM initialization and
before publishing a review ticket. A stale modal therefore cannot start a new
review against an unloaded service. Read-only retained-content access stays read-only.

Cancellation cannot reverse a rename already submitted to the filesystem. An
operation committed at that boundary remains a normal retained, reviewable change.
Regressions hold a management verification read across shutdown, recreate a new
service and verify that the original active generation and source note remain.
Queued removal and post-shutdown/late-WASM previews have independent regressions.
