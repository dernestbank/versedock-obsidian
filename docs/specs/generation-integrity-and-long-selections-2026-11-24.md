# Retained Bible integrity and long selections

Date: November 24, 2026. Development and verification run on Nana’s Mac mini.

An imported Bible resource can remain open after another stored version becomes
current. Its integrity callback previously checked the current version by module
ID, even though its displayed text and metadata still belonged to the retained
version. It now verifies the captured generation directory through the existing
validated readVersion operation. A removed generation reports an integrity issue.
No source format, selected version or cache ownership contract changes.

Reader could extend a same-chapter selection to all 176 verses of Psalm 119, but
parsing rejected ranges longer than 101 verses. History discarded the selection
immediately and stored bookmarks/highlights could not match it. Parsing now uses
the existing ascending 1–200 coordinate bounds consistently. Passage availability
still belongs to the selected Bible; this change does not invent missing verses.
Reversed ranges and endpoints above 200 remain invalid.

Seven new regression/compatibility cases cover both integrity directions, saved
selection restoration, bookmark/highlight membership, history and invalid bounds.
Five fail before the fixes. Reintroducing each defect fails its intended tests;
source bytes are restored exactly. Evidence and logs are retained under
.research/platform-mini/generation-integrity and reference-persistence.

The real pinned 31,102-entry KJV SQLite source also passes: two generated versions
retain their own provenance, damage to the displayed version is detected, and
damage only to the newly selected version does not falsely indict the retained
one. The full Psalm 119 selection restores, returns 176 ordered verses, remains in
history and matches its final bookmarked verse. All mutations occur in generated
copies in an owned temporary directory; the input source hash stays unchanged.

Focused five-axis review: the callback binds verification to the same generation
as metadata/text, reuses existing ownership/hash validation and adds no new path
input. Reference parsing keeps bounded coordinates and same-chapter semantics;
existing history size/scan bounds remain. No dependency, API or persistence-format
migration is introduced. The changes add no read-time work beyond an explicit
integrity operation, and allow at most 200 coordinates per parsed range.
Tests exercise real service/promotion code with an in-memory store; the real-corpus
check uses actual temporary files and SQL.js. Neither is native Obsidian proof.
No other blocking finding was identified in this focused change review. The
accumulated source/CSS/script/evidence release review remains incomplete.

Full check, Linux runtime and package results are recorded in the current
.research/platform-mini/report.json, .research/platform-linux/report.json and
STATUS.md after verification. Native Mini/theme/assistive/device and exact final
ZIP acceptance remain separate open gates; no release completion is claimed.
