import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "/brainfunction-vision/",
  plugins: [react()],
  cacheDir: "./.vite-cache",
  server: {host: "127.0.0.1", port: 4197, strictPort: true},
  preview: {host: "127.0.0.1", port: 4197, strictPort: true},
  build: {chunkSizeWarningLimit: 1500},
});
