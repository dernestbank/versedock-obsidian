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
const config = path.join(vault, ".obsidian");
fs.writeFileSync(path.join(config, "community-plugins.json"), '["versedock"]\n');
console.log("Installed the dev plugin to isolated vault: " + vault);
console.log("Open this vault in Obsidian and enable community plugins if needed.");
