import type { ReportGenerationCoordinator } from "@/src/application/generate-report/report-generation-coordinator";
import type { GeneratedSessionCaseRepository } from "@/src/domain/session/generated-session-case-repository";
import type { ReportStatus, SessionEndReason } from "@/src/domain/session/session-lifecycle";

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
  }): Promise<{
    reportStatus: "ready" | "insufficient-evidence";
    nextPath: string;
  }>;
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

      if (reason === "user-quit") {
        return {
          nextPath: "/dashboard",
          sessionStatus: "ended",
          endedReason: reason,
          reportStatus: updated.sessionLifecycle.reportStatus
        };
      }

      return {
        nextPath: reportGeneratingPath(sessionId),
        sessionStatus: "ended",
        endedReason: reason,
        reportStatus: updated.sessionLifecycle.reportStatus
      };
    },

    async handleVoiceFailureForLearner({ learnerId, sessionId, recoverable }) {
      if (recoverable) {
        return {
          behavior: "resume-voice-conversation",
          nextPath: `/practice/${sessionId}`
        };
      }

      await this.endSessionForLearner({
        learnerId,
        sessionId,
        reason: "voice-failure"
      });

      return {
        behavior: "end-session",
        nextPath: reportGeneratingPath(sessionId)
      };
    },

    async runReportGeneratingFlowForLearner({ learnerId, sessionId }) {
      const generatedSessionCase = await generatedSessionCaseRepository.getForLearner(
        learnerId,
        sessionId
      );
      if (!generatedSessionCase) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const result = await reportGenerationCoordinator.generateForEndedSession({
        generatedSessionCase
      });

      if (result.status === "ready") {
        await generatedSessionCaseRepository.updateReportArtifactsForLearner({
          learnerId,
          sessionCaseId: sessionId,
          reportStatus: "ready",
          reportReadyAt: new Date(),
          sessionReport: result.report,
          sessionTranscript: result.transcript,
          sessionEvaluation: result.evaluation
        });

        return {
          reportStatus: "ready",
          nextPath: `/practice/${sessionId}/report`
        };
      }

      await generatedSessionCaseRepository.updateReportArtifactsForLearner({
        learnerId,
        sessionCaseId: sessionId,
        reportStatus: "insufficient-evidence",
        reportReadyAt: null,
        sessionReport: null,
        sessionTranscript: null,
        sessionEvaluation: null
      });

      return {
        reportStatus: "insufficient-evidence",
        nextPath: "/dashboard"
      };
    }
  };
}

function needsReportGeneration(reason: SessionEndReason): boolean {
  return reason !== "user-quit";
}

function reportGeneratingPath(sessionId: string): string {
  return `/practice/${sessionId}/report-generating`;
}
