// Native acceptance checks for the Reader. The caller supplies a disposable vault.
import assert from 'node:assert/strict';
import path from 'node:path';

const phrase = 'God so loved the world';
const note = 'Love comes before the gift.';
const markButton = 'Mark selected text or verses';

export async function createReaderAnnotations(page, scratch) {
  const reader = page.locator('.vd-reader:visible');
  const verse = reader.locator('[data-reference="John.3.16"]');
  await verse.scrollIntoViewIfNeeded();
  const points = await verse.evaluate((el, phrase) => {
    const node = el.firstChild;
    const index = node.textContent.indexOf(phrase);
    if (index < 0) throw Error('Expected WEB verse text.');
    const range = el.ownerDocument.createRange();
    const point = offset => {
      range.setStart(node, offset); range.collapse(true);
      const rect = range.getBoundingClientRect();
      return {x: rect.x, y: rect.y + rect.height / 2};
    };
    return [point(index), point(index + phrase.length)];
  }, phrase);
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  await page.mouse.move(points[1].x, points[1].y, {steps:12});
  await page.mouse.up();
  assert.equal(await page.evaluate(() => document.getSelection().toString()), phrase);
  await reader.getByRole('button', {name:markButton}).click();
  const editor = page.locator('.vd-annotation-editor:visible');
  assert.equal(await editor.locator('blockquote').innerText(), phrase);
  await editor.getByLabel('Color').selectOption('blue');
  await editor.getByLabel('Annotation (optional)').fill(note);
  await editor.screenshot({path:path.join(scratch,'annotation-editor.png')});
  await editor.getByRole('button',{name:'Save mark'}).click();
  const saved = verse.locator('mark.vd-mark-blue');
  await saved.waitFor();
  assert.equal(await saved.innerText(), phrase);
  await saved.click();
  await editor.getByLabel('Mark style', {exact:true}).selectOption('underline');
  await editor.getByRole('button',{name:'Save mark'}).click();
  await verse.locator('.vd-mark-underline').waitFor();

  // A backward selection spans two rows, their verse numbers and the active row's controls.
  await reader.evaluate(el => {
    const start = el.querySelector('[data-reference="John.3.16"]').lastChild;
    const finish = el.querySelector('[data-reference="John.3.17"]').firstChild;
    el.ownerDocument.getSelection().setBaseAndExtent(finish, 7, start, start.length - 13);
  });
  await reader.getByRole('button',{name:markButton}).click();
  const quote = await editor.locator('blockquote').innerText();
  assert.match(quote,/eternal life\. For God$/);
  await editor.getByLabel('Color').selectOption('rose');
  await editor.getByRole('button',{name:'Save mark'}).click();
  await reader.locator('[data-reference="John.3.17"] .vd-mark-rose').waitFor();

  await reader.locator('.vd-verse[data-verse="18"] .vd-verse-num').click();
  await reader.getByRole('button',{name:markButton}).click();
  assert.match(await editor.locator('strong').first().innerText(), /John 3:18/);
  const full = reader.locator('[data-reference="John.3.18"]');
  assert.equal(await editor.locator('blockquote').textContent(), await full.textContent());
  await editor.getByRole('button',{name:'Save mark'}).click();
  await full.locator('.vd-mark-amber').waitFor();
  await reader.screenshot({path:path.join(scratch,'marked-reader.png')});
}

export async function verifyRestartedAnnotations(page) {
  const reader = page.locator('.vd-reader:visible');
  await reader.locator('[data-reference="John.3.18"] .vd-mark-amber').waitFor();
  const blue = reader.locator('[data-reference="John.3.16"] .vd-mark-underline');
  assert.equal(await blue.innerText(), phrase);
  assert.equal(await blue.getAttribute('title'), note);
  await page.evaluate(() => app.commands.executeCommandById('versedock:open-navigation'));
  await page.getByRole('button',{name:'Highlights',exact:true}).click();
  const entry = page.locator('.vd-annotation-entry').filter({hasText:note});
  await entry.getByRole('button',{name:'Edit annotation'}).click();
  const editor = page.locator('.vd-annotation-editor:visible');
  assert.equal(await editor.getByLabel('Annotation (optional)').inputValue(),note);
  await editor.getByRole('button',{name:'Remove mark'}).click();
  await entry.waitFor({state:'detached'});
  await page.evaluate(() => app.commands.executeCommandById('versedock:open-reader'));
  await blue.waitFor({state:'detached'});
  await reader.locator('[data-reference="John.3.16"] .vd-mark-rose').waitFor();
}
