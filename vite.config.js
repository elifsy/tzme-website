import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { cpSync, readdirSync } from 'node:fs';
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [
    vue(),
    Components({ resolvers: [ElementPlusResolver({ importStyle: "css" })] }),
    curatedPublicAssets(),
  ],
  build: { copyPublicDir: false },
  server: { proxy: { "/api": process.env.VITE_API_TARGET || env.VITE_API_TARGET || "http://127.0.0.1:8080" } },
  preview: { proxy: { "/api": process.env.VITE_API_TARGET || env.VITE_API_TARGET || "http://127.0.0.1:8080" } },
  };
});
