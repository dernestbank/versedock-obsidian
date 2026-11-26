# Retain original OSIS for bundled Matthew Henry commentary

Accepted: November 18, 2026. Supersedes the flattening decision in 0003; its
pinned archive, SWORD build-time boundary, source edition and coverage remain.

Schema 2 stores exact original section OSIS once, replacing duplicate flattened
text assets. The same SWORD 1.9.0 public C API exports the pinned MHC 2.2 archive.
All 4,249 section ranges and their complete ordered text blocks match the saved
pre-migration baseline. The same 31,096 coordinates are covered; four absent and
three unmatched coordinates remain explicit. Separate book/chapter introduction
keys are still excluded. No source numbering is remapped.

The runtime checks each book's size/hash and source/range bounds. It retains two
raw books and at most four parsed section trees. Lookup does not parse every
section in a chapter: the compact card parses its displayed section and detail
parses its displayed two-section page. Reinitialization clears both caches and
rejects stale reads/initializations. Schema 1 assets remain readable as plain
text. Legacy JSON cannot supply trusted semantic nodes; only its validated kind
and text fields reach the plain renderer.

A pure bounded parser maps OSIS headings, paragraph/poetry boundaries, italic,
bold, superscript, underline and small caps to the existing inert semantic
vocabulary. The same text-API renderer is shared with imported resources. It
never attaches OSIS, source CSS, event handlers or raw URLs to the DOM. Unknown
wrappers preserve ordinary text; active content is quarantined. Limit exhaustion
shows an explicit explanation and the complete original OSIS. The established
quotation disclosures and twenty-block continuation controls remain.

Qualified references use the canonical book table and its explicit aliases.
No missing book/chapter context is inferred. A citation containing multiple
qualified addresses retains all targets in a source-reference selector inside
the fixed-edition offline preview. Any malformed member makes the original label
inert. Out-of-canon books remain unavailable. Known chapters are checked before
showing a range; verse endpoints are checked against the chapter loaded for
display. Missing coordinates never become nearby verses. Reader navigation is
an explicit action, separate from previewing.

An independent Python HTMLParser oracle produced directly from SWORD verifies
all exact source strings, ordered text blocks, 199,876 emphasis markers and
62,374 citation labels. Of these citations, 62,302 have supported qualified
syntax, including 241 with multiple targets; 72 have unsupported/incomplete
addresses. Endpoint checks find 227 supported addresses missing at least one
endpoint in bundled KJV and 237 in WEB. Those remain source errors or edition
differences and are not repaired. Syntax support does not prove a verse exists.
All actual source sections fit the parser bounds.

The alternative of storing both raw OSIS and a complete generated rich tree
would add duplicated content and a second trusted-data boundary. Source-only
assets add about 9.4 MB before compression over the previous projection and
permit explicit raw-source inspection. Parsing only displayed sections bounds
runtime work; representative slower-device acceptance remains open.

Verification: the focused tests, full check, `qa:commentary-content`, a second
byte-identical 68-file SWORD export and preview smoke. Disabling checksum
enforcement makes the same-length source-tampering regression fail; enforcement
is restored. Hostile markup/attributes, legacy-node stripping, stale work and
nonexistent far chapters have regressions. Native emphasis/citation selection,
quotation/continuation focus, narrow/light/dark and actual screen-reader checks
remain open while CUA returns `cgWindowNotFound`. Automated checks do not close
those gates or the full goal.

Rebuild/verify after placing the pinned archive at `.research/MHC.zip`:

```sh
npm run commentary:build -- --sword-library /absolute/path/to/libsword.dylib
npm run qa:commentary-content
```

The builder writes its independent oracle under ignored `.research/modules/`.
Neither the engine, raw archive nor oracle ships in the preview package.
