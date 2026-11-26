---
title: SwordDock Bible Brand & UI Guidelines
type: brand-guidelines
status: production-artwork-complete
date: 2026-11-26
---

# SwordDock Bible — brand and product language

**Product name:** SwordDock Bible
**Short brand:** SwordDock
**Category:** Bible Study Studio
**Product descriptor:** Offline Bible study for Obsidian.
**Developer:** QuantGist
**Positioning:** An independent, offline-first Bible study workspace inside Obsidian.

## Name usage

- First mention: **SwordDock Bible**. Subsequent short mentions: **SwordDock**.
- Manifest display name: `SwordDock Bible`.
- UI destinations: `Bible Reader`, `Study Inspector`, `Search`, `Module Library`, `Bible Study Desk`.
- When the product needs a visible qualifier, use **Developer Preview** in copy or release metadata, not as part of the official brand.
- Never present the plugin as part of or endorsed by **MySword**, **CrossWire SWORD**, **Obsidian**, **Logos**, or any Bible translation publisher.
- Legacy project terms **MySword+** and **VerseDock** may appear only in historical release notes, migration notes, installation IDs/URLs, or documentation about compatibility.

## Design direction

- Use theme-adaptive Obsidian surface, text, border and accent tokens instead of hard-coded purple-on-black UI; don't override global editor styles.
- Scripture is the focal point: editorial serif by default, comfortable 60–68ch line length, 1.55–1.85 line height, low-contrast superscript verse numbers, visually clear focus/selection.
- Keep controls in native panes; a user can open the reader alone or assemble the Bible Study Desk.
- Premium feel is from rhythm, hierarchy and progressive disclosure, not unnecessary decoration.
- Support light/dark themes, narrow panes, keyboard navigation, reduced motion and clear disabled states.
- Do not depict commentary, lexicon, parallel editions, or module downloads as working in the v0.1.0 preview; mockups must disclose future features.

## Icon direction

The final mark uses two solid pages and a notched bookmark. The open gutter stays visible at ribbon size. The plugin uses the monochrome SVG with the host’s text color. The release wordmark uses outlined Newsreader lettering. Master vectors, export sizes, palette values and clear-space rules are in the [brand pack](assets/brand/README.md).

## Compatibility and migration

The technical ID `versedock`, folder `.obsidian/plugins/versedock/`, saved setting keys, CSS selector namespace and view type IDs remain unchanged through this rebrand. They are implementation identifiers, not user-facing brand strings. The existing GitHub repository URL `dernestbank/versedock-obsidian` and published 0.1.0 ZIP remain valid legacy entry points. A future technical-ID migration requires explicit data-transfer and rollback tests.

## Clearance checkpoint

### Preliminary exact-name screening — 2026-11-15

The following reproducible checks found no exact `SwordDock` name collision:

- The official [USPTO Trademark Search](https://tmsearch.uspto.gov/) Wordmark query for `SwordDock`, with live and dead filings enabled, returned zero records.
- The official Obsidian [community plugin list](https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json) contained no `SwordDock` name or ID. The broader Bible-plugin category is crowded, so this result distinguishes the name only; it does not establish market distinctiveness.
- [GitHub repository search](https://github.com/search?q=SwordDock&type=repositories) returned no exact-name repository; its only substring result was the unrelated 2018 `SwordDocker` repository. The [npm registry search](https://www.npmjs.com/search?q=sworddock) returned no `sworddock` package.
- Exact public-web queries for `SwordDock` and `SwordDock Bible` returned no indexed result in the search service used for this checkpoint.

These are narrow exact-name checks, not a comprehensive clearance search. They do not cover unregistered/common-law use, confusingly similar spellings or meanings, state registrations, international registers, app stores, domains, social handles, logos, or design marks. Search results can change after the date above. The USPTO itself recommends searching similar marks and coordinated classes, not only exact terms. Professional trademark counsel should review the name and icon before a stable/public-directory launch.

**Review scope.** The earlier exact-name screen and November 26 public-web recheck inform the product decision. No professional legal clearance opinion is recorded. The stable artwork and the historical installation ID `versedock` are documented above.
