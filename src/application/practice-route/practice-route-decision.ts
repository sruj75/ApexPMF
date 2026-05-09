import {
  hasRoutableSessionReportArtifacts,
  reportGeneratingPath,
  resolveSessionLifecycleRoute
} from "@/src/application/end-session/session-lifecycle-route-policy";
import {
  getLearnerEntryContext,
  getLearnerSessionRuntime
} from "@/src/application/start-session/practice-entry-seam";
import { toStartedSession, type StartedSession } from "@/src/domain/session/generated-session-case";
import type { SessionReport, SessionTranscriptTurn } from "@/src/domain/session/session-report";

export type PracticeRouteIntent =
  | "practice-session"
  | "session-report"
  | "report-generating";

export type PracticeRouteDecision =
  | {
      action: "not-found";
    }
  | {
      action: "redirect";
      path: string;
    }
  | {
      action: "render-practice-session";
      startedSession: StartedSession;
    }
  | {
      action: "render-session-report";
      report: SessionReport;
      transcript: SessionTranscriptTurn[];
    };

export type PracticeRouteDecisionDependencies = {
  getLearnerEntryContext: () => ReturnType<typeof getLearnerEntryContext>;
  getLearnerSessionRuntime: () => ReturnType<typeof getLearnerSessionRuntime>;
};

const defaultDependencies: PracticeRouteDecisionDependencies = {
  getLearnerEntryContext,
  getLearnerSessionRuntime
};

const loginPath = "/login";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Canonical route-decision seam for all practice lifecycle routes.
 * Route shells call this once, then only execute the returned action.
 */
export async function resolvePracticeRouteDecision(
  input: {
    intent: PracticeRouteIntent;
    sessionId: string;
  },
  dependencies: PracticeRouteDecisionDependencies = defaultDependencies
): Promise<PracticeRouteDecision> {
  const { intent, sessionId } = input;

  if (!isValidPracticeSessionId(sessionId)) {
    return { action: "not-found" };
  }

  if (intent === "report-generating") {
    const runtime = await dependencies.getLearnerSessionRuntime();
    if (!runtime.ok) {
      return {
        action: "redirect",
        path: loginPath
      };
    }

    const outcome = await runtime.runReportGeneratingFlowForLearner({ sessionId });
    return {
      action: "redirect",
      path: outcome.nextPath
    };
  }

  const context = await dependencies.getLearnerEntryContext();
  if (!context.ok) {
    return {
      action: "redirect",
      path: loginPath
    };
  }

  const generatedSessionCase = await context.generatedSessionCaseRepository.getForLearner(
    context.learnerId,
    sessionId
  );

  if (!generatedSessionCase) {
    return { action: "not-found" };
  }

  const route = resolveSessionLifecycleRoute({
    sessionId,
    generatedSessionCase
  });

  if (intent === "practice-session") {
    if (route.destination !== "voice-conversation") {
      return {
        action: "redirect",
        path: route.nextPath
      };
    }

    return {
      action: "render-practice-session",
      startedSession: toStartedSession(generatedSessionCase)
    };
  }

  if (route.destination !== "session-report") {
    return {
      action: "redirect",
      path: route.nextPath
    };
  }

  if (!hasRoutableSessionReportArtifacts(generatedSessionCase)) {
    return {
      action: "redirect",
      path: reportGeneratingPath(sessionId)
    };
  }

  return {
    action: "render-session-report",
    report: generatedSessionCase.sessionReport,
    transcript: generatedSessionCase.sessionTranscript
  };
}

export function isValidPracticeSessionId(sessionId: string): boolean {
  return uuidPattern.test(sessionId);
}
