import esbuild from "esbuild";

const production = process.argv.includes("production");
const config = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "main.js",
  format: "cjs",
  target: "es2022",
  platform: "browser",
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  sourcemap: production ? false : "inline",
  minify: production,
  logLevel: "info",
};
if (production) await esbuild.build(config);
else {
  const context = await esbuild.context(config);
  await context.watch();
  console.log("Watching MySword+ sources.");
}
