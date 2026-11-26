# Installed Bible, commentary and dictionary resources

Date: 2026-11-18. Status: implemented in the current candidate; native acceptance pending.

The full-completion goal extends the existing pinned installer to three additional
physical SQLite schemas. `normalizeModuleContent` dispatches to the study inspector
or Book-container converter. Both use the same reviewed download fingerprints,
bounded decompression and verified immutable-generation promotion. The catalogue
pins compressed and transport-decompressed representations independently.

Prepared study packages retain publisher metadata, exact source records and
coordinates alongside a plain reading projection. Imported Bibles implement the
same `BibleResource` contract as bundled editions. Reader, search, insertion,
source details and full Comparison use the selected resource; no installed ID
falls through to WEB content in the resource dock. Source numbering and incomplete
coverage remain explicit. A requested verse range with an internal gap fails.

Bible rendering interprets known source formatting and postfix lexical markers.
Added-word and red-letter switches are independent, including overlapping source
markers. Balanced notes/headings are excluded from Scripture text; an unclosed
annotation fails preparation. Unsupported markers remain visible. The source KJV
contains 175 unsupported marker diagnostics plus three overlapping-style pairs;
the full corpus is checked rather than assuming well-nested XML. Publisher regex
rules and CSS are retained as inert metadata and never evaluated.

The imported source keeps its own identity. In particular its lexical tags must
not be presented as CrossWire original-word alignment. Interactive word details
currently remain scoped to the bundled tagged KJV; original-language interlinear
work is a separate gate. Source notices and actual book coverage replace any
hard-coded public-domain/66-book claims on imported Reader surfaces.

Installed commentary matches every overlapping source range and retains book and
chapter introductions, with bounded pages. Dictionaries use bounded headword
pages and retain per-module query/entry state independently of Bible navigation.
Each panel shows the installed source, with exact original entry text available
in an inert disclosure. Rich formatting and internal links remain subsequent work.

`scripts/verify-study-installation.mjs` installs the actual pinned research SQLite
fixtures into a temporary filesystem, verifies content integrity, checks source
passage/headword access and discovers/reopens all three with network access
disabled. Counts: KJV 31,102, JFB 21,114, Easton 3,965. The source fixtures and
temporary stores are excluded from the distributable package. This proves the
core transaction and reopening path; it does not replace a native download,
switching, keyboard or visual check.

The current normalized packages measure 16,208,746 / 30,587,899 / 6,530,300 bytes,
respectively. Browser/native performance, general local-file imports, repair and
interrupted-stage management remain tracked in the full completion ledger.
