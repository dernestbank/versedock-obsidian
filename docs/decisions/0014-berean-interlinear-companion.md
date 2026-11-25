# KJV with a Berean interlinear companion

Accepted: November 18, 2026. The user selected this presentation after being
offered a companion or a requirement for exact KJV English word alignment.

KJV remains the Scripture edition. Its Interlinear display adds a selected-verse
Berean companion with original Hebrew, Aramaic and Greek, source glosses,
transliteration, identifiers and supplied short/full grammar. Both source order
and Berean English order use recorded ranks. Dictionary lookup normalizes ID
padding only; it never merges or aligns repeated identifiers.

The bundled public-domain corpus is pinned to the source snapshot and the 1,189
acquired chapter hashes. A deterministic converter preserves all nine word
fields in compact JSON tuples (52,486,570 chapter bytes). The generated manifest
is pinned in runtime code; each lazy-loaded chapter is size/hash checked and
structurally validated. A two-chapter cache bounds memory. Reinitialization and
panel disposal invalidate older async work. No network, HTML, CSS or remote font
is needed to read the companion.

All 31,102 source verse coordinates are retained, including 17 records with no
words. Those records show source absence beside the KJV verse. Nearest-verse
fallbacks and Strong's joins would conceal edition differences and are excluded.

The panel follows the Reader's selected verse (first source verse for a chapter
selection), with previous/next verse buttons. Original-order Hebrew/Aramaic runs
right-to-left; other rows are isolated left-to-right. Roving arrow focus follows
the physical direction. Display controls remember row visibility, font, size and
order. Original-source selection opens an attributed dictionary/grammar detail
without fabricating a tagged KJV selection.

Validation: `npm run check`, `node scripts/verify-interlinear.mjs`, package smoke
and native Obsidian checks. The full-corpus verifier compares every word field
against the pinned raw input. Tests reject same-length tampering, oversized files,
invalid ranks/paths, stale reinitialization and cache growth. Removing the chapter
checksum comparison makes the tampering regression fail. Native evidence is
tracked in `docs/specs/interlinear.md` and the completion ledger.

This implements the selected companion presentation. Exact KJV English alignment
is not a claim of this feature. Mobile, other desktop OSes, actual screen readers
and slower devices require separate release evidence.
