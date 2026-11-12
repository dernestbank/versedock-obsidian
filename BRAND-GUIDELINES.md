---
title: SwordDock Bible Brand & UI Guidelines
type: brand-guidelines
status: provisional-pending-trademark-clearance
date: 2026-11-12
---

# SwordDock Bible — brand and product language

**Product name:** SwordDock Bible
**Short brand:** SwordDock
**Category:** Bible Study Studio
**Tagline:** Read deeply. Study intelligently. Connect every insight.
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

An open book that forms an abstract upright blade through its central spine or bookmark shape. The sword symbolism should remain subtle and nonviolent; avoid imitating MySword logos or CrossWire SWORD trademarks. Icon remains provisional pending brand/IP review. Use SVG/vector geometry for final production rather than baking a raster image into the Obsidian ribbon.

## Compatibility and migration

The technical ID `versedock`, folder `.obsidian/plugins/versedock/`, saved setting keys, CSS selector namespace and view type IDs remain unchanged through this rebrand. They are implementation identifiers, not user-facing brand strings. The existing GitHub repository URL `dernestbank/versedock-obsidian` and published 0.1.0 ZIP remain valid legacy entry points. A future technical-ID migration requires explicit data-transfer and rollback tests.

## Clearance checkpoint

2026-11-12: preliminary public web, Obsidian directory and GitHub name searches found no obvious exact-name match. USPTO live database was not fully queryable in this session. A comprehensive trademark/common-law search and review for similar software/Bible-study products are still outstanding. This document is a product decision, not a legal clearance opinion.
