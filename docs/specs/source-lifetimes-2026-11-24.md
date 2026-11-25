# Source generations and UI operation lifetimes

Date: November 24, 2026. Development runs on Nana’s Mac mini.

Search previously watched only the selected edition ID. Replacing that edition’s
stored generation left whole-Bible results from the old resource beside a new
source heading. It now watches the Bible resource instance as well as the edition
ID, reusing the existing query, match/scope and cancellation path. Unrelated
notifications leave the input/results alone. Short queries also clear aria-busy
when they cancel an older search.

Quick Jump/Insert now subscribes to source-instance changes while open. A changed
source refreshes the existing reference preview and edition hint, increments its
revision and invalidates an old pending insertion. Each asynchronous preview uses
one captured Bible for text and metadata. Closing removes the subscription. The
existing original-editor/selection protection and clipboard fallback remain.
A fresh insertion after reviewing the updated preview still succeeds.

Library now uses actual measured bytes/files/missing counts for its storage result,
so a surviving KJV, dictionary, companion or imported resource remains visible
when WEB/cross-reference/commentary metadata is unavailable. A recheck’s final
notice/render belongs to the opening that requested it; closing/reopening the
view invalidates the old UI continuation. Read-only resource checks may finish.

Storage cleanup/recovery keeps its authorized operation but refreshes review only
when the initiating dialog revision is still current. Finishing an older operation
cannot start another review after close or overwrite a newly opened review.
Current operation completion still refreshes its report and status.

Twenty new unit cases pass; fourteen fail on the old code. Six targeted mutations
reintroduce each defect and fail the expected cases, with exact source restoration.
Logs and pre-change production snapshots: .research/platform-mini/source-lifetimes.
The first strict check caught a missing typed WorkspaceLeaf argument in the fake
MarkdownView constructor; that fixture is corrected and the earlier log retained.

Eight browser baseline flows reproduce stale Search, stale Quick Insert writing
to a fake editor, stuck busy status, hidden partial storage, closed/reopened Library
refresh and closed storage follow-up. Twenty-two corrected cases pass at 1100/390
x 950. The actual ImportedBibleResource decodes/searches two controlled generations
of one edition ID. Production Search/Library/Reference/Storage classes use controlled
Obsidian, fake-editor and storage-task boundaries. No real notes, Trash moves or
native UI are involved. These fixtures do not establish native update acceptance.

Page identity, meaningful content, overlay absence, clean console, interaction
outcomes, screenshots and absence of page overflow are checked. The Browser plugin
is unavailable; connected mini1 Playwright is used. Fixture/evidence/screenshots:
/Users/nanabee_home/Documents/obsidian_vaults/my-plugins/.sworddock-qa/source-lifetimes-2026-11-24.
The owned QA server is stopped and port 56060 verified closed.

Focused five-axis review: provider identity extends the existing source-change and
revision/cancellation paths; it does not create a second search or insertion API.
Reference input and editor snapshots remain stable. Listener cleanup and opening/
revision checks keep UI continuation ownership local. Measurements are reported
from all resource types, with explicit zero/missing handling. No dependencies,
persistence formats, permission prompts or new external-data paths are introduced.
Read-only checks and already authorized storage operations may finish after closing;
the old UI cannot start follow-up review. No further blocking finding is identified
in this focused change. Complete CSS/script/test/evidence and native release review
remain open even though all 107 production TS files have received source inspection.

Current full checks/package fingerprints are recorded in the platform reports and
STATUS.md. This checkpoint does not complete native source-update/failure, theme,
platform, assistive or slower-device acceptance.
