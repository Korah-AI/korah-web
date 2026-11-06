// Builds the sidebar island into ../app/sidebar-react.js and ../app/sidebar-react.css.
// Run from korah-bot/: npm run build:sidebar
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "app");

await build({
  entryPoints: [path.join(here, "src/index.tsx")],
  outfile: path.join(out, "sidebar-react.js"),
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  tsconfig: path.join(here, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
  logLevel: "info",
});

execFileSync(
  path.join(here, "node_modules/.bin/tailwindcss"),
  ["-c", path.join(here, "tailwind.config.cjs"), "-i", path.join(here, "styles.css"),
   "-o", path.join(out, "sidebar-react.css"), "--minify"],
  { stdio: "inherit", cwd: here },
);
