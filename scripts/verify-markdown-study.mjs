import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const name = 'A study in John';
const notePath = name + '.md';
const prose = 'Read Jn 3:16–18.\n\nCompare 1 Corinthians 13:4–7.\n\n`Mark 1:1` and [Luke 2:1](https://example.org)\n\n';
const missingLink = '[My study dictionary · Grace](obsidian://sworddock-cite?vault=vault&module=local-dictionary-missing&entry=grace)';
const commentaryLink = 'a[href*="module=mhc"]';
const citation = 'Matthew Henry’s Commentary · MHC 2.2 · John 3:1-21';

async function openNote(page, mode) {
  await page.evaluate(async ({notePath, mode}) => {
    const file = app.vault.getFileByPath(notePath) ?? await app.vault.create(notePath, '');
    const leaf = app.workspace.getLeavesOfType('markdown').find(leaf => leaf.view.file === file) ?? app.workspace.getLeaf('tab');
    await leaf.openFile(file, {state:{mode, source:false}});
    await app.workspace.revealLeaf(leaf);
    app.workspace.setActiveLeaf(leaf, {focus:true});
    if (mode === 'source') leaf.view.editor.focus();
  }, {notePath, mode});
}

async function command(page, id) {
  assert.ok(await page.evaluate(id => app.commands.executeCommandById('versedock:' + id), id), id);
}

async function hoverLiveReference(page) {
  const line = page.locator('.markdown-source-view:visible .cm-line').filter({hasText:'Read Jn 3:16'}).first();
  await line.scrollIntoViewIfNeeded();
  const point = await line.evaluate(el => {
    const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const i = node.textContent.indexOf('Jn');
      if (i < 0) continue;
      const range = el.ownerDocument.createRange();
      range.setStart(node,i); range.setEnd(node,i+2);
      const rect=range.getBoundingClientRect();
      return {x:rect.x+rect.width/2,y:rect.y+rect.height/2};
    }
    throw Error('Reference not rendered in Live Preview');
  });
  await page.mouse.move(0,0);
  await page.mouse.move(point.x,point.y);
}

export async function createStudyNote(page, scratch) {
  await openNote(page, 'source');
  await page.keyboard.insertText(prose);
  await hoverLiveReference(page);
  const hover = page.locator('.cm-tooltip .vd-note-verse-preview');
  await hover.getByText(/his only born Son/).waitFor();
  await page.mouse.move(0,0);
  for (const word of ['Mark', 'Luke']) {
    await page.evaluate(word => {
      const editor = app.workspace.activeLeaf.view.editor;
      editor.setCursor({line:4, ch:editor.getLine(4).indexOf(word)+2});
    }, word);
    await command(page, 'preview-note-verse');
    await page.locator('.notice').filter({hasText:'Place the cursor on a plain verse reference'}).first().waitFor();
    assert.equal(await page.locator('.modal .vd-note-verse-preview').count(), 0);
  }
  await page.evaluate(() => app.workspace.activeLeaf.view.editor.setCursor({line:0,ch:10}));
  await command(page, 'preview-note-verse');
  const preview = page.locator('.modal .vd-note-verse-preview');
  const verse = preview.locator('.vd-preview-verse');
  await verse.getByText(/his only born Son/).waitFor();
  assert.equal(await verse.locator('p').count(), 3);
  assert.equal(await preview.locator('.vd-pill').innerText(), 'WEB');
  await preview.getByRole('button',{name:'Open in SwordDock'}).click();
  await page.locator('.vd-reader:visible [data-reference="John.3.18"]').waitFor();
  assert.equal(await page.evaluate(() => app.plugins.plugins.versedock.currentRef.endVerse), 18);

  await openNote(page, 'source');
  await page.evaluate(() => {
    const editor=app.workspace.activeLeaf.view.editor;
    editor.setCursor({line:editor.lastLine(), ch:0});
  });
  await command(page, 'quick-insert');
  const insert = page.locator('.vd-reference-modal');
  assert.equal(await insert.getByLabel('Bible translation').inputValue(), 'webp');
  await insert.getByLabel('Scripture reference').fill('1 Cor. 13:4–7');
  await insert.locator('.vd-preview-heading').getByText('1 Corinthians 13:4-7').waitFor();
  await insert.getByRole('button',{name:'Insert quote',exact:true}).click();
  const editorValue = () => page.evaluate(() => app.workspace.activeLeaf.view.editor.getValue());
  const quoted = await editorValue();
  assert.ok(quoted.startsWith(prose));
  assert.match(quoted, /> — 1 Corinthians 13:4-7 \(WEB\)/);
  await page.evaluate(() => app.workspace.activeLeaf.view.editor.undo());
  assert.equal(await editorValue(), prose);
  await page.evaluate(() => {
    const editor=app.workspace.activeLeaf.view.editor;
    editor.redo();
    editor.setCursor({line:editor.lastLine(),ch:0});
  });
  await page.keyboard.insertText('\nSource: ');
  await command(page, 'insert-resource-citation');
  await page.locator('.vd-resources:visible').getByRole('button',{name:'Cite entry'}).first().click();
  const dialog = page.locator('.vd-citation-modal:visible');
  await dialog.getByText(citation,{exact:true}).waitFor();
  await dialog.screenshot({path:path.join(scratch,'study-citation.png')});
  await dialog.getByRole('button',{name:'Insert into '+name,exact:true}).click();
  await page.evaluate(() => {
    const editor=app.workspace.activeLeaf.view.editor;
    editor.setCursor({line:editor.lastLine(), ch:editor.getLine(editor.lastLine()).length});
    editor.focus();
  });
  await page.keyboard.insertText('\n\nSee also ' + missingLink);
  await openNote(page, 'preview');
  const reading = page.locator('.markdown-reading-view:visible');
  const reference = reading.getByRole('button',{name:'Preview John 3:16-18',exact:true});
  await reference.focus();
  await page.keyboard.press('Enter');
  await verse.getByText(/his only born Son/).waitFor();
  await preview.screenshot({path:path.join(scratch,'study-verse-preview.png')});
  await page.keyboard.press('Escape');
  assert.equal(await reading.locator('code button, a button').count(), 0);
  await reference.hover();
  await page.locator('.hover-popover .vd-preview-verse').getByText(/his only born Son/).waitFor();
  await page.mouse.move(0,0);

  await page.evaluate(async () => {
    const plugin=app.plugins.plugins.versedock;
    plugin.settings.livePreviews=false;
    await plugin.saveSettings();
  });
  const link = reading.locator(commentaryLink);
  await link.waitFor();
  assert.equal(await link.textContent(), citation);
  assert.equal(await link.evaluate(el => el.closest('blockquote') !== null), false);
  const markdown = await readFile(path.join(scratch,'vault',notePath),'utf8');
  assert.ok(markdown.startsWith(prose));
  assert.match(markdown, /> — 1 Corinthians 13:4-7 \(WEB\)/);
  assert.ok(markdown.includes('[' + citation + '](obsidian://sworddock-cite?'));
  await page.evaluate(() => {
    const plugin=app.plugins.plugins.versedock;
    plugin.selectReference({...plugin.currentRef,verse:16,endVerse:undefined});
  });
}

export async function reopenStudyNote(page) {
  const preferences = await page.evaluate(() => {
    const {livePreviews,readingPreviews}=app.plugins.plugins.versedock.settings;
    return {livePreviews,readingPreviews};
  });
  assert.deepEqual(preferences,{livePreviews:false,readingPreviews:true});
  await openNote(page,'source');
  await hoverLiveReference(page);
  // The positive hover check above uses the same pointer position and 300 ms hover delay.
  await page.waitForTimeout(650);
  assert.equal(await page.locator('.cm-tooltip .vd-note-verse-preview').count(), 0);
  await openNote(page,'preview');
  const reading = page.locator('.markdown-reading-view:visible');
  await reading.locator('a[href*="module=local-dictionary-missing"]').click();
  await page.locator('.notice').getByText(/cited module .* is unavailable/).first().waitFor();
  await reading.locator(commentaryLink).click();
  const modal=page.locator('.vd-citation-modal:visible');
  await modal.getByRole('heading',{name:'Matthew Henry’s Commentary · MHC 2.2'}).waitFor();
  await modal.getByRole('heading',{name:'John 3:1-21',exact:true}).waitFor();
  assert.ok((await modal.locator('.vd-commentary-text').innerText()).length>100);
  await page.keyboard.press('Escape');
}
