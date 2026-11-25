# Rich source content and exact internal addresses

Accepted: November 18, 2026. This implements the active goal's richer resource
content while retaining the existing source and installation boundaries.

Retained module HTML is parsed into an inert, bounded semantic tree. The UI
constructs allowlisted elements through text APIs; source HTML never enters a
browser HTML parser. This avoids automatic remote image requests as well as
script, event-handler and source-CSS execution. Supported headings, emphasis,
lists, quotations, tables, line breaks, code and validated embedded raster images
remain readable. Unique named anchors are keyboard destinations. Duplicate
anchors/attributes, unsafe links and unsupported active content stay inert.

The parser limits source length, nodes and depth. Exhaustion selects the complete
existing plain projection with an explanation, rather than a partial rich tree.
Original source remains available as text. Parsing happens for displayed entries;
the reader does not build the whole library's DOM in advance.

New Journal preparations retain exact source IDs separately from display titles.
Entry links use those IDs, dictionary links use normalized headword keys, and
commentary links use retained source-coordinate ranges. Missing, ambiguous and
foreign targets are explained without title guessing or nearest-coordinate
substitution. Older Journal packages remain readable and can be reinstalled or
reimported to acquire source IDs. Own-module prefixes require the exact installed
ID or retained publisher abbreviation. A shared bounded Details parser retains
that abbreviation and the other inert source metadata for all six module kinds;
stored optional metadata is validated for Journal resources as well as study
resources. Legacy packages need reinstallation to acquire missing metadata.

Bible references open an offline preview naming its fixed edition and originating
resource. Cross-chapter ranges load one chapter at a time, at most 25 visible
verses per page. Reader navigation is a separate explicit action. Exact source
endpoints must exist. GBF notes/headings are shown separately from Scripture, with
their original source available, rather than being inserted into verse wording.

Book/devotional/atlas navigation preserves search, entry and scroll state with
local Back navigation. Devotional and atlas contents/index entries are available
alongside dated readings and maps. Commentary previews retain Reader context.
Dictionary links retain their source/query context. Closing views or changing
sources invalidates pending async rendering.

The alternative of inserting sanitized HTML would still require a browser
parsing boundary and a separate resource-loading policy. Flattening all text
would continue losing supported formatting and useful navigation. The semantic
tree keeps a small explicit rendering vocabulary and full raw-source disclosure.

Verification: 352 tests / 56 files, strict TypeScript and production build pass.
The full-source verifier checks all 56,984 retained records from six pinned
SQLite fixtures. All 25,882 non-Bible entries match an independent Python
HTMLParser text oracle; none exhaust parser bounds. Source typos, missing targets
and unsupported links are counted rather than repaired by inference. Native book
contents/back, passage preview and devotional index/fragment navigation pass;
remaining rich UI acceptance is tracked separately. Bundled Matthew Henry content
used its existing plain projection at this checkpoint. Decision 0016 subsequently
extends it with retained OSIS, supported emphasis and source citations; its native
acceptance remains separate.

Occurrence pagination also now retains a bounded two-key cache of verified verse
coordinates. Later pages hydrate displayed books rather than verifying all 66
books again. Initialization invalidates the cache and stale reads. Tests cover
read counts and stale reinitialization; this is not slower-device acceptance.
