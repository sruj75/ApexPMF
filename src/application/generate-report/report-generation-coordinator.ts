import type { GeneratedSessionCase } from "@/src/domain/session/generated-session-case";
import { Data, Effect } from "effect";
import {
  createNonLiveLlmRuntimePolicy,
  type NonLiveLlmRuntimePolicy
} from "@/src/application/non-live-llm-policy";
import type { ReportBuilder } from "@/src/domain/session/report-builder";
import { createDeterministicReportBuilder } from "@/src/domain/session/report-builder";
import type {
  HiddenEvaluationEngine,
  HiddenEvaluationResult
} from "@/src/domain/session/hidden-evaluation-engine";
import type {
  SessionEvaluationArtifact,
  SessionEvaluationInsufficientReason
} from "@/src/domain/session/session-evaluation";
import type {
  SessionReport,
  SessionTranscriptTurn
} from "@/src/domain/session/session-report";

export type ReportGenerationResult =
  | {
      status: "ready";
      report: SessionReport;
      transcript: SessionTranscriptTurn[];
      evaluation: SessionEvaluationArtifact;
    }
  | {
      status: "insufficient-evidence";
      reason: SessionEvaluationInsufficientReason;
    };

export class ReportGenerationCoordinatorDependencyError extends Data.TaggedError(
  "ReportGenerationCoordinatorDependencyError"
)<{
  operation: "hidden-evaluation-engine" | "report-builder";
  cause: unknown;
}> {}

export type ReportGenerationCoordinatorError =
  ReportGenerationCoordinatorDependencyError;

export type ReportGenerationCoordinator = {
  generateForEndedSession(input: {
    generatedSessionCase: GeneratedSessionCase;
  }): Effect.Effect<ReportGenerationResult, ReportGenerationCoordinatorError, never>;
};

export function createReportGenerationCoordinator(input?: {
  reportBuilder?: ReportBuilder;
  hiddenEvaluationEngine?: HiddenEvaluationEngine;
  nonLiveLlmRuntimePolicy?: NonLiveLlmRuntimePolicy;
}): ReportGenerationCoordinator {
  const reportBuilder =
    input?.reportBuilder ?? createDeterministicReportBuilder();
  const hiddenEvaluationEngine =
    input?.hiddenEvaluationEngine ??
    (
      input?.nonLiveLlmRuntimePolicy ?? createNonLiveLlmRuntimePolicy()
    ).composeHiddenEvaluationEngine();

  return {
    generateForEndedSession({ generatedSessionCase }) {
      return Effect.gen(function* () {
        const transcript = generatedSessionCase.sessionTranscript;
        if (!transcript) {
          return {
            status: "insufficient-evidence",
            reason: "transcript-too-short"
          };
        }

        const evaluationResult = yield* hiddenEvaluationEngine
          .evaluateEndedSession({
            generatedSessionCase,
            transcript
          })
          .pipe(
            Effect.catchAllCause((cause) =>
              Effect.fail(
                new ReportGenerationCoordinatorDependencyError({
                  operation: "hidden-evaluation-engine",
                  cause
                })
              )
            )
          );

        if (evaluationResult.status !== "ready") {
          return insufficiencyFromEvaluation(evaluationResult);
        }

        const reportResult = yield* reportBuilder
          .buildFromEvaluation({
            generatedSessionCase,
            transcript,
            evaluation: evaluationResult.evaluation
          })
          .pipe(
            Effect.catchAllCause((cause) =>
              Effect.fail(
                new ReportGenerationCoordinatorDependencyError({
                  operation: "report-builder",
                  cause
                })
              )
            )
          );

        if (reportResult.status !== "ready") {
          return {
            status: "insufficient-evidence",
            reason: "invalid-judge-output"
          };
        }

        return {
          status: "ready",
          report: reportResult.report,
          transcript,
          evaluation: evaluationResult.evaluation
        };
      });
    }
  };
}

function insufficiencyFromEvaluation(
  evaluationResult: HiddenEvaluationResult
) {
  return evaluationResult.status === "ready"
    ? {
        status: "insufficient-evidence" as const,
        reason: "invalid-judge-output" as const
      }
    : {
        status: "insufficient-evidence" as const,
        reason: evaluationResult.reason
      };
}
