#!/usr/bin/env python3
"""Build a deterministic offline preview ZIP from an explicit asset allowlist."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import hashlib
import json

ROOT = Path(__file__).resolve().parent.parent
manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
version = manifest["version"]
assert manifest["id"] == "versedock", "Keep the existing installed plugin ID"
assert version in json.loads((ROOT / "versions.json").read_text()), version
assets = ["main.js", "manifest.json", "styles.css", "README.md", "BRAND-GUIDELINES.md", "LICENSE", "assets/sql-wasm.wasm", "assets/LICENSE-sql.js.txt"]
library_dir = ROOT / "library" / "webp"
web = json.loads((library_dir / "manifest.json").read_text(encoding="utf-8"))
assert web["id"] == "webp" and len(web["books"]) == 66 and web["verseCount"] == 31103
allowed_books = {book["code"] + ".json" for book in web["books"]}
assert len(allowed_books) == 66, "Duplicate WEB book IDs"
allowed_books.update({"manifest.json", "SOURCE-LICENSE.md"})
actual = {p.name for p in library_dir.iterdir()}
assert actual == allowed_books, "Unexpected/missing library resources: " + str(actual ^ allowed_books)

paths = assets + ["library/webp/" + name for name in sorted(allowed_books)]
references_dir = ROOT / "library/crossrefs"
references = json.loads((references_dir / "manifest.json").read_text())
assert references["id"] == "openbible-crossrefs" and references["license"] == "CC BY 4.0"
assert {book["code"] for book in references["books"]} == {book["code"] for book in web["books"]}
reference_files = allowed_books
assert {p.name for p in references_dir.iterdir()} == reference_files, "Unexpected cross-reference files"
paths += ["library/crossrefs/" + name for name in sorted(reference_files)]
commentary_dir = ROOT / "library/mhc"
commentary = json.loads((commentary_dir / "manifest.json").read_text())
assert commentary["id"] == "mhc" and commentary["license"] == "Public Domain" and len(commentary["books"]) == 66
assert {book["code"] for book in commentary["books"]} == {book["code"] for book in web["books"]}
assert {p.name for p in commentary_dir.iterdir()} == allowed_books, "Unexpected commentary files"
paths += ["library/mhc/" + name for name in sorted(allowed_books)]
lexicon_dir = ROOT / "library/strongs"
lexicon = json.loads((lexicon_dir / "manifest.json").read_text())
lexicon_files = {"manifest.json", "SOURCE-LICENSE.md", "G.json", "H.json"}
assert lexicon["id"] == "strongs" and lexicon["license"] == "Public Domain"
assert {p.name for p in lexicon_dir.iterdir()} == lexicon_files, "Unexpected dictionary files"
paths += ["library/strongs/" + name for name in sorted(lexicon_files)]
interlinear_dir = ROOT / "library/interlinear"
interlinear = json.loads((interlinear_dir / "manifest.json").read_text())
assert interlinear['id'] == 'bsb-interlinear' and interlinear['wordCount'] == 443625
interlinear_files = {entry['file'] for entry in interlinear['chapters']} | {'manifest.json', 'SOURCE-LICENSE.md'}
assert len(interlinear_files) == 1191
assert {p.name for p in interlinear_dir.iterdir()} == interlinear_files, 'Unexpected interlinear files'
paths += ['library/interlinear/' + name for name in sorted(interlinear_files)]
for name in paths:
    assert (ROOT / name).is_file(), "Missing package asset: " + name
target = ROOT / "dist" / f"SwordDock-Bible-{version}-offline.zip"
target.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(target, "w", compression=ZIP_DEFLATED, compresslevel=8) as out:
    for name in paths:
        info = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
        info.create_system = 3  # Unix permissions are encoded identically on all build hosts.
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        out.writestr(info, (ROOT / name).read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=8)
with ZipFile(target) as zf:
    assert zf.testzip() is None
    assert set(zf.namelist()) == set(paths)
    assert zf.read("manifest.json") == (ROOT / "manifest.json").read_bytes()
print("ZIP", target)
print("ENTRIES", len(paths))
print("BYTES", target.stat().st_size)
print("SHA256", hashlib.sha256(target.read_bytes()).hexdigest())
