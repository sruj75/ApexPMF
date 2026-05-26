import { describe, expect, it } from "vitest";
import {
  buildNodeWorkspacePath,
  normalizeWorkspaceRelativePath
} from "@/src/providers/workspace";

describe("Workspace provider path helpers", () => {
  it("builds founders/projects/nodes path convention", () => {
    expect(
      buildNodeWorkspacePath({
        founderId: "f-1",
        projectId: "p-1",
        nodeId: "interview-practice",
        relativePath: "reports/latest.md"
      })
    ).toBe("founders/f-1/projects/p-1/nodes/interview-practice/reports/latest.md");
  });

  it("normalizes relative paths and rejects traversal", () => {
    expect(normalizeWorkspaceRelativePath("./reports/../reports/latest.md")).toBe(
      "reports/latest.md"
    );
    expect(() => normalizeWorkspaceRelativePath("../secrets.txt")).toThrow(
      "must stay within the node workspace"
    );
  });
});
