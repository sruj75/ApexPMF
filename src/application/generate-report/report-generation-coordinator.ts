import type { GeneratedSessionCase } from "@/src/domain/session/generated-session-case";
import { Data, Effect } from "effect";
import { HiddenEvaluationCapability } from "@/src/application/llm-runtime/llm-runtime-layers";
import {
  type ReportGenerationResult,
  insufficientReportGenerationResult,
  readyReportGenerationResult
} from "./report-generation-outcomes";
import type { ReportBuilder } from "@/src/domain/session/report-builder";
import { createDeterministicReportBuilder } from "@/src/domain/session/report-builder";
import type { HiddenEvaluationResult } from "@/src/domain/session/hidden-evaluation-engine";

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
  }): Effect.Effect<
    ReportGenerationResult,
    ReportGenerationCoordinatorError,
    HiddenEvaluationCapability
  >;
};

export function createReportGenerationCoordinator(input?: {
  reportBuilder?: ReportBuilder;
}): ReportGenerationCoordinator {
  const reportBuilder = input?.reportBuilder ?? createDeterministicReportBuilder();

  return {
    generateForEndedSession({ generatedSessionCase }) {
      return Effect.gen(function* () {
        const hiddenEvaluationEngine = yield* HiddenEvaluationCapability;
        const transcript = generatedSessionCase.sessionTranscript;
        if (!transcript) {
          return insufficientReportGenerationResult("transcript-too-short");
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
          const insufficiency = insufficiencyFromEvaluation(evaluationResult);
          yield* Effect.logInfo("report-generation.insufficient_evidence", {
            sessionCaseId: generatedSessionCase.id,
            reason:
              insufficiency.status === "insufficient-evidence"
                ? insufficiency.reason
                : "unknown"
          });
          return insufficiency;
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
          return insufficientReportGenerationResult("invalid-judge-output");
        }

        return readyReportGenerationResult({
          report: reportResult.report,
          transcript,
          evaluation: evaluationResult.evaluation
        });
      });
    }
  };
}

function insufficiencyFromEvaluation(
  evaluationResult: HiddenEvaluationResult
) {
  return evaluationResult.status === "ready"
    ? insufficientReportGenerationResult("invalid-judge-output")
    : insufficientReportGenerationResult(evaluationResult.reason);
}
