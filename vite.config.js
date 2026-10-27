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

// The same public HTML is returned to people and crawlers; no user-agent routing.
function publicSearchDocuments(apiTarget) {
  let config
  const documents = new Set(['/robots.txt', '/sitemap.xml', '/llms.txt'])
  function middleware(transform, indexPath) {
    return async (request, response, next) => {
      if (!['GET', 'HEAD'].includes(request.method)) return next()
      const url = new URL(request.originalUrl || request.url, 'http://site.local')
      if (documents.has(url.pathname)) {
        try {
          const upstream = await fetch(apiTarget + url.pathname, { signal: AbortSignal.timeout(10000) })
          if (!upstream.ok) { response.statusCode = 503; response.setHeader('X-Robots-Tag','noindex'); return response.end('Website discovery document is temporarily unavailable.') }
          response.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/plain;charset=UTF-8')
          response.setHeader('Cache-Control','no-store')
          return response.end(request.method === 'HEAD' ? undefined : await upstream.text())
        } catch { response.statusCode=503; return response.end('Website discovery document is temporarily unavailable.') }
      }
      if (/^\/admin(?:\/|$)/.test(url.pathname)) response.setHeader('X-Robots-Tag','noindex,nofollow,noarchive')
      if (/^\/(?:api|assets|src|docs|database|server|scripts|node_modules|@vite|@id|@fs)(?:\/|$)/.test(url.pathname)) return next()
      if (!String(request.headers.accept || 'text/html').includes('text/html') && request.headers.accept !== '*/*') return next()
      if (url.pathname === '/index.html') { response.statusCode=301; response.setHeader('Location','/'); return response.end() }
      try {
        const upstream = await fetch(apiTarget + '/api/seo/document?' + new URLSearchParams({ path: url.pathname + url.search }), { signal: AbortSignal.timeout(10000) })
        // Keep development usable while an older backend is still being replaced.
        if ([401,404].includes(upstream.status)) return next()
        if (!upstream.ok) throw Error('Public page data is unavailable')
        const document = await upstream.json()
        if (!document.page || typeof document.head !== 'string' || typeof document.body !== 'string') throw Error('Invalid public document')
        const canonical = new URL(document.page.url)
        if (document.page.status === 200 && canonical.pathname !== url.pathname) { response.statusCode=301;response.setHeader('Location',canonical.pathname+url.search);return response.end() }
        let template = await readFile(indexPath,'utf8')
        if (transform) template = await transform(url.pathname + url.search,template)
        template = template.replace(/<!--site:head:start-->[\s\S]*?<!--site:head:end-->/,()=>document.head).replace('<!--site:body-->',()=>document.body).replace('<!--site:bootstrap-->',()=>document.bootstrap)
        response.statusCode=document.page.status;response.setHeader('Content-Type','text/html;charset=UTF-8');response.setHeader('Cache-Control','no-store')
        if (!document.page.indexable) response.setHeader('X-Robots-Tag',document.page.robots)
        return response.end(request.method === 'HEAD' ? undefined : template)
      } catch {
        response.statusCode=503;response.setHeader('Content-Type','text/html;charset=UTF-8');response.setHeader('X-Robots-Tag','noindex,nofollow')
        return response.end('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>网站暂时不可用 - TZME 重钢机械</title><h1>网站暂时不可用</h1><p>请稍后重试。</p></html>')
      }
    }
  }
  return {
    name:'public-search-documents',
    configResolved(value){ config=value },
    configureServer(server){ server.middlewares.use(middleware(server.transformIndexHtml.bind(server),resolve(config.root,'index.html'))) },
    configurePreviewServer(server){ server.middlewares.use(middleware(null,resolve(config.root,config.build.outDir,'index.html'))) },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = process.env.VITE_API_TARGET || env.VITE_API_TARGET || 'http://127.0.0.1:8080';
  return {
  plugins: [
    vue(),
    Components({ resolvers: [ElementPlusResolver({ importStyle: "css" })] }),
    curatedPublicAssets(),
    pdfPreviewAssets(),
    publicSearchDocuments(apiTarget),
  ],
  build: { copyPublicDir: false },
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/database/snapshots/**', '**/server/**', '**/*.local.json'] },
    proxy: { "/api": process.env.VITE_API_TARGET || env.VITE_API_TARGET || "http://127.0.0.1:8080" },
  },
  preview: { proxy: { "/api": process.env.VITE_API_TARGET || env.VITE_API_TARGET || "http://127.0.0.1:8080" } },
  };
});
