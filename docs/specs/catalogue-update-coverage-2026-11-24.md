# Catalogue update contract verification

Date: November 24, 2026. Development host: Nana’s Mac mini.

The requirement is an explicit reviewed-source update with retained versions and
rollback/restart safety. Previous unit coverage separated installation, version
selection and failures; it did not compose that changed-source flow end to end.
The new tests in tests/catalogue-updates.test.ts exercise the existing public
service and management callback with controlled source snapshots and real WASM,
SQLite, gzip and temporary filesystem operations. No new user-facing feature or
production policy change is needed.

The Obsidian DOM, catalogue lookup and downloader are controlled boundaries.
Source-page fragments label the fixtures as controlled QA; they do not describe
published older/newer vendor releases. The chosen synthetic download URLs are not
requested. No public transport, native rendering, actual publisher update, app
restart, screen reader or device performance is established by these tests.
The offline restart here creates a fresh service with downloads forbidden.

## Catalogue source-update contract coverage — November 24, 2026

Seven new existing-behavior tests compose controlled changed-source fingerprints,
the actual management modal callback, real SQLite/gzip normalization, installation
and a temporary filesystem. Catalogue pin changes alone preserve the chosen
edition after offline restart. The modal shows distinct current/reviewed source
hashes and a reviewed-source link before the explicit Install reviewed update
control publishes a new generation. Both generations remain readable; the exact
selected source persists through offline restart and explicit rollback/reselection.

Altered and stale artifacts fail without changing any prior stored byte. Active
update cancellation reaches the downloader signal and preserves the prior readable
selection. Management-save failure retains the prior selection and original bytes;
the new verified but uncommitted generation remains available without silently
activating on restart. All temporary stores are owned by the tests and removed.

The existing implementation passes. No production bug or behavioral RED is claimed:
initial setup failures came from the fixture’s unaccepted publisher-source URL.
The controlled source now respects the unchanged publisher-source validation;
its download function remains a stub and performs no public network request.
Three deliberate defects (missing update activation, omitted source-pin checks,
and a false current-source fingerprint in the review) fail the tests. Both
production files are restored exactly. No production source, UI styling, real
catalogue pin or dependency changed.

Full Mini/Linux **495-test / 71-file** checks, strict TypeScript and build pass.
Linux takes **79.797 seconds** with **1,691** unchanged inputs,
fingerprint `73752fcb9384e3bfd5073af46c3e2f38e911712621e28b4b633e014d2c5f51bc`.
Real six-source import/reopen, management and recovery also pass. Production stays
**394,340 bytes**, SHA-256
`27e1a4314441cde1437971301be88b2ea16238636ab8b40dce6dd381b49e19b1`.
All **1,475** entries of the existing **34,957,736-byte** ZIP match current project
bytes, retaining the prior two identical builds and clean-install/offline-restart
data smoke evidence. ZIP SHA-256:
`56c9f8db2c4c9c3840125a0d985ada10b12b2bd4b1bacf214aad84586dd61253`.
No redundant package or deployment run is claimed. The isolated test-vault core
files remain identical. HEAD and dependency lock remain unchanged.

The source/evidence audit now covers **19 of 71 test files plus the shared UI
fixture** (20 of 72 test/support files). Transaction, import, storage, loopback
transport, production filesystem guards and study-preparation boundaries were read
in full, along with prior focused UI-lifetime/rich-verifier cases. Test doubles and
source/runtime limits are explicit in the scoped review; no full evidence audit
or native acceptance follows from these counts. Production TS/CSS/scripts already
have source inspection; remaining test/evidence coverage and all open native/
source-update/failure/final ZIP/platform/theme/assistive/slower-device gates remain.
The Mini QA-only AppleScript exception is unanswered. No native UI, personal vault,
OS permission, commit, publication or permanent user-data deletion changed.
Development remains on the mini and the full completion goal stays active.
