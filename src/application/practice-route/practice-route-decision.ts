import {
  hasRoutableSessionReportArtifacts,
  reportGeneratingPath,
  resolveSessionLifecycleRoute
} from "@/src/application/end-session/session-lifecycle-route-policy";
import {
  getLearnerEntryContextEffect,
  getLearnerSessionRuntimeEffect
} from "@/src/application/start-session/practice-entry-seam";
import { toStartedSession, type StartedSession } from "@/src/domain/session/generated-session-case";
import type { SessionReport, SessionTranscriptTurn } from "@/src/domain/session/session-report";
import { Data, Effect } from "effect";

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
  getLearnerEntryContext: () => ReturnType<typeof getLearnerEntryContextEffect>;
  getLearnerSessionRuntime: () => ReturnType<typeof getLearnerSessionRuntimeEffect>;
};

const defaultDependencies: PracticeRouteDecisionDependencies = {
  getLearnerEntryContext: getLearnerEntryContextEffect,
  getLearnerSessionRuntime: getLearnerSessionRuntimeEffect
};

const loginPath = "/login";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class PracticeRouteDecisionDependencyError extends Data.TaggedError(
  "PracticeRouteDecisionDependencyError"
)<{
  operation: string;
  cause: unknown;
}> {}

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
  return Effect.runPromise(resolvePracticeRouteDecisionEffect(input, dependencies));
}

export function isValidPracticeSessionId(sessionId: string): boolean {
  return uuidPattern.test(sessionId);
}

function resolvePracticeRouteDecisionEffect(
  input: {
    intent: PracticeRouteIntent;
    sessionId: string;
  },
  dependencies: PracticeRouteDecisionDependencies
): Effect.Effect<PracticeRouteDecision, PracticeRouteDecisionDependencyError> {
  return Effect.gen(function* () {
    const { intent, sessionId } = input;

    if (!isValidPracticeSessionId(sessionId)) {
      return { action: "not-found" } satisfies PracticeRouteDecision;
    }

    if (intent === "report-generating") {
      const runtime = yield* tryDependency(
        "getLearnerSessionRuntime",
        dependencies.getLearnerSessionRuntime
      );
      if (!runtime.ok) {
        return {
          action: "redirect",
          path: loginPath
        } satisfies PracticeRouteDecision;
      }

      const outcome = yield* tryDependency("runReportGeneratingFlowForLearner", () =>
        runtime.runReportGeneratingFlowForLearner({ sessionId })
      );
      if (outcome.reportStatus === "not-found") {
        return { action: "not-found" } satisfies PracticeRouteDecision;
      }
      return {
        action: "redirect",
        path: outcome.nextPath
      } satisfies PracticeRouteDecision;
    }

    const context = yield* tryDependency(
      "getLearnerEntryContext",
      dependencies.getLearnerEntryContext
    );
    if (!context.ok) {
      return {
        action: "redirect",
        path: loginPath
      } satisfies PracticeRouteDecision;
    }

    const generatedSessionCase = yield* context.generatedSessionCaseRepository
      .getForLearner(context.learnerId, sessionId)
      .pipe(
        Effect.mapError(
          (cause) =>
            new PracticeRouteDecisionDependencyError({
              operation: "generatedSessionCaseRepository.getForLearner",
              cause
            })
        )
      );

    if (!generatedSessionCase) {
      return { action: "not-found" } satisfies PracticeRouteDecision;
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
        } satisfies PracticeRouteDecision;
      }

      return {
        action: "render-practice-session",
        startedSession: toStartedSession(generatedSessionCase)
      } satisfies PracticeRouteDecision;
    }

    if (route.destination !== "session-report") {
      return {
        action: "redirect",
        path: route.nextPath
      } satisfies PracticeRouteDecision;
    }

    if (!hasRoutableSessionReportArtifacts(generatedSessionCase)) {
      return {
        action: "redirect",
        path: reportGeneratingPath(sessionId)
      } satisfies PracticeRouteDecision;
    }

    return {
      action: "render-session-report",
      report: generatedSessionCase.sessionReport,
      transcript: generatedSessionCase.sessionTranscript
    } satisfies PracticeRouteDecision;
  });
}

function tryDependency<T>(
  operation: string,
  run: () => Effect.Effect<T, unknown, never>
): Effect.Effect<T, PracticeRouteDecisionDependencyError> {
  return Effect.suspend(run).pipe(
    Effect.catchAllCause((cause) =>
      Effect.fail(
        new PracticeRouteDecisionDependencyError({
          operation,
          cause
        })
      )
    )
  );
}
