# Original-language interlinear

The worldwide 0.1.12 release also presents the companion alongside WEB. Previously installed tagged KJV editions retain the original workflow. The November decision and source audit follow.


The user selected “KJV with a clearly labelled Berean interlinear companion”
on November 18, 2026. The display keeps KJV Scripture alongside the selected
verse's original words and Berean glosses. This resolves the presentation choice;
it does not establish exact alignment to KJV English wording. Exact KJV alignment
is outside this selected companion presentation and must never be claimed.

## Source and data boundary

Use the acquired `bsb-interlinear` snapshot
`5d48325c55371efa69bc99debc2131d8974b15ab6116e49b00a07a95973c91be`.
The audited 1,189 chapter-file hash list has SHA-256
`3a58643986cb4f11cb45ecf1227ed33de1f1760bb0becc8556d0d6e99cf6420f`.
All 66 books, 31,102 verses and 443,625 words must survive conversion. Primary
Berean terms dedicate the material to the public domain; the API documents its
format adaptation and source-derived original/English ranks. Preserve both ranks,
script, language, transliteration, short/full grammar, raw identifiers and nullable
glosses without inventing absent values. Record original chapter hashes and the
conversion in the shipped source notice and manifest.

Package inert, checksum-bound chapter data. The lazy reader checks exact file
size/hash before parsing, validates coordinates/unique complete source ranks,
and caches at most two chapters. Manifest/data paths are fixed from known book
and chapter coordinates. Missing/corrupt/unavailable verses produce an explicit
unavailable state, never a nearest-verse or Strong's-based substitution.

## Display contract

Keep KJV Scripture and companion English glosses visibly identified. Each word
group is identified by its source verse and source position, with that exact
word's supplied rows. Original order and Berean English order use the recorded
source ranks; repeated Strong's numbers never merge or realign words. Hebrew and
Aramaic use RTL original-word order with isolated LTR English, identifiers and
grammar. Greek uses LTR. Missing optional rows are marked as not supplied.
Word selection/lexicon details retain the interlinear source identity and do not
create a fabricated KJV word selection. Definition lookup may normalize zero
padding only; it does not establish alignment.

Controls must support keyboard focus, remembered row preferences, original-text
font/size and source order. Selecting a new Reader verse or edition cannot leave
an earlier async response attached to the new context. The source and rights
notice must be available from the display. Native Hebrew/Greek, narrow panes and
both themes require observed acceptance; source assertions alone cannot pass them.

## Implementation and verification

Use the existing TypeScript/Obsidian architecture and scoped theme tokens. Build
the resource with a deterministic Python script under `scripts/`, data under
`library/interlinear/`, runtime validation under `src/core/`, and rendering under
`src/ui/`. Render source strings only through text APIs. No source HTML/CSS,
network fetch or remote fonts execute while reading.

Commands: `python3 scripts/build_interlinear.py`, `npm run check`,
`node scripts/verify-interlinear.mjs`, `npm run deploy:test`,
`npm run package:preview`, `npm run smoke:preview`.

Vitest regressions must reject corrupted hashes, hostile paths, invalid ranks,
duplicate words/verses, stale responses and source mismatches. Real corpus checks
compare every retained field and coordinate with its pinned input; Greek, Hebrew,
Aramaic, repeated identifiers and null rows need explicit samples. Package smoke
must prove all assets exist and reopen without network. Do not mark exact KJV
English alignment, mobile, screen-reader or broad release gates complete on the
basis of a labelled companion or automated corpus checks.

## Observed acceptance — November 18, 2026

The complete converted corpus matches all nine fields in each of 443,625 source
words: 300,668 Hebrew, 4,826 Aramaic and 138,131 Greek. The 31,102 verse records
include 17 empty word arrays. Those are preserved, rather than filling them from
KJV tags or a neighbouring record. There are 37,047 absent glosses, 6,038 absent
identifiers, 291 absent short grammar codes, 292 absent expanded grammar fields
and four absent transliterations. The product verifier records these counts in
the local ignored `.research/interlinear/product-verification.json`.

Native Obsidian 1.15.1 acceptance in the isolated test vault passes:

- Genesis 1:1: pointed Hebrew, both separate H0853 occurrences, missing-gloss
  marker, grammar and dictionary lookup. Left-arrow moves from source word four
  to five in original RTL order; Enter selects it.
- Recorded Berean English order displays source positions 1, 3, 4, 2, 5, 6, 7.
- John 3:16: accented Greek, G0025, “loved,” full aorist grammar and dictionary.
- Daniel 2:4: distinct Hebrew and Aramaic word identities, diacritics and grammar.
- Acts 8:37: explicit source absence alongside its retained KJV verse; next/previous
  companion navigation moves the Reader selection and retains focus.
- Grammar, Berean English order, Serif and 25 px survive app reload. Reading
  removes the companion; Interlinear restores it without changing the reference.
- Default light/dark and roughly 295 CSS-pixel Reader panes render with wrapping
  word groups and usable controls. The temporary split is closed afterward.
- The native test exposed KJV selection clipping when a loaded companion expanded.
  The final build scrolls the selected KJV verse into view after the panel settles;
  advancing from Acts 8:38 to 39 verifies the correction. Word selection also
  brings its detail into the companion's scroll area.

Captures 16–24 under ignored `.research/design-recovery/` record these checks.
No personal vault was modified. The CUA phase ended with its completion summary.
This is macOS/default-theme/keyboard evidence, not actual screen-reader, mobile,
other desktop OS or slower-device acceptance. Complete checks pass 335 tests in
52 files, strict TypeScript, production build, runtime audit (zero findings), and
the 1,475-entry clean-install/offline-restart package smoke.
