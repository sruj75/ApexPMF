import type { GeneratedSessionCase } from "@/src/domain/session/generated-session-case";
import {
  createHiddenEvaluationEngine,
  type HiddenEvaluationEngine
} from "@/src/domain/session/hidden-evaluation-engine";
import {
  createDeterministicReportBuilder,
  type ReportBuilder
} from "@/src/domain/session/report-builder";
import type { SessionEvaluationArtifact } from "@/src/domain/session/session-evaluation";
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
    input?.hiddenEvaluationEngine ?? createHiddenEvaluationEngine();

  return {
    async generateForEndedSession({ generatedSessionCase }) {
      const transcript =
        generatedSessionCase.sessionTranscript ??
        createSyntheticTranscript(generatedSessionCase);
      const evaluationResult = await hiddenEvaluationEngine.evaluateEndedSession({
        generatedSessionCase,
        transcript
      });

      if (evaluationResult.status !== "ready") {
        return {
          status: "insufficient-evidence"
        };
      }

      const reportResult = await reportBuilder.buildFromEvaluation({
        generatedSessionCase,
        transcript,
        evaluation: evaluationResult.evaluation
      });

      if (reportResult.status !== "ready") {
        return {
          status: "insufficient-evidence"
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

function createSyntheticTranscript(
  generatedSessionCase: GeneratedSessionCase
): SessionTranscriptTurn[] {
  const firstTrap = generatedSessionCase.traps[0];

  return [
    {
      sequence: 1,
      turnId: "turn-1",
      speaker: "learner",
      text: "Would this be useful for your team?"
    },
    {
      sequence: 2,
      turnId: "turn-2",
      speaker: "persona",
      text: firstTrap
        ? firstTrap.setup
        : `${generatedSessionCase.customerPersona.interviewRole}: This sounds interesting, timing is difficult.`,
      metadata: {
        cue: "praise"
      }
    },
    {
      sequence: 3,
      turnId: "turn-3",
      speaker: "learner",
      text: "What did you try in the last month and who decides this purchase?"
    },
    {
      sequence: 4,
      turnId: "turn-4",
      speaker: "persona",
      text: "We paid a consultant and still rebuilt reports manually."
    }
  ];
}
