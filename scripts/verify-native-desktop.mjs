// Fresh native Obsidian startup and process restart from the packaged preview.
// Run with a desktop session (or Xvfb) and a local Obsidian executable.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir, release } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const [executable, archive] = process.argv.slice(2);
if (!executable || !archive) throw Error('Expected an Obsidian executable and a SwordDock preview ZIP.');
const scratch = await mkdtemp(path.join(tmpdir(), 'sworddock-native-'));
const vault = path.join(scratch, 'vault');
const profile = path.join(scratch, 'profile');
const pluginDir = path.join(vault, '.obsidian', 'plugins', 'versedock');
await mkdir(pluginDir, { recursive: true });
await mkdir(profile);
execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['-m', 'zipfile', '-e', path.resolve(archive), pluginDir]);
const packageHash = createHash('sha256').update(await readFile(archive)).digest('hex');
await writeFile(path.join(profile, 'obsidian.json'), JSON.stringify({
  vaults: { '5d0c000000000001': { path: vault, ts: Date.now(), open: true } }, updateDisabled: true
}));

async function runDesktop(check) {
  const child = spawn(path.resolve(executable), ['--user-data-dir=' + profile, '--remote-debugging-port=0'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const exit = once(child, 'exit');
  let browser;
  try {
    const endpoint = new Promise(resolve => {
      let buffer = '';
      const inspect = chunk => {
        buffer = (buffer + chunk.toString()).slice(-8192);
        const match = /DevTools listening on (ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[\w-]+)\s/.exec(buffer);
        if (match) resolve(match[1]);
      };
      child.stderr.on('data', inspect);
      child.stdout.on('data', inspect);
    });
    const address = await Promise.race([endpoint, exit.then(([code]) => { throw Error('Obsidian exited during startup (' + code + ').'); }),
      delay(60000, null, {ref: false}).then(() => { throw Error('Obsidian did not open its local test connection.'); })]);
    browser = await chromium.connectOverCDP(address);
    const context = browser.contexts()[0];
    let page;
    for (let attempt = 0; attempt < 300 && !page; attempt++) {
      page = context.pages().find(candidate => candidate.url().startsWith('app://obsidian.md/index.html'));
      if (!page) await delay(100);
    }
    assert.ok(page, 'Obsidian did not open its vault window.');
    await page.waitForFunction(() => window.app?.vault?.adapter?.getBasePath?.());
    assert.equal(path.resolve(await page.evaluate(() => app.vault.adapter.getBasePath())), path.resolve(vault));
    try {
      await check(page, context);
    } catch (error) {
      console.error('Disposable vault state:', await page.evaluate(() => ({
        enabled: [...app.plugins.enabledPlugins],
        pluginLoaded: !!app.plugins.plugins.versedock,
        dialogs: [...document.querySelectorAll('.modal')].map(dialog => dialog.innerText.slice(0, 400))
      })));
      throw error;
    }
    // Quit the application normally so Obsidian can persist vault trust and workspace state.
    await page.evaluate(() => { setTimeout(() => window.electron.remote.app.quit(), 0); });
    await Promise.race([exit, delay(15000, null, {ref: false}).then(() => { throw Error('Native quit did not finish.'); })]);
  } finally {
    await browser?.close();
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await Promise.race([exit, delay(15000, null, { ref: false }).then(() => { throw Error('Disposable Obsidian process did not stop.'); })]);
  }
}

async function command(page, id) {
  const executed = await page.evaluate(id => app.commands.executeCommandById('versedock:' + id), id);
  assert.ok(executed, 'Missing native command ' + id);
}
async function observeCompanion(page) {
  const reader = page.locator('.vd-reader:visible');
  await reader.locator('.vd-interlinear-word').first().waitFor();
  assert.match(await reader.locator('.vd-interlinear-head').innerText(), /Berean interlinear companion\s+John 3:16/);
  assert.match(await reader.locator('.vd-verse[data-verse="16"]').innerText(), /only begotten Son/i);
  const contrast = await reader.locator('.vd-verse.is-selected .vd-red-letter').first().evaluate(word => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const fill = color => { ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); };
    const luminance = () => {
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data, v => {
        const channel = v / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const layers = [];
    for (let el = word; el; el = el.parentElement) layers.push(getComputedStyle(el).backgroundColor);
    fill('white');
    layers.reverse().forEach(fill);
    const background = luminance();
    fill(getComputedStyle(word).color);
    const foreground = luminance();
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  assert.ok(contrast >= 4.5, 'Selected red-letter verse contrast: ' + contrast.toFixed(2));
  const words = reader.locator('.vd-interlinear-word');
  assert.equal(await words.count(), 25);
  await words.first().click();
  await reader.locator('.vd-interlinear-detail').getByText(/Strong’s dictionary:/).waitFor();
  return reader.getByLabel('Interlinear word order');
}

const result = { platform: process.platform, os: release(), packageSha256: packageHash };
await runDesktop(async (page, context) => {
  const trust = page.getByRole('button', {name: 'Trust author and enable plugins'});
  await trust.click();
  let toggle;
  for (let attempt = 0; attempt < 300 && !toggle; attempt++) {
    for (const candidate of context.pages()) {
      const control = candidate.locator('[data-plugin-id="versedock"] .checkbox-container');
      if (await control.isVisible()) { toggle = control; break; }
    }
    if (!toggle) await delay(100);
  }
  assert.ok(toggle, 'Missing SwordDock switch in Community plugins.');
  await toggle.click();
  await page.waitForFunction(() => app.commands.commands['versedock:open-reader']);
  const settingsPage = toggle.page();
  if (settingsPage !== page) await settingsPage.close();
  else await page.keyboard.press('Escape');

  await command(page, 'open-reader');
  const scripture = page.locator('.vd-reader:visible .vd-verse[data-verse="16"]');
  await scripture.waitFor();
  assert.match(await scripture.innerText(), /his only born Son, that whoever believes in him/i);
  await command(page, 'open-library');
  const library = page.locator('.vd-library:visible');
  await library.getByText('6 installed resources', {exact: true}).waitFor();
  await library.getByRole('button', {name: 'Read KJV with companion'}).click();
  const order = await observeCompanion(page);
  await order.selectOption('english');
  // A restart must read the saved settings from disk.
  const settingsPath = path.join(pluginDir, 'data.json');
  let saved;
  for (let attempt = 0; attempt < 100; attempt++) {
    saved = await readFile(settingsPath, 'utf8').then(JSON.parse).catch(() => null);
    if (saved?.bibleEdition === 'kjv' && saved?.interlinear?.order === 'english') break;
    await delay(100);
  }
  assert.equal(saved?.interlinear?.order, 'english');
  assert.equal(saved?.bibleEdition, 'kjv');
  result.window = await page.title();
  result.freshInstall = true;
});
await runDesktop(async page => {
  await page.waitForFunction(() => app.commands.commands['versedock:open-reader']);
  await command(page, 'open-reader');
  const order = await observeCompanion(page);
  assert.equal(await order.inputValue(), 'english');
  await page.screenshot({path: path.join(scratch, 'restarted-reader.png')});
  result.restartedCompanionWords = 25;
});
console.log(JSON.stringify(result, null, 2));
console.log('Native QA vault and capture:', scratch);
