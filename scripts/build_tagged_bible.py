#!/usr/bin/env python3
"""Convert pinned CrossWire resources with SWORD's C API (build-time only)."""
import ctypes as c
from ctypes.util import find_library
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from tempfile import TemporaryDirectory
from zipfile import ZipFile
from build_commentary import bind, ROOT

SOURCES = {
    "KJV": ("873815aa4b4123025616d1f41eae75f412111275f4c3884e36f92d4f46dcba1d", "mods.d/kjv.conf", "modules/texts/ztext/kjv/", {p + "." + s for p in ("ot", "nt") for s in ("bzs", "bzv", "bzz")}),
    "StrongsGreek": ("38f7d29db912d7c6a416cf19bfdefd9bdb9882193634229210a0d10b5cccc434", "mods.d/strongsgreek.conf", "modules/lexdict/zld/strongsgreek/", {"dict." + s for s in ("zdx", "zdt", "dat", "idx")}),
    "StrongsHebrew": ("51bd1f67e8730ce60ce3ad601faa53e79110f24f695d88f85d914c153204d0e0", "mods.d/strongshebrew.conf", "modules/lexdict/rawld/strongshebrew/", {"strongs.doc", "strongshebrew.dat", "strongshebrew.idx"})
}

class VerseParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tokens = []
        self.word = None
        self.skip = 0
        self.red = False
        self.added = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        assert tag in {"w", "q", "note", "title", "reference", "catchword", "rdg", "seg", "divinename", "transchange", "milestone", "hi", "p", "lg", "l", "div", "chapter", "verse", "abbr", "foreign", "inscription"}, tag
        if tag in {"note", "title"}:
            self.skip += 1
        if self.skip:
            return
        if tag == "q":
            if a.get("who") == "Jesus": self.red = True
            if "eid" in a: self.red = False
        if tag == "transchange": self.added = a.get("type") == "added"
        if tag == "w":
            assert self.word is None
            strong = [p.split(":", 1)[1] for p in a.get("lemma", "").split() if re.fullmatch(r"strong:[GH][0-9]{1,5}", p)]
            strong = list(dict.fromkeys(s[0] + str(int(s[1:])) for s in strong if int(s[1:]) > 0))
            self.word = {"text": "", "strongs": strong, "lemmas": [p.split(":", 1)[1] for p in a.get("lemma", "").split() if p.startswith("lemma.TR:")], "morphology": a.get("morph", "").split()}

    def handle_endtag(self, tag):
        if tag in {"note", "title"}:
            self.skip -= 1
            return
        if self.skip: return
        if tag == "w":
            if self.word and self.word["text"]:
                self.tokens.append(self.word)
            self.word = None
        if tag == "q": self.red = False
        if tag == "transchange": self.added = False

    def handle_data(self, text):
        if self.skip: return
        text = re.sub(r"\s+", " ", text)
        if not text: return
        if self.word is not None:
            self.word["text"] += text
            if self.red: self.word["redLetter"] = True
            if self.added: self.word["added"] = True
        else:
            token = {"text": text}
            if self.red: token["redLetter"] = True
            if self.added: token["added"] = True
            self.tokens.append(token)

class DictionaryParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []; self.lemma = ""; self.transliteration = ""; self.field = None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "orth": self.field = "transliteration" if a.get("type") == "trans" else ("lemma" if not a.get("type") else None)
        if tag in {"lb", "def"}: self.parts.append(" ")
    def handle_endtag(self, tag):
        if tag == "orth": self.field = None
    def handle_data(self, text):
        self.parts.append(text)
        if self.field: setattr(self, self.field, getattr(self, self.field) + text)

def write_json(folder, name, data):
    raw = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode()
    (folder / name).write_bytes(raw)
    return {"bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}

def build(sword_library=None):
    library_path = sword_library or find_library("sword")
    assert library_path, "Pass --sword-library with the installed SWORD 1.9.0 library path"
    lib = c.CDLL(library_path)
    make = bind(lib, "SWMgr_newWithPath", c.c_ssize_t, [c.c_char_p])
    dispose = bind(lib, "SWMgr_delete", None, [c.c_ssize_t])
    module = bind(lib, "SWMgr_getModuleByName", c.c_ssize_t, [c.c_ssize_t, c.c_char_p])
    setkey = bind(lib, "SWModule_setKeyText", None, [c.c_ssize_t, c.c_char_p])
    children = bind(lib, "SWModule_getKeyChildren", c.POINTER(c.c_char_p), [c.c_ssize_t])
    rawentry = bind(lib, "SWModule_getRawEntry", c.c_char_p, [c.c_ssize_t])
    config = bind(lib, "SWModule_getConfigEntry", c.c_char_p, [c.c_ssize_t, c.c_char_p])
    canon = re.findall(r'"([A-Z0-9]{3})\|([^|]+)\|', (ROOT / "src/core/books.ts").read_text())
    assert len(canon) == 66
    with TemporaryDirectory(prefix="sworddock-tagged-") as temporary:
        source = Path(temporary).resolve()
        configurations = {}
        for name, (sha, conf, prefix, files) in SOURCES.items():
            archive = ROOT / ".research" / (name + ".zip")
            assert archive.stat().st_size < 5000000 and hashlib.sha256(archive.read_bytes()).hexdigest() == sha
            allowed = {conf, *[prefix + f for f in files]}
            with ZipFile(archive) as zipped:
                assert set(zipped.namelist()) == allowed and len(zipped.infolist()) == len(allowed)
                assert sum(f.file_size for f in zipped.infolist()) < 6000000
                configurations[name] = zipped.read(conf).decode()
                for f in sorted(allowed):
                    target = source / f; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(zipped.read(f))
        manager = make(str(source).encode())
        assert manager
        try:
            kjv = module(manager, b"KJV")
            assert config(kjv, b"Version") == b"3.1"
            assert Path(config(kjv, b"AbsoluteDataPath").decode()).resolve() == source / "modules/texts/ztext/kjv"
            folder = ROOT / "library/kjv"; folder.mkdir(exist_ok=True)
            books = []; omitted = []; count = 0
            for code, osis in canon:
                web = json.loads((ROOT / "library/webp" / (code + ".json")).read_text())
                chapters = []
                for chapter in web["chapters"]:
                    verses = []
                    setkey(kjv, f'{osis}.{chapter["chapter"]}.1'.encode())
                    source_max = int(children(kjv)[5])
                    omitted += [f'{osis}.{chapter["chapter"]}.{v["verse"]}' for v in chapter["verses"] if v["verse"] > source_max]
                    for number in range(1, source_max + 1):
                        reference = f'{osis}.{chapter["chapter"]}.{number}'
                        setkey(kjv, reference.encode()); keys = children(kjv)
                        if not keys or keys[7].decode() != reference:
                            omitted.append(reference); continue
                        parser = VerseParser(); parser.feed((rawentry(kjv) or b"").decode()); parser.close()
                        assert parser.word is None and parser.skip == 0
                        tokens = parser.tokens
                        text = "".join(t["text"] for t in tokens)
                        assert text.strip(), reference
                        verses.append({"verse": number, "text": text, "tokens": tokens})
                    chapters.append({"chapter": chapter["chapter"], "verses": verses})
                n = sum(len(ch["verses"]) for ch in chapters); count += n
                fingerprint = write_json(folder, code + ".json", {"code": code, "chapters": chapters})
                books.append({"code": code, "chapters": len(chapters), "verses": n, **fingerprint})
            manifest = {"id": "kjv", "abbreviation": "KJV", "title": "King James Version", "edition": "CrossWire 3.1 (2023-07-19)", "language": "en", "license": "GPL; see source notice", "licenseNotice": "CrossWire grants use for any purpose; base-text rights held by the Crown of England. See SOURCE-LICENSE.md and original configuration.", "source": "https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/KJV.zip", "sourcePage": "https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=KJV", "sourceSha256": SOURCES["KJV"][0], "verseCount": count, "books": books, "versification": "KJV", "unavailableCoordinates": omitted}
            write_json(folder, "manifest.json", manifest)
            (folder / "SOURCE-LICENSE.md").write_text("# CrossWire KJV 3.1\n\nSource: " + manifest["sourcePage"] + "\n\n" + manifest["licenseNotice"] + "\n\nConverted by SwordDock: source OSIS tags become inert JSON text tokens. Notes and headings are excluded from verse text. Strong’s identifiers, source Greek forms, morphology codes, red-letter and added-word markers are retained. Empty source-word tags are omitted from display. No numbering remapping. The original configuration and all source notices follow.\n\n```ini\n" + configurations["KJV"] + "\n```\n")
            lex = ROOT / "library/strongs"; lex.mkdir(exist_ok=True)
            lex_files = []
            for name, prefix, maximum, version in (("StrongsGreek", "G", 5624, b"2.0"), ("StrongsHebrew", "H", 8674, b"1.2")):
                handle = module(manager, name.encode()); assert handle and config(handle, b"Version") == version
                expected = source / SOURCES[name][2].rstrip("/")
                assert Path(config(handle, b"AbsoluteDataPath").decode()).resolve() == expected, (config(handle, b"AbsoluteDataPath"), str(expected))
                entries = {}
                for n in range(1, maximum + 1):
                    setkey(handle, str(n).encode()); raw = (rawentry(handle) or b"").decode()
                    if not raw.strip(): continue
                    if prefix == "G":
                        parser = DictionaryParser(); parser.feed(raw)
                        # The source entry carries its own exact key; reject nearest-key fallback.
                        if not re.search(r'<entryFree n="' + str(n) + '"', raw): continue
                        entry = {"lemma": parser.lemma.strip(), "transliteration": parser.transliteration.strip(), "text": re.sub(r"\s+", " ", "".join(parser.parts)).strip()}
                    else:
                        match = re.match(r"\s*(\d+)\s+", raw)
                        if not match or int(match[1]) != n: continue
                        entry = {"lemma": "", "transliteration": "", "text": re.sub(r"\s+", " ", raw).strip()}
                    entries[prefix + str(n)] = entry
                fingerprint = write_json(lex, prefix + ".json", entries)
                lex_files.append({"file": prefix + ".json", "entries": len(entries), **fingerprint})
            write_json(lex, "manifest.json", {"id": "strongs", "schemaVersion": 1, "license": "Public Domain", "files": lex_files, "sources": {name: sha for name, (sha, *_) in SOURCES.items() if name != "KJV"}})
            (lex / "SOURCE-LICENSE.md").write_text("# Strong’s dictionaries\n\nJames Strong, 1890. Public domain. CrossWire Greek 2.0 and Hebrew 1.2.\n\nGreek TEI is flattened to inert text with lexical form and transliteration retained. Hebrew entries retain the source transliteration and pronunciation in their complete text; no Hebrew script is invented. Numeric gaps in the source are preserved. No active source HTML is rendered.\n\n" + "\n\n".join("Source: https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=" + name + "\n\n```ini\n" + configurations[name] + "\n```" for name in ("StrongsGreek", "StrongsHebrew")))
            print("KJV", count, "verses; omissions", omitted, "; dictionaries", lex_files)
        finally:
            dispose(manager)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sword-library")
    build(parser.parse_args().sword_library)
