import type { GeneratedSessionCase } from "@/src/domain/session/generated-session-case";
import {
  createDeterministicReportBuilder,
  type ReportBuilder
} from "@/src/domain/session/report-builder";
import type {
  SessionReport,
  SessionTranscriptTurn
} from "@/src/domain/session/session-report";

export type ReportGenerationResult =
  | {
      status: "ready";
      report: SessionReport;
      transcript: SessionTranscriptTurn[];
    }
  | {
      status: "insufficient-evidence";
    };

export type ReportGenerationCoordinator = {
  generateForEndedSession(input: {
    generatedSessionCase: GeneratedSessionCase;
  }): Promise<ReportGenerationResult>;
};

export function createReportGenerationCoordinator(input?: {
  reportBuilder?: ReportBuilder;
}): ReportGenerationCoordinator {
  const reportBuilder =
    input?.reportBuilder ?? createDeterministicReportBuilder();

  return {
    async generateForEndedSession({ generatedSessionCase }) {
      return reportBuilder.buildForEndedSession({ generatedSessionCase });
    }
  };
}
