import type { GeneratedSessionCase } from "./generated-session-case";
import { Effect } from "effect";
import type { SessionEvaluationArtifact } from "./session-evaluation";
import type {
  PersonaEvidenceRef,
  SessionReport,
  SessionTranscriptTurn
} from "./session-report";

export type ReportBuilderResult =
  | {
      status: "ready";
      report: SessionReport;
    }
  | {
      status: "insufficient-evidence";
    };

export type ReportBuilder = {
  buildFromEvaluation(input: {
    generatedSessionCase: GeneratedSessionCase;
    transcript: SessionTranscriptTurn[];
    evaluation: SessionEvaluationArtifact;
  }): Effect.Effect<ReportBuilderResult, never, never>;
};

export function createDeterministicReportBuilder(): ReportBuilder {
  return {
    buildFromEvaluation({ generatedSessionCase, transcript, evaluation }) {
      return Effect.sync(() => {
        if (transcript.length === 0 || evaluation.learningSignal.evidence.length === 0) {
          return { status: "insufficient-evidence" } satisfies ReportBuilderResult;
        }

        const report: SessionReport = {
          outcome: {
            summary: `Session ended with reason: ${generatedSessionCase.sessionLifecycle.endedReason}. ${evaluation.learningSignal.summary}`
          },
          missedSignals: buildMissedSignals(evaluation),
          badQuestions: buildBadQuestions(evaluation),
          strongQuestions: buildStrongQuestions(evaluation),
          trapResults: evaluation.trapResults.map((trapResult) => ({
            trapLabel: trapResult.trapLabel,
            outcome: trapResult.outcome,
            detail: trapResult.detail,
            evidence: trapResult.evidence
          })),
          skillMovement: buildSkillMovement(evaluation),
          nextPracticeFocus: {
            title: "Ask behavior-first discovery follow-ups",
            description:
              "When social signals appear, ask for concrete customer history before discussing solutions."
          },
          sourceContext:
            generatedSessionCase.sessionSource.kind === "active-ideal-customer-profile"
              ? generatedSessionCase.sessionSource.idealCustomerProfile.name
              : generatedSessionCase.sessionSource.label,
          lightPersonaLabel: generatedSessionCase.customerPersona.lightPersonaLabel,
          expandableEvidence: takeEvidence(evaluation)
        };

        return {
          status: "ready",
          report
        } satisfies ReportBuilderResult;
      });
    }
  };
}

function buildMissedSignals(evaluation: SessionEvaluationArtifact) {
  const signals = [];

  if (evaluation.interviewBehavior.followingUpOnVagueAnswers.outcome === "missed") {
    signals.push({
      title: "Vague answer not followed up",
      detail: evaluation.interviewBehavior.followingUpOnVagueAnswers.note,
      evidence: evaluation.interviewBehavior.followingUpOnVagueAnswers.evidence
    });
  }

  if (evaluation.interviewBehavior.avoidingPitching.outcome === "missed") {
    signals.push({
      title: "Pitching before discovery",
      detail: evaluation.interviewBehavior.avoidingPitching.note,
      evidence: evaluation.interviewBehavior.avoidingPitching.evidence
    });
  }

  if (evaluation.interviewBehavior.resistingCompliments.outcome === "missed") {
    signals.push({
      title: "Compliment treated as validation",
      detail: evaluation.interviewBehavior.resistingCompliments.note,
      evidence: evaluation.interviewBehavior.resistingCompliments.evidence
    });
  }

  return signals;
}

function buildBadQuestions(evaluation: SessionEvaluationArtifact) {
  if (evaluation.interviewBehavior.avoidingPitching.outcome !== "missed") {
    return [];
  }

  return evaluation.interviewBehavior.avoidingPitching.evidence.map((evidence) => ({
    question: evidence.snippet ?? "Pitching-language turn",
    whyItMissed: "Question drifted toward pitch or validation-seeking behavior.",
    evidence: [evidence]
  }));
}

function buildStrongQuestions(evaluation: SessionEvaluationArtifact) {
  const evidence = [
    ...evaluation.interviewBehavior.askingConcreteHistory.evidence,
    ...evaluation.interviewBehavior.uncoveringWorkaroundsOrDecisionProcess.evidence
  ];

  return evidence.map((item) => ({
    question: item.snippet ?? "Concrete-history prompt",
    whyItWorked:
      "Prompt anchored the conversation on concrete customer behavior and decision context.",
    evidence: [item]
  }));
}

function buildSkillMovement(
  evaluation: SessionEvaluationArtifact
): SessionReport["skillMovement"] {
  const concreteHistory =
    evaluation.interviewBehavior.askingConcreteHistory.outcome === "met";
  const workaroundDiscovery =
    evaluation.interviewBehavior.uncoveringWorkaroundsOrDecisionProcess.outcome ===
    "met";

  const movement: "up" | "flat" =
    concreteHistory && workaroundDiscovery ? "up" : "flat";

  return [
    {
      skill: "Concrete History",
      movement,
      rationale:
        movement === "up"
          ? "Concrete-history and workaround discovery both appeared in evidence."
          : "Discovery behavior appeared inconsistently; keep reinforcing follow-ups."
    }
  ];
}

function takeEvidence(evaluation: SessionEvaluationArtifact): PersonaEvidenceRef[] {
  const uniqueByTurn = new Map<string, PersonaEvidenceRef>();
  const merged = [
    ...evaluation.learningSignal.evidence,
    ...evaluation.interviewBehavior.askingConcreteHistory.evidence,
    ...evaluation.interviewBehavior.followingUpOnVagueAnswers.evidence,
    ...evaluation.interviewBehavior.resistingCompliments.evidence
  ];

  for (const item of merged) {
    const key = `${item.sequence}-${item.turnId ?? ""}`;
    if (!uniqueByTurn.has(key)) {
      uniqueByTurn.set(key, item);
    }
  }

  return [...uniqueByTurn.values()];
}
