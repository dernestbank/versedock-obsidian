# Local word study in Parallel Compare

Date: 2026-11-16. Status: implemented and verified in the native test vault.

The supplied Parallel Translations concept includes tagged-word details beneath the two Bibles. Comparison previously rendered plain text, even for the installed tagged KJV. Reuse the Reader's word panel with an explicit local action context instead of sending a comparison word through the Reader's global selection API.

Only a KJV source token with a Strong's identifier can start this flow. WEB remains untagged. Hover previews the local footer; click or Enter pins a word without moving focus, navigating the Reader, changing its edition, or publishing a cross-edition verse-link event. Comparison keeps its own selected coordinate and transient word state. Chapter changes or removing KJV from both comparison panes clear that state. Reload retains editions/passage, but not the transient word pin.

Local Lexicon opens a contextual read-only word-study modal. It uses the selected token's KJV coordinates and the existing offline dictionary/occurrence providers. Closing the modal cancels its occurrence work. Reader word study continues to use its existing global Inspector route. Source verse numbering is never remapped to make word selection match another edition.

Four policy tests cover edition gating, source coordinates, untagged tokens and invalid token indices. Inverting the edition gate makes the focused suite fail. Existing state tests cover preview/pin stability and clearing.

Native verification pinned John 3:16 “loved”, moved Right and Enter to “the world”, opened both dictionary links in local Lexicon and the full contextual modal, and paged G2889's 152 displayed tagged verses from 1–25 to 26–50. Closing the modal restored its launch-button focus. Unpin cleared the footer. Both-WEB showed no tagged controls; Read tagged KJV changed only Comparison's left edition. Changing chapters cleared the transient pin. Reader settings remained WEB / John.3.16 throughout these comparison actions. Source words are exposed inside labelled verse groups; this grouping was necessary for the native accessibility tree to expose the interactive text. The final desk was restored to KJV / John 3:16 with both docks open.

Saved evidence: `design-qa-comparison-word-study.jpg` and `design-qa-study-verified.jpg`. Hover behavior shares the already-tested Reader state model; native Comparison pointer preview and mobile-device presentation have not been separately verified.
