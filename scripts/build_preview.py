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
assets = ["main.js", "manifest.json", "styles.css", "README.md", "BRAND-GUIDELINES.md", "LICENSE"]
library_dir = ROOT / "library" / "webp"
web = json.loads((library_dir / "manifest.json").read_text(encoding="utf-8"))
assert web["id"] == "webp" and len(web["books"]) == 66 and web["verseCount"] == 31103
allowed_books = {book["code"] + ".json" for book in web["books"]}
assert len(allowed_books) == 66, "Duplicate WEB book IDs"
allowed_books.update({"manifest.json", "SOURCE-LICENSE.md"})
actual = {p.name for p in library_dir.iterdir()}
assert actual == allowed_books, "Unexpected/missing library resources: " + str(actual ^ allowed_books)

paths = assets + ["library/webp/" + name for name in sorted(allowed_books)]
for name in paths:
    assert (ROOT / name).is_file(), "Missing package asset: " + name
target = ROOT / "dist" / f"SwordDock-Bible-{version}-offline-preview.zip"
target.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(target, "w", compression=ZIP_DEFLATED, compresslevel=8) as out:
    for name in paths:
        info = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
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
