import { normalize, posix } from "path";

export function normalizeWorkspaceRelativePath(relativePath: string): string {
  const normalized = normalize(relativePath).replace(/\\/g, "/");
  const trimmed = normalized.replace(/^\.\//, "");

  if (trimmed.startsWith("../") || trimmed === ".." || posix.isAbsolute(trimmed)) {
    throw new Error("relativePath must stay within the node workspace");
  }

  return trimmed;
}

export function buildNodeWorkspacePath(input: {
  founderId: string;
  projectId: string;
  nodeId: string;
  relativePath: string;
}): string {
  const relativePath = normalizeWorkspaceRelativePath(input.relativePath);

  return [
    "founders",
    input.founderId,
    "projects",
    input.projectId,
    "nodes",
    input.nodeId,
    relativePath
  ].join("/");
}
