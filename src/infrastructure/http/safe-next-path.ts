export function safeNextPath(
  nextPath: string | null,
  fallbackPath = "/dashboard"
): string {
  if (!nextPath) {
    return fallbackPath;
  }

  const trimmed = nextPath.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallbackPath;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackPath;
  }
}
