import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Même alias "@/..." que tsconfig.json, sinon les imports des composants cassent.
  resolve: { alias: { "@": root } },
  test: {
    // jsdom par défaut (composants) ; les tests de lib/content.ts déclarent
    // `@vitest-environment node` en tête de fichier pour accéder à fs.
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
