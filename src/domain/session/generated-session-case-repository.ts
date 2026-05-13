import type {
  CreateGeneratedSessionCaseInput,
  GeneratedSessionCase
} from "./generated-session-case";
import { Data, Effect } from "effect";
import { withDefaultSessionLifecycle } from "./generated-session-case";
import type { ReportStatus } from "./session-lifecycle";
import type { SessionReport, SessionTranscriptTurn } from "./session-report";
import type { SessionLifecycleState } from "./session-lifecycle";
import type { SessionEvaluationArtifact } from "./session-evaluation";
import type { SessionChargeResult } from "../credits/credit-ledger";

export type GeneratedSessionCaseRepositoryOperation =
  | "create"
  | "getForLearner"
  | "updateSessionLifecycleForLearner"
  | "updateReportArtifactsForLearner"
  | "updateCreditChargeForLearner";

export class GeneratedSessionCaseRepositoryPersistenceError extends Data.TaggedError(
  "GeneratedSessionCaseRepositoryPersistenceError"
)<{
  operation: GeneratedSessionCaseRepositoryOperation;
  cause: unknown;
}> {}

export class GeneratedSessionCaseRepositoryDecodeError extends Data.TaggedError(
  "GeneratedSessionCaseRepositoryDecodeError"
)<{
  operation: GeneratedSessionCaseRepositoryOperation;
  cause: unknown;
}> {}

export type GeneratedSessionCaseRepositoryError =
  | GeneratedSessionCaseRepositoryPersistenceError
  | GeneratedSessionCaseRepositoryDecodeError;

export type GeneratedSessionCaseRepository = {
  create(
    learnerId: string,
    input: CreateGeneratedSessionCaseInput
  ): Effect.Effect<
    GeneratedSessionCase,
    GeneratedSessionCaseRepositoryError,
    never
  >;
  getForLearner(
    learnerId: string,
    sessionCaseId: string
  ): Effect.Effect<
    GeneratedSessionCase | null,
    GeneratedSessionCaseRepositoryError,
    never
  >;
  updateSessionLifecycleForLearner(input: {
    learnerId: string;
    sessionCaseId: string;
    updater: (current: SessionLifecycleState) => SessionLifecycleState;
  }): Effect.Effect<
    GeneratedSessionCase | null,
    GeneratedSessionCaseRepositoryError,
    never
  >;
  updateReportArtifactsForLearner(input: {
    learnerId: string;
    sessionCaseId: string;
    reportStatus: Extract<ReportStatus, "ready" | "insufficient-evidence">;
    reportReadyAt: Date | null;
    sessionReport: SessionReport | null;
    sessionTranscript: SessionTranscriptTurn[] | null;
    sessionEvaluation: SessionEvaluationArtifact | null;
  }): Effect.Effect<
    GeneratedSessionCase | null,
    GeneratedSessionCaseRepositoryError,
    never
  >;
  updateCreditChargeForLearner(input: {
    learnerId: string;
    sessionCaseId: string;
    creditCharge: SessionChargeResult;
  }): Effect.Effect<
    GeneratedSessionCase | null,
    GeneratedSessionCaseRepositoryError,
    never
  >;
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
    create(learnerId, input) {
      return Effect.sync(() => {
        const generatedSessionCase = withDefaultSessionLifecycle({
          ...input,
          id: `session-case-${nextId}`,
          learnerId,
          createdAt: new Date(),
          creditCharge: null
        });

        nextId += 1;
        generatedSessionCases = [...generatedSessionCases, generatedSessionCase];
        return generatedSessionCase;
      });
    },

    getForLearner(learnerId, sessionCaseId) {
      return Effect.succeed(
        generatedSessionCases.find(
          (generatedSessionCase) =>
            generatedSessionCase.learnerId === learnerId &&
            generatedSessionCase.id === sessionCaseId
        ) ?? null
      );
    },

    updateSessionLifecycleForLearner(input) {
      return Effect.sync(() => {
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
      });
    },

    updateReportArtifactsForLearner(input) {
      return Effect.sync(() => {
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
      });
    },

    updateCreditChargeForLearner(input) {
      return Effect.sync(() => {
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
          creditCharge: input.creditCharge
        };

        generatedSessionCases = generatedSessionCases.map((sessionCase, rowIndex) =>
          rowIndex === index ? next : sessionCase
        );

        return next;
      });
    }
  };
}
