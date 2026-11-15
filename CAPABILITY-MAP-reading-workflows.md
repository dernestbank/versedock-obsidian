# Capability Map: Offline Reading Workflows

Status: **Proposed for review**  
Date: 2026-11-15

## Assumptions to confirm

1. The first release uses only immutable plans bundled with SwordDock; it does not download, import or generate plans.
2. Plan progress is small plugin-setting data under the existing stable `versedock` ID; it does not modify Bible resources or create vault notes.
3. Opening a reading never marks it complete. Completion requires an explicit user action.
4. Resetting progress is destructive and must use a separate confirmation flow; it is not part of the first implementation slice.
5. Scheduling, reminders, streaks, cloud sync semantics, custom plans and multi-device conflict resolution remain out of scope until the local workflow is verified.
6. A plan day may contain multiple canonical Scripture references so chapter-spanning readings do not require a new reference grammar.

## Modules

| Module id | Responsibility | Depends on |
|---|---|---|
| `reading-plan-catalog` | Define, validate and expose a small immutable catalog of bundled plans and their canonical daily readings. No settings, UI, network or filesystem writes. | — |
| `reading-plan-progress` | Normalize and update bounded per-plan progress in existing plugin settings while preserving all legacy settings and failing closed for unknown plans, invalid days and oversized edited data. | `reading-plan-catalog` |
| `study-session` | Present plan selection, start/resume state, daily readings, passage navigation, explicit day completion and truthful plan-complete states in Obsidian. | `reading-plan-progress` |

Build order: `reading-plan-catalog` → `reading-plan-progress` → `study-session`.

## Boundary contracts

- `reading-plan-catalog` provides stable plan IDs and validated, immutable canonical readings. Downstream modules never trust persisted labels or reading definitions.
- `reading-plan-progress` persists only stable plan IDs and bounded progress coordinates; it resolves all display content through the catalog.
- `study-session` requests progress transitions through the controller and never mutates settings directly.
- Every module remains offline and dependency-free. None interacts with MySword import, module storage, rights acknowledgement or external content.

## Proposed first vertical slice

Ship one short bundled plan through all three modules: catalog validation, migration-safe progress, Inspector start/resume navigation, and explicit completion. Additional plans reuse the same contract only after that complete path is verified.

## Approval gate

Approve or revise the module boundaries, build order and assumptions above before a module specification or implementation plan is written.
