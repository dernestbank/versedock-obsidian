#!/usr/bin/env python3
"""Build immutable MHC assets using SWORD's public C API, never a custom binary reader.

Requires the pinned public-domain MHC 2.2 archive and installed SWORD 1.9.0.
The engine is a build-time tool; neither its code nor binaries ship in the plugin.
"""
from collections import Counter
import argparse
import ctypes as c
from ctypes.util import find_library
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from tempfile import TemporaryDirectory
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
SOURCE_SHA = "6bcb936873ca144e317805e5c1677940fd86e2403f7c14517752e44f25c8882b"
SOURCE_URL = "https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/MHC.zip"
SOURCE_PAGE = "https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=MHC"


class CommentaryParser(HTMLParser):
    """Keep ordered text blocks; never copy executable markup or link attributes."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.parts = []
        self.kind = "paragraph"
        self.superscripts = 0
        self.references = []
        self.reference_stack = []
        self.emphasis = Counter()

    def flush(self):
        text = re.sub(r"\s+", " ", "".join(self.parts)).strip()
        if text:
            assert len(text) <= 100000 and not re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", text)
            kind = "quotation" if self.kind == "paragraph" and self.superscripts >= 2 else self.kind
            self.blocks.append({"kind": kind, "text": text})
        self.parts = []
        self.superscripts = 0

    def handle_starttag(self, tag, attrs):
        assert tag in {"hi", "reference", "div", "title", "chapter", "l", "lg", "note", "milestone"}, tag
        attrs = dict(attrs)
        if tag == "reference":
            self.references.append({"reference": attrs.get("osisref", ""), "label": ""})
            self.reference_stack.append(len(self.references) - 1)
        if tag == "hi":
            self.emphasis[attrs.get("type", "")] += 1
        if tag in {"div", "l", "lg"}:
            self.flush()
        elif tag == "title":
            self.flush()
            self.kind = "heading"
        elif tag == "hi" and attrs.get("type") == "super":
            self.superscripts += 1

    def handle_endtag(self, tag):
        if tag == "reference" and self.reference_stack:
            self.reference_stack.pop()
        if tag in {"div", "l", "lg", "title"}:
            self.flush()
        if tag == "title":
            self.kind = "paragraph"

    def handle_data(self, data):
        self.parts.append(data)
        for index in self.reference_stack:
            self.references[index]["label"] += data


def bind(library, name, result, arguments):
    function = getattr(library, "org_crosswire_sword_" + name)
    function.restype = result
    function.argtypes = arguments
    return function


def build(sword_library):
    archive = ROOT / ".research/MHC.zip"
    assert archive.stat().st_size < 25000000
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == SOURCE_SHA, "Unexpected MHC snapshot"
    library = c.CDLL(sword_library or find_library("sword"))
    make = bind(library, "SWMgr_newWithPath", c.c_ssize_t, [c.c_char_p])
    dispose = bind(library, "SWMgr_delete", None, [c.c_ssize_t])
    get_module = bind(library, "SWMgr_getModuleByName", c.c_ssize_t, [c.c_ssize_t, c.c_char_p])
    set_key = bind(library, "SWModule_setKeyText", None, [c.c_ssize_t, c.c_char_p])
    children = bind(library, "SWModule_getKeyChildren", c.POINTER(c.c_char_p), [c.c_ssize_t])
    get_raw = bind(library, "SWModule_getRawEntry", c.c_char_p, [c.c_ssize_t])
    config = bind(library, "SWModule_getConfigEntry", c.c_char_p, [c.c_ssize_t, c.c_char_p])
    canon = re.findall(r'"([A-Z0-9]{3})\|([^|]+)\|', (ROOT / "src/core/books.ts").read_text())
    assert len(canon) == 66
    counts = Counter()
    omissions = {"unavailableCoordinates": [], "versesWithoutCommentary": []}
    converted = {}
    oracle = {}
    baseline_path = ROOT / ".research/modules/mhc-plain-baseline.json"
    baseline = json.loads(baseline_path.read_text()) if baseline_path.exists() else None
    with TemporaryDirectory(prefix="sworddock-mhc-source-") as temporary:
        source = Path(temporary).resolve()
        allowed = {"mods.d/mhc.conf", *["modules/comments/zcom4/mhc/" + part + "." + suffix
                   for part in ("ot", "nt") for suffix in ("bzs", "bzv", "bzz")]}
        with ZipFile(archive) as zipped:
            assert len(zipped.infolist()) == 7 and set(zipped.namelist()) == allowed
            assert sum(info.file_size for info in zipped.infolist()) < 20000000
            configuration = zipped.read("mods.d/mhc.conf").decode("utf8")
            for required in ("DistributionLicense=Public Domain", "Version=2.2", "Versification=KJV", "ModDrv=zCom4"):
                assert required in configuration
            # Exact paths from this pinned archive only; no extractall or metadata-derived path.
            for name in sorted(allowed):
                target = source / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(zipped.read(name))
        manager = make(str(source).encode())
        assert manager
        try:
            module = get_module(manager, b"MHC")
            assert module and config(module, b"Version") == b"2.2"
            actual_path = Path(config(module, b"AbsoluteDataPath").decode()).resolve()
            assert actual_path == source / "modules/comments/zcom4/mhc", "Unexpected module resolution"
            for code, osis in canon:
                bible = json.loads((ROOT / "library/webp" / (code + ".json")).read_text())
                groups = []
                previous_raw = None
                for chapter in bible["chapters"]:
                    previous_raw = None
                    for verse in chapter["verses"]:
                        reference = f'{osis}.{chapter["chapter"]}.{verse["verse"]}'
                        set_key(module, reference.encode())
                        key = children(module)
                        if not key or key[7].decode() != reference:
                            counts["unavailableCoordinates"] += 1
                            omissions["unavailableCoordinates"].append(reference)
                            previous_raw = None
                            continue
                        raw = get_raw(module) or b""
                        if not raw.strip():
                            counts["versesWithoutCommentary"] += 1
                            omissions["versesWithoutCommentary"].append(reference)
                            previous_raw = None
                            continue
                        counts["coveredVerses"] += 1
                        if raw == previous_raw:
                            groups[-1]["endVerse"] = verse["verse"]
                            continue
                        parser = CommentaryParser()
                        parser.feed(raw.decode("utf8"))
                        parser.close()
                        parser.flush()
                        assert parser.blocks and len(parser.blocks) <= 2000
                        assert len(raw.decode("utf8")) <= 1024 * 1024
                        group = {"chapter": chapter["chapter"], "verse": verse["verse"],
                                 "endVerse": verse["verse"], "source": raw.decode("utf8")}
                        groups.append(group)
                        key = f'{code}.{chapter["chapter"]}.{verse["verse"]}'
                        oracle[key] = {"sourceSha256": hashlib.sha256(raw).hexdigest(),
                                       "blocksSha256": hashlib.sha256(json.dumps(parser.blocks, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest(),
                                       "references": [{"reference": ref["reference"], "label": re.sub(r"\s+", " ", ref["label"]).strip()} for ref in parser.references],
                                       "emphasis": dict(parser.emphasis)}
                        previous_raw = raw
                assert groups, "Empty commentary book " + code
                if baseline:
                    for group in groups:
                        key = f'{code}.{group["chapter"]}.{group["verse"]}-{group["endVerse"]}'
                        assert baseline["entries"].get(key) == oracle[f'{code}.{group["chapter"]}.{group["verse"]}']["blocksSha256"], "Changed section/text " + key
                converted[code] = {"code": code, "entries": groups}
                counts["entries"] += len(groups)
                print("Converted", code, len(groups), "entries", flush=True)
        finally:
            dispose(manager)
    assert counts["coveredVerses"] > 30000
    destination = ROOT / "library/mhc"
    destination.mkdir(parents=True, exist_ok=True)
    manifest = {
        "id": "mhc", "schemaVersion": 2, "title": "Matthew Henry's Commentary",
        "fullTitle": "Matthew Henry's Complete Commentary on the Whole Bible", "edition": "2.2 (2022-08-29)",
        "sourcePage": SOURCE_PAGE, "source": SOURCE_URL, "sourceSha256": SOURCE_SHA,
        "license": "Public Domain", "versification": "KJV", "conversion": dict(counts), "omissions": omissions,
        "entryCount": counts["entries"], "books": [],
        "notice": "Public Domain—Copy Freely. CrossWire's MHC 2.2 was prepared from CCEL text supplied by Logos Research. This is the complete commentary edition, including continuations. SwordDock queries the SWORD engine for each available WEB coordinate, groups identical adjacent entries within a chapter, and retains each section's exact original OSIS. Bounded inert rendering preserves headings, paragraphs, source quotations and supported emphasis. Qualified source references open an edition-labelled offline preview; missing or invalid addresses are not guessed. Separate book/chapter introduction keys are not exported. The source uses KJV versification; coordinates are not remapped."
    }
    for code, _ in canon:
        document = converted[code]
        raw = (json.dumps(document, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
        assert len(raw) <= 12000000
        (destination / (code + ".json")).write_bytes(raw)
        manifest["books"].append({"code": code, "entries": len(document["entries"]),
                                   "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()})
    (destination / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    oracle_path = ROOT / ".research/modules/mhc-source-oracle.json"
    oracle_path.parent.mkdir(parents=True, exist_ok=True)
    oracle_path.write_text(json.dumps({"sourceSha256": SOURCE_SHA, "entries": oracle}, ensure_ascii=False, separators=(",", ":")) + "\n")
    (destination / "SOURCE-LICENSE.md").write_text(
        "# Matthew Henry's Complete Commentary\n\n" + manifest["notice"] + "\n\n"
        + "Source: " + SOURCE_PAGE + "\n\nDownload: " + SOURCE_URL + "\n\n"
        + "Archive SHA-256: " + SOURCE_SHA + "\n\n"
        + "Exported using the SWORD 1.9.0 public C API. The GPL-licensed engine is used only at build time; no engine code or binary is included in the plugin. Commentary output is public domain.\n\n"
        + "Conversion counts:\n\n" + json.dumps(dict(counts), indent=2)
        + "\n\nUnavailable source entries (never remapped):\n\n" + json.dumps(omissions, indent=2) + "\n")
    print(json.dumps(dict(counts), indent=2))


if __name__ == "__main__":
    arguments = argparse.ArgumentParser(description=__doc__)
    arguments.add_argument("--sword-library", help="Path to the installed SWORD 1.9.0 shared library")
    options = arguments.parse_args()
    if not options.sword_library and not find_library("sword"):
        arguments.error("SWORD was not found; pass --sword-library with its installed shared-library path")
    build(options.sword_library)
