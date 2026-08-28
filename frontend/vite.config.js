import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(process.cwd(), "client"),
  publicDir: path.resolve(process.cwd(), "public"),
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
    },
  },
  build: {
    outDir: path.resolve(process.cwd(), "dist"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  envDir: path.resolve(process.cwd(), ".."),
});
