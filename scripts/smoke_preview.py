#!/usr/bin/env python3
"""Clean-vault installation smoke test for the complete SwordDock offline preview.

Uses only the standard library, no user vaults or network access. This checks
packaging and persisted reading data, not Obsidian's graphical interface.
"""
import hashlib
import json
from pathlib import Path, PurePosixPath
import socket
import stat
from tempfile import TemporaryDirectory
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent


def validate_package(archive: Path) -> None:
    with ZipFile(archive) as zf:
        names = zf.namelist()
        assert len(names) == len(set(names)) == 76, "Unexpected or duplicate ZIP entries"
        assert zf.testzip() is None, "Corrupt ZIP entry"
        for entry in zf.infolist():
            name = PurePosixPath(entry.filename)
            assert not name.is_absolute() and ".." not in name.parts
            assert not stat.S_ISLNK(entry.external_attr >> 16)

        assert {"assets/sql-wasm.wasm", "assets/LICENSE-sql.js.txt",
                "main.js", "styles.css", "manifest.json",
                "library/webp/manifest.json"}.issubset(names)
        with TemporaryDirectory(prefix="sworddock-fresh-install-") as tmp:
            vault = Path(tmp) / "SwordDock Fresh Test"
            plugin_dir = vault / ".obsidian" / "plugins" / "versedock"
            plugin_dir.mkdir(parents=True)
            zf.extractall(plugin_dir)
            (vault / ".obsidian" / "community-plugins.json").write_text(
                '["versedock"]\n', encoding="utf-8"
            )
            (vault / "Smoke Test.md").write_text(
                "# SwordDock clean-vault smoke test\n", encoding="utf-8"
            )
            plugin = json.loads((plugin_dir / "manifest.json").read_text())
            assert plugin["id"] == "versedock", "Existing plugin ID must remain stable"
            assert plugin["name"] == "SwordDock Bible", "Unexpected public display name"
            assert plugin["version"] == archive.name.split("SwordDock-Bible-")[1].split("-offline")[0]
            assert (plugin_dir / "main.js").is_file()
            assert (plugin_dir / "styles.css").is_file()
            wasm = (plugin_dir / "assets" / "sql-wasm.wasm").read_bytes()
            assert wasm[:4] == bytes([0, 97, 115, 109]) and len(wasm) > 500000
            license_text = (plugin_dir / "assets" / "LICENSE-sql.js.txt").read_text()
            assert "MIT" in license_text or "Permission is hereby granted" in license_text
            assert inspect_offline_books(plugin_dir / "library" / "webp") == 31103

            # A restart can only use files already extracted into this new vault.
            # Explicitly disallow socket use during the simulated second read.
            original_socket = socket.socket
            try:
                socket.socket = lambda *a, **k: (_ for _ in ()).throw(
                    AssertionError("Unexpected network access")
                )
                assert inspect_offline_books(plugin_dir / "library" / "webp") == 31103
            finally:
                socket.socket = original_socket
            print("CLEAN-INSTALL PASS:", plugin["name"], plugin["version"],
                  f"{len(names)}-file offline package, 66 books, 31,103 verses; restart read passes")


def inspect_offline_books(folder: Path) -> int:
    manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["id"] == "webp" and manifest["verseCount"] == 31103
    assert len(manifest["books"]) == 66
    assert len(list(folder.glob("*.json"))) == 67
    total = 0
    by_code = {}

    for book in manifest["books"]:
        code = book["code"]
        assert code not in by_code, "Duplicate book code"
        raw = (folder / (code + ".json")).read_bytes()
        canonical = raw[:-1] if raw.endswith(b"\n") else raw
        assert len(canonical) == book["bytes"], f"{code}: wrong data length"
        assert hashlib.sha256(canonical).hexdigest() == book["sha256"], (
            f"{code}: checksum mismatch"
        )
        document = json.loads(raw)
        assert document["code"] == code
        assert len(document["chapters"]) == book["chapters"]
        count = sum(len(ch["verses"]) for ch in document["chapters"])
        assert count == book["verses"], f"{code}: incorrect verse count"
        total += count
        by_code[code] = document
    chapter = next(ch for ch in by_code["JOH"]["chapters"] if ch["chapter"] == 3)
    verse = next(v for v in chapter["verses"] if v["verse"] == 16)
    assert "For God so loved the world" in verse["text"]
    assert total == 31103
    return total


if __name__ == "__main__":
    manifest = json.loads((ROOT / "manifest.json").read_text())
    version = manifest["version"]
    validate_package(ROOT / "dist" / f"SwordDock-Bible-{version}-offline-preview.zip")
