export type SessionEndReason =
  | "user-quit"
  | "natural-conclusion"
  | "60-minute cap"
  | "credit-exhaustion"
  | "voice-failure";

export type SessionStatus = "voice-conversation" | "ended";

export type ReportStatus =
  | "not-requested"
  | "generating"
  | "ready"
  | "insufficient-evidence";

export type SessionLifecycleState = {
  sessionStatus: SessionStatus;
  endedReason: SessionEndReason | null;
  endedAt: Date | null;
  reportStatus: ReportStatus;
  reportReadyAt: Date | null;
};

export function createInitialSessionLifecycleState(): SessionLifecycleState {
  return {
    sessionStatus: "voice-conversation",
    endedReason: null,
    endedAt: null,
    reportStatus: "not-requested",
    reportReadyAt: null
  };
}
