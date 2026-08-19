import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// ── COPY CLASSIC SCRIPTS INTO THE BUILD ──
// index.html loads src/js/supabase-db.js and src/js/app.js as plain
// <script src>, not type="module". Vite cannot bundle a classic script, so it
// leaves the tags pointing at /src/js/... and warns — which meant `npm run
// build` emitted a dist/ containing index.html and CSS and NO JAVASCRIPT AT
// ALL. `npm run preview` served a blank page, and any deploy fed from dist/
// would have shipped a dead app. (Production has been unaffected only because
// vercel.json sets outputDirectory to the repo root and never runs the build.)
//
// They stay classic on purpose: app.js is one 5,000-line script whose ~180
// functions are wired to inline onclick= handlers via explicit window.*
// assignments, and ES modules would also switch the whole file to strict mode.
// Converting it is a separate job with real regression risk.
//
// So: copy them through verbatim, preserving the path index.html already
// points at. The list is read from index.html rather than hardcoded, so a new
// classic script needs no change here.
// Served at the same URL as before, but never referenced by the CURRENT
// index.html, so nothing above would pick them up:
//   · sw.js          — a self-destroying service worker. Devices still running
//                      the old PWA worker re-fetch this on their update check;
//                      it clears every cache, unregisters itself and reloads
//                      the page. It has to stay reachable at /sw.js until
//                      those devices have all come back at least once.
//   · registerSW.js  — the OLD cached index.html on those same devices still
//                      requests it. It now unregisters instead of registering.
const LEGACY_ROOT_FILES = ['sw.js', 'registerSW.js'];

function copyClassicScripts() {
  const LOCAL_SCRIPT = /<script[^>]+src="(\/[^"]+\.js)"/g;
  return {
    name: 'copy-classic-scripts',
    apply: 'build',
    generateBundle() {
      const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
      const wanted = new Set(LEGACY_ROOT_FILES);
      for (const [, src] of html.matchAll(LOCAL_SCRIPT)) wanted.add(src.replace(/^\//, ''));

      for (const rel of wanted) {
        const abs = path.resolve(__dirname, rel);
        if (!fs.existsSync(abs)) {
          this.warn(`/${rel} is expected in the build but does not exist on disk`);
          continue;
        }
        this.emitFile({ type: 'asset', fileName: rel, source: fs.readFileSync(abs) });
      }
    },
  };
}

export default defineConfig({
  plugins: [copyClassicScripts()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
})
