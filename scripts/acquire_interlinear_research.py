"""Acquire primary-source chapter fixtures; not a plugin runtime installer."""
import concurrent.futures, hashlib, json, time, urllib.request
from pathlib import Path

ROOT = Path('.research/interlinear')
CHAPTERS = ROOT / 'chapters'
CHAPTERS.mkdir(parents=True, exist_ok=True)
books_document = json.loads((ROOT / 'books.json').read_text())
books = books_document['books']
snapshot = books_document['dataset']['sha256']

def acquire(task):
    book, chapter = task
    key = f"{book['id']}-{chapter}"
    target = CHAPTERS / (key + '.json')
    initial = ROOT / (key + '.json')
    payload = None
    for attempt in range(3):
        try:
            if target.exists():
                payload = target.read_bytes()
            elif initial.exists():
                payload = initial.read_bytes()
            else:
                request = urllib.request.Request(f"https://bible.helloao.org/api/d/bsb-interlinear/{book['id']}/{chapter}.json", headers={'User-Agent': 'SwordDock-source-validation/0.1'})
                with urllib.request.urlopen(request, timeout=30) as response:
                    payload = response.read(2_000_001)
            if len(payload) > 2_000_000:
                raise ValueError('oversized chapter')
            document = json.loads(payload)
            if document['dataset']['id'] != 'bsb-interlinear' or document['dataset']['sha256'] != snapshot:
                raise ValueError('dataset snapshot changed')
            if document['book']['id'] != book['id'] or document['chapter']['number'] != chapter:
                raise ValueError('chapter coordinate mismatch')
            verses = document['chapter']['content']
            if not isinstance(verses, list) or len(verses) != document['numberOfVerses']:
                raise ValueError('verse count mismatch')
            seen = set()
            count = 0
            languages = {}
            issues = []
            for verse in verses:
                number = verse['verse']
                if not isinstance(number, int) or not 1 <= number <= 200 or number in seen:
                    raise ValueError('invalid or duplicate verse')
                seen.add(number)
                if not isinstance(verse['words'], list) or len(verse['words']) > 500:
                    raise ValueError('invalid word array')
                positions = set()
                for word in verse['words']:
                    count += 1
                    language = word.get('language')
                    languages[language] = languages.get(language, 0) + 1
                    if language not in ('hebrew', 'aramaic', 'greek'):
                        issues.append(f'{number}: unknown language {language!r}')
                    if not isinstance(word.get('pos'), int) or word['pos'] in positions:
                        issues.append(f'{number}: invalid/duplicate source position')
                    positions.add(word.get('pos'))
                    for field in ('text', 'transliteration', 'parsing', 'parsingFull', 'strongs', 'gloss'):
                        value = word.get(field)
                        if value is not None and (not isinstance(value, str) or len(value) > 2000):
                            issues.append(f'{number}: unsupported {field}')
            target.write_bytes(payload)
            return {'key': key, 'verses': len(verses), 'words': count, 'languages': languages, 'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest(), 'issues': issues}
        except Exception as error:
            if target.exists() and payload is not None:
                raise RuntimeError(f'{key}: cached source requires review: {error}') from error
            if attempt == 2:
                raise RuntimeError(f'{key}: {error}') from error
            time.sleep(attempt + 1)

tasks = [(book, chapter) for book in books for chapter in range(book['firstChapterNumber'], book['lastChapterNumber'] + 1)]
results = []
failures = []
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    futures = [pool.submit(acquire, task) for task in tasks]
    for future in concurrent.futures.as_completed(futures):
        try:
            results.append(future.result())
        except Exception as error:
            failures.append(str(error))
        if (len(results) + len(failures)) % 100 == 0:
            print('Chapters checked:', len(results), 'Failures:', len(failures), flush=True)
report = {'dataset': 'bsb-interlinear', 'snapshot': snapshot, 'expectedChapters': len(tasks), 'chapters': len(results), 'verses': sum(r['verses'] for r in results), 'words': sum(r['words'] for r in results), 'bytes': sum(r['bytes'] for r in results), 'failures': failures, 'chaptersWithIssues': [r['key'] for r in results if r['issues']], 'files': sorted(results, key=lambda item: item['key'])}
report['complete'] = not failures and not report['chaptersWithIssues'] and report['chapters'] == 1189 and report['verses'] == 31102 and report['words'] == 443625
(ROOT / 'corpus-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print({k: v for k, v in report.items() if k != 'files'}, flush=True)
