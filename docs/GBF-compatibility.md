# MySword GBF compatibility — SwordDock Bible

**Stage:** Source-preserving semantic inspection plus an isolated fail-closed DOM renderer, local unpublished 0.1.6 development candidate.

Reference: [MySword module format / Bible tags](https://mysword.info/modules-format). This reference defines GBF tag families, but publisher-specific rules, conversion fidelity, translations and rights still need separate review. No MySword module is redistributed here.

## Safely classified token families

- Structural: `CM`, `CI`, `PI0`–`PI7`, `PF0`–`PF7` (paragraph, separator, poetry layout), represented as typed inert events.
- Text presentation: balanced `FI/Fi`, `FO/Fo`, `FR/Fr` and `FU/Fu` pairs become typed format events while preserving their exact source spans.
- Paired annotations: balanced `RF/Rf` translator notes and `TS/Ts` titles become typed open/close events and exact extracted regions. Optional note labels and title levels are retained only as inert metadata.
- Cross-references: documented numeric `RX` formats plus the observed `b.c.v—c:v` cross-chapter form. Parsed coordinates remain inert metadata; invalid or out-of-pattern citations stay untouched and **unresolved**.
- Lexical/interlinear: `WG`, `WH`, `WT`, `Q/q`, `E/e`, `T/t`, `X/x`, `H/h`, `G/g`, standalone `D`, `wh`, `wg`, `wt`.
- HTML-like tags remain inert `html` tokens and are never inserted into the DOM as markup. Lexical/interlinear, unsupported, malformed and unknown tokens remain opaque semantic events.

## Semantic and rendering safety contract

Semantic interpretation is bounded to 32,768 Unicode characters and 32 nested paired markers. A verse is `fullyInterpreted` only when its token stream is lossless, balanced, free of unsupported escape/entity syntax, and contains no opaque events. Unsupported data remains present in the event stream and makes semantic rendering ineligible.

The isolated DOM renderer accepts only a `fullyInterpreted`, lossless document with zero opaque events. It builds a detached fragment, inserts every module string with `createTextNode`, uses only hardcoded tag/class names, keeps RX coordinates visible and inert, and replaces the target only after the complete event stream validates. It is not yet connected to module conversion, installation, or the reader UI.

## Source preservation contract

Each token records the original UTF-16 offset range and **exact original source substring**; concatenating all tokens must yield the source verse precisely. Do not normalize punctuation, whitespace, red-letter text, references, translator notes, Hebrew or Greek scripts. Unicode UTF-16 offsets are not raw UTF-8 byte offsets. No renderer or importer may silently drop an unsupported token.

## QA evidence: publisher-hosted WEB MySword module

The local ignored QA module (not committed or packaged) has 31,103 verses. Every verse round-trips exactly: 31,103 succeeded, zero source reconstruction failures. The conversion preflight reports 15,870 verses bearing markup, 71,821 recognized GBF markers, seven HTML markers, 424 validated RX markers, zero unresolved markers, zero tag-issue verses, 15,866 fully interpreted markup verses, seven opaque semantic events, 1,126 translator notes, and 169 titles. The `<RX 12.6.31—7:20>` token in Hebrews 11:34 is represented as 2 Kings 6:31–7:20 without following the link or changing its raw text. Conversion remains explicitly blocked.

## Release blockers

1. Define faithful semantics for lexical/interlinear markers and any explicitly approved HTML subset; the current safe renderer deliberately refuses both.
2. Compare parsed citation coordinates against authorized editions and define safe navigation behavior; parsing alone does not establish versification fidelity.
3. Review edition `VerseRules` and `CustomCSS` without executing untrusted rules; decide on a safe explicit subset.
4. Test against authorized real modules across multiple editions and canonical schemes, with resource/memory profiling on weaker machines.
5. Establish rights/provenance and a reversible, opt-in installation design before adding any conversion writer or public release.
