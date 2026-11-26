# Installable Book, Devotional and Graphics resources

Date: 2026-11-18. Status: implemented; desktop verification recorded in STATUS.md.

The user authorized automatic installation and readers for these three resource
types. Add one catalogue-to-Resources path for the three inspected publisher
downloads. Retain direct-file and external exploration routes. Existing Bible,
commentary and dictionary implementations remain available.

The download boundary accepts only the curated HTTPS URL and a pinned SHA-256.
Bound compressed and decompressed sizes, support cancellation, verify gzip and
SQLite, validate physical Details/Journal/Data schemas, and never execute module
HTML, scripts, CSS, external image URLs or SQL from metadata. Normalize text to
inert paragraphs and only accept embedded raster images with verified magic.
Devotional dates are parsed only from the inspected named-source identifier
convention; do not infer arbitrary date associations.

Store a normalized package with its checksum in a unique staging directory.
Read both content and manifest back and verify before promoting an immutable generation by rename.
Failed/cancelled jobs expose no installed resource; an older generation remains
usable. Discover and Downloads expose progress, cancel, failure/retry and Open.
Downloads are user initiated; no background auto-update or content redistribution.

Resources adds the installed modules without changing the existing Inspector.
Remember each module's entry and scroll position. Books offer contents, search,
previous/next and bookmarks. Devotionals add date/Today and AM/PM when supplied,
with an explicit Markdown reflection action. Graphics offer an image index,
captions, attribution, zoom, fit and an overflow viewport for panning. Bible
navigation must not move independent reading modules or steal their focus.

Verification includes synthetic SQLite fixtures, malicious HTML/image references,
invalid schemas, gzip expansion limits, checksums, cancellation, failed writes,
restart discovery, and the actual three source modules. Source bytes are research
fixtures only and are excluded from the distributable preview.

The publisher returns Content-Encoding: x-gzip. Obsidian may therefore return
the decompressed SQLite body. The catalogue pins both representations and the
installer always checks the exact database fingerprint before conversion.
Cancellation uses a logical abort around Obsidian requestUrl; an in-flight HTTP
transfer can finish, but its result cannot prepare or activate after cancellation.
A 60-second timeout releases the queue. Compressed/source-size checks apply to
these fixed catalogue artifacts; requestUrl buffers a response before returning.

Inspected artifacts: All of Grace (208,791 compressed / 1,081,344 database bytes),
Morning and Evening (1,271,459 / 4,663,296), Sunday School Atlas
(7,525,853 / 7,572,480). Both fingerprints are recorded in reading-catalogue.ts.
There is no module mirror, bundled copy or dynamic remote catalogue execution.
Source documentation: https://www.mysword.info/modules-format and the three
official download pages preserved in each catalogue entry.
