import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const production = process.argv.includes("production");
const dependencyLicenses = [
  'assets/LICENSE-sql.js.txt', 'node_modules/fflate/LICENSE',
  ...['node-html-parser', 'css-select', 'css-what', 'dom-serializer', 'domelementtype',
    'domhandler', 'domutils', 'entities', 'nth-check'].map(name => 'node_modules/' + name + '/LICENSE'),
  'node_modules/he/LICENSE-MIT.txt', 'assets/LICENSE-boolbase.txt'
];
const config = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: production ? "dist/manual/main.js" : "main.js",
  format: "cjs",
  target: "es2022",
  loader: { ".wasm": "binary", ".svg": "text" },
  footer: { js: "/*\n" + dependencyLicenses.map(file => readFileSync(file, "utf8")).join("\n") + "\n*/" },
  platform: "browser",
  external: ["obsidian", "electron", "node:*", "@codemirror/*", "@lezer/*"],
  sourcemap: production ? false : "inline",
  minify: production,
  logLevel: "info",
};
if (production) await esbuild.build(config);
else {
  const context = await esbuild.context(config);
  await context.watch();
  console.log("Watching SwordDock Bible sources.");
}
