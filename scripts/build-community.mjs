// Obsidian installs exactly these three assets. Keep chapters compressed and
// independently addressable so opening one passage doesn't expand the corpus.
import { readFile, mkdir, copyFile, writeFile, stat } from 'node:fs/promises';
import { gzipSync } from 'fflate';
import path from 'node:path';

const output = 'dist/community';
const resources = {};
const notices = [];
for (const library of ['webp', 'crossrefs', 'mhc', 'strongs', 'interlinear']) {
  const folder = path.join('library', library);
  const manifest = JSON.parse(await readFile(path.join(folder, 'manifest.json'), 'utf8'));
  const files = library === 'interlinear' ? manifest.chapters.map(c => c.file)
    : library === 'strongs' ? ['G.json', 'H.json'] : manifest.books.map(b => b.code + '.json');
  for (const file of [...files, 'manifest.json', 'SOURCE-LICENSE.md']) {
    if (!/^(?:[A-Za-z0-9-]+\.json|SOURCE-LICENSE\.md)$/.test(file)) throw Error('Unexpected resource filename: ' + file);
    const key = library + '/' + file;
    if (Object.hasOwn(resources, key)) throw Error('Duplicate resource: ' + key);
    const data = await readFile(path.join(folder, file));
    resources[key] = [data.length, Buffer.from(gzipSync(data, {level: 8, mtime: 0})).toString('base64')];
    if (file === 'SOURCE-LICENSE.md') notices.push(data.toString('utf8'));
  }
}
await mkdir(output, {recursive: true});
const license = await readFile('LICENSE', 'utf8');
const noticesText = [license, ...notices].join('\n\n').replaceAll('*/', '* /');
const bundle = await readFile('dist/manual/main.js', 'utf8');
await writeFile(path.join(output, 'main.js'), '"use strict";\nconst SWORDDOCK_LIBRARY='
  + JSON.stringify(resources) + ';\n' + bundle + '\n/*\n' + noticesText + '\n*/\n');
for (const file of ['manifest.json', 'styles.css']) await copyFile(file, path.join(output, file));
console.log(Object.keys(resources).length, 'offline resource files in community main.js,',
  (await stat(path.join(output, 'main.js'))).size, 'bytes');

await copyFile(path.join(output, 'main.js'), 'main.js');
