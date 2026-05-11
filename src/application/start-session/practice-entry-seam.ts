import { type EntryFailure } from "@/src/application/start-session/entry-failure";
import {
  createNonLiveLlmRuntimePolicy,
  type NonLiveLlmRuntimePolicy
} from "@/src/application/non-live-llm-policy";
import {
  SessionCaseNotFoundError,
  type SessionOrchestratorError,
  createSessionOrchestrator
} from "@/src/application/end-session/session-orchestrator";
import { createReportGenerationCoordinator } from "@/src/application/generate-report/report-generation-coordinator";
import type { SessionEndReason } from "@/src/domain/session/session-lifecycle";
import {
  normalizeStartPracticeFailure,
  startPracticeForLearner
} from "@/src/application/start-session/start-practice";
import {
  getSupabaseLearnerEntryContextEffect,
  type SupabaseLearnerEntryContextError,
  type SupabaseLearnerEntryContextResult
} from "@/src/infrastructure/supabase/learner-entry-context";
import { Effect } from "effect";

export type LearnerEntryContextResult =
  | {
      ok: true;
      learnerId: string;
      idealCustomerProfileRepository: Extract<
        SupabaseLearnerEntryContextResult,
        { ok: true }
      >["idealCustomerProfileRepository"];
      generatedSessionCaseRepository: Extract<
        SupabaseLearnerEntryContextResult,
        { ok: true }
      >["generatedSessionCaseRepository"];
    }
  | {
      ok: false;
      reason: "unauthenticated";
    };

export type StartPracticeSeamResult =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      failure: EntryFailure;
    };

export function getLearnerEntryContextEffect(): Effect.Effect<
  LearnerEntryContextResult,
  SupabaseLearnerEntryContextError,
  never
> {
  return getSupabaseLearnerEntryContextEffect();
}

export async function getLearnerEntryContext(): Promise<LearnerEntryContextResult> {
  return Effect.runPromise(getLearnerEntryContextEffect());
}

type LearnerSessionRuntimeEffectResult =
  | {
      ok: false;
      reason: "unauthenticated";
    }
  | {
      ok: true;
      endSessionForLearner(input: {
        sessionId: string;
        reason: SessionEndReason;
      }): Effect.Effect<{
        nextPath: string;
        sessionStatus: "ended";
        endedReason: SessionEndReason;
        reportStatus: "not-requested" | "generating" | "ready" | "insufficient-evidence";
      }, SessionOrchestratorError, never>;
      runReportGeneratingFlowForLearner(input: {
        sessionId: string;
      }): Effect.Effect<
        | {
            reportStatus: "not-found";
          }
        | {
            reportStatus: "ready" | "insufficient-evidence";
            nextPath: string;
          },
        SessionOrchestratorError,
        never
      >;
    };

export type LearnerSessionRuntimeResult =
  | {
      ok: false;
      reason: "unauthenticated";
    }
  | {
      ok: true;
      endSessionForLearner(input: {
        sessionId: string;
        reason: SessionEndReason;
      }): Promise<{
        nextPath: string;
        sessionStatus: "ended";
        endedReason: SessionEndReason;
        reportStatus: "not-requested" | "generating" | "ready" | "insufficient-evidence";
      }>;
      runReportGeneratingFlowForLearner(input: {
        sessionId: string;
      }): Promise<
        | {
            reportStatus: "not-found";
          }
        | {
            reportStatus: "ready" | "insufficient-evidence";
            nextPath: string;
          }
      >;
    };

/**
 * Learner-scoped Session Orchestrator wiring for end-session and report-generating flows.
 * Call sites use this instead of assembling repositories and coordinators directly.
 */
export function getLearnerSessionRuntimeEffect(): Effect.Effect<
  LearnerSessionRuntimeEffectResult,
  SupabaseLearnerEntryContextError,
  never
> {
  return Effect.gen(function* () {
    const context = yield* getLearnerEntryContextEffect();
    if (!context.ok) {
      return { ok: false, reason: "unauthenticated" };
    }

    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: context.generatedSessionCaseRepository,
      reportGenerationCoordinator: createReportGenerationCoordinator()
    });

    const { learnerId } = context;

    return {
      ok: true as const,
      endSessionForLearner({ sessionId, reason }) {
        return orchestrator.endSessionForLearner({
          learnerId,
          sessionId,
          reason
        });
      },
      runReportGeneratingFlowForLearner({ sessionId }) {
        return orchestrator
          .runReportGeneratingFlowForLearner({ learnerId, sessionId })
          .pipe(
            Effect.catchIf(
              (error): error is SessionCaseNotFoundError =>
                error instanceof SessionCaseNotFoundError,
              () =>
              Effect.succeed({
                reportStatus: "not-found" as const
              })
            )
          );
      }
    };
  });
}

export async function getLearnerSessionRuntime(): Promise<LearnerSessionRuntimeResult> {
  const runtime = await Effect.runPromise(getLearnerSessionRuntimeEffect());
  if (!runtime.ok) {
    return runtime;
  }

  return {
    ok: true,
    endSessionForLearner: (input) => Effect.runPromise(runtime.endSessionForLearner(input)),
    runReportGeneratingFlowForLearner: (input) =>
      Effect.runPromise(runtime.runReportGeneratingFlowForLearner(input))
  };
}

export function startPracticeFromEntryContextEffect(context: {
  learnerId: string;
  idealCustomerProfileRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["idealCustomerProfileRepository"];
  generatedSessionCaseRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["generatedSessionCaseRepository"];
},
input?: {
  nonLiveLlmRuntimePolicy?: NonLiveLlmRuntimePolicy;
}): Effect.Effect<StartPracticeSeamResult, never, never> {
  const nonLiveLlmRuntimePolicy =
    input?.nonLiveLlmRuntimePolicy ?? createNonLiveLlmRuntimePolicy();

  return Effect.gen(function* () {
    const result = yield* Effect.either(
      Effect.gen(function* () {
        const personaGenerator =
          yield* nonLiveLlmRuntimePolicy.composePersonaGenerator();
        return yield* startPracticeForLearner(context.learnerId, {
          idealCustomerProfileRepository: context.idealCustomerProfileRepository,
          generatedSessionCaseRepository: context.generatedSessionCaseRepository,
          personaGenerator
        });
      })
    );

    if (result._tag === "Left") {
      return {
        ok: false,
        failure: nonLiveLlmRuntimePolicy.mapStartSessionFailure(
          normalizeStartPracticeFailure(result.left)
        )
      };
    }

    return {
      ok: true,
      sessionId: result.right.sessionId
    };
  });
}

export async function startPracticeFromEntryContext(context: {
  learnerId: string;
  idealCustomerProfileRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["idealCustomerProfileRepository"];
  generatedSessionCaseRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["generatedSessionCaseRepository"];
},
input?: {
  nonLiveLlmRuntimePolicy?: NonLiveLlmRuntimePolicy;
}): Promise<StartPracticeSeamResult> {
  return Effect.runPromise(startPracticeFromEntryContextEffect(context, input));
}
