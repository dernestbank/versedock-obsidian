#!/usr/bin/env python3
"""Build an installable *manual preview* ZIP, including separate WEB book data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

ROOT = Path(__file__).resolve().parent.parent
manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
version = manifest["version"]
plugin_id = manifest["id"]
assert plugin_id == "versedock", plugin_id
assert version == "0.1.0", version
assets = ["main.js", "manifest.json", "styles.css", "README.md", "LICENSE"]
books = sorted((ROOT / "library" / "webp").glob("*"))
assert len([p for p in books if p.suffix == ".json"]) == 67, len(books)
assert any(p.name == "SOURCE-LICENSE.md" for p in books)
for name in assets:
    if not (ROOT / name).is_file():
        raise RuntimeError("Missing build asset " + name)
target = ROOT / "dist" / ("VerseDock-" + version + "-offline-preview.zip")
target.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(target, "w", compression=ZIP_DEFLATED, compresslevel=8) as zipf:
    for name in assets:
        zipf.write(ROOT / name, name)
    for file in books:
        zipf.write(file, file.relative_to(ROOT))
with ZipFile(target, "r") as zipf:
    bad = zipf.testzip()
    assert bad is None, bad
    assert zipf.read("manifest.json") == (ROOT / "manifest.json").read_bytes()
    json.loads(zipf.read("library/webp/manifest.json"))
print("ZIP", target)
print("BYTES", target.stat().st_size)
print("SHA256", hashlib.sha256(target.read_bytes()).hexdigest())
