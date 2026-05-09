import type { ReportGenerationCoordinator } from "@/src/application/generate-report/report-generation-coordinator";
import type { GeneratedSessionCaseRepository } from "@/src/domain/session/generated-session-case-repository";
import type { ReportStatus, SessionEndReason } from "@/src/domain/session/session-lifecycle";
import {
  resolveReportGeneratingDecision,
  resolveSessionLifecycleRoute,
  voiceConversationPath
} from "./session-lifecycle-route-policy";

export type SessionOrchestrator = {
  endSessionForLearner(input: {
    learnerId: string;
    sessionId: string;
    reason: SessionEndReason;
  }): Promise<{
    nextPath: string;
    sessionStatus: "ended";
    endedReason: SessionEndReason;
    reportStatus: ReportStatus;
  }>;
  handleVoiceFailureForLearner(input: {
    learnerId: string;
    sessionId: string;
    recoverable: boolean;
  }): Promise<
    | {
        behavior: "resume-voice-conversation";
        nextPath: string;
      }
    | {
        behavior: "end-session";
        nextPath: string;
      }
  >;
  runReportGeneratingFlowForLearner(input: {
    learnerId: string;
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

export function createSessionOrchestrator(input: {
  generatedSessionCaseRepository: GeneratedSessionCaseRepository;
  reportGenerationCoordinator: ReportGenerationCoordinator;
}): SessionOrchestrator {
  const { generatedSessionCaseRepository, reportGenerationCoordinator } = input;

  return {
    async endSessionForLearner({ learnerId, sessionId, reason }) {
      const updated = await generatedSessionCaseRepository.updateSessionLifecycleForLearner({
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
        throw new Error(`Session not found: ${sessionId}`);
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
    },

    async handleVoiceFailureForLearner({ learnerId, sessionId, recoverable }) {
      if (recoverable) {
        return {
          behavior: "resume-voice-conversation",
          nextPath: voiceConversationPath(sessionId)
        };
      }

      const outcome = await this.endSessionForLearner({
        learnerId,
        sessionId,
        reason: "voice-failure"
      });

      return {
        behavior: "end-session",
        nextPath: outcome.nextPath
      };
    },

    async runReportGeneratingFlowForLearner({ learnerId, sessionId }) {
      const generatedSessionCase = await generatedSessionCaseRepository.getForLearner(
        learnerId,
        sessionId
      );
      if (!generatedSessionCase) {
        return {
          reportStatus: "not-found"
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

      const result = await reportGenerationCoordinator.generateForEndedSession({
        generatedSessionCase
      });

      const persisted = await generatedSessionCaseRepository.updateReportArtifactsForLearner({
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
          reportStatus: "not-found"
        };
      }

      const persistedDecision = resolveReportGeneratingDecision({
        sessionId,
        generatedSessionCase: persisted
      });
      if (persistedDecision.decision !== "skip-generation") {
        throw new Error(
          `Session lifecycle route unresolved after report persistence: ${sessionId}`
        );
      }

      return {
        reportStatus: persistedDecision.reportStatus,
        nextPath: persistedDecision.nextPath
      };
    }
  };
}

function needsReportGeneration(reason: SessionEndReason): boolean {
  return reason !== "user-quit";
}
