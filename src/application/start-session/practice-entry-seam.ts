import {
  classifyEntryFailure,
  type EntryFailure
} from "@/src/application/start-session/entry-failure";
import {
  degradableHiddenEvaluationCapabilityLayerFromEnv,
  requiredPersonaGenerationCapabilityLayerFromEnv
} from "@/src/application/llm-runtime/llm-runtime-layers";
import {
  SessionCaseNotFoundError,
  type SessionOrchestratorError,
  createSessionOrchestrator
} from "@/src/application/end-session/session-orchestrator";
import { createReportGenerationCoordinator } from "@/src/application/generate-report/report-generation-coordinator";
import type { SessionEndReason } from "@/src/domain/session/session-lifecycle";
import {
  normalizeStartPracticeFailure,
  defaultStartPracticeNonceLayer,
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
      creditLedgerRepository: Extract<
        SupabaseLearnerEntryContextResult,
        { ok: true }
      >["creditLedgerRepository"];
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

export type LearnerSessionRuntimeEffectResult =
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

    const hiddenEvaluationLayer = degradableHiddenEvaluationCapabilityLayerFromEnv(
      process.env
    );
    const reportGenerationCoordinator = createReportGenerationCoordinator();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: context.generatedSessionCaseRepository,
      reportGenerationCoordinator
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
            Effect.provide(hiddenEvaluationLayer),
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

export type StartPracticeEntryContext = {
  learnerId: string;
  idealCustomerProfileRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["idealCustomerProfileRepository"];
  generatedSessionCaseRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["generatedSessionCaseRepository"];
  creditLedgerRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["creditLedgerRepository"];
};

export function startPracticeFromEntryContextEffect(
  context: StartPracticeEntryContext
): Effect.Effect<StartPracticeSeamResult, never, never> {
  const personaLayer = requiredPersonaGenerationCapabilityLayerFromEnv(process.env);

  return Effect.gen(function* () {
    const result = yield* Effect.either(
      startPracticeForLearner(context.learnerId, {
        idealCustomerProfileRepository: context.idealCustomerProfileRepository,
        generatedSessionCaseRepository: context.generatedSessionCaseRepository,
        creditLedgerRepository: context.creditLedgerRepository
      }).pipe(
        Effect.provide(defaultStartPracticeNonceLayer),
        Effect.provide(personaLayer)
      )
    );

    if (result._tag === "Left") {
      const failure = classifyEntryFailure(
        normalizeStartPracticeFailure(result.left)
      );
      yield* Effect.logWarning("start-practice.entry_failure", {
        learnerId: context.learnerId,
        category: failure.category,
        details: failure.details
      });
      return {
        ok: false,
        failure
      };
    }

    return {
      ok: true,
      sessionId: result.right.sessionId
    };
  });
}
