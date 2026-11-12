# VerseDock for Obsidian

**An independent, offline-first Bible reader and Markdown study companion for desktop Obsidian.** This is an early development preview, not yet an Obsidian Community Plugins listing.

VerseDock started as the *MySword+* project. It is **not affiliated with MySword, Obsidian, Logos, or other Bible software vendors.** Future MySword module compatibility is a planned feature, not part of the current release.

## What works in 0.1.0

- Read the **World English Bible (WEB, 66-book ENGWEBP edition)** offline, with an elegant theme-adaptive serif reader and adjustable typography.
- Jump to books and chapters, or type references such as `John 3:16`, `Ps 23`, and `1co 13:4-7`.
- Search local Bible text; preview and copy passages.
- Insert an attributed Bible callout or quotation directly into a Markdown note.
- Create and open linked study notes as **ordinary Markdown files**, not proprietary records.
- Save passage bookmarks and highlights.
- Open native Obsidian Reader, Study Inspector, Search, and Module Library views.
- Work without an account or analytics.

The plugin currently includes **only the WEB**. Commentaries, dictionaries, Strong's, interlinear support, parallel Bible views, MySword SQLite imports, download catalogs, and mobile validation are **not yet implemented**. The Inspector honestly displays uninstalled-resource states.

## Download and install this development preview

This preview is **not yet eligible for one-click installation from Obsidian's directory**. Download the `VerseDock-0.1.0-offline-preview.zip` asset from [GitHub Releases](https://github.com/dernestbank/versedock-obsidian/releases).

1. In Obsidian, create a dedicated **test vault** before installing; do not trial experimental builds in irreplaceable notes.
2. Extract the ZIP into `<vault>/.obsidian/plugins/versedock/`. The folder must contain `main.js`, `manifest.json`, `styles.css`, and `library/webp/manifest.json` plus per-book JSON files.
3. Open the vault in Obsidian, go to **Settings → Community plugins**, enable community plugins, and enable **VerseDock (Preview)**.
4. Open the command palette and run **VerseDock: Open Bible Reader**.
5. For a study workflow, open **VerseDock: Open Bible Study Desk**. Other available commands include Quick Jump, Quick Verse Insert, offline Search, and Module Library.

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
```

Open `test-vault` as a separate vault in Obsidian and enable the development plugin. The committed `library/webp` contains validated public-domain data, so an additional data download is not necessary just to build. To regenerate the source precisely, download `https://ebible.org/Scriptures/engwebp_vpl.zip` to `.research/engwebp_vpl.zip` and run `npm run library:build`.

## Data provenance

- [eBible.org WEB ENGWEBP VPL source](https://ebible.org/Scriptures/engwebp_vpl.zip), public-domain 66-book English translation, with attribution and version metadata in [library/webp/SOURCE-LICENSE.md](library/webp/SOURCE-LICENSE.md).
- Bible text is split by book, chapter, and verse **without editing verse wording**; original source text checksum is recorded in the local manifest.
- The *World English Bible* name is a trademark of its publisher; this application is not affiliated with it.
- The source code is [MIT licensed](LICENSE). The bundled WEB public-domain text carries its **separate** provenance and terms.

## Privacy and scope

No account, telemetry, or Bible API traffic is required for reading/search. Markdown study notes remain in the user's own vault. Binary Bible resources are placed in the plugin's local folder; **do not assume Obsidian Sync, Git or iCloud ignores that folder**. This prerelease is explicitly desktop-only; mobile support and sync behavior need more testing.

## Project plans and issues

See [STATUS.md](STATUS.md) for verified testing and known gaps; use GitHub Issues for bug reports. Project planning and design files currently live in the original development workspace and will be migrated selectively as documentation is prepared.

Release note: **0.1.0 is a developer preview, not the finished Logos/MySword-style study suite.**
