import {
  type ReportGenerationCoordinator,
  type ReportGenerationCoordinatorError
} from "@/src/application/generate-report/report-generation-coordinator";
import type { HiddenEvaluationCapability } from "@/src/application/llm-runtime/llm-runtime-layers";
import type { ProgressionUpdater } from "@/src/application/update-progression/progression-updater";
import { finalizeSessionCredits } from "@/src/application/end-session/finalize-session-credits";
import type { SessionCreditContext } from "@/src/domain/credits/credit-ledger";
import type { CreditLedgerRepository, CreditLedgerRepositoryError } from "@/src/domain/credits/credit-ledger-repository";
import {
  type GeneratedSessionCaseRepository,
  type GeneratedSessionCaseRepositoryError
} from "@/src/domain/session/generated-session-case-repository";
import type { ProgressionRepositoryError } from "@/src/domain/progression/progression-repository";
import type { SessionEndReason } from "@/src/domain/session/session-lifecycle";
import { Data, Effect } from "effect";
import {
  resolveReportGeneratingDecision,
  resolveSessionLifecycleRoute,
  voiceConversationPath
} from "./session-lifecycle-route-policy";
import {
  endSessionVoiceFailureOutcome,
  reportGeneratingFlowOutcome,
  resumeVoiceConversationOutcome,
  sessionEndOutcome,
  type ReportGeneratingFlowOutcome,
  type SessionEndOutcome,
  type VoiceFailureOutcome
} from "./session-orchestrator-outcomes";

export class SessionCaseNotFoundError extends Data.TaggedError(
  "SessionCaseNotFoundError"
)<{
  learnerId: string;
  sessionId: string;
  operation: "end-session" | "report-generating";
}> {}

export class SessionLifecycleRouteResolutionError extends Data.TaggedError(
  "SessionLifecycleRouteResolutionError"
)<{
  learnerId: string;
  sessionId: string;
  operation: "report-generating";
}> {}

export type SessionOrchestratorError =
  | GeneratedSessionCaseRepositoryError
  | ReportGenerationCoordinatorError
  | CreditLedgerRepositoryError
  | ProgressionRepositoryError
  | SessionCaseNotFoundError
  | SessionLifecycleRouteResolutionError;

export type CreditFinalizationInput = {
  sessionCreditContext: SessionCreditContext;
  actualDurationMinutes: number;
  usableDurationMinutes: number;
  creditLedgerRepository: CreditLedgerRepository;
};

export type SessionOrchestrator = {
  endSessionForLearner(input: {
    learnerId: string;
    sessionId: string;
    reason: SessionEndReason;
    creditFinalization?: CreditFinalizationInput;
  }): Effect.Effect<SessionEndOutcome, SessionOrchestratorError, never>;
  handleVoiceFailureForLearner(input: {
    learnerId: string;
    sessionId: string;
    recoverable: boolean;
    creditFinalization?: CreditFinalizationInput;
  }): Effect.Effect<VoiceFailureOutcome, SessionOrchestratorError, never>;
  runReportGeneratingFlowForLearner(input: {
    learnerId: string;
    sessionId: string;
  }): Effect.Effect<
    ReportGeneratingFlowOutcome,
    SessionOrchestratorError,
    HiddenEvaluationCapability
  >;
};

export function createSessionOrchestrator(input: {
  generatedSessionCaseRepository: GeneratedSessionCaseRepository;
  reportGenerationCoordinator: ReportGenerationCoordinator;
  progressionUpdater?: ProgressionUpdater;
  now?: () => Effect.Effect<Date, never, never>;
}): SessionOrchestrator {
  const { generatedSessionCaseRepository, reportGenerationCoordinator, progressionUpdater } = input;
  const now = input.now ?? defaultNow;

  const endSessionForLearner: SessionOrchestrator["endSessionForLearner"] = ({
    learnerId,
    sessionId,
    reason,
    creditFinalization
  }) =>
    Effect.gen(function* () {
      const endedAt = yield* now();
      const updated =
        yield* generatedSessionCaseRepository.updateSessionLifecycleForLearner({
          learnerId,
          sessionCaseId: sessionId,
          updater: (current) => ({
            ...current,
            sessionStatus: "ended",
            endedReason: reason,
            endedAt,
            reportStatus: needsReportGeneration(reason)
              ? "generating"
              : current.reportStatus,
            reportReadyAt: needsReportGeneration(reason)
              ? null
              : current.reportReadyAt
          })
        });

      if (!updated) {
        return yield* Effect.fail(
          new SessionCaseNotFoundError({
            learnerId,
            sessionId,
            operation: "end-session"
          })
        );
      }

      let creditChargeResult;
      if (creditFinalization) {
        creditChargeResult = yield* finalizeSessionCredits({
          learnerId,
          sessionCreditContext: creditFinalization.sessionCreditContext,
          reason,
          actualDurationMinutes: creditFinalization.actualDurationMinutes,
          usableDurationMinutes: creditFinalization.usableDurationMinutes,
          creditLedgerRepository: creditFinalization.creditLedgerRepository
        });
      }

      const route = resolveSessionLifecycleRoute({
        sessionId,
        generatedSessionCase: updated
      });

      return sessionEndOutcome({
        nextPath: route.nextPath,
        endedReason: reason,
        reportStatus: updated.sessionLifecycle.reportStatus,
        creditChargeResult
      });
    });

  const handleVoiceFailureForLearner: SessionOrchestrator["handleVoiceFailureForLearner"] =
    ({ learnerId, sessionId, recoverable, creditFinalization }) => {
      if (recoverable) {
        return Effect.succeed(resumeVoiceConversationOutcome(voiceConversationPath(sessionId)));
      }

      return endSessionForLearner({
        learnerId,
        sessionId,
        reason: "voice-failure",
        creditFinalization
      }).pipe(
        Effect.map((outcome) => endSessionVoiceFailureOutcome(outcome.nextPath))
      );
    };

  const runReportGeneratingFlowForLearner: SessionOrchestrator["runReportGeneratingFlowForLearner"] =
    ({ learnerId, sessionId }) =>
      Effect.gen(function* () {
        const generatedSessionCase = yield* generatedSessionCaseRepository.getForLearner(
          learnerId,
          sessionId
        );
        if (!generatedSessionCase) {
          return yield* missingSessionError({
            learnerId,
            sessionId,
            operation: "report-generating"
          });
        }

        const decision = resolveReportGeneratingDecision({
          sessionId,
          generatedSessionCase
        });

        if (decision.decision === "skip-generation") {
          return reportGeneratingFlowOutcome({
            reportStatus: decision.reportStatus,
            nextPath: decision.nextPath
          });
        }

        const result = yield* reportGenerationCoordinator.generateForEndedSession({
          generatedSessionCase
        });
        const reportReadyAt = result.status === "ready" ? yield* now() : null;

        const persisted =
          yield* generatedSessionCaseRepository.updateReportArtifactsForLearner({
            learnerId,
            sessionCaseId: sessionId,
            reportStatus: result.status,
            reportReadyAt,
            sessionReport: result.status === "ready" ? result.report : null,
            sessionTranscript: result.status === "ready" ? result.transcript : null,
            sessionEvaluation: result.status === "ready" ? result.evaluation : null
          });
        if (!persisted) {
          return yield* missingSessionError({
            learnerId,
            sessionId,
            operation: "report-generating"
          });
        }

        if (result.status === "ready" && progressionUpdater) {
          yield* progressionUpdater.applyCompletedSession({
            learnerId,
            sessionId,
            sessionReport: result.report,
            completedAt: reportReadyAt!
          });
        }

        const persistedDecision = resolveReportGeneratingDecision({
          sessionId,
          generatedSessionCase: persisted
        });
        if (persistedDecision.decision !== "skip-generation") {
          return yield* Effect.fail(
            new SessionLifecycleRouteResolutionError({
              learnerId,
              sessionId,
              operation: "report-generating"
            })
          );
        }

        return reportGeneratingFlowOutcome({
          reportStatus: persistedDecision.reportStatus,
          nextPath: persistedDecision.nextPath
        });
      });

  return {
    endSessionForLearner,
    handleVoiceFailureForLearner,
    runReportGeneratingFlowForLearner
  };
}

function needsReportGeneration(reason: SessionEndReason): boolean {
  return reason !== "user-quit";
}

function missingSessionError(input: {
  learnerId: string;
  sessionId: string;
  operation: "end-session" | "report-generating";
}): Effect.Effect<never, SessionCaseNotFoundError, never> {
  return Effect.fail(
    new SessionCaseNotFoundError({
      learnerId: input.learnerId,
      sessionId: input.sessionId,
      operation: input.operation
    })
  );
}

function defaultNow(): Effect.Effect<Date, never, never> {
  return Effect.clockWith((clock) =>
    Effect.succeed(new Date(clock.unsafeCurrentTimeMillis()))
  );
}
