import {
  type ReportGenerationCoordinator,
  type ReportGenerationCoordinatorError
} from "@/src/application/generate-report/report-generation-coordinator";
import {
  type GeneratedSessionCaseRepository,
  type GeneratedSessionCaseRepositoryError
} from "@/src/domain/session/generated-session-case-repository";
import type { ReportStatus, SessionEndReason } from "@/src/domain/session/session-lifecycle";
import { Data, Effect } from "effect";
import {
  resolveReportGeneratingDecision,
  resolveSessionLifecycleRoute,
  voiceConversationPath
} from "./session-lifecycle-route-policy";

export class SessionCaseNotFoundError extends Data.TaggedError(
  "SessionCaseNotFoundError"
)<{
  learnerId: string;
  sessionId: string;
  operation: "end-session";
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
  | SessionCaseNotFoundError
  | SessionLifecycleRouteResolutionError;

export type SessionOrchestrator = {
  endSessionForLearner(input: {
    learnerId: string;
    sessionId: string;
    reason: SessionEndReason;
  }): Effect.Effect<
    {
      nextPath: string;
      sessionStatus: "ended";
      endedReason: SessionEndReason;
      reportStatus: ReportStatus;
    },
    SessionOrchestratorError,
    never
  >;
  handleVoiceFailureForLearner(input: {
    learnerId: string;
    sessionId: string;
    recoverable: boolean;
  }): Effect.Effect<
    | {
        behavior: "resume-voice-conversation";
        nextPath: string;
      }
    | {
        behavior: "end-session";
        nextPath: string;
      },
    SessionOrchestratorError,
    never
  >;
  runReportGeneratingFlowForLearner(input: {
    learnerId: string;
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

export function createSessionOrchestrator(input: {
  generatedSessionCaseRepository: GeneratedSessionCaseRepository;
  reportGenerationCoordinator: ReportGenerationCoordinator;
}): SessionOrchestrator {
  const { generatedSessionCaseRepository, reportGenerationCoordinator } = input;

  const endSessionForLearner: SessionOrchestrator["endSessionForLearner"] = ({
    learnerId,
    sessionId,
    reason
  }) =>
    Effect.gen(function* () {
      const updated =
        yield* generatedSessionCaseRepository.updateSessionLifecycleForLearner({
          learnerId,
          sessionCaseId: sessionId,
          updater: (current) => ({
            ...current,
            sessionStatus: "ended",
            endedReason: reason,
            endedAt: new Date(),
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

      const route = resolveSessionLifecycleRoute({
        sessionId,
        generatedSessionCase: updated
      });

      return {
        nextPath: route.nextPath,
        sessionStatus: "ended",
        endedReason: reason,
        reportStatus: updated.sessionLifecycle.reportStatus
      };
    });

  const handleVoiceFailureForLearner: SessionOrchestrator["handleVoiceFailureForLearner"] =
    ({ learnerId, sessionId, recoverable }) => {
      if (recoverable) {
        return Effect.succeed({
          behavior: "resume-voice-conversation" as const,
          nextPath: voiceConversationPath(sessionId)
        });
      }

      return endSessionForLearner({
        learnerId,
        sessionId,
        reason: "voice-failure"
      }).pipe(
        Effect.map((outcome) => ({
          behavior: "end-session" as const,
          nextPath: outcome.nextPath
        }))
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
          return {
            reportStatus: "not-found" as const
          };
        }

        const decision = resolveReportGeneratingDecision({
          sessionId,
          generatedSessionCase
        });

        if (decision.decision === "skip-generation") {
          return {
            reportStatus: decision.reportStatus,
            nextPath: decision.nextPath
          };
        }

        const result = yield* reportGenerationCoordinator.generateForEndedSession({
          generatedSessionCase
        });

        const persisted =
          yield* generatedSessionCaseRepository.updateReportArtifactsForLearner({
            learnerId,
            sessionCaseId: sessionId,
            reportStatus: result.status,
            reportReadyAt: result.status === "ready" ? new Date() : null,
            sessionReport: result.status === "ready" ? result.report : null,
            sessionTranscript: result.status === "ready" ? result.transcript : null,
            sessionEvaluation: result.status === "ready" ? result.evaluation : null
          });
        if (!persisted) {
          return {
            reportStatus: "not-found" as const
          };
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

        return {
          reportStatus: persistedDecision.reportStatus,
          nextPath: persistedDecision.nextPath
        };
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
