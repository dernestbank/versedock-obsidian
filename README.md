# SwordDock Bible

**An independent, offline-first Bible reader and Markdown study companion for Obsidian.** This development preview supports manual installation. Native checks cover macOS, Windows, Linux and iPadOS.

SwordDock Bible was previously developed under the working titles *MySword+* and *VerseDock*. It is **not affiliated with MySword, Obsidian, Logos, or other Bible software vendors.** Six pinned publisher downloads have automatic installers, covering Bible, commentary, dictionary, book, devotional and graphics resources. The current candidate also imports compatible local SQLite/gzip modules after a source review. All six kinds have native Mac import and restart coverage. The acceptance review records platform-specific results.

## What works in the 0.1.x developer previews

- Read **World English Bible (WEB)** or **King James Version (CrossWire KJV 3.1)** offline; select the edition in the Reader toolbar or Settings. Both retain their own verse numbering.
- Preview tagged KJV words with the pointer; click or press Enter to pin a word in Instant Details. Its compact Word, Lexicon and Occurrences tabs show dictionary entries, source forms, documented Robinson grammar and paged results with exact counts of matching tagged verses. Unknown morphology remains visible as a source code. Left/Right moves between tagged words within a verse. WEB has no inferred lexical tags.
- Jump to books and chapters, or type references such as `John 3:16`, `Ps 23`, and `1co 13:4-7`.
- Select complete verse ranges in the Reader; visible selection, copy, highlights, bookmarks, linked notes and study-link events retain both endpoints.
- Extend a Reader selection directly with Shift-click, Shift+Enter, Shift+J or Shift+K; backward and forward extensions normalize to one canonical same-chapter range.
- Search exact phrases, all entered words, or any entered word across the whole Bible, the current chapter or book, any directly selected book, or either testament, with safe in-result highlighting; preview and copy passages.
- Insert an attributed Bible callout or quotation directly into a Markdown note.
- Create, discover, and reopen Scripture-linked study notes as **ordinary Markdown files**, using bounded Obsidian frontmatter and resolved-backlink indexes. The primary note stays first; notes linking to it appear as backlinks. Study shows up to three short note excerpts; Notes shows up to five, with titles and modification times. Preview reads are limited to displayed Markdown files under 256 KiB and never search bodies for links. New notes record the selected edition; existing notes are not rewritten. New range notes retain both endpoints in frontmatter and filenames, while positively identified range notes from older previews continue to open without being rewritten.
- Save passage bookmarks and highlights.
- Reopen up to fifty recent passages from the Study Inspector's bounded reading history, review the selected Bible's provenance in Resource Info, and preview local MySword modules before explicitly installing them.
- Open native Obsidian Reader, Study Inspector, Search, chapter-level Comparison, and Module Library views.
- Open the Study Desk with a dedicated left navigation dock and a right Study overview showing Commentary, Cross-References and My Notes together. Search, Library and Comparison open in center tabs. Resources is a separate native right-dock tab for installed Bibles, commentary and Greek/Hebrew dictionaries; it retains per-category module choices and dictionary queries.
- Install **All of Grace**, **Morning and Evening**, and **The Complete Sunday School Atlas** from Discover, individually or together. Downloads provides status, cancellation and retry. Verified resources appear in My library and Resources immediately.
- Read books with contents/search/bookmarks, devotionals with date/Today and morning/evening selection, and maps with thumbnails/zoom/scroll panning. Each resource remembers its reading position independently of Bible navigation.
- The current candidate adds pinned **MySword KJV**, **Jamieson–Fausset–Brown Commentary** and **Easton’s Dictionary** installers. Installed Bibles use their own text, coverage and source notices in Reader, search and full Comparison. Installed commentary follows source passage ranges and introductions; Easton supports paged headword lookup with independent saved queries. Source fixtures pass preparation, storage verification and offline reopening. Native queue installation, edition switching, commentary/dictionary links and restart rediscovery are verified; broader fault-path and platform acceptance remains open. Imported Bible word tags are retained, while interactive word-study controls currently belong to the bundled CrossWire KJV.

- The Inspector restores its selected tab after reload; the Reader provides a collapsible Instant Details bar on desktop and narrow panes.
- The right dock's Study, Parallel and Notes tabs support keyboard navigation. Docked Parallel shows actual WEB and KJV passage text. Full Comparison has independent installed-edition selectors, saves its source choices and passage, and reports differing source verse numbers without remapping them. Its bundled tagged KJV words open local Word / Lexicon / Occurrences details without changing the Reader's edition or passage.
- Toggle the Inspector header between Follow and Pinned to hold its passage while navigating the Reader; the pinned reference survives reloads.
- Commentary, Cross-References and My Notes remember their collapsed state across passage changes and reloads.
- Read related passages offline from 344,016 bundled [OpenBible.info cross-references](https://www.openbible.info/labs/cross-references/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Study previews three targets; References shows up to twelve unique targets with WEB excerpts. Source credit remains visible.
- Read [Matthew Henry's Commentary](https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=MHC) offline: 4,249 source sections across 66 books. The Study card previews the matching section; Read more opens supported source headings, emphasis and citation links, with continuation controls and the original OSIS available as text. Source Scripture quotations remain in collapsible disclosures. Citations with multiple qualified addresses offer each target in the offline preview; incomplete, unsupported or missing coordinates are never guessed. Commentary follows the Inspector's Follow/Pin setting. Native acceptance of these new formatting/link controls remains open; see [the rich-source decision](docs/decisions/0016-bundled-commentary-rich-source.md).
- Settings and Help are available from the left dock footer; Help includes the workspace guide and keyboard shortcuts.
- Linked-note actions reuse an already open Markdown tab and preserve the Reader passage when returning to it.
- Link Reader and Comparison with explicit Unlinked / Link A / Link B / Link C assignments, choosing Follow or Pinned behavior per pane.
- Review installed-resource storage, integrity and provenance, with external module source links and a local preview-and-import flow.
- Review the current Reader edition’s source, license, coverage, checksum and measured local size in Resource Info.
- Manage additional resources from their Library cards or Storage: review source notices and retained versions, choose a version that survives restart, remove from the library and restore, or reinstall/repair a publisher download. Local repairs reopen the preview/import flow. The default Bible is protected; damaged originals remain retained. Native macOS checks cover version selection/reload, removal/restore, default protection, damaged-copy repair and failed-save rollback/retry. The native update check covered two genuine publisher KJV revisions, rollback and restart.
- Review all additional-resource storage from Storage or Manage resources, including retained versions, staging, management records and other data. Select eligible unused folders to move to vault Trash; active, Restore and rollback data stay protected. Review and recover complete prepared stages; incomplete stages cannot activate. Native macOS checks cover measured reversible cleanup, prepared-stage recovery/reload and incomplete-stage refusal.
- Disabling or unloading SwordDock rejects queued library changes and new previews, cancels uncommitted management/recovery changes, and stops further cleanup. Already committed changes remain; completed Trash moves stay in Trash. Native checks cancelled a live publisher repair and an active SQLite preview during plugin unload.
- Desktop Cancel stops the actual publisher transfer. Interrupted downloads save bounded, verified prefixes when a strong publisher validator is available. Retry can resume those bytes after restart, validates the range response and checks the complete pinned file/database before installation. Saved prefixes appear in storage review and can be moved to Trash. Mobile currently uses Obsidian’s public download API: cancellation prevents installation, but its network transfer may finish and Retry starts again. The iPad release checks use physical devices.
- Use Classic, Compact or Focus reading modes. Focus collapses the native left and right docks while the central Reader is active, remembers their independent states across reloads, and restores them on Exit, Escape or switching to another file. Escape inside a dialog closes that dialog while preserving Focus.
- Use the Reader actions menu for insertion, Inspector, comparison, Focus mode and reading history; primary passage and appearance controls stay on the toolbar.
- Choose Classic, Compact study or Focus directly from Appearance. Compact study reduces verse spacing without changing your typography. Focus remembers the previous layout across reloads, and layout changes keep the selected passage in view.
- Adjust Scripture line height from 1.15 to 2.00 for dense study or more open reading; the default remains 1.68. Escape closes Reading appearance and returns focus to its button, including while Focus mode is active.
- Work without an account or analytics.

### Local MySword import (current developer candidate)

The command **Import or inspect a local MySword module** and Module Library's **Import local file** button open a local SQLite/gzip preview. Selected and expanded files are bounded to 64 MiB. Type detection uses physical tables rather than extensions. Bible, commentary and dictionary types are detected directly; Book containers can be imported as books, dated devotionals or embedded graphics. Encrypted databases, ZIP archives, ambiguous schemas and unsupported formats are rejected.

Preparation uses bundled [sql.js](https://github.com/sql-js/sql.js) (MIT licensed), including its local WebAssembly engine and license in `assets/LICENSE-sql.js.txt`. Review the source notice, record/image counts, samples, sizes and fingerprints before choosing **Install in this vault**. An optional source/permission note stays with the resource. Original files are unchanged and are never uploaded. The local basename and both file/database fingerprints are retained; raw and gzip versions of the same database share an identity separate from bundled/catalogue resources.

Preview writes nothing. Changing files or reader types invalidates the prior review; closing cancels pending preparation. Installation verifies a staged package before activation. Original source records remain alongside the reading projection. Supported source formatting and links are rendered from a bounded semantic model; source scripts, CSS and regex rules stay inert. Unsupported content remains available as original text. Full-source temporary-filesystem checks cover all six types and offline reopening. Native checks cover all six successful reviews, installs, readers and restart rediscovery, including gzip Bible/devotional inputs. Original files and provenance fingerprints verify unchanged. Native invalid-file/stale-review/failure cases and platform release checks remain tracked in the completion ledger.

The separate **Advanced Bible inspection** tool remains read-only and retains its stricter semantic diagnostics. Its CLI equivalent, `npm run qa:mysword -- /absolute/path/to/module.bbl.mybible`, prints metadata, counts, SHA-256 and sample references without saving or uploading content. That diagnostic report is distinct from the current importer; see [GBF compatibility](docs/GBF-compatibility.md) for the original scanner inventory.

For bounded local performance evidence without exposing Scripture, run `npm run qa:mysword:benchmark -- /absolute/path/to/module.bbl.mybible [iterations]`; iterations default to 7 and must be between 3 and 25. The command performs one untimed warm-up, verifies identical count/reference diagnostics and unchanged source bytes on every measured pass, and reports preview, semantic-preflight and combined duration statistics plus coarse process-memory samples. It performs no network access, conversion, installation or file writes. Results from one desktop do not establish mobile or slower-device performance.

The plugin bundles **WEB, tagged KJV, a Berean interlinear companion, Strong’s Greek/Hebrew dictionaries, OpenBible cross-reference coordinates and Matthew Henry's Commentary**. KJV includes 31,102 verses with its own source numbering. In KJV, choose **Interlinear** to study the selected verse's Hebrew, Aramaic or Greek with explicitly labelled Berean English glosses. Display controls save word order, rows and original-text font/size. The complete companion retains 443,625 words; 17 source verse records supply no words and show that absence explicitly. See the [companion decision](docs/decisions/0014-berean-interlinear-companion.md) for source pins and verification. Berean English ranks do not establish alignment to KJV English wording.

Word study remains a separate tagged KJV display. Occurrences counts matching displayed tagged verses in this edition, deduplicates repeated tags within a verse and provides pages of 25 results. Later pages reuse verified verse coordinates and load the displayed books. Documented Robinson codes receive readable grammar labels; other schemas retain their original code. The [acceptance review](docs/specs/acceptance-2026-11-26.md) records rich-content, module-management and physical-device verification. Source coordinates are retained without inferred remapping. See the [rich-content decision](docs/decisions/0015-rich-resource-content.md), [cross-reference decision](docs/decisions/0002-bundled-cross-references.md), [commentary decision](docs/decisions/0003-bundled-commentary.md), [tagged-word decision](docs/decisions/0004-tagged-kjv-word-study.md) and [installed-study decision](docs/decisions/0009-installed-study-modules.md) for provenance and rebuild rules.

## Download and install this development preview

Build this branch with the commands below to create `dist/SwordDock-Bible-0.1.11-offline-preview.zip`. GitHub Releases also hosts the older VerseDock 0.1.0 preview. Both use the plugin folder name `versedock`. [Historical releases](https://github.com/dernestbank/versedock-obsidian/releases)

1. In Obsidian, create a dedicated **test vault** before installing; do not trial experimental builds in irreplaceable notes.
2. Extract the ZIP into `<vault>/.obsidian/plugins/versedock/`. The folder must contain `main.js`, `manifest.json`, `styles.css`, `assets/sql-wasm.wasm`, and `library/webp/manifest.json` plus per-book JSON files.
3. Open the vault in Obsidian, go to **Settings → Community plugins**, enable community plugins, and enable **SwordDock Bible** (older downloads still display **VerseDock (Preview)**). When upgrading from the previous name, fully quit and reopen Obsidian **after safely saving other vaults**; the running application may cache the previous command prefix. Do not rename the installed `versedock` folder or delete its `data.json`.
4. Open the command palette and run **SwordDock Bible: Open Bible Reader**.
5. For a study workflow, open **SwordDock Bible: Open Bible Study Desk**. It opens the Reader and Inspector together while returning focus to the Reader. Other available commands include Quick Jump, Quick Verse Insert, offline Search, and Module Library.

**Important:** Installing only `main.js`, `manifest.json`, and `styles.css` is *not enough* for this offline preview, because Bible text currently ships as separate files. The ZIP above contains the complete local library.

## Local development

Requirements: Node.js 22+, Python 3, and desktop Obsidian.

```bash
git clone https://github.com/dernestbank/versedock-obsidian.git
cd versedock-obsidian
npm ci --legacy-peer-deps
npm run check
npm run deploy:test
npm run package:preview
npm run smoke:preview
```

Open `test-vault` as a separate vault in Obsidian and enable the development plugin. The committed `library/webp` contains validated public-domain data, so an additional data download is not necessary just to build. To regenerate the source precisely, download `https://ebible.org/Scriptures/engwebp_vpl.zip` to `.research/engwebp_vpl.zip` and run `npm run library:build`.

## Data provenance

- [eBible.org WEB ENGWEBP VPL source](https://ebible.org/Scriptures/engwebp_vpl.zip), public-domain 66-book English translation, with attribution and version metadata in [library/webp/SOURCE-LICENSE.md](library/webp/SOURCE-LICENSE.md).
- Bible text is split by book, chapter, and verse **without editing verse wording**; original source text checksum is recorded in the local manifest.
- The *World English Bible* name is a trademark of its publisher; this application is not affiliated with it.
- The source code is [MIT licensed](LICENSE). The bundled WEB public-domain text carries its **separate** provenance and terms.

## Privacy and scope

Reading and search run locally without an account. Markdown study notes stay in the vault. Plugin settings store reading history, bookmarks, highlights and appearance. The Study Inspector can clear reading history independently. Vault sync and backup tools may copy plugin settings and installed resources. For an iPad vault, transfer the entire preview folder, including its bundled libraries and assets.

## Brand and design

Our preferred product name is **SwordDock Bible**, short name **SwordDock**. See [BRAND-GUIDELINES.md](BRAND-GUIDELINES.md) for brand usage, visual direction and the preliminary trademark-screening status. Prior VerseDock releases and plugin IDs remain valid for backward compatibility.

## Project plans and issues

See [STATUS.md](STATUS.md) for verified testing and known gaps; use GitHub Issues for bug reports. Project planning and design files currently live in the original development workspace and will be migrated selectively as documentation is prepared.

Release note: **0.1.0 is a developer preview, not the finished Logos/MySword-style study suite.**

Installable content is downloaded from the publisher when requested and is excluded from the preview ZIP. Resource readers preserve supported headings, emphasis, lists, quotations, tables, line breaks and embedded raster images. Internal topic/headword/commentary links stay within their source; Bible links open a bounded offline preview that identifies the selected edition. Journal links require retained source IDs: reinstall or reimport older saved packages to enable those addresses. Original source and unsupported-content notes remain accessible. Unknown Bible markers stay visible, and imported Bible notes/headings are available separately from Scripture through Source notes. Source CSS, scripts, unsafe URLs and remote images never execute in the reader. Desktop cancellation aborts the network request and supports verified saved-prefix resume; mobile requestUrl can finish an already-started transfer. A changed publisher checksum requires catalogue review rather than automatic acceptance.
