export type SessionEndIntent = {
  sessionId: string;
  reason: "user-quit";
  recordedAt: Date;
};

// v1 issue #6 seam: record intent at the app boundary without lifecycle persistence yet.
export function recordUserQuitIntent(input: {
  sessionId: string;
}): SessionEndIntent {
  return {
    sessionId: input.sessionId,
    reason: "user-quit",
    recordedAt: new Date()
  };
}
