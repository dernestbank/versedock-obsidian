# ADR-003: Bundle MHC commentary through the SWORD engine at build time

## Status

Accepted for the local development preview

The source-flattening portion is superseded by
[0016](0016-bundled-commentary-rich-source.md). The pinned source, engine and
coverage decisions below remain; the historical implementation is preserved here.

## Date

2026-11-16

## Context

The Study dock's Commentary card had no content. The reference shows Matthew Henry commentary linked to the active passage, with a preview and a longer reading view.

[CrossWire's MHC module page](https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=MHC) and its archive configuration identify edition 2.2 (2022-08-29), KJV versification and Public Domain distribution. Its provenance credits CCEL and Logos Research. The source archive SHA-256 is `6bcb936873ca144e317805e5c1677940fd86e2403f7c14517752e44f25c8882b`.

## Decision

Use the public-domain complete edition as immutable assets in `library/mhc`, separately from WEB and cross-reference coordinates. Generate one JSON file per canonical book plus a manifest and source/license notice. This follows the existing bundled-asset lifecycle; it does not implement or authorize the proposed MySword importer.

At build time, use SWORD 1.9.0's public C API through Python ctypes. Read only the seven allowlisted files from the pinned ZIP into a fresh temporary directory. Check the module's resolved data path and version. For each local WEB coordinate, set the engine key and verify that its returned OSIS reference matches before reading its raw entry. This avoids implementing a private SWORD binary format or inferring the end of a commentary range from the next heading. Adjacent verses within one chapter are grouped only when the engine returns identical source text.

Export ordered plain-text headings, paragraphs and numbered quotation blocks. The latter are identified by multiple source superscript markers within a paragraph; the words are preserved in all cases. Flatten emphasis and source reference links. Do not export book/chapter introduction keys, website editorial front matter, CSS or executable markup. The full section can include source Scripture quotations; these retain the source edition's wording and do not become WEB text.

The runtime verifies manifest structure, per-book size/checksum, ordered non-overlapping section ranges and text-block bounds. It caches two books. Lookup returns sections overlapping the selected verse/range, or all sections of the requested chapter. Study previews the first paragraph and labels the actual section range. The detailed Commentary tab initially renders two sections and twenty blocks per section, with controls to continue reading and focus the newly appended content. Quotation blocks remain complete inside native disclosures, initially collapsed so the leading Scripture quotation does not bury the commentary in narrow docks. Inspector Follow/Pin controls the passage used by both views.

Display source credit and public-domain status in the panel and library. The engine remains a build-time dependency: no SWORD code or binary is linked into or distributed with the plugin. The generated commentary output is public-domain text.

## Alternatives considered

### Concise MHC edition

The source/coverage check found that the public MHCC 2.0 module returned no entry for John 3:16. Its source headings also did not support assigning that entry to this verse without inference. The complete MHC 2.2 edition resolves the selection correctly through the engine.

### Directly parse the compressed SWORD files

Rejected because the maintained engine already supplies canonical key resolution and linked-entry behavior. A custom binary reader would add format and versification risk without improving the dock.

### Render source OSIS/HTML in Obsidian

Rejected for this iteration. Plain text preserves the commentary words and headings while keeping source markup out of the live DOM. Faithful emphasis and active source links require a separate renderer contract.

## Consequences

The exported data is approximately 39.2 MB before compression and includes 4,249 sections covering 31,096 local coordinates. Four coordinates return no entry: `Josh.18.1`, `1Sam.25.1`, `2Sam.22.1`, `Prov.11.20`. Three WEB coordinates do not resolve to the same KJV coordinate: `Rom.14.24`, `Rom.14.25`, `Rom.14.26`. The manifest and source notice list these omissions. No coordinate is silently remapped. Source ranges may cover more verses than the user's selection.

All 66 regenerated book checksums matched on a second export. Unit coverage verifies section lookup, overlapping ranges, generated coordinates/checksums, missing/tampered content, invalid metadata, bounded reads and storage measurement. Native QA covers full-text continuation, passage opening, Follow/Pin, chapter-section continuation, library/storage inventory and both color schemes. Lexical data, another Bible edition and complete visual-reference fidelity remain separate work.

Ordinary builds use the checked-in generated files. To reproduce the assets, install SWORD 1.9.0, place the exact archive at `.research/MHC.zip`, then run:

```sh
npm run commentary:build -- --sword-library /absolute/path/to/libsword.dylib
```

On Linux, pass the installed `libsword.so` path or allow the system library lookup. The builder pins the source archive hash and edition; a changed upstream archive requires source review and an explicit update. Build tools and source archives are excluded from the preview ZIP.
