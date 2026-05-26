import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full));
      continue;
    }

    if (full.endsWith(".ts") || full.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

describe("Issue #23 env boundary", () => {
  it("platform shell code does not read process.env directly", () => {
    const root = resolve(process.cwd(), "src/platform/shell");
    const files = collectFiles(root);
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      const rel = file.replace(resolve(process.cwd()) + "/", "");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("process.env") && !line.trimStart().startsWith("//")) {
          violations.push(`${rel}:${i + 1} ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
