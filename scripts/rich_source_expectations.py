"""Independent HTMLParser text oracle for the pinned SQLite research fixtures."""
from collections import Counter
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / '.research/modules'
BLOCKED = {'script','style','iframe','object','embed','svg','math','template','head','form','button','input','select','textarea','video','audio','canvas','noscript','applet'}
VOIDS = {'embed','input','meta','link','base','img','br','hr'}

class TextOracle(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skipping = []
        self.text = []
    def handle_starttag(self, tag, attrs):
        if tag in BLOCKED and tag not in VOIDS:
            self.skipping.append(tag)
    def handle_endtag(self, tag):
        if tag in self.skipping:
            self.skipping = self.skipping[:len(self.skipping)-1-self.skipping[::-1].index(tag)]
    def handle_data(self, data):
        if not self.skipping:
            self.text.append(data)

def digest(text):
    return sha256(text.encode()).hexdigest()

result = {}
for kind in ['book','devotional','graphics','commentary','dictionary','bible']:
    db = sqlite3.connect('file:' + str(WORK / (kind + '.sqlite')) + '?mode=ro', uri=True)
    db.execute('PRAGMA trusted_schema=OFF')
    if kind in ['book','devotional','graphics']:
        rows = db.execute('SELECT id,content FROM Journal WHERE coalesce(hidden,0)=0').fetchall()
    elif kind == 'bible':
        rows = [(None, row[0]) for row in db.execute('SELECT Scripture FROM Bible')]
    else:
        table = 'Commentary' if kind == 'commentary' else 'Dictionary'
        rows = [(None, row[0]) for row in db.execute('SELECT Data FROM ' + table)]
    records = []
    for source_id, source in rows:
        record = {'source':digest(source)}
        if source_id is not None:
            record['sourceId'] = source_id
        if kind != 'bible':
            oracle = TextOracle(); oracle.feed(source); oracle.close()
            record['text'] = digest(re.sub(r'\s+', '', ''.join(oracle.text)))
        records.append(record)
    result[kind] = records
    db.close()
(WORK / 'rich-source-expectations.json').write_text(json.dumps(result,separators=(',',':')))
print(json.dumps({kind:len(records) for kind,records in result.items()}))
