# Spec: Authorized, reversible MySword Bible import

**Status:** Proposed for review

**Date:** 2026-11-15

**Scope:** Phase 3 Tasks 6–8; only Task 6 (the contract) is covered by this document.

## Objective

Define the safety and data contract that must exist before SwordDock Bible can write an imported module. The first eligible writer will accept only a user-selected, unencrypted `.bbl.mybible` Bible that passes the existing bounded SQLite inspection and every gate below. The import must remain local, opt-in, integrity-verifiable, reversible, and separate from the plugin installation.

This specification does not authorize a writer. `.cmt.mybible`, `.dct.mybible`, `.bok.mybible`, and `.jor.mybible` remain unsupported for writing until each has an evidence-backed schema and semantic specification. Inspection support may be added independently, but it must not be described as import support.

### Users and outcomes

- A user with a module they are authorized to use can inspect an exact preview and understand every blocker before any write.
- A successful future import cannot overwrite the shipped WEB library, plugin code, settings, notes, or another imported module.
- An interrupted or failed import leaves the previously active library usable and leaves, at worst, an inert staging directory that can be safely identified and cleaned up.
- Every installed module can be traced to its source hash, the parser/converter version, an explicit local rights acknowledgement, and hashes of all installed files.
- A module can be deactivated and quarantined without immediately destroying its data; permanent deletion is a separate explicit action.

## Assumptions

1. Initial writable scope is the 66-book Protestant canon already represented by SwordDock's canonical map. Alternate canons and custom `VerseRules` stay blocked.
2. The selected source is a local file. Import never fetches a URL and never uploads module content or provenance.
3. The user, not SwordDock, is responsible for establishing permission. SwordDock records an acknowledgement but does not provide legal clearance.
4. The source SQLite file is not copied by default. Its base filename, byte length, SHA-256, and user-entered provenance are recorded; its absolute path is not.
5. Imported content is stored under the vault configuration directory but outside `.obsidian/plugins/versedock/`, so a normal plugin upgrade cannot replace it.
6. The current 24 MiB source-file, 100,000-row, and 32,768-character-per-Scripture limits remain hard gates unless a later accepted ADR changes them with performance evidence.

## Capability boundaries

| Capability | Responsibility | Depends on | Initial state |
|---|---|---|---|
| `import-preview` | Read-only validation, semantic coverage, rights form, exact change summary | Existing inspector and semantic IR | Task 7 |
| `import-package` | Deterministic normalized files and integrity manifest in memory/staging | `import-preview` approval | Task 8, disabled |
| `module-store` | Staging, commit, discovery, verification, quarantine, recovery | Accepted storage ADR | Task 8, disabled |
| `module-activation` | Choose an integrity-verified module without damaging settings or shipped WEB | `module-store` | Later vertical slice |

Build order: `import-preview` → `import-package` → `module-store` → `module-activation`. A writer must not bypass the preview contract.

## Eligibility gates

All gates are conjunctive. A failing or unknown result blocks the write and remains visible in the preview.

### Format and resource gates

- Base filename ends in `.bbl.mybible`; extension alone is never trusted.
- SQLite magic bytes, integrity check, required `Details`/`Bible` tables, required columns, row types, duplicate detection, and record bounds pass the existing production inspector.
- Source size is at most 24 MiB; Bible rows are at most 100,000; each Scripture value is at most 32,768 Unicode code points.
- The module is unencrypted and uncompressed. Renamed ZIP/encrypted/proprietary containers are refused.
- Every string written to JSON is valid Unicode without NUL or unpaired-surrogate code units. Text is not Unicode-normalized.
- The generated package is at most 96 MiB and contains at most 70 files for the initial Bible layout. Crossing either bound aborts before commit.
- The initial writer requires all 66 canonical book numbers and exact canonical chapter counts. Partial Bibles remain preview-only.

### Fidelity and semantic gates

- Every source Scripture value round-trips through the lexical and semantic layers exactly by UTF-16 span and raw string.
- Every markup-bearing verse is `fullyInterpreted`, lossless, balanced, within nesting limits, and has zero opaque events.
- Module `CustomCSS`, `VerseRules`, right-to-left mode, Strong's/interlinear markers, unknown HTML, unsupported escapes/entities, alternate canon rows, invalid chapters, and unresolved RX markers block the initial writer.
- Empty verses are listed for review and require an edition-specific accepted fixture before they may be written.
- Parsed RX coordinates are not activated as links until the edition's published versification is verified.
- Conversion never strips a token, executes module SQL/regex/CSS/HTML, follows a link, or rewrites Scripture punctuation, whitespace, casing, or Unicode.

### Rights and provenance gates

The preview requires an explicit, unchecked-by-default acknowledgement immediately before a future write:

> I confirm that I have permission to store and use this module in this vault. I understand that SwordDock Bible has not verified its copyright, license, provenance, or redistribution rights.

The user must choose one `rightsBasis`:

- `public-domain`
- `explicit-license`
- `personal-use-permission`
- `other-written-permission`

`unknown`, a blank value, or module metadata alone cannot satisfy the gate. `explicit-license` and `other-written-permission` require a bounded local note or source citation. SwordDock stores the acknowledgement locally and never transmits it.

The acknowledgement applies only to local storage/use. It does not authorize redistribution, packaging, sync, publication, or sharing. The preview warns that `.obsidian` content may be included by third-party sync, backup, or Git tools.

## Storage contract

The proposed storage root is:

```text
<vault-config>/versedock/modules/v1/
  installed/<module-id>/
    manifest.json
    manifest.sha256
    books/*.json
  staging/<transaction-id>/
    transaction.json
  quarantine/<module-id>--<transaction-id>/
```

For the normal configuration directory this resolves to `.obsidian/versedock/modules/v1/`. It is deliberately outside `.obsidian/plugins/versedock/` and outside the Markdown note tree.

### Identifier and path rules

- `module-id` is generated from the module type plus the full captured source-byte SHA-256, for example `bible-<64 lowercase hex characters>`. It never contains a source filename or user-entered value. The normalized-content hash remains a separate manifest field.
- `transaction-id` is generated internally from cryptographically random bytes and uses lowercase hexadecimal only.
- Every operation resolves the target path, verifies it is a descendant at least one level below the fixed storage root, and verifies the manifest/transaction ownership marker before rename, quarantine, or cleanup.
- Symlinks are not valid module entries. A symlink anywhere in an operated path causes refusal.
- If the platform adapter cannot prove canonical containment and no-symlink behavior, write, quarantine and permanent-delete operations remain unavailable on that platform; there is no weaker fallback.
- The shipped `library/webp` tree, plugin code, `data.json`, and vault notes are never writer targets.

### Normalized Bible layout

The first package uses one deterministic UTF-8 JSON file per present canonical book plus the manifest and its hash. JSON object keys, book order, chapter order, verse order, and newline policy are fixed by the converter. Scripture strings remain exact JavaScript strings from the validated source; semantic metadata is additive and cannot replace `raw`.

The original SQLite bytes are not stored unless a future separately approved export/archive feature defines retention, encryption, and deletion behavior.

## Transaction and rollback contract

1. **Prepare in memory:** inspect, calculate hashes/counts, validate rights fields, and create an immutable import plan. No filesystem write occurs.
2. **Stage:** create a new internally named staging directory under the fixed root. Write a bounded `transaction.json` ownership marker first, then normalized files, then `manifest.json`, then `manifest.sha256` last. The marker contains only schema version, transaction ID and intended module ID.
3. **Read-back verification:** reopen every staged file, enforce byte counts and SHA-256 values, validate the manifest schema, and re-count books/chapters/verses.
4. **Commit:** rename the verified staging directory to its content-addressed installed path. Commit never replaces an existing different directory. The same full source hash is an idempotent already-installed result and does not mutate the existing provenance record. Correcting provenance is a separately specified metadata operation or a quarantine-and-reimport flow. Copy-and-delete is not an atomic-commit fallback; a platform whose adapter rename semantics are unverified remains write-ineligible.
5. **Activate separately:** update the small active-module setting only after installed integrity verification succeeds. If settings persistence fails, the module remains installed but inactive; the previously active module remains selected.
6. **Recover:** on startup, ignore staging directories. Offer cleanup only for owned, structurally valid staging entries. Never treat staging as installed content.
7. **Rollback/deactivate:** switch activation back to the last integrity-verified module. No installed files are changed.
8. **Remove:** first rename an inactive installed directory to quarantine, then update discovery/activation state. Permanent deletion is a separate explicit confirmation and revalidates root, depth, no-symlink, and ownership evidence immediately before deletion.

There is no overwrite-in-place, recursive cleanup fallback, or automatic deletion of an unknown path. A failed cleanup reports the inert path and stops.

## Integrity manifest

`manifest.json` is deterministic for an immutable authorized import plan and contains only allowlisted fields. The plan captures its acknowledgement/import timestamps once before staging; retrying the same plan cannot generate new timestamps:

```ts
interface ImportedBibleManifestV1 {
  schemaVersion: 1;
  moduleId: `bible-${string}`;
  moduleType: "bible";
  title: string;
  abbreviation: string;
  language: string | null;
  edition: string | null;
  canon: "protestant-66";
  source: {
    format: "mysword-bbl-sqlite";
    filename: string;
    bytes: number;
    sha256: string;
  };
  provenance: {
    rightsBasis: "public-domain" | "explicit-license" |
      "personal-use-permission" | "other-written-permission";
    citation: string | null;
    acknowledgementVersion: 1;
    acknowledgedAt: string;
  };
  conversion: {
    swordDockVersion: string;
    converterVersion: 1;
    semanticVersion: 1;
    importedAt: string;
  };
  coverage: {
    books: number;
    chapters: number;
    verses: number;
    emptyVerses: number;
    markupVerses: number;
    semanticReadyMarkupVerses: number;
    opaqueEvents: 0;
  };
  files: Array<{
    path: `books/${CanonicalBookCode}.json`;
    bytes: number;
    sha256: string;
    chapters: number;
    verses: number;
  }>;
  normalizedContentSha256: string;
}
```

All free text has explicit implementation limits: title 200 code points, abbreviation 32, language/edition 100, source base filename 255, and provenance citation 2,000. Control characters except tab/newline in the citation are rejected. Absolute source paths, device identifiers, usernames, and note content are not recorded.

`CanonicalBookCode` is the existing fixed 66-book VPL code allowlist. Folder location determines staging/installed/quarantine lifecycle; an untrusted manifest field never asserts its own filesystem state.

`manifest.sha256` contains the SHA-256 of the exact `manifest.json` bytes. This detects corruption only; it is not a digital signature and makes no authenticity claim. A module is usable only after the sidecar, manifest, each file hash/length, and structural counts pass verification.

`normalizedContentSha256` is the SHA-256 of a deterministic UTF-8 digest list ordered by file path. Each line contains the relative path, byte length and file SHA-256 separated by tabs and terminated by `\n`. It covers normalized book content without creating a manifest self-hash cycle.

## Privacy and retention

Module text and ordinary metadata are local content, not telemetry. A provenance citation can contain personal information if a user enters it, so the UI must tell users not to include private correspondence or unnecessary personal details. Its sole purpose is the local permission audit trail.

The citation and acknowledgement remain only inside the module manifest while installed or quarantined. They are never logged, indexed into Scripture search, copied to notes, or transmitted. Permanent module deletion removes them with the owned quarantine directory; application diagnostics retain only non-content error codes and counts.

## Import preview contract

Task 7 may implement only a read-only preview. It must display:

- source base filename, byte length, SHA-256, module metadata, books/chapters/verses, and elapsed inspection time;
- semantic coverage and every blocker, including representative references without Scripture text in logs;
- the exact storage root and estimated generated size/file count;
- the rights-basis fields and acknowledgement, visibly incomplete until the user supplies them;
- a statement that preview creates no module and that passing technical checks is not legal clearance;
- a machine-readable `eligibleForWrite: false` until every technical, semantic, versification, performance, GUI, and rights gate required by this spec has evidence.

Task 7 must not create staging directories, persist the acknowledgement, add an Import button that writes, or advertise other module types as supported.

## Threat model and abuse cases

| Threat | Abuse case | Required control |
|---|---|---|
| Spoofing | Module metadata claims a trusted publisher/license | Never infer rights or authenticity; record source hash and user acknowledgement |
| Tampering | Source or staged file changes during import | Hash input, generate from captured bytes, read back every staged file, content-addressed ID |
| Repudiation | User cannot tell why a module was installed | Local acknowledgement version/time, import version, source hash, deterministic plan/manifest |
| Information disclosure | Absolute path/user identity leaks into manifests or logs | Store base filename only; no telemetry/upload; redact Scripture from diagnostics |
| Denial of service | Huge SQLite/text/expansion exhausts memory or disk | Existing source/row/text bounds plus generated-size/file bounds and abort-before-commit |
| Elevation/path escape | Crafted filename or manifest targets vault files | Generated IDs, fixed root, canonical-path/depth checks, symlink refusal, ownership evidence |

Additional required negative tests include path traversal strings, symlink targets, manifest field overflow, hash mismatch, partial writes, duplicate commit, settings-save failure, quarantine failure, malicious HTML/CSS/regex, malformed Unicode, and simulated restart with orphan staging.

Ownership markers are defense in depth, not proof against another local process that can edit the vault. Cleanup is never automatic. The initial writer may quarantine an owned inactive module but does not implement permanent deletion; that destructive action requires a later security review and explicit UI approval.

## Technology and commands

- TypeScript 5.9, Obsidian API 1.14 types, sql.js 1.16, Vitest 4.1; no new dependency is approved by this spec.
- Build and full verification: `npm run check`
- Focused future tests: `npx vitest run tests/mysword-import-preview.test.ts tests/module-store.test.ts`
- Dependency audit: `npm audit --json`
- Real-file read-only QA: `npm run qa:mysword -- /absolute/path/module.bbl.mybible`
- Package and smoke test: `npm run package:preview && npm run smoke:preview`

## Project structure and style

Future implementation should keep pure validation/planning in `src/core/`, filesystem orchestration behind a narrow adapter in `src/core/module-store.ts`, Obsidian UI in `src/ui/`, and synthetic fixtures/tests in `tests/`. No core validator imports Obsidian UI types.

Use discriminated unions for plan outcomes and explicit immutable data. For example:

```ts
type ImportEligibility =
  | {status: "blocked"; blockers: readonly ImportBlocker[]}
  | {status: "preview-ready"; plan: Readonly<AuthorizedImportPlan>};
```

Do not represent a blocked result with optional fields that a caller can accidentally ignore.

## Testing strategy

- Pure unit tests for bounded provenance fields, deterministic IDs/manifests, eligibility, and path-policy functions.
- In-memory SQLite integration tests for malformed schemas, semantic blockers, exact source preservation, and deterministic planning.
- Temporary-directory module-store tests for read-back verification, interruption, idempotency, rollback, quarantine, symlink/path escape, and restart recovery.
- Existing full publisher WEB fixture remains read-only corpus evidence; it cannot become an import fixture merely because its technical scan succeeds.
- Disposable-vault GUI tests verify focus order, disabled/write-free preview states, screen-reader labels, light/dark rendering, and unchanged prior library after simulated failures.
- Mutation checks must prove eligibility is conjunctive, hash mismatches block activation, and path/ownership checks cannot be removed unnoticed.

## Boundaries

### Always

- Treat source bytes, SQLite values, module metadata, manifests, paths, and semantic events as untrusted.
- Preserve exact Scripture source and make blockers visible.
- Keep preview read-only until every gate is implemented and tested.
- Verify installed integrity before activation and after restart.
- Keep the stable plugin ID `versedock` and migrate existing settings compatibly.

### Ask first

- Enable a writer or destructive permanent-delete action.
- Change the storage root, resource limits, canon scope, or acknowledgement wording.
- Add a dependency, network acquisition, source-file retention, alternate-canon mapping, or HTML/CSS/VerseRules subset.
- Publish or redistribute an imported module or claim legal/authenticity verification.

### Never

- Write merely because technical inspection passed.
- Derive a filesystem path from a filename, title, abbreviation, or other user/module string.
- Overwrite plugin assets, notes, settings, the shipped WEB library, or an installed module.
- Execute imported HTML, CSS, SQL, regex, scripts, links, or commands.
- Log Scripture text, absolute source paths, acknowledgement text, or other sensitive local data.
- Claim that hashes prove publisher authenticity or that an acknowledgement proves legal rights.

## Success criteria for Task 6

- Provenance and rights fields, acknowledgement language, and non-claims are explicit and bounded.
- Storage root, deterministic identifiers, normalized layout, staging, commit, activation, rollback, quarantine, and permanent-deletion boundaries are specified.
- Integrity metadata and corruption/authenticity limits are defined.
- Initial format/canon/semantic/resource gates and unsupported module types are unambiguous.
- Threat model, negative tests, commands, project boundaries, and writer-enablement gates are reviewable.
- The storage ADR is accepted before Task 7 planning; this spec is approved before any writer implementation.

## Open questions requiring review

1. Is `.obsidian/versedock/modules/v1/` the preferred user-data root, accepting that third-party sync/backup tools may include it?
2. Are the four `rightsBasis` choices and acknowledgement wording sufficient, or should legal review change them before any writer UI exists?
3. Should permanent deletion require typing the module abbreviation, or is a standard explicit confirmation sufficient?
4. The 96 MiB generated-package cap is conservative but not yet benchmarked on mobile; it remains a blocker for writer enablement until measured.
