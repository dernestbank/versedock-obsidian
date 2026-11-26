# SwordDock Bible UI design QA

## Installed reading modules — 2026-11-18

The new installer and Book/Devotional/Graphics readers were exercised in the
native isolated test vault. A three-module batch fetched publisher resources,
verified them, prepared normalized content and activated each offline. Book
navigation/bookmarks survived reload. Devotional morning/evening selection
resolved matching source entries and its explicit reflection action opened a
new Markdown note. Atlas thumbnails selected the expected map; the larger modal
rendered the embedded image, supported zoom/scroll/Fit, and restored launcher
focus on close. KJV remained at Proverbs 5:3 throughout the resource checks.
The existing Study Inspector tab was retained.

Evidence: `design-qa-installed-book.jpg`, `design-qa-installed-devotional.jpg`,
`design-qa-installed-atlas.jpg`, `design-qa-installed-atlas-large.jpg`. The tested
right dock is narrow; search/bookmarks are disclosed to preserve reading space,
and maps have an explicit larger viewer. This verifies the named desktop flows,
not arbitrary MySword formats or untested mobile-device behavior. See decision
0008 and the November 18 STATUS checkpoint for integrity tests and transport
cancellation limits.


## Current verified build — 2026-11-16

This entry supersedes the availability blocks and pending Comparison checks below. Native test-vault verification resumed successfully. The requested composition is implemented as independent Obsidian leaves: left navigation/resources, central Reader or Comparison, and right Study / Parallel / Notes with actual commentary, cross-references and Markdown notes. The Reader and Comparison each have a source-backed Word / Lexicon / Occurrences footer. The final native desk is saved in `design-qa-study-verified.jpg`; Comparison's populated footer is saved in `design-qa-comparison-word-study.jpg`.

Comparison keyboard QA changed both selectors and confirmed their source text, retained selector focus, and preserved the other pane's scroll position. Reload retained edition choices and an independently pinned Romans 14 passage while Reader remained on John 3:16. Romans 14 reported actual WEB-only coordinates 24–26; John 3 had no numbering warning. Narrow Comparison controls wrapped at roughly 400 CSS pixels in dark and light themes. Evidence: `design-qa-comparison-sources.jpg`, `design-qa-comparison-numbering.jpg`, `design-qa-comparison-light.jpg`, `design-qa-comparison-narrow.jpg`, `design-qa-comparison-narrow-light.jpg` and `design-qa-comparison-selection.jpg`.

Comparison word QA pinned John 3:16 “loved”, used Right / Enter to select the next tagged phrase, and opened its local Lexicon and full word-study modal. G2889 showed 152 matching displayed tagged verses; Next advanced 1–25 to 26–50. Modal Close returned focus to its launcher. Unpin cleared the footer; switching both sources to WEB removed tagged controls; Read tagged KJV changed only Comparison's left edition. A chapter change cleared the pin. Reader settings still read WEB / John.3.16 throughout these actions. Labelled verse groups now expose all tagged controls in the native accessibility tree. Finally Reader was restored to KJV / John 3:16, Compact, 17px / 1.68 / 65ch, dark theme and both docks open.

The implementation uses native interface typography, theme surfaces/accent, Obsidian icons and actual installed source content. It preserves the reference's three-column hierarchy and bottom details panel; the mockup's illustrative lexicon entries and commentary are not copied as data. This is verified desktop functionality and composition, not a pixel-identical reproduction. Exact reference viewport matching, mobile-device behavior and the future P2 Research preset remain outside this evidence. Latest automated gate: 221 tests across 33 files, strict TypeScript and production build.

## Dock correction — 2026-11-16

This section supersedes the earlier blanket acceptance below. The user's new reference is `/Users/user/.codex/attachments/8fcba22b-a4fa-441f-897d-a0867b9ebf2f/image-2.png` (1598 × 984). Native light/dark captures were returned inline by Computer Use from `test-vault`, approximately 2732 × 1682 Retina pixels; they were not saved to the older `design-qa-reader.png`. The current capture and reference have different content, theme settings and window proportions, so exact visual fidelity is not established.

Earlier P1 findings: no dedicated left navigation; right dock scattered resources across tabs; full-page Library/Comparison tools occupied vertically stacked right splits. Implemented fixes: native NavigationView; combined Study overview with Commentary, Cross-References and My Notes; center placement for full-page tools; state-preserving migration of older side leaves. Post-fix native evidence showed all three Study sections together at full right-dock height and the navigation rail at left. Search opened centrally while both docks remained present; Highlights opened its selected Inspector tab; Study Desk survived reload.

Fonts and typography retain native interface text and a serif Scripture column. Spacing now follows the reference's navigation/Reader/Study hierarchy, although the toolbar remains denser. Colors use theme surfaces and accent tokens and were inspected in both schemes. Icons use Obsidian's icon set. Content uses installed WEB and actual vault note metadata; absent commentary and lexical resources remain visible empty states.

Remaining verification: a same-size saved comparison, narrow dock clipping review (the native window capture cuts off part of the far-right edge), and the full requested content/tool functionality. These are not proven by the automated suite. The earlier assertion that no actionable findings remain does not apply to this revision.

Current dock correction final result: blocked

### Follow-up native check — 2026-11-16

#### Parallel controls and source numbering — native verification completed above

The design contract's per-pane edition controls and explicit numbering-mismatch state were missing from the fixed WEB/KJV comparison. The full Comparison view now offers independent native selectors. It saves known source identifiers and a canonical reference in its Obsidian view state, preserves the unaffected pane's scroll position on an edition change, restores keyboard focus to the changed selector, and exposes each text region to keyboard scrolling. Both sides highlight only the requested source-coordinate numbers. A numbering notice compares actual chapter number sets; equality does not claim semantic alignment. Missing chapters remain explicit per-pane failures.

The focused tests first failed for the missing comparison policy, then passed. Six cases cover preferred Reader defaults, independent saved state/range, malformed state rejection, equal number sets, omissions on either side and the real Romans 14 assets. The latter reports WEB-only 24, 25, 26 and explicitly states that no remapping is applied. Full gate: 217 tests across 33 files, strict TypeScript and production build; deployed to test-vault.

The required native follow-up was completed in the current verified build above. Policy tests alone do not establish those UI outcomes; the saved native captures record the tested composition and theme states.

#### Dense typography controls and Appearance dismissal

The old 1.55–1.85 line-height range could not reach the concept's dense study presentation. Both native control surfaces now allow 1.15–2.00 in 0.01 steps, preserving the default 1.68 and all previously saved values. Native keyboard input reached exactly 1.30. The check restored 1.68; the test-vault settings file confirms Compact, font 17, leading 1.68, width 65, John 3:16 and no remaining Focus dock snapshot.

The Focus Escape guard referenced an unused Appearance class. It now identifies the actual `.vd-type-popover`, which has its own Escape dismissal and focus restoration. Native QA focused Reset typography without activating it, pressed Escape, and verified that Appearance closed while Focus's floating Exit remained present. A second Escape restored both docks. `design-qa-focus-appearance-escape.png` records the intermediate Focus state. No existing note was edited.

The native test window's display placement produced clipped captures and coordinate-input failures. Native Fill and Move Window Back to Mac produced complete captures, but did not establish the reference viewport. Further screenshot comparison was stopped when Obsidian returned to another vault receiving input. An availability question is pending; native verification must resume in test-vault only. Full fidelity remains unproven and the visual gate remains blocked, independent of the passing behavior checks.

#### Dock density and active workspace

The earlier 2940 × 1686 native capture showed resource descriptions pushing Matthew Henry below the left dock's fold, and the Notes card partly below the right fold. Resource rows now share an Offline heading and retain their detailed descriptions as native tooltips. All five installed bundles are visible together. Study card headers and padding are smaller; the overview commentary excerpt uses three lines, with the complete text still available through Read more. Commentary and cross-reference credits remain visible. All three Study cards now fit together at the tested window size. Additional workspace shortcuts remain scrollable rather than displacing the fixed footer.

`design-qa-study-density.png` and `design-qa-study-density-light.png` show John 3:16 / KJV, the populated G25 footer, the left resources and all three right cards in dark and light themes. The Bible Reader navigation entry now remains selected while Study or docked Parallel has focus; utility tabs retain their separate routes. Native word selection updated the Reader, footer and Inspector to John 3:16. Fonts and Scripture settings remain unchanged; only dock spacing and preview length changed. Theme tokens preserve dark/light surfaces, legible source credits, accent states and visible word focus. Icons remain the native Obsidian library. Source-backed text differs from the illustrative commentary and G26 noun in the concept: the selected English verb actually carries G25 / V-AAI-3S.

A native zoom/resize check did not establish the exact 1598 × 984 reference viewport. Actual Size and the dark theme were restored. These captures prove the corrected composition and functionality at the tested size, not pixel-equivalent rendering. Full visual acceptance remains open; no mobile-device verification or new workspace preset is claimed. The complete automated gate still passes at 32 files / 211 tests plus strict TypeScript and production build.

#### Linked-note excerpts and native Focus workspace

`design-qa-note-preview.png` captures a clearly labeled disposable note in the Notes dock alongside the existing empty primary note. The title comes from its indexed H1, the excerpt from its first prose paragraph, and the timestamp from the file. YAML, a private QA marker and the second paragraph do not appear in the preview. Editing the first paragraph refreshed the native card without manual Refresh. Opening it used ordinary Markdown; reopening reused the tab. The fixture was closed and moved outside the test vault into ignored QA storage; the linked-note count returned to one without editing existing notes.

Study reads excerpts for at most three cards, Notes for five. Files above 256 KiB are rejected before reading; extraction scans at most the first 16 KiB and returns at most 180 code points plus ellipsis. It uses inert text nodes, excludes template quotations/code/embeds, and makes no Markdown-renderer or network calls. Empty observations remain explicitly empty. Discovery continues to use metadata indexes rather than body searching. New study notes record the selected edition.

Focus now owns only native dock collapse flags, preserving all tabs and leaves. Native checks confirmed that entering from Library opens the Reader, switching to Markdown restores the docks, returning to Reader reapplies Focus, and reloading preserves the original independent restore flags. `design-qa-focus-dark.png` shows both docks collapsed and a bottom navigator with reserved Scripture space. `design-qa-focus-restored.png` shows the asymmetric return state (left closed, right open). Quick Jump initially exposed Escape propagating into Reader exit; checking the original event path fixed it. A fresh native reload verified dialog Escape preserves Focus and a second Escape restores both docks. The return layout remains Compact with the original typography.

`design-qa-study-current.png` records the final dark Study workspace with both docks open, actual commentary, cross-reference previews and the existing note. At this 2940 × 1686 native-pixel window the narrow right dock scrolls to reach the full Notes card. Fonts, theme colors and Obsidian icons retain the established native adaptation. Note snippets and reversible native Focus now function; same-viewport matching, every mockup preset and mobile-device flows remain unproven. This is a functional QA pass for this slice, not full visual acceptance. Latest automated gate: 211 tests across 32 files, strict TypeScript and production build.

#### Compact Instant Details and complete result paging

The first populated footer used roughly 250 CSS pixels in the desktop frame and presented raw morphology. `design-qa-word-details-dark.png` and `design-qa-word-details-light.png` show the revised footer with Word/Lexicon/Occurrences tabs and a compact identity/grammar/definition grid. It now uses roughly 180 CSS pixels in the captured state, while preserving the 17px Scripture setting. The headword uses the reading serif; grammar, controls and dictionary preview use interface typography. Theme surfaces, accent and red-letter colors remain native tokens. Obsidian icons supply the pin/clear controls. The complete entry is reachable in Lexicon rather than expanding the overview indefinitely.

Native pointer preview showed “whosoever” at John 3:15 while the selected Reader verse and Inspector remained John 3:16, with focus still on the original application surface. Pinning that preview selected its source verse and restored focus to the tagged word. Selecting “loved” displayed G25, agapao and `Verb · Aorist · Active · Indicative · Third person · Singular`. Right moved the footer from Word to Lexicon and Occurrences with correct focused-tab state. Unknown schemas remain raw codes; no Hebrew grammatical expansion is inferred.

Occurrence search showed **109 KJV tagged verses**, and all five pages were checked natively through 101–109. The final page disables Next and focuses Previous; intermediate paging keeps the initiating control focused. `design-qa-word-occurrences.png` records the final page. This counts verses containing displayed exported tags, deduplicating repeated same-verse tags; it does not claim the number of underlying Greek words in an independent source.

Manual collapse persisted through a bookmark update, and the original bookmark state was restored. Explicit Unpin collapsed and cleared the word, returning focus within the Reader. `design-qa-word-details-narrow.png` records a roughly 360 CSS-pixel Reader with stacked details, usable tabs and the complete selected verse/actions visible. The initial resize check exposed selection disappearing below the fold; the width-only observer corrected this without making hover previews navigate. This is desktop narrow-pane evidence, not a mobile-device pass. Original dock width and dark mode were restored.

The new footer reduces the visual gap to the supplied Study Desk concept and closes readable Robinson grammar, hover preview/pin and complete paged-result gaps. Exact same-viewport fidelity, note snippets, all workspace presets and device-specific mobile flows remain unproven. The overall fidelity gate stays open.

Validation: strict TypeScript, 30 test files / 197 tests and production build pass. Existing runtime dependencies and bundled source assets are unchanged. Package checks verify the explicit 284-file archive, every data checksum and a second read with network sockets disabled; native behaviors above are separately verified in Obsidian.

#### Tagged words and actual parallel editions

`design-qa-word-study-dark.png` and `design-qa-word-study-light.png` are unmodified 2940 × 1846 native captures. Both show John 3:16 in CrossWire KJV 3.1, source red-letter text, selected “loved,” populated bottom Greek word details, the left resource navigation and right Study cards. The bottom panel now uses a compact identity column beside the full definition, after the first native review exposed excess wrapping in a narrow definition column. Source forms, G25, agapao and morphology `robinson:V-AAI-3S` are real source data. Strong’s source credit remains visible. The older Hebrew dictionary’s H430 entry was also checked live at Genesis 1:1; its transliteration and pronunciation are preserved without generating Hebrew script.

The edition menu switches WEB/KJV, and a native app reload retained KJV. Tagged words use flat inline controls with inherited Scripture typography and source red-letter color; Right moved keyboard focus from “loved” to “the world.” Full word study in the narrow right dock showed the first fifty G25 verses beginning Matthew 5:43, explicitly indicating more matches. Source gaps remain unavailable. The Library and Storage views showed five installed bundles, 275 measured files, 90.4 MB and zero missing. Native review caught a stale WEB-default storage label while KJV was active; it was corrected and covered by a regression test.

`design-qa-parallel-kjv.png` shows the full chapter comparison with distinct WEB/KJV text. The right Parallel tab also showed both John 3:16 texts, including WEB “only born” and KJV “only begotten.” The colors follow theme tokens and were reviewed in light and dark, with dark restored. Icons remain Obsidian’s existing system. No raster imitation or fabricated source text is used.

This closes the missing tagged-word/dictionary and second-edition functionality gaps. It does **not** prove complete visual alignment to every concept screen. Full interlinear alignment, decoded morphology, exhaustive occurrence counts, note-body snippets, a same-viewport reference comparison and remaining concept interactions are still outside the evidence. The overall fidelity result above remains unproven.

Verification gate: 29 test files / 188 tests, strict TypeScript and production build pass. A second source export produced identical hashes for all 72 KJV/dictionary assets. The 284-entry package passes clean-vault extraction and a second offline read, validating all generated book/dictionary hashes. A final native reload verified the corrected current-edition storage labels; the test vault was left in dark mode on John 3:16 with G25 details visible. The legacy WEB notice is outside the measured storage summary, so its measured-file count is one below the full library-file count.

#### Working commentary content

`design-qa-commentary-dark.png` and `design-qa-commentary-light.png` are unmodified native captures at 2940 × 1846 pixels. Both show Reader selection John 3:16, the real MHC section John 3:1–21, three OpenBible/WEB previews and the existing linked note. The left dock includes MHC as an actual installed resource. The source credit is visible in both color schemes, and dark mode was restored afterward.

Fonts retain the established interface/Scripture split; the commentary preview uses the interface font and its full reading view uses the reading serif. Spacing keeps the three Study cards together without the earlier empty Commentary placeholder. All new colors use theme tokens; the light capture shows dark readable text, visible boundaries and purple reference/actions. Asset fidelity uses the existing Obsidian icon system. Copy now contains actual source commentary and the real section range; the concept's exact excerpt remains different because it depicts a verse-specific extract while this edition indexes John 3:1–21 as one section. No text is synthesized to imitate the concept.

Native Read more opened the complete section. Tab/Return loaded the second and third block batches and moved focus to the newly appended content; all 46 source blocks were reachable. Open this passage selected John 3:1–21 in the Reader. Pin held that source section while the Reader moved to John 4; Follow then loaded John 4:1–3 and 4:4–26. More sections appended 4:27–42 and 4:43–54 with focus on the first new section. Library/Storage showed 4,249 sections, three installed resources, 203 measured files, 47.7 MB and no missing files. Automated gates pass at 180 tests across 28 files plus TypeScript, production build and clean-install/restart checks.

Narrow follow-up: `design-qa-commentary-narrow.png` shows the populated card at approximately 240 CSS pixels for John 3:14, including its section label, preview, Read more and source credit without clipping. `design-qa-commentary-detail-narrow.png` shows the full text reflowing in a roughly 290 CSS-pixel dock after reload. That check found that the leading source Scripture quotation pushed the commentary down several screens. Quotation blocks now use native, initially collapsed disclosures; the commentary begins immediately below the disclosure. Native expansion exposed the complete source quotation, and collapsing it hid the quotation again. The updated full-text screenshot records the collapsed state. The Study overview was left open afterward.

This resolves the earlier missing-commentary finding for the bundled edition. It does not resolve the remaining lexical/tagged-word tools, second translation, or exact same-viewport/source-state comparison. Full visual QA therefore remains unproven; the goal is still active.

#### Visual density and mode restoration

Current saved captures are `design-qa-study-desktop.png` and `design-qa-study-narrow.png` (2940 × 1846 native pixels, approximately 1470 × 923 CSS pixels at 2×). The selected passage remains John 3:16; the desktop capture shows Compact study with Commentary, Cross-References and My Notes open. The narrow capture used an approximately 240 CSS-pixel Inspector before Commentary was expanded. Original reference: 1598 × 984 image pixels, with no reliable CSS viewport or density metadata. These are useful composition and region checks, not a same-size pixel-fidelity pass.

- Typography: retained the plan's 17px Scripture, 1.68 leading and 65ch measure. Compact study reduces row padding to 1px instead of shrinking fonts. The line-height slider's earlier 1.70 rounding of the 1.68 default was reproduced in native AX and corrected with a 0.01 step; AX now reports 1.68. Native interface fonts and the actual WEB wording still differ from the concept's serif interface and KJV text.
- Spacing/layout: the duplicate Reader title row is gone and the passage toolbar is 44px. Right tabs now include icons; the context header, section gaps and card padding are smaller. Three inline cross-reference previews clamp to two lines, leaving the complete My Notes card visible in the desktop capture. The narrow capture shows complete Study/Parallel/Notes labels, card boundaries, source credit and primary actions. Native Right/Home tab navigation passed at this width.
- Colors/tokens: all new styling uses existing theme surfaces, text and accent tokens. The current captures verify dark mode only; the modified compact presentation has not been recaptured in light mode.
- Asset quality: the new tab icons use Obsidian's icon set, with decorative SVGs hidden from accessibility. No raster assets are introduced. The caret glyph remains an existing implementation detail and differs from the concept's icon treatment.
- Copy/content: related passages are actual WEB excerpts with source credit. The Commentary card explicitly reports missing content, My Notes uses the real indexed file, and lexical data is still absent. The concept's commentary and expanded word study remain incomplete product capabilities rather than verified content.

The Focus round trip initially lost Compact study and could leave the selected verse clipped above the viewport. These were actionable findings: the persisted return-layout transition is now unit-covered, and native Compact → Focus → reload → Exit restored Compact study with unchanged typography. A further native Focus/Exit round trip after the scroll correction showed the complete John 3:16 selection centered in the Reader; the desktop capture was refreshed from that state. All mode entry points share the controller transition. Full reference fidelity remains unproven until remaining content/tool capabilities, matching viewport/state and light-mode comparison are completed.

Cross-reference content iteration: `design-qa-crossrefs.png` is a saved, unmodified native capture from `test-vault` showing the left navigation, WEB Reader selected at John 3:16 and the right Study card with three real local previews. Visible source attribution reads OpenBible.info · CC BY 4.0. Native checks opened the twelve-target References list, pinned John 3:16, followed Romans 5:8 into the Reader, then unpinned and observed Romans 5:8-related targets replace the list. Module Library showed 344,016 coordinates and two installed resources; Storage measured 135 files / 10.2 MB / zero missing. The saved image supersedes the earlier statement that all new captures were inline-only. It still differs from the reference's KJV text, commentary, expanded lexical panel and reading density; it does not establish full fidelity. The source card's three passages and credit fit without clipping at desktop width. This pass does not re-establish narrow-pane or light-theme fidelity for the new content.

Navigation footer correction: adding the active cross-reference module exposed overflow that hid Settings and Help. Brand and footer now remain outside the scrolling navigation content, and both utility icons remain visible. A native check after reload verified the fixed footer, with the additional module and Workspace actions above it. The saved screenshot was refreshed after this correction. Selected ranges now reserve action space only on their first row, preserving full text width on the remaining selected verses.

Inspector follow iteration: the former static Follow badge is now an accessible toggle with explicit Pinned/Follow text and pressed state. A pinned passage supplies all passage-specific Study/Parallel/Notes content and actions. Native verification pinned John 3:16, advanced the Reader to John 4, reloaded and retained John 3:16 in Notes. Unpinning immediately switched the dock to John 4. Unit coverage includes pinned ranges and malformed persisted coordinates.

Notes iteration: removed the redundant secondary resource strip from the primary Notes panel and placed discovery mechanics in a disclosure. The native capture at John 3:16 showed Study/Parallel/Notes above the note heading, indexed note card and actions. Clicking the existing note twice reused a single Markdown tab; returning through Bible Reader preserved the selected John 3:16 reference and Notes panel. No note content was edited in this check.

Primary dock navigation iteration: Parallel previously opened a center Comparison tab despite being presented next to Study/Notes as a dock choice. It now selects an in-dock tab panel showing the current passage from installed WEB, edition details, Copy, full-comparison access and the missing second-edition state. Native capture at John 3:14–16 showed the full three-verse passage in the right panel while the Reader remained visible. ArrowRight selected Notes and Home returned to Study, with focus on the correct primary tab. Primary tabs now expose roles, selected state and panel relationships rather than plain shortcut buttons.

Left-dock utility iteration: Settings and Help icons now occupy the navigation footer as in the reference. Native Help opened the guide and its Settings action opened the shared settings renderer with the six existing sections. A settings screenshot showed both footer icons and the modal's typography, size, width and mode controls.

Keyboard correction: actual Shift+J/K dispatch uppercase letters; the prior lowercase-only Reader handler missed those events. After repair, native Shift+J selected John 3:14–15 and the next press extended to 14–16. The breadcrumb, selected-row accessibility labels and right Study reference all updated consistently. This supersedes earlier unverified shortcut claims.

Reader composition iteration: the large centered editorial chapter masthead previously appeared in Classic mode despite the study-desk reference using a compact left heading. Classic/Compact now use a 23px left heading and 24px initial reading padding; Focus retains the large centered treatment. The selected-passage rail previously reserved 250px for eight controls; it now reserves 155px for Copy, Note, Bookmark and More, with secondary actions in a native menu. Native captures at John 3 and selected John 3:16 verified both changes; the menu exposed insertion, Highlight, Commentary, Inspector and Compare, and the right My Notes card displayed the actual indexed John 3:16 vault note.

Study-card persistence iteration: collapsing Commentary now records the choice in the Inspector workspace state. Native testing changed Romans 11 → 12 and reloaded; the Commentary body remained absent while the other two sections remained open. A regression test rejects malformed stored section lists and deduplicates supported keys.

Responsive dock review: resizing the actual native divider produced a Reader approximately 420 CSS pixels wide with two toolbar rows and visible edition/link/search/typography/overflow controls. A separate capture at approximately 240 CSS pixels for the Study dock showed all top navigation controls, wrapped card text and visible actions without the earlier right-edge cutoff. Native captures were returned inline. Balanced desktop proportions were restored after review. These observations replace the earlier outstanding narrow-dock review, but do not establish full same-state reference fidelity or complete scholarly content functionality.

Toolbar iteration: the earlier capture showed history arrows stacked vertically and too many Reader actions competing for a row. History is now horizontal and secondary controls are in the native Reader actions menu. The subsequent native dark capture showed one row across the center pane. Menu interaction, entering Focus mode and restoring through Exit all passed. Narrow CSS now preserves the primary controls rather than hiding them by their child position; rendered narrow-pane review is still outstanding.

The test window was fitted to its display with macOS Window → Fill. The new native dark capture shows the full right edge, complete Study/Parallel/Notes controls, all three card boundaries and both navigation docks. The earlier edge cutoff was therefore at least partly a window-position/capture problem. Inspector width constraints were also tightened so children cannot force horizontal overflow.

Desktop Instant Details now occupies its own Reader layout region and expanded successfully in native Obsidian. Inspector Notes was selected, the app was reloaded, and the resulting accessibility tree still showed `Notes` selected and `Your Scripture notes`. The earlier save-without-restore defect is repaired and a malformed-state regression test passes.

Evidence is the inline native screenshot and accessibility output from this run; no new screenshot file has been saved. Full same-state visual comparison, smaller widths and scholarly content/tool completeness remain outstanding, so the current result above stays blocked.

**Source visual truth**

- Primary layout and visual language: `/Users/user/Documents/obsidian_vaults/my-plugins/mysword+/design/SwordDock-Bible-UI-Mockups/04-research-desk-light.png`
- Supporting component references: `01-editorial-focus-dark.png`, `02-study-desk-dark.png`, `08-module-library.png`, and `09-quick-verse-insert.png` in the same directory.
- Rendered implementation: `/Users/user/Documents/obsidian_vaults/my-plugins/mysword+/dev/design-qa-reader.png`

**Capture normalization**

- Source: 1672 x 941 pixels, light desktop research-desk concept.
- Implementation: 2940 x 1682 pixels, native macOS/Retina Obsidian 1.15.1 window capture from the isolated `test-vault`.
- The implementation was reviewed at its native application size. Pixel dimensions were not downsampled because this is an Obsidian ItemView rather than a fixed browser viewport; comparisons used region proportions, typography hierarchy, pane behavior and control density rather than pixel-perfect app-shell geometry.
- State: light theme, Reader at Romans 8, Inspector docked right, Module Library also docked right. The reference uses illustrative John 3/KJV/lexicon data that the current release does not ship.

**Full-view comparison evidence**

- The implementation preserves the reference's native Obsidian shell, compact study toolbar, centered editorial Scripture column, violet selected state, docked Inspector, quiet border system and serif/interface type split.
- The implemented chapter masthead uses the stronger editorial hierarchy from the focus mockup while retaining the lighter research-desk palette.
- The Library and Quick Insert surfaces use the same violet focus treatment, restrained panels, provenance/status hierarchy and native pane/modal framing as their dedicated references.

**Focused region comparison evidence**

- Reader header: book/chapter hierarchy, edition overline, compact breadcrumb and version status were checked against screens 01 and 04.
- Reader navigation: session back/forward controls and the WEB/offline edition selector were checked in the native toolbar; back restores the prior passage without changing the persisted MRU semantics.
- Selected verse: violet leading rule, low-opacity selection fill and action rail were checked against screens 02 and 04.
- Selected range: range references keep both endpoints in the Reader selection state, expose the action rail only at the first selected verse, and label copy/highlight/bookmark/insert actions as a selected passage.
- Inspector: compact tabs, the new Resource Info provenance surface, reference heading and the collapsible Instant Details footer were checked against screens 02, 04 and 05. The footer remains explicit about missing verified lexicon data.
- Parallel comparison: the chapter-level two-pane shell was checked against screen 03; the primary WEB pane renders real offline text and the second pane states the missing-edition prerequisite.
- Study links: Reader and Comparison expose explicit Unlinked / Link A/B/C Follow / Pinned assignments. Matching Link A + Follow moved Reader Romans 8 → 9 and the comparison pane followed; switching Comparison to Link A · Pinned kept it on Romans 9 while Reader moved to Romans 10.
- Study-link indicator: the active assignment now renders a visible colored dot plus the group letter and Follow/Pinned label; the dot is decorative only and the accessible button name carries the full state.
- Focus mode: the native Reader toolbar and status footer fade to a quiet reading surface, while a compact floating chapter navigator keeps Previous / Next / Exit discoverable; the full toggle exposes its pressed state and Escape hint. Native reload verification advanced Romans 10 → 11 through the floating navigator and restored the full Reader controls.
- Module Library: collection heading, installed resource row, status, statistics, local-first storage panel and the new Get started / Installed / Discover / Downloads / Import navigation were checked against screen 08 and the added resource-flow references.
- Module Library navigation order: Get started → Discover → My library → Downloads → Import now matches the resource-acquisition flow in the design plan.
- Module Library storage: the installed WEB footprint measured 4.5 MB across 67 local files in the native test vault; the metric is presented as local-only and omits adapter paths.
- Storage review: the native Storage & resources modal reports the same measured footprint, renders a protected bundled-WEB resource row with a disabled removal action, and explicitly excludes personal notes, bookmarks and imported originals.
- Storage sync copy: the modal states that available disk space is not exposed by the current adapter and that vault sync/Git/cloud backup remain user-managed rather than silently enabled.
- Import source directory: the native Import state now lists three external directories with named domains, categories and Visit site links, plus an explicit Import downloaded files return path.
- Import review: the read-only MySword surface now exposes source bytes, SHA-256, chapter coverage, inspection timing, planned `.obsidian/versedock/modules/v1/` layout, unsaved rights/provenance fields and an explicit write-ineligible state.
- Settings: the native SwordDock settings screen now exposes Reading & appearance, Study workspace, Library & downloads, Notes & references, Keyboard & accessibility, and Data & privacy sections with working entry-point actions.
- Notes: the destination folder is configurable and normalized before any file or internal link is created; existing notes are never moved.
- Quick Insert: modal hierarchy, reference field, preview card and the complete callout / quote / reference-link / create-note / copy action set were checked against screen 09.

**Required fidelity surfaces**

- Fonts and typography: passed. Editorial Scripture and display headings use an Iowan/Palatino/Georgia stack; UI chrome remains on Obsidian's interface font. Weight, line-height, small-label tracking and selected-state legibility are consistent with the references.
- Spacing and layout rhythm: passed. Toolbar, reading measure, masthead whitespace, pane padding, panel radii and vertical rhythm match the visual intent. Narrow Library layout now responds to pane width rather than the full window.
- Colors and visual tokens: passed. All styling remains scoped and mapped to Obsidian theme tokens, with violet accents, theme-adaptive surfaces, muted borders and a distinct positive/offline state.
- Image quality and asset fidelity: passed. The implemented product UI does not replace source imagery with placeholders; visible controls use Obsidian's native icon set. The supplied mockups remain reference-only and are not embedded as raster UI.
- Copy and content: passed with intentional product constraints. The app shows real WEB/offline/provenance labels and honest empty states instead of the mockups' illustrative KJV, commentary and lexicon content.

**Comparison history**

1. Initial live pass found a P2 selected-verse overlap: the floating action rail covered long verse text. Fixed by reserving inline space for the rail on wide panes and returning it to normal flow below 760 px.
2. Initial live pass found a P2 responsive mismatch: the Library used viewport media queries and stayed in a desktop grid when docked in a narrow Obsidian pane. Fixed with a named Library container and pane-width container queries.
3. Post-fix live capture confirmed the selected verse remains readable, the rail stays aligned, and the docked Library stacks without horizontal clipping.

**Findings**

- No actionable P0, P1 or P2 findings remain.
- P3: a future release could add a dedicated full-width Library placement command, but the current docked layout is usable and intentionally responsive.
- Intentional deviations: no red-letter text is inferred; KJV, commentaries, lexicons, parallel comparison and download catalogs are not fabricated because the current release does not provide those verified resources.

**Primary interactions tested**

- Reader loaded the installed WEB chapter and rendered the selected verse state.
- Quick Jump range references are unit-covered for persistence through Reader rendering, settings reload and study-link events; the native preview showed both endpoints, while automated native activation remains a known verification limitation.
- Selected-verse action controls remained visible and keyboard-exposed.
- Reader range selection is directly extendable with Shift-click or Shift+Enter, with both forward and backward endpoints normalized before rendering.
- Inspector tabs and honest unavailable-resource state rendered in the right dock.
- Inspector Resource Info was keyboard-reached natively with End → Left → Left and exposed the verified WEB title, edition, coverage, license, source link and checksum without leaking a local adapter path.
- Module Library opened, showed the installed WEB resource and adapted to its dock width.
- Discover now opens a dedicated WEB edition detail modal with verified provenance, checksum, measured local footprint and explicit Reader/Library actions; unavailable source metadata is rendered as non-interactive text.
- Module Library tabs opened the truthful bundled-resource, no-downloads and read-only-import states without disabled navigation.
- Module Library tabs were keyboard-tested natively: Left moved My library → Discover and Right returned to My library; inactive tabs remained non-native focus targets while the active panel updated.
- SwordDock settings opened in Obsidian and exposed working Inspector, Search, Library, current-note and local-history actions.
- Parallel Comparison opened from the command palette and rendered Romans 8 with the truthful second-edition-unavailable state.
- Study-link behavior was tested natively: matching Link A · Follow synchronized the comparison heading on Reader navigation, while Link A · Pinned preserved the comparison chapter independently.
- Reader Focus mode was tested natively: entering Focus mode quieted the Reader chrome, the floating navigator advanced Romans 10 → 11, and Exit restored the full toolbar while preserving the active passage.
- Reader navigation moved Romans 8 → Romans 9, enabled Back, and restored Romans 8 with Forward enabled.
- Module Library measured local storage after a plugin reload and displayed the 4.5 MB / 67-file result.
- Storage & resources opened from the Library and displayed measured files, default-Bible protection and data-scope copy.
- Storage & resources natively exposed the measured WEB row (4.5 MB · 67 files), “Current default · protected” status and an unavailable Remove action with an explanatory label.
- Import source directory displayed all three external links and routed Import downloaded files to the existing read-only inspector entry point.
- MySword inspection remains read-only and now reports source integrity/provenance evidence without creating staging files or persisting the rights form.
- Quick Verse Insert opened with a valid Romans 8:24 preview and working callout, quote, reference-link, create-note and copy actions present.
- Reader verse actions include a direct Commentary route that selects the Inspector Commentary tab; commentary content remains an honest unavailable state until a compatible provider is installed.
- Narrow Reader styling exposes the Instant Details surface below the passage for selected verses; its collapsed/expanded state is semantic and its Lexicon action routes to the truthful unavailable-resource tab.
- Light-theme live reload succeeded in the isolated Obsidian test vault.

**Console/errors**

- Native Obsidian UI verification exposed no visible runtime error state. The codebase also passed TypeScript, 154 Vitest tests and the production esbuild build.
- Browser console inspection is not applicable because this is a native Obsidian plugin surface, not a browser-hosted prototype.

**Implementation checklist**

- [x] Reader visual system applied.
- [x] Selected verse and action rail verified.
- [x] Inspector density and tab state verified.
- [x] Quick Insert modal verified.
- [x] Module Library desktop and docked layouts verified.
- [x] Module Library navigation and safe acquisition states verified.
- [x] Native settings sections and entry points verified.
- [x] Parallel comparison shell and missing-edition state verified.
- [x] Reader back/forward navigation and edition selector verified.
- [x] Typed study-link bus with matching-group follow, pinned and unlinked pane behavior verified.
- [x] Instant Details footer collapse/empty state implemented.
- [x] Light theme and responsive pane behavior verified.

Historical pre-correction result: passed
