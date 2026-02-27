import esbuild from "esbuild";
import process from "node:process";

const isProd = process.argv[2] === "production";

const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "fs",
    "path",
    "os",
    "crypto",
    "stream",
    "util",
    "events",
    "buffer",
    "url"
  ],
  format: "cjs",
  target: "es6",
  logLevel: "info",
  sourcemap: !isProd,
  minify: isProd,
  outfile: "main.js"
});

if (isProd) {
  await ctx.rebuild();
  await ctx.dispose();
} else {
  await ctx.watch();
}
