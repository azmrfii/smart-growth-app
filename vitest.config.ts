import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Konfigurasi terpisah dari vite.config.ts agar unit test tidak ikut
// menjalankan plugin server (Nitro/agent-native) yang berat.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./app", import.meta.url)) } },
  test: { include: ["app/**/*.test.ts"], environment: "node" },
});
