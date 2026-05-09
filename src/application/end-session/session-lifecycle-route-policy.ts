import type { GeneratedSessionCase } from "@/src/domain/session/generated-session-case";

export type SessionLifecycleDestination =
  | {
      destination: "voice-conversation";
      nextPath: string;
    }
  | {
      destination: "report-generating";
      nextPath: string;
    }
  | {
      destination: "session-report";
      nextPath: string;
    }
  | {
      destination: "practice-dashboard";
      nextPath: string;
    };

export type ReportGeneratingDecision =
  | {
      decision: "generate-report";
      nextPath: string;
    }
  | {
      decision: "skip-generation";
      reportStatus: "ready" | "insufficient-evidence";
      nextPath: string;
    };

export type GeneratedSessionCaseWithRoutableReport = GeneratedSessionCase & {
  sessionLifecycle: GeneratedSessionCase["sessionLifecycle"] & {
    reportStatus: "ready";
  };
  sessionReport: NonNullable<GeneratedSessionCase["sessionReport"]>;
  sessionTranscript: NonNullable<GeneratedSessionCase["sessionTranscript"]>;
  sessionEvaluation: NonNullable<GeneratedSessionCase["sessionEvaluation"]>;
};

export function resolveSessionLifecycleRoute(input: {
  sessionId: string;
  generatedSessionCase: GeneratedSessionCase;
}): SessionLifecycleDestination {
  const { sessionId, generatedSessionCase } = input;
  const { sessionLifecycle } = generatedSessionCase;

  if (sessionLifecycle.sessionStatus === "voice-conversation") {
    return {
      destination: "voice-conversation",
      nextPath: voiceConversationPath(sessionId)
    };
  }

  if (sessionLifecycle.endedReason === "user-quit") {
    return {
      destination: "practice-dashboard",
      nextPath: practiceDashboardPath()
    };
  }

  if (
    sessionLifecycle.reportStatus === "insufficient-evidence" ||
    sessionLifecycle.reportStatus === "not-requested"
  ) {
    return {
      destination: "practice-dashboard",
      nextPath: practiceDashboardPath()
    };
  }

  if (hasRoutableSessionReportArtifacts(generatedSessionCase)) {
    return {
      destination: "session-report",
      nextPath: sessionReportPath(sessionId)
    };
  }

  return {
    destination: "report-generating",
    nextPath: reportGeneratingPath(sessionId)
  };
}

export function resolveReportGeneratingDecision(input: {
  sessionId: string;
  generatedSessionCase: GeneratedSessionCase;
}): ReportGeneratingDecision {
  const route = resolveSessionLifecycleRoute(input);

  if (route.destination === "report-generating") {
    return {
      decision: "generate-report",
      nextPath: route.nextPath
    };
  }

  if (route.destination === "session-report") {
    return {
      decision: "skip-generation",
      reportStatus: "ready",
      nextPath: route.nextPath
    };
  }

  return {
    decision: "skip-generation",
    reportStatus: "insufficient-evidence",
    nextPath: route.nextPath
  };
}

export function hasRoutableSessionReportArtifacts(
  generatedSessionCase: GeneratedSessionCase
): generatedSessionCase is GeneratedSessionCaseWithRoutableReport {
  return (
    generatedSessionCase.sessionLifecycle.reportStatus === "ready" &&
    generatedSessionCase.sessionReport !== null &&
    generatedSessionCase.sessionTranscript !== null &&
    generatedSessionCase.sessionEvaluation !== null
  );
}

export function voiceConversationPath(sessionId: string): string {
  return `/practice/${sessionId}`;
}

export function reportGeneratingPath(sessionId: string): string {
  return `/practice/${sessionId}/report-generating`;
}

export function sessionReportPath(sessionId: string): string {
  return `/practice/${sessionId}/report`;
}

export function practiceDashboardPath(): string {
  return "/dashboard";
}
