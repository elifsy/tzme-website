import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [
    vue(),
    Components({ resolvers: [ElementPlusResolver({ importStyle: "css" })] }),
  ],
  server: { proxy: { "/api": process.env.VITE_API_TARGET || env.VITE_API_TARGET || "http://127.0.0.1:8080" } },
  preview: { proxy: { "/api": process.env.VITE_API_TARGET || env.VITE_API_TARGET || "http://127.0.0.1:8080" } },
  };
});
