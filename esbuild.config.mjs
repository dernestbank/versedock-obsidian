import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const production = process.argv.includes("production");
const config = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "main.js",
  format: "cjs",
  target: "es2022",
  loader: { ".wasm": "binary", ".svg": "text" },
  footer: { js: "/*\n" + ["assets/LICENSE-sql.js.txt", "node_modules/fflate/LICENSE"].map(file => readFileSync(file, "utf8")).join("\n") + "\n*/" },
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
