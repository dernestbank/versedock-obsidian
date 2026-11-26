# ADR-001: Store imported modules outside the plugin installation

## Status

Proposed

## Date

2026-11-15

## Context

SwordDock's shipped WEB data currently lives under `.obsidian/plugins/versedock/library/webp`. That location is appropriate for immutable release assets, but user-imported modules must survive ordinary plugin upgrades and must never be overwritten by extracting a new release ZIP. Large imported content also does not belong in `data.json`, and writing it into the Markdown note tree would expose generated files as notes and make vault workflows noisier.

The store must support bounded staging, integrity verification, activation independent from commit, recovery after interruption, and reversible removal. Paths derived from untrusted module metadata are unacceptable.

## Decision

Use `.obsidian/versedock/modules/v1/` (more generally `<vault-config>/versedock/modules/v1/`) as the root for future user-imported module data.

- Installed modules use content-addressed, application-generated IDs under `installed/`.
- New packages are written and read-back verified under `staging/`, then renamed into `installed/` without replacement.
- Removal first renames an inactive module into `quarantine/`; permanent deletion is separate and explicit.
- The shipped WEB library remains under the plugin installation and is never a target of the importer.
- `data.json` stores only small settings such as the active module ID, not module content or the authoritative installed registry.
- Each installed directory is self-describing through a deterministic manifest and integrity sidecar. Discovery scans owned manifests rather than trusting an unverified central path list.

This decision establishes a root and lifecycle, not writer authorization. The writer remains unavailable until the proposed import specification is approved and implemented with its tests and gates.

## Alternatives considered

### `.obsidian/plugins/versedock/library/imported/`

- Advantage: matches the current shipped-library lookup and keeps all plugin files together.
- Rejected: plugin upgrades, manual ZIP extraction, or uninstall can replace/delete user imports; release assets and user data have different lifecycles.

### Vault-root `.sworddock/` or `SwordDock Modules/`

- Advantage: visible and likely included in general vault sync/backup.
- Rejected: generated data pollutes the Markdown content namespace, may be indexed as notes, and makes accidental editing more likely.

### Store normalized content in `data.json`

- Advantage: uses Obsidian's standard plugin settings API.
- Rejected: multi-megabyte content makes settings writes fragile, couples annotations/settings to module transactions, and provides no practical per-file verification or quarantine.

### Keep only the source SQLite file and query it in place

- Advantage: avoids conversion output and preserves source bytes.
- Rejected: the original location may disappear, arbitrary SQLite stays on the hot read path, semantic eligibility cannot be frozen, and imported behavior would depend on mutable external files.

## Consequences

- Plugin updates and imported data have separate paths and lifecycles.
- Uninstalling the plugin may leave user-imported data behind; the UI and documentation must provide an explicit, safe cleanup path.
- Third-party Obsidian Sync, Git, cloud backup, or device policies may include or exclude `.obsidian` content. The UI must warn users and cannot promise sync behavior.
- Storage operations need canonical-path, depth, no-symlink, and ownership checks immediately before rename/quarantine/delete.
- Mobile support cannot be claimed until the adapter behavior, rename semantics, capacity, and performance are tested on actual devices.
- A future root migration requires a new ADR and an explicit, reversible migration; changing this path silently is not allowed.
