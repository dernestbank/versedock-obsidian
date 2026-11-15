# MySword GBF compatibility — SwordDock Bible

**Stage:** Source-preserving lexical scanner plus bounded RX semantic inspection, local unpublished 0.1.5 development candidate.

Reference: [MySword module format / Bible tags](https://mysword.info/modules-format). This reference defines GBF tag families, but publisher-specific rules, conversion fidelity, translations and rights still need separate review. No MySword module is redistributed here.

## Safely classified token families

- Structural: `CM`, `CI`, `PI0`–`PI7`, `PF0`–`PF7` (paragraph, separator, poetry layout).
- Paired annotations: `FI/Fi`, `FO/Fo`, `FR/Fr`, `FU/Fu`, `RF/Rf`, `TS/Ts`; optional translator-note/link and title-level openers are recognized without interpretation.
- Cross-references: documented numeric `RX` formats plus the observed `b.c.v—c:v` cross-chapter form. Parsed coordinates remain inert metadata; invalid or out-of-pattern citations stay untouched and **unresolved**.
- Lexical/interlinear: `WG`, `WH`, `WT`, `Q/q`, `E/e`, `T/t`, `X/x`, `H/h`, `G/g`, standalone `D`, `wh`, `wg`, `wt`.
- HTML-like tags remain inert `html` tokens and are never inserted into the DOM as markup. Unsupported and malformed tags are reported separately.

## Source preservation contract

Each token records the original UTF-16 offset range and **exact original source substring**; concatenating all tokens must yield the source verse precisely. Do not normalize punctuation, whitespace, red-letter text, references, translator notes, Hebrew or Greek scripts. Unicode UTF-16 offsets are not raw UTF-8 byte offsets. No renderer or importer may silently drop an unsupported token.

## QA evidence: publisher-hosted WEB MySword module

The local ignored QA module (not committed or packaged) has 31,103 verses. Every verse round-trips exactly: 31,103 succeeded, zero source reconstruction failures. The conversion preflight reports 15,870 verses bearing markup, 71,821 recognized GBF markers, seven HTML markers, 424 validated RX markers, zero unresolved markers and zero tag-issue verses. The previously unresolved `<RX 12.6.31—7:20>` token in Hebrews 11:34 is now represented as 2 Kings 6:31–7:20 without following the link or changing its raw text. Conversion remains explicitly blocked.

## Release blockers

1. Define and test semantic rendering for translator notes, reference links, red-letter annotations, poetry, titles, lexicon/interlinear tags, and HTML under a strict safety policy.
2. Compare parsed citation coordinates against authorized editions and define safe navigation behavior; parsing alone does not establish versification fidelity.
3. Review edition `VerseRules` and `CustomCSS` without executing untrusted rules; decide on a safe explicit subset.
4. Test against authorized real modules across multiple editions and canonical schemes, with resource/memory profiling on weaker machines.
5. Establish rights/provenance and a reversible, opt-in installation design before adding any conversion writer or public release.
