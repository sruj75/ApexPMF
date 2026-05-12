import type { ReportStatus, SessionEndReason } from "@/src/domain/session/session-lifecycle";

export type SessionEndOutcome = {
  nextPath: string;
  sessionStatus: "ended";
  endedReason: SessionEndReason;
  reportStatus: ReportStatus;
};

export type VoiceFailureOutcome =
  | {
      behavior: "resume-voice-conversation";
      nextPath: string;
    }
  | {
      behavior: "end-session";
      nextPath: string;
    };

export type ReportGeneratingFlowOutcome = {
  reportStatus: "ready" | "insufficient-evidence";
  nextPath: string;
};

export function sessionEndOutcome(input: {
  nextPath: string;
  endedReason: SessionEndReason;
  reportStatus: ReportStatus;
}): SessionEndOutcome {
  return {
    nextPath: input.nextPath,
    sessionStatus: "ended",
    endedReason: input.endedReason,
    reportStatus: input.reportStatus
  };
}

export function resumeVoiceConversationOutcome(
  nextPath: string
): Extract<VoiceFailureOutcome, { behavior: "resume-voice-conversation" }> {
  return {
    behavior: "resume-voice-conversation",
    nextPath
  };
}

export function endSessionVoiceFailureOutcome(
  nextPath: string
): Extract<VoiceFailureOutcome, { behavior: "end-session" }> {
  return {
    behavior: "end-session",
    nextPath
  };
}

export function reportGeneratingFlowOutcome(input: {
  reportStatus: "ready" | "insufficient-evidence";
  nextPath: string;
}): ReportGeneratingFlowOutcome {
  return {
    reportStatus: input.reportStatus,
    nextPath: input.nextPath
  };
}
