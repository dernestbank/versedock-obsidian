# Native Focus restoration and bounded note previews

Date: 2026-11-16. Status: accepted for the local development candidate.

Focus needs to provide a quiet Reader while respecting the user's Obsidian layout. `FocusDockSession` records only the native left/right collapse flags. It never closes, replaces or moves leaves. Entering Focus on a central Reader collapses both docks; leaving Reader or exiting Focus restores their independent flags. Returning to Reader captures the current flags again. The saved snapshot supports reload recovery. Unload restores the workspace without discarding that recovery state. A Reader inside a dock does not collapse its own parent. All mode entry points use the controller transition.

Escape checks both current focus and the original event path. Obsidian can dismiss a dialog and restore focus before the Reader listener runs; relying on activeElement alone would also exit Focus. Dialogs, inputs and plugin popovers keep their own Escape behavior.

Note discovery continues to use frontmatter and resolved backlinks. A displayed card may read a Markdown excerpt after discovery: at most three cards in Study and five in Notes, with a 256 KiB pre-read file cap, a 16 KiB extraction window and 180 code points plus ellipsis. Frontmatter, code, quotations and embeds are omitted; output is plain text. Large, missing, unreadable and empty notes receive explicit states. No renderer, network lookup or note mutation is involved. Relevant metadata events debounce card refresh; closing the Inspector removes listeners and timers. New study notes record the selected Bible edition without migrating existing files.

Validation includes six pure dock-session cases, seven preview/extraction cases, edition attribution, strict TypeScript and native Obsidian checks for reload restoration, switching files, dialog Escape isolation, live note edits, ordinary Markdown opening/reuse and fixture removal. See `design-qa.md` for evidence and visual limitations.
