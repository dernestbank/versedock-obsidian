#!/usr/bin/env python3
"""Convert the pinned OpenBible coordinate download to verified offline book files.

Read one explicitly named ZIP entry; never extract third-party archive paths.
Only coordinates present in bundled WEB, with targets within one chapter, ship.
"""
import hashlib
import json
from pathlib import Path
import re
from collections import Counter
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
SOURCE_SHA256 = "b54a2a381e3eb587ca4ea34ba3f1d052923c49625d857014041f3254eb7c4f1e"
archive = ROOT / ".research/openbible-cross-references.zip"
assert archive.stat().st_size < 12_000_000
assert hashlib.sha256(archive.read_bytes()).hexdigest() == SOURCE_SHA256, "Unexpected source revision"
with ZipFile(archive) as source:
    assert source.namelist() == ["cross_references.txt"]
    assert source.getinfo("cross_references.txt").file_size < 12_000_000
    lines = source.read("cross_references.txt").decode("utf-8-sig").splitlines()
assert lines[0] == "From Verse\tTo Verse\tVotes\t#www.openbible.info CC-BY 2026-11-16"

books = re.findall(r'"([A-Z0-9]{3})\|([^|]+)\|', (ROOT / "src/core/books.ts").read_text())
assert len(books) == 66
valid = set()
for code, osis in books:
    book = json.loads((ROOT / "library/webp" / (code + ".json")).read_text())
    for chapter in book["chapters"]:
        for verse in chapter["verses"]:
            valid.add(f'{osis}.{chapter["chapter"]}.{verse["verse"]}')

grouped = {osis: {} for _, osis in books}
counts = Counter()
coordinate = re.compile(r"^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$")
for line in lines[1:]:
    origin, target, score = line.split("\t")
    votes = int(score)
    counts["sourceRecords"] += 1
    start, _, end = target.partition("-")
    end = end or start
    first, last = coordinate.fullmatch(start), coordinate.fullmatch(end)
    assert first and last and coordinate.fullmatch(origin), "Unsupported coordinate syntax"
    if origin not in valid or start not in valid or end not in valid:
        counts["omittedUnavailableCoordinates"] += 1
        continue
    if first.groups()[:2] != last.groups()[:2]:
        counts["omittedCrossChapterRanges"] += 1
        continue
    assert int(last[3]) >= int(first[3]), "Reversed range"
    if not all(f"{first[1]}.{first[2]}.{v}" in valid for v in range(int(first[3]), int(last[3]) + 1)):
        counts["omittedUnavailableCoordinates"] += 1
        continue
    canonical = start if start == end else start + "-" + last[3]
    osis, chapter, verse = origin.split(".")
    entries = grouped[osis].setdefault(chapter + "." + verse, {})
    if canonical in entries:
        counts["duplicateRecords"] += 1
    entries[canonical] = max(votes, entries.get(canonical, votes))

destination = ROOT / "library/crossrefs"
destination.mkdir(parents=True, exist_ok=True)
manifest = {
    "id": "openbible-crossrefs", "schemaVersion": 1,
    "title": "OpenBible Cross-References", "edition": "2026-11-16",
    "sourcePage": "https://www.openbible.info/labs/cross-references/",
    "source": "https://a.openbible.info/data/cross-references.zip",
    "sourceSha256": SOURCE_SHA256, "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "attribution": "Cross-reference coordinates and votes by OpenBible.info, CC BY 4.0. Converted to book JSON by SwordDock; only coordinates available in bundled WEB and targets within one chapter are included. Previews use public-domain WEB text.",
    "conversion": dict(counts), "recordCount": 0, "books": []
}
for code, osis in books:
    refs = {key: sorted(entries.items(), key=lambda item: (-item[1], item[0])) for key, entries in grouped[osis].items()}
    raw = (json.dumps({"code": code, "references": refs}, separators=(",", ":")) + "\n").encode()
    count = sum(len(entries) for entries in refs.values())
    (destination / (code + ".json")).write_bytes(raw)
    manifest["recordCount"] += count
    manifest["books"].append({"code": code, "records": count, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()})
(destination / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
(destination / "SOURCE-LICENSE.md").write_text(
    "# OpenBible.info cross-references\n\n" + manifest["attribution"] + "\n\n"
    + "Source: " + manifest["sourcePage"] + "\n\nDownload: " + manifest["source"]
    + "\n\nLicense: " + manifest["licenseUrl"] + "\n\nSnapshot: " + manifest["edition"]
    + "\n\nZIP SHA256: " + SOURCE_SHA256 + "\n\nConversion counts:\n\n"
    + json.dumps({**counts, "includedRecords": manifest["recordCount"]}, indent=2) + "\n\n"
    + "Source wording and Scripture quotations from the OpenBible website are not included. "
    + "Coordinate validation does not establish equivalence between different versification systems. "
    + "Scores are community votes and do not establish theological authority.\n")
print(json.dumps({**counts, "includedRecords": manifest["recordCount"]}, indent=2))
