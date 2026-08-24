import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: false,
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
  },
});
