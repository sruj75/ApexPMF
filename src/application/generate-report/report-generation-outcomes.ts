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

export function readyReportGenerationResult(input: {
  report: SessionReport;
  transcript: SessionTranscriptTurn[];
  evaluation: SessionEvaluationArtifact;
}): Extract<ReportGenerationResult, { status: "ready" }> {
  return {
    status: "ready",
    report: input.report,
    transcript: input.transcript,
    evaluation: input.evaluation
  };
}

export function insufficientReportGenerationResult(
  reason: SessionEvaluationInsufficientReason
): Extract<ReportGenerationResult, { status: "insufficient-evidence" }> {
  return {
    status: "insufficient-evidence",
    reason
  };
}
