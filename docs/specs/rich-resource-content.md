# Rich resource content and internal links

The active goal authorizes supported formatting and clickable internal references
through completion. Continue the existing TypeScript/Obsidian architecture, local
source retention and verified installation boundary. This is the implementation
contract for that already-authorized capability; it does not require another
approval round or a new service/dependency.

## Content boundary

Module SQLite/HTML, attributes, hrefs, identifiers and images are untrusted.
Convert retained HTML into a bounded inert semantic tree, then construct only
allowlisted DOM elements through text APIs. Never attach source HTML, CSS, event
attributes, SVG, scripts, forms, embeds, remote images or executable URLs.
Preserve paragraphs/headings, emphasis, quotations, lists, tables, line breaks,
pre/code, superscript/subscript, embedded validated raster images, named anchors
and supported hyperlinks. Preserve raw source and explicitly disclose unsupported
or bounded-out content. Unknown wrapper tags retain text; active content stays
inert and available only in the raw-source disclosure. No silent text clipping.

The parser accepts at most 1 MiB of source, 20,000 nodes and 32 nesting levels.
Malformed publisher nesting must not discard ordinary text. Limit exhaustion
falls back to the existing complete plain projection with a clear explanation and
retained original source. Parse lazily for displayed entries, not the entire
installed library. Existing stored generations remain readable; retain Journal
source IDs in new preparations so internal addresses survive display-title changes.

## Link boundary

Use the publisher's [module format](https://www.mysword.info/modules-format)
and actual pinned corpora. Optional leading `#` and percent-escaped topic names
are supported. Resolve same-module `j`/`k` topics by retained source ID, `d`
headwords by the dictionary's normalized key, and `c` coordinates by retained
commentary ranges. Ambiguous or absent addresses are unavailable, never guessed.
Legacy packages lacking Journal IDs expose the required reinstallation explicitly.
Cross-entry fragment anchors work within the resolved entry. Plain local fragments
resolve only to unique retained anchors. Unsupported foreign-module addresses stay
visible with an explanation; they never fall through to another edition.

Bible `b` targets retain numeric/text references and valid ranges, including
cross-chapter ranges. A bounded offline preview names the selected Bible edition
and source resource; no guessed remapping is applied. Explicit Bible-edition
suffixes must resolve exactly to an available edition or show unavailable.
Cross-chapter previews load one chapter at a time. Invalid/nonexistent coordinates
show unavailable without navigating or substituting a nearby verse. Reader
navigation is an explicit preview action. Safe HTTPS external links may open only
on user activation; unsafe protocols and credentials are inert. Popup-note text
is rendered as text. No source-driven automatic network requests or filesystem
access occur.

Entry navigation retains each module's selection, scroll, bookmarks and search.
Book/devotional/atlas entry links open their exact target, including navigation
entries previously filtered out of devotional/graphics views. Dictionary links
change that dictionary's selected entry. Commentary links can preview their exact
source entry without losing the Reader context. Back navigation is available.
New async work is disposed with its view/modal and cannot write into a new source.

## Verification and structure

Parser/link models live under `src/core/`, rendering/modal code under `src/ui/`,
regressions under `tests/`, and corpus verifiers under `scripts/`. Follow existing
strict TypeScript, explicit discriminated unions, bounded input checks and native
theme variables. Keep feature logic in focused files rather than expanding the
large main/controller modules.

Commands: `npm test -- tests/resource-content.test.ts tests/resource-links.test.ts`,
`npm run check`, `node scripts/verify-rich-resources.mjs`, `npm run deploy:test`,
`npm run package:preview`, `npm run smoke:preview`.

Tests first: hostile HTML/URL/percent decoding, malformed nesting, full text,
resource bounds, repeated/absent aliases/anchors, actual topic IDs, exact reference
coordinates and ranges, unknown editions and state transitions. Full-source
verification measures formatting/link/anchor coverage for the real book,
devotional, atlas, commentary and dictionary corpora, and records unresolved
source targets explicitly. Native Obsidian must prove inline emphasis/lists,
internal entry/back/fragment navigation, passage previews with edition context,
dictionary/commentary links, keyboard focus, both themes and narrow layouts.
Bible GBF source/annotations must remain available explicitly rather than vanish.
Cross-platform/screen-reader/slower-device gates remain separate until observed.

## Bundled Matthew Henry continuation

Regenerate the same pinned MHC 2.2 archive through SWORD 1.9.0's public C API.
Preserve existing section grouping, coverage and omitted-coordinate reporting.
Schema 2 stores exact section OSIS once instead of shipping both a flattened
projection and duplicate source. Schema 1 remains readable as its plain fallback.
Validate source lengths and source-book checksums before parsing. Parse only the
sections displayed by the compact card or paginated detail, with a bounded cache.

Map source italic/bold/superscript/small-caps/underline and heading/paragraph/poetry
boundaries to the same inert semantic vocabulary. Preserve ordered source words
and the existing quoted-Scripture disclosures. Retain full original OSIS text.
Unsupported markup and limits must be explained without silent content loss.
Source OSIS references retain exact qualified book/chapter/verse endpoints;
space-separated references offer every valid target individually. Unknown,
unqualified, reversed or mixed-invalid addresses are unavailable; no inferred
context or nearest verse is substituted. The same fixed-edition offline preview
and explicit Reader action apply.

Before replacing assets, save an ignored independent plain-text/range baseline.
Compare all regenerated sources, text blocks, reference labels and targets against
the SWORD/Python oracle. Tests cover hostile markup, malformed references,
multiple targets, bounds, legacy assets, same-length tampering, stale loads and
lazy parsing. Run full checks, deterministic rebuild, package smoke and native
formatting/link/focus/theme checks when a native window is available.
