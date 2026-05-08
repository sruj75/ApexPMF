import type { GeneratedSessionCase } from "./generated-session-case";
import type {
  PersonaEvidenceRef,
  SessionReport,
  SessionTranscriptTurn
} from "./session-report";

export type ReportBuilderResult =
  | {
      status: "ready";
      report: SessionReport;
      transcript: SessionTranscriptTurn[];
    }
  | {
      status: "insufficient-evidence";
    };

export type ReportBuilder = {
  buildForEndedSession(input: {
    generatedSessionCase: GeneratedSessionCase;
  }): Promise<ReportBuilderResult>;
};

export function createDeterministicReportBuilder(): ReportBuilder {
  return {
    async buildForEndedSession({ generatedSessionCase }) {
      if (
        generatedSessionCase.sessionLifecycle.sessionStatus !== "ended" ||
        !generatedSessionCase.sessionLifecycle.endedReason ||
        generatedSessionCase.sessionLifecycle.endedReason === "user-quit"
      ) {
        return {
          status: "insufficient-evidence"
        };
      }

      const transcript = createSyntheticTranscript(generatedSessionCase);
      const primaryEvidence = evidenceFromTurn(transcript[0], {
        title: "Asked framing-first question",
        detail:
          "The opener invited social signals before concrete history, which reduced discovery depth on that turn."
      });
      const concreteEvidence = evidenceFromTurn(transcript[2], {
        title: "Concrete history follow-up",
        detail:
          "This follow-up anchored on a real past attempt and produced actionable customer evidence."
      });

      const report: SessionReport = {
        outcome: {
          summary: `Session ended with reason: ${generatedSessionCase.sessionLifecycle.endedReason}.`
        },
        missedSignals: [
          {
            title: "Polite praise treated as validation",
            detail:
              "The persona gave positive language that did not include concrete buying behavior.",
            evidence: [primaryEvidence]
          }
        ],
        badQuestions: [
          {
            question: "Would this be useful for your team?",
            whyItMissed:
              "The question allowed a speculative answer instead of prompting concrete history.",
            evidence: [primaryEvidence]
          }
        ],
        strongQuestions: [
          {
            question: "What did you try in the last month to solve this?",
            whyItWorked:
              "The question pulled specific past behavior and tradeoff detail.",
            evidence: [concreteEvidence]
          }
        ],
        trapResults: generatedSessionCase.traps.map((trap) => ({
          trapLabel: trap.label,
          outcome: "triggered" as const,
          detail: trap.weakBehavior,
          evidence: [primaryEvidence]
        })),
        skillMovement: [
          {
            skill: "Concrete History",
            movement: "flat",
            rationale:
              "One strong follow-up appeared, but early turns stayed in speculative territory."
          }
        ],
        nextPracticeFocus: {
          title: "Ask behavior-first follow-ups",
          description:
            "After any praise or interest signal, follow with a past-action question before discussing solutions."
        },
        sourceContext:
          generatedSessionCase.sessionSource.kind === "active-ideal-customer-profile"
            ? generatedSessionCase.sessionSource.idealCustomerProfile.name
            : generatedSessionCase.sessionSource.label,
        lightPersonaLabel: generatedSessionCase.customerPersona.lightPersonaLabel,
        expandableEvidence: [primaryEvidence, concreteEvidence]
      };

      return {
        status: "ready",
        report,
        transcript
      };
    }
  };
}

function createSyntheticTranscript(
  generatedSessionCase: GeneratedSessionCase
): SessionTranscriptTurn[] {
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
      text: `${generatedSessionCase.customerPersona.interviewRole}: It sounds helpful, though timing is hard right now.`,
      metadata: {
        cue: "praise"
      }
    },
    {
      sequence: 3,
      turnId: "turn-3",
      speaker: "learner",
      text: "What did you try in the last month to solve this?"
    },
    {
      sequence: 4,
      turnId: "turn-4",
      speaker: "persona",
      text: "We paid a consultant and still rebuilt reports manually that weekend."
    }
  ];
}

function evidenceFromTurn(
  turn: SessionTranscriptTurn | undefined,
  input: {
    title: string;
    detail: string;
  }
): PersonaEvidenceRef {
  return {
    sequence: turn?.sequence ?? 1,
    turnId: turn?.turnId,
    snippet: turn?.text,
    title: input.title,
    detail: input.detail
  };
}
