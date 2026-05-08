import type {
  CreateGeneratedSessionCaseInput,
  GeneratedSessionCase
} from "./generated-session-case";
import { withDefaultSessionLifecycle } from "./generated-session-case";
import type { ReportStatus } from "./session-lifecycle";
import type { SessionReport, SessionTranscriptTurn } from "./session-report";
import type { SessionLifecycleState } from "./session-lifecycle";
import type { SessionEvaluationArtifact } from "./session-evaluation";

export type GeneratedSessionCaseRepository = {
  create(
    learnerId: string,
    input: CreateGeneratedSessionCaseInput
  ): Promise<GeneratedSessionCase>;
  getForLearner(
    learnerId: string,
    sessionCaseId: string
  ): Promise<GeneratedSessionCase | null>;
  updateSessionLifecycleForLearner(input: {
    learnerId: string;
    sessionCaseId: string;
    updater: (current: SessionLifecycleState) => SessionLifecycleState;
  }): Promise<GeneratedSessionCase | null>;
  updateReportArtifactsForLearner(input: {
    learnerId: string;
    sessionCaseId: string;
    reportStatus: Extract<ReportStatus, "ready" | "insufficient-evidence">;
    reportReadyAt: Date | null;
    sessionReport: SessionReport | null;
    sessionTranscript: SessionTranscriptTurn[] | null;
    sessionEvaluation: SessionEvaluationArtifact | null;
  }): Promise<GeneratedSessionCase | null>;
};

export function createInMemoryGeneratedSessionCaseRepository(
  initialCases: GeneratedSessionCase[] = []
): GeneratedSessionCaseRepository {
  let generatedSessionCases = [...initialCases];
  let nextId = generatedSessionCases.reduce((max, sessionCase) => {
    const match = /^session-case-(\d+)$/.exec(sessionCase.id);
    return match ? Math.max(max, Number.parseInt(match[1] ?? "0", 10) + 1) : max;
  }, 1);

  return {
    async create(learnerId, input) {
      const generatedSessionCase = withDefaultSessionLifecycle({
        ...input,
        id: `session-case-${nextId}`,
        learnerId,
        createdAt: new Date()
      });

      nextId += 1;
      generatedSessionCases = [...generatedSessionCases, generatedSessionCase];
      return generatedSessionCase;
    },

    async getForLearner(learnerId, sessionCaseId) {
      return (
        generatedSessionCases.find(
          (generatedSessionCase) =>
            generatedSessionCase.learnerId === learnerId &&
            generatedSessionCase.id === sessionCaseId
        ) ?? null
      );
    },

    async updateSessionLifecycleForLearner(input) {
      const index = generatedSessionCases.findIndex(
        (generatedSessionCase) =>
          generatedSessionCase.learnerId === input.learnerId &&
          generatedSessionCase.id === input.sessionCaseId
      );
      if (index < 0) {
        return null;
      }

      const current = generatedSessionCases[index];
      const next: GeneratedSessionCase = {
        ...current,
        sessionLifecycle: input.updater(current.sessionLifecycle)
      };

      generatedSessionCases = generatedSessionCases.map((sessionCase, rowIndex) =>
        rowIndex === index ? next : sessionCase
      );

      return next;
    },

    async updateReportArtifactsForLearner(input) {
      const index = generatedSessionCases.findIndex(
        (generatedSessionCase) =>
          generatedSessionCase.learnerId === input.learnerId &&
          generatedSessionCase.id === input.sessionCaseId
      );
      if (index < 0) {
        return null;
      }

      const current = generatedSessionCases[index];
      const next: GeneratedSessionCase = {
        ...current,
        sessionLifecycle: {
          ...current.sessionLifecycle,
          reportStatus: input.reportStatus,
          reportReadyAt: input.reportReadyAt
        },
        sessionReport: input.sessionReport,
        sessionTranscript: input.sessionTranscript,
        sessionEvaluation: input.sessionEvaluation
      };

      generatedSessionCases = generatedSessionCases.map((sessionCase, rowIndex) =>
        rowIndex === index ? next : sessionCase
      );

      return next;
    }
  };
}
