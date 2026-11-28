// Scoped to the disposable vault created by verify-native-desktop.
import assert from "node:assert/strict";
import initSqlJs from "sql.js";

export async function verifyStudyInspector(page) {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  let bytes;
  try {
    db.run("CREATE TABLE Details(Title TEXT, Author TEXT, Abbreviation TEXT, Version TEXT)");
    db.run("INSERT INTO Details VALUES('Inspector test commentary','Test author','ITC','1')");
    db.run("CREATE TABLE Commentary(Book INT, Chapter INT, FromVerse INT, ToVerse INT, Data TEXT)");
    db.run("INSERT INTO Commentary VALUES(43,3,14,18,'A passage-specific commentary entry.')");
    bytes = Array.from(db.export());
  } finally { db.close(); }
  const id = await page.evaluate(async data => {
    const p = app.plugins.plugins.versedock;
    const preview = await p.modules.previewLocalFile({name:"inspector.cmt.mybible",bytes:new Uint8Array(data)},"commentary");
    const installed = await p.modules.installLocalFile(preview.ticket,"Inspector test");
    await p.openInspector("study");
    return installed.id;
  },bytes);
  const inspector = page.locator(".vd-inspector:visible").first();
  const tab = name => inspector.getByRole("tab",{name,exact:true});
  const source = inspector.getByRole("combobox",{name:"Commentary source"});
  await source.selectOption(id);
  await inspector.getByText("A passage-specific commentary entry.",{exact:true}).waitFor();
  await inspector.getByRole("button",{name:"Read more"}).click();
  assert.equal(await source.inputValue(),id);
  await inspector.locator(".vd-installed-study-entry .vd-selectable-resource").filter({hasText:"A passage-specific commentary entry."}).waitFor();
  assert.equal(await inspector.getByRole("tablist").count(),1);
  for (const name of ["Study","Parallel","Bookmarks","Highlights","History"]) assert.equal(await tab(name).count(),1);
  await tab("Parallel").click();
  await inspector.locator(".vd-dock-parallel-preview p").first().waitFor();
  assert.equal(await inspector.locator(".vd-dock-edition").count(),1);
  for (const [name,heading] of [["Bookmarks","Bookmarked passages"],["Highlights","Highlights and annotations"],["History","Recent reading"]]) {
    await tab(name).click();
    await inspector.getByRole("heading",{name:heading}).waitFor();
  }
  await tab("Lexicon").click();
  const input=inspector.getByRole("searchbox");
  for (const [key,action,definition] of [["G25","Enter","to love"],["H430","Click","gods in the ordinary sense"]]) {
    await input.fill(key);
    if(action==="Enter") await input.press("Enter");
    else await inspector.getByRole("button",{name:"Look up",exact:true}).click();
    await inspector.locator(".vd-word-entries h4").filter({hasText:key}).waitFor();
    await inspector.locator(".vd-word-entries .vd-selectable-resource").filter({hasText:definition}).waitFor();
  }
  await tab("Study").click();
  assert.equal(await source.inputValue(),id);
  await source.selectOption("mhc");
  await inspector.locator(".vd-commentary-excerpt").waitFor();
  await source.selectOption(id);
  await inspector.getByText("A passage-specific commentary entry.",{exact:true}).waitFor();
  return id;
}
