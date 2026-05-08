import type { GeneratedSessionCase } from "@/src/domain/session/generated-session-case";
import type { ReportBuilder } from "@/src/domain/session/report-builder";
import { createDeterministicReportBuilder } from "@/src/domain/session/report-builder";
import type {
  HiddenEvaluationEngine,
  HiddenEvaluationResult
} from "@/src/domain/session/hidden-evaluation-engine";
import { createHiddenEvaluationEngine } from "@/src/domain/session/hidden-evaluation-engine";
import type {
  SessionEvaluationArtifact,
  SessionEvaluationInsufficientReason
} from "@/src/domain/session/session-evaluation";
import type {
  SessionReport,
  SessionTranscriptTurn
} from "@/src/domain/session/session-report";
import { createOpenRouterChatClient } from "@/src/infrastructure/llm/openrouter";

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

export type ReportGenerationCoordinator = {
  generateForEndedSession(input: {
    generatedSessionCase: GeneratedSessionCase;
  }): Promise<ReportGenerationResult>;
};

export function createReportGenerationCoordinator(input?: {
  reportBuilder?: ReportBuilder;
  hiddenEvaluationEngine?: HiddenEvaluationEngine;
}): ReportGenerationCoordinator {
  const reportBuilder =
    input?.reportBuilder ?? createDeterministicReportBuilder();
  const hiddenEvaluationEngine =
    input?.hiddenEvaluationEngine ?? createProductionHiddenEvaluationEngine();

  return {
    async generateForEndedSession({ generatedSessionCase }) {
      const transcript = generatedSessionCase.sessionTranscript;
      if (!transcript) {
        return {
          status: "insufficient-evidence",
          reason: "transcript-too-short"
        };
      }

      const evaluationResult = await hiddenEvaluationEngine.evaluateEndedSession({
        generatedSessionCase,
        transcript
      });

      if (evaluationResult.status !== "ready") {
        return insufficiencyFromEvaluation(evaluationResult);
      }

      const reportResult = await reportBuilder.buildFromEvaluation({
        generatedSessionCase,
        transcript,
        evaluation: evaluationResult.evaluation
      });

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

function createProductionHiddenEvaluationEngine(): HiddenEvaluationEngine {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      async evaluateEndedSession() {
        return {
          status: "insufficient-evidence",
          reason: "provider-failure"
        };
      }
    };
  }

  return createHiddenEvaluationEngine({
    chatClient: createOpenRouterChatClient({
      apiKey,
      model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
      siteUrl: process.env.OPENROUTER_SITE_URL,
      appTitle: process.env.OPENROUTER_APP_TITLE ?? "The Mom Test Simulator"
    })
  });
}
