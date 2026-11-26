import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const vault = path.join(root, "test-vault");
const pluginDir = path.join(vault, ".obsidian", "plugins", "versedock");
fs.mkdirSync(pluginDir, { recursive: true });
for (const file of ["main.js", "manifest.json", "styles.css"]) {
  fs.copyFileSync(path.join(root, file), path.join(pluginDir, file));
}
const wasmDir = path.join(pluginDir, "assets");
fs.mkdirSync(wasmDir, { recursive: true });
for (const asset of ["sql-wasm.wasm", "LICENSE-sql.js.txt"]) {
  fs.copyFileSync(path.join(root, "assets", asset), path.join(wasmDir, asset));
}
const source = path.join(root, "library", "webp");
if (!fs.existsSync(path.join(source, "manifest.json"))) {
  throw new Error("Missing WEB data; run npm run library:build");
}
fs.cpSync(source, path.join(pluginDir, "library", "webp"), { recursive: true, force: true });
const references = path.join(root, "library", "crossrefs");
if (!fs.existsSync(path.join(references, "manifest.json"))) throw new Error("Missing bundled cross-reference data");
fs.cpSync(references, path.join(pluginDir, "library", "crossrefs"), { recursive: true, force: true });
const commentary = path.join(root, "library", "mhc");
if (!fs.existsSync(path.join(commentary, "manifest.json"))) throw new Error("Missing bundled commentary data");
fs.cpSync(commentary, path.join(pluginDir, "library", "mhc"), { recursive: true, force: true });
for (const resource of ["strongs", "interlinear"]) {
  const resourceSource = path.join(root, "library", resource);
  if (!fs.existsSync(path.join(resourceSource, "manifest.json"))) throw new Error("Missing bundled " + resource + " data");
  fs.cpSync(resourceSource, path.join(pluginDir, "library", resource), { recursive: true, force: true });
}
const config = path.join(vault, ".obsidian");
fs.writeFileSync(path.join(config, "community-plugins.json"), '["versedock"]\n');
console.log("Installed the dev plugin to isolated vault: " + vault);
console.log("Open this vault in Obsidian and enable community plugins if needed.");
