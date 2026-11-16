import { build } from "esbuild";

const options = {
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info",
};
await Promise.all([
  build({ ...options, entryPoints: ["preview.ts"], outfile: "bundle.js" }),
  build({
    ...options,
    entryPoints: ["../effects/landing-sky.ts"],
    outfile: "../effects/sky.js",
  }),
  build({
    ...options,
    entryPoints: ["../effects/landing-scan.ts"],
    outfile: "../effects/scan.js",
  }),
]);
