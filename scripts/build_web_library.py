#!/usr/bin/env python3
"""Generate per-book offline WEB packs from official eBible.org VPL.
Source https://ebible.org/Scriptures/engwebp_vpl.zip
Edition ENGWEBP, public-domain 66-book World English Bible.
Verse text is preserved exactly (no word transformations).
"""
from pathlib import Path
from collections import defaultdict
import hashlib, json, re, zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / ".research" / "engwebp_vpl.zip"
DEST = ROOT / "library" / "webp"
REGEX = re.compile(r"^([A-Z0-9]{3}) (\d+):(\d+) (.*)$")
CODES = """GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV""".split()
if not SOURCE.is_file():
    raise SystemExit("Missing upstream archive at " + str(SOURCE))
with zipfile.ZipFile(SOURCE) as z:
    data = z.read("engwebp_vpl.txt")
raw = data.decode("utf-8-sig")
groups = defaultdict(lambda: defaultdict(dict))
count = 0
for row in raw.splitlines():
    match = REGEX.fullmatch(row)
    if match is None: raise RuntimeError("Unexpected VPL row: " + repr(row[:90]))
    code, chapter, verse, text = match.groups()
    if code not in CODES: raise RuntimeError("Unknown book: " + code)
    c, v = int(chapter), int(verse)
    if v in groups[code][c]: raise RuntimeError("Duplicate verse: " + row[:40])
    groups[code][c][v] = text
    count += 1
assert count == 31103, count
assert set(groups) == set(CODES)
DEST.mkdir(parents=True, exist_ok=True)
manifest = {
    "id": "webp", "abbreviation": "WEB", "title": "World English Bible",
    "edition": "ENGWEBP (66 books); 2020 stable text edition",
    "language": "en", "license": "Public Domain",
    "source": "https://ebible.org/Scriptures/engwebp_vpl.zip",
    "sourcePage": "https://ebible.org/details.php?id=engwebp",
    "licenseNotice": "World English Bible is a trademark of eBible.org; no altered text may be labeled World English Bible.",
    "sourceSha256": hashlib.sha256(data).hexdigest(), "verseCount": count, "books": []
}
for code in CODES:
    chapters = [
        {"chapter": c, "verses": [{"verse": v, "text": t} for v, t in sorted(verses.items())]}
        for c, verses in sorted(groups[code].items())
    ]
    output = {"code": code, "chapters": chapters}
    encoded = json.dumps(output, ensure_ascii=False, separators=(",", ":"))
    (DEST / (code + ".json")).write_text(encoded + "\n", encoding="utf-8")
    manifest["books"].append({
        "code": code, "chapters": len(chapters),
        "verses": sum(len(c["verses"]) for c in chapters),
        "bytes": len(encoded.encode("utf-8")),
        "sha256": hashlib.sha256(encoded.encode("utf-8")).hexdigest()
    })
(DEST / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
(DEST / "SOURCE-LICENSE.md").write_text(
    "# World English Bible (WEB) source\n\n"
    "Source: https://ebible.org/Scriptures/engwebp_vpl.zip\n\n"
    "Edition: ENGWEBP, public-domain 66-book, 2020 stable text.\n\n"
    "The translation is public domain; the name World English Bible is a trademark of eBible.org.\n"
    "Do not distribute altered Scripture under that trademark.\n\n"
    "VPL text SHA256: " + manifest["sourceSha256"] + "\n\n"
    "No Scripture wording is altered by the VPL-to-book conversion.\n",
    encoding="utf-8"
)
print("Generated", len(CODES), "books,", count, "verses,", sum(x["bytes"] for x in manifest["books"]), "data bytes")
