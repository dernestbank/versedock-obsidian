# Comparison history and deferred Resources opening

Date: November 24, 2026. Development runs on Nana’s Mac mini.

Comparison chapter navigation was local when unlinked or pinned, but its Back and
Forward controls operated Reader history. Clicking Back left Comparison unchanged
and could move Reader elsewhere. Comparison now owns transient back/forward stacks
for its chapter, followed-link and pinned-word passage changes. Own-link echoes
and equivalent references do not add duplicates. New navigation clears the forward
branch; restoring view state starts a new history. The most recent 100 transitions
are retained. Only its existing following mode publishes Comparison-origin history
navigation; independent modes leave Reader unchanged. Edition choice stays local.
History remains transient; the existing native view state retains the current
passage and editions across restart. No new settings format is introduced.

openResources previously inspected leaf.view immediately after revealing the leaf.
An existing deferred leaf could still hold its placeholder, losing the requested
module selection. It now awaits loadIfDeferred before checking the Resources view,
matching the existing Reader and Inspector opening pattern. Without a target it
preserves the current module; unknown module handling remains in ResourcesView.

Twelve unit cases pass, including seven original failing cases. Three targeted
mutations fail the intended tests and exact source bytes are restored. Logs and
pre-change snapshots: .research/platform-mini/comparison-navigation.

Eight rendered cases pass at 1100/390 x 900. The real plugin opening method and
Comparison/Resources classes run with controlled content and Obsidian host shims;
WordDetails is stubbed. Before: Next moved Comparison to John 4, Back kept it there
and moved Reader from John 3:16 to John 1:1; requested Resources stayed unopened.
After: Next/Back/Forward and branch changes work in all three modes, Reader stays
at John 3:16 while independent, own-link echoes create no duplicate, and the cold
Resources action displays QA Book with its first entry. No console errors/warnings
or horizontal page overflow occur in these fixtures. Page identity, nonblank
content, absence of framework overlays and screenshots support the scoped claim.
The Browser plugin/skill is unavailable; connected mini1 Playwright is used.
Fixture source, before/after evidence and screenshots are outside the project:
/Users/nanabee_home/Documents/obsidian_vaults/my-plugins/.sworddock-qa/comparison-navigation-2026-11-24.

Focused five-axis review found no further blocking issue in these changes.
Local history follows the view’s existing reference and publication ownership;
reusing canonical reference IDs avoids duplicate entries. Stacks are bounded and
navigation is synchronous; no new dependency or external data path is introduced.
The Resources change uses the existing Obsidian lifecycle operation instead of
assuming a placeholder is already loaded. The fake-host tests and rendered fixture
do not prove actual native deferred behavior, theme, accessibility or device QA.

Current full Mini/Linux/package results are recorded in the platform reports and
STATUS.md. The broader source review and native release acceptance remain open.
