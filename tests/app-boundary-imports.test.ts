import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

function collectFiles(dir: string, ext: string[]): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full, ext));
    } else if (ext.some((e) => full.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

describe("App layer module boundary", () => {
  const appRoot = resolve(__dirname, "../app");
  const appFiles = collectFiles(appRoot, [".ts", ".tsx"]);

  it("app/* has no runtime imports from src/domain/*", () => {
    const violations: string[] = [];

    for (const file of appFiles) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      const rel = file.replace(resolve(__dirname, "..") + "/", "");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          line.includes("@/src/domain") &&
          !line.trimStart().startsWith("//")
        ) {
          violations.push(`${rel}:${i + 1} — ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("app/* has no direct Effect imports", () => {
    const violations: string[] = [];

    for (const file of appFiles) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      const rel = file.replace(resolve(__dirname, "..") + "/", "");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          /from\s+["']effect["']/.test(line) &&
          !line.trimStart().startsWith("//")
        ) {
          violations.push(`${rel}:${i + 1} — ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("app/* has no runtime imports from src/infrastructure/*", () => {
    const violations: string[] = [];

    for (const file of appFiles) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      const rel = file.replace(resolve(__dirname, "..") + "/", "");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          line.includes("@/src/infrastructure") &&
          !line.trimStart().startsWith("//")
        ) {
          violations.push(`${rel}:${i + 1} — ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("app/* has no runtime imports from src/providers/*", () => {
    const violations: string[] = [];

    for (const file of appFiles) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      const rel = file.replace(resolve(__dirname, "..") + "/", "");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          line.includes("@/src/providers") &&
          !line.trimStart().startsWith("//")
        ) {
          violations.push(`${rel}:${i + 1} — ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("app/* has no throw statements in production paths", () => {
    const violations: string[] = [];

    for (const file of appFiles) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      const rel = file.replace(resolve(__dirname, "..") + "/", "");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          /\bthrow\s/.test(line) &&
          !line.trimStart().startsWith("//")
        ) {
          violations.push(`${rel}:${i + 1} — ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
