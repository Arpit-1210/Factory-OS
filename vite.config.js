import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// ── COPY NON-BUNDLED SCRIPTS INTO THE BUILD ──
// index.html now loads a single type="module" entry, which Vite bundles,
// hashes and minifies normally. Anything still referenced as a CLASSIC
// <script src="/..."> cannot be bundled, and Vite leaves such tags pointing at
// a path that would not exist in dist/ — which is how `npm run build` once
// emitted a dist/ with index.html, CSS and NO JAVASCRIPT AT ALL.
//
// So: copy through only the scripts Vite will not handle itself. Module
// scripts are skipped deliberately — copying them would place a stale,
// unbundled duplicate at a path nothing references.
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
  const SCRIPT_TAG = /<script([^>]*)\ssrc="(\/[^"]+\.js)"/g;
  return {
    name: 'copy-classic-scripts',
    apply: 'build',
    generateBundle() {
      const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
      const wanted = new Set(LEGACY_ROOT_FILES);
      for (const [, attrs, src] of html.matchAll(SCRIPT_TAG)) {
        if (/type\s*=\s*["']module["']/.test(attrs)) continue;  // Vite bundles these
        wanted.add(src.replace(/^\//, ''));
      }

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
