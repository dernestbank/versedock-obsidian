# SwordDock Bible

**An independent, offline-first Bible reader and Markdown study companion for desktop Obsidian.** This is an early development preview, not yet an Obsidian Community Plugins listing.

SwordDock Bible was previously developed under the working titles *MySword+* and *VerseDock*. It is **not affiliated with MySword, Obsidian, Logos, or other Bible software vendors.** Preview-only MySword Bible inspection is now being developed; full import and compatibility are not yet supported.

## What works in the 0.1.x developer previews

- Read the **World English Bible (WEB, 66-book ENGWEBP edition)** offline, with an elegant theme-adaptive serif reader and adjustable typography.
- Jump to books and chapters, or type references such as `John 3:16`, `Ps 23`, and `1co 13:4-7`.
- Search exact phrases or all entered words across the whole Bible, the current book, or either testament; preview and copy passages.
- Insert an attributed Bible callout or quotation directly into a Markdown note.
- Create and open linked study notes as **ordinary Markdown files**, not proprietary records.
- Save passage bookmarks and highlights.
- Reopen up to fifty recent passages from the Study Inspector's bounded reading history.
- Open native Obsidian Reader, Study Inspector, Search, and Module Library views.
- Work without an account or analytics.

### Local MySword Bible inspection (0.1.2 developer candidate)

The command **Inspect local MySword Bible module (preview)** and the Module Library button open a private, local file picker for a user-owned `.bbl.mybible` SQLite database (maximum 24 MiB). SwordDock checks the SQLite signature, schema, integrity, numeric references, duplicate verses and row counts, and shows read-only metadata and **literal-text** sample verses. No module is installed, modified or uploaded. Embedded MySword HTML, CustomCSS and Bible tags are **never executed or formatted**. Copyright, source quality and versification are not validated by the preview, and other module types or encrypted/ZIP modules are not supported.

The preview uses bundled [sql.js](https://github.com/sql-js/sql.js) (MIT licensed), including its local WebAssembly engine, so it works without a remote SQLite service. SQL.js is packaged with its license in `assets/LICENSE-sql.js.txt`. A publisher-hosted MySword **World English Bible** test module (August 2025) has passed read-only inspection on macOS; other real-world editions, memory profiling on slower devices, content permissions and full conversion remain release gates. The publisher-hosted SQLite module is **not part of this repository or release ZIP**.

For reproducible local inspection of your own *unencrypted* module, use `npm run qa:mysword -- /absolute/path/to/module.bbl.mybible`. The command prints metadata, counts, SHA-256 and sample *references* only—never the verse text—and does not upload, install or save a copy. As of **0.1.3**, the inspector also offers **Check text-conversion readiness (no installation)**. This explicitly detects unsupported markup, Strong's flags, right-to-left data, and invalid canonical chapter numbers; even a passing technical report is **not** a grant of copyright permission or proof of versification accuracy, and no installation is implemented. The publisher-hosted WEB MySword module fails this strict check because 15,870 verses contain markup, which must be parsed losslessly rather than stripped. Version **0.1.4** added a source-preserving GBF tag scanner; **0.1.5** added bounded RX reference semantics. Version **0.1.6** adds typed semantic inspection for supported typography, layout, translator notes and titles, plus an isolated safe-DOM renderer that refuses any opaque event. Version **0.1.7** preserves keyboard focus after asynchronous preflight checks. Version **0.1.8** cooperatively yields between bounded verse batches so the same read-only semantic report does not run as one monolithic UI task. Version **0.1.9** adds bounded, migration-safe local reading history. Version **0.1.10** adds keyboard-complete Inspector tab navigation for narrow panes; **0.1.11** repairs Obsidian's live focus-manager handling so only the selected tab participates in normal Tab order. No semantic or accessibility work is wired to conversion or installation. Unknown, unbalanced, lexical/interlinear and HTML markers remain visible and blocked; VerseRules and CustomCSS are never interpreted or executed. Even a source-perfect semantic scan is not proof of faithful formatting, edition versification, rights, or safe installation. The current supported marker inventory and unresolved cases are documented in [GBF compatibility](docs/GBF-compatibility.md).

For bounded local performance evidence without exposing Scripture, run `npm run qa:mysword:benchmark -- /absolute/path/to/module.bbl.mybible [iterations]`; iterations default to 7 and must be between 3 and 25. The command performs one untimed warm-up, verifies identical count/reference diagnostics and unchanged source bytes on every measured pass, and reports preview, semantic-preflight and combined duration statistics plus coarse process-memory samples. It performs no network access, conversion, installation or file writes. Results from one desktop do not establish mobile or slower-device performance.

The plugin currently includes **only the WEB**. Commentaries, dictionaries, Strong's, interlinear support, parallel Bible views, MySword SQLite **installation/conversion**, download catalogs, and mobile validation are **not yet implemented**. The Inspector honestly displays uninstalled-resource states.

## Download and install this development preview

This preview is **not yet eligible for one-click installation from Obsidian's directory**. The original public 0.1.0 preview was released under the previous VerseDock name. Until a SwordDock Bible release is published, download the existing `VerseDock-0.1.0-offline-preview.zip` asset from [GitHub Releases](https://github.com/dernestbank/versedock-obsidian/releases). Its installed folder and manifest ID remain `versedock`. The locally staged **0.1.11 development candidate** is named `SwordDock-Bible-0.1.11-offline-preview.zip`, but it is not yet a published release. It adds safe Quick Verse Insert, library integrity checks, MySword read-only inspection, a non-destructive cooperative conversion-readiness preflight, inert RX validation, bounded GBF semantic diagnostics, retained keyboard focus, bounded reading history, scoped and cancellable offline Bible search, keyboard-complete Inspector tabs with an Obsidian-tested roving focus repair, privacy-safe missing-resource errors, and an in-app recheck flow for a restored WEB manifest without restarting Obsidian.

1. In Obsidian, create a dedicated **test vault** before installing; do not trial experimental builds in irreplaceable notes.
2. Extract the ZIP into `<vault>/.obsidian/plugins/versedock/`. The folder must contain `main.js`, `manifest.json`, `styles.css`, `assets/sql-wasm.wasm`, and `library/webp/manifest.json` plus per-book JSON files.
3. Open the vault in Obsidian, go to **Settings → Community plugins**, enable community plugins, and enable **SwordDock Bible** (older downloads still display **VerseDock (Preview)**). When upgrading from the previous name, fully quit and reopen Obsidian **after safely saving other vaults**; the running application may cache the previous command prefix. Do not rename the installed `versedock` folder or delete its `data.json`.
4. Open the command palette and run **SwordDock Bible: Open Bible Reader**.
5. For a study workflow, open **SwordDock Bible: Open Bible Study Desk**. Other available commands include Quick Jump, Quick Verse Insert, offline Search, and Module Library.

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

No account, telemetry, or Bible API traffic is required for reading/search. Markdown study notes remain in the user's own vault. Reading history, bookmarks, highlights and appearance are stored in the existing plugin settings; the Study Inspector can clear reading history independently. Binary Bible resources are placed in the plugin's local folder; **do not assume Obsidian Sync, Git, iCloud or another backup tool ignores plugin settings or resources**. This prerelease is explicitly desktop-only; mobile support and sync behavior need more testing.

## Brand and design

Our preferred product name is **SwordDock Bible**, short name **SwordDock**. See [BRAND-GUIDELINES.md](BRAND-GUIDELINES.md) for brand usage, visual direction and the preliminary trademark-screening status. Prior VerseDock releases and plugin IDs remain valid for backward compatibility.

## Project plans and issues

See [STATUS.md](STATUS.md) for verified testing and known gaps; use GitHub Issues for bug reports. Project planning and design files currently live in the original development workspace and will be migrated selectively as documentation is prepared.

Release note: **0.1.0 is a developer preview, not the finished Logos/MySword-style study suite.**
