import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { cpSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Keep source material out of production; selected copies live in public/assets.
function curatedPublicAssets() {
  let config;
  return {
    name: 'curated-public-assets', apply: 'build',
    configResolved(value) { config = value; },
    writeBundle() {
      const ignored = new Set(['素材照片', '网站资料']);
      const target = resolve(config.root, config.build.outDir);
      for (const entry of readdirSync(config.publicDir, { withFileTypes: true })) {
        if (!ignored.has(entry.name)) cpSync(resolve(config.publicDir, entry.name), resolve(target, entry.name), { recursive: true });
      }
    },
  };
}

// Serve PDF decoders and fonts locally in development and in the production bundle.
function pdfPreviewAssets() {
  const source = resolve('node_modules/pdfjs-dist');
  const directories = ['cmaps', 'standard_fonts', 'wasm', 'iccs'];
  let config;
  return {
    name: 'pdf-preview-assets',
    configResolved(value) { config = value; },
    configureServer(server) {
      server.middlewares.use('/assets/pdfjs', async (request, response, next) => {
        const parts = (request.url || '').split('?')[0].split('/').filter(Boolean);
        if (!['GET', 'HEAD'].includes(request.method) || parts.length !== 2 || !directories.includes(parts[0]) || !/^[a-zA-Z0-9_.-]+$/.test(parts[1]) || parts[1] === '..') return next();
        try {
          const bytes = await readFile(resolve(source, ...parts));
          response.setHeader('Content-Type', parts[1].endsWith('.wasm') ? 'application/wasm' : parts[1].endsWith('.js') ? 'text/javascript' : 'application/octet-stream');
          response.end(request.method === 'HEAD' ? undefined : bytes);
        } catch (error) { if (error.code === 'ENOENT') next(); else next(error); }
      });
    },
    writeBundle() {
      for (const directory of directories) cpSync(resolve(source, directory), resolve(config.root, config.build.outDir, 'assets/pdfjs', directory), { recursive: true });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [
    vue(),
    Components({ resolvers: [ElementPlusResolver({ importStyle: "css" })] }),
    curatedPublicAssets(),
    pdfPreviewAssets(),
  ],
  build: { copyPublicDir: false },
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/database/snapshots/**', '**/server/**', '**/*.local.json'] },
    proxy: { "/api": process.env.VITE_API_TARGET || env.VITE_API_TARGET || "http://127.0.0.1:8080" },
  },
  preview: { proxy: { "/api": process.env.VITE_API_TARGET || env.VITE_API_TARGET || "http://127.0.0.1:8080" } },
  };
});
