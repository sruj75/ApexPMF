import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url))
    }
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**", "app/**"],
      exclude: [
        "tests/**",
        "**/*.test.*",
        "**/*.spec.*",
        ".next/**",
        "node_modules/**"
      ],
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 78,
        functions: 77,
        branches: 70,
        statements: 78
      }
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/**/*.test.ts"]
        }
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["tests/**/*.test.tsx"],
          setupFiles: ["./tests/setup.ui.ts"]
        }
      }
    ]
  }
});
