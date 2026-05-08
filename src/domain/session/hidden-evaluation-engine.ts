import type { GeneratedSessionCase } from "./generated-session-case";
import type { PersonaEvidenceRef, SessionTranscriptTurn } from "./session-report";
import type { SessionEvaluationArtifact } from "./session-evaluation";

const concreteHistoryQuestionTerms = [
  "what did you try",
  "last time",
  "recently",
  "walk me through",
  "how are you doing",
  "what happened",
  "who decides",
  "who approved",
  "how much did it cost"
];

const pitchTerms = [
  "our product",
  "we built",
  "would this be useful",
  "book a demo",
  "schedule a demo",
  "this will fix",
  "totally fix",
  "this solves",
  "our feature"
];

const complimentTerms = ["sounds great", "exciting", "love this", "amazing"];
const workaroundTerms = ["workaround", "manual", "spreadsheet", "consultant"];
const decisionTerms = ["who decides", "who approved", "decision process", "budget"];
const badFitDiscoveryTerms = [
  "are you the buyer",
  "are you the user",
  "who decides",
  "who owns this",
  "who signs off"
];

export type HiddenEvaluationResult =
  | {
      status: "ready";
      evaluation: SessionEvaluationArtifact;
    }
  | {
      status: "insufficient-evidence";
    };

export type HiddenEvaluationEngine = {
  evaluateEndedSession(input: {
    generatedSessionCase: GeneratedSessionCase;
    transcript: SessionTranscriptTurn[];
  }): Promise<HiddenEvaluationResult>;
};

export function createHiddenEvaluationEngine(): HiddenEvaluationEngine {
  return {
    async evaluateEndedSession({ generatedSessionCase, transcript }) {
      if (
        generatedSessionCase.sessionLifecycle.sessionStatus !== "ended" ||
        !generatedSessionCase.sessionLifecycle.endedReason ||
        generatedSessionCase.sessionLifecycle.endedReason === "user-quit"
      ) {
        return { status: "insufficient-evidence" };
      }

      if (transcript.length === 0) {
        return { status: "insufficient-evidence" };
      }

      const learnerTurns = transcript.filter((turn) => turn.speaker === "learner");
      const personaTurns = transcript.filter((turn) => turn.speaker === "persona");
      if (learnerTurns.length === 0 || personaTurns.length === 0) {
        return { status: "insufficient-evidence" };
      }

      const pitchedTurns = learnerTurns.filter((turn) =>
        containsAny(turn.text, pitchTerms)
      );
      const concreteHistoryTurns = learnerTurns.filter((turn) =>
        containsAny(turn.text, concreteHistoryQuestionTerms)
      );
      const vaguePersonaTurns = personaTurns.filter((turn) => isVagueSignalTurn(turn));
      const complimentTurns = personaTurns.filter((turn) => isComplimentTurn(turn));

      const followingUpEvidence = vaguePersonaTurns
        .map((turn) => nextLearnerTurn(transcript, turn.sequence))
        .filter((turn): turn is SessionTranscriptTurn => Boolean(turn))
        .filter((turn) => isConcreteFollowUp(turn.text));

      const complimentResistEvidence = complimentTurns
        .map((turn) => nextLearnerTurn(transcript, turn.sequence))
        .filter((turn): turn is SessionTranscriptTurn => Boolean(turn))
        .filter((turn) => isConcreteFollowUp(turn.text));

      const badFitEvidence = learnerTurns.filter((turn) =>
        containsAny(turn.text, badFitDiscoveryTerms)
      );

      const workaroundPromptTurns = learnerTurns.filter(
        (turn) =>
          containsAny(turn.text, workaroundTerms) ||
          containsAny(turn.text, decisionTerms)
      );
      const workaroundResponseTurns = personaTurns.filter(
        (turn) =>
          containsAny(turn.text, workaroundTerms) ||
          containsAny(turn.text, ["approved", "decision", "overtime"])
      );

      const avoidingPitching =
        pitchedTurns.length > 0
          ? {
              outcome: "missed" as const,
              note: "Pitching language appeared before grounded discovery.",
              evidence: pitchedTurns.map((turn) =>
                evidenceFromTurn(turn, "Pitch-first behavior", turn.text)
              )
            }
          : {
              outcome: "met" as const,
              note: "No explicit pitch language detected in learner turns.",
              evidence: firstEvidence(learnerTurns, "Discovery-first opener")
            };

      const askingConcreteHistory =
        concreteHistoryTurns.length > 0
          ? {
              outcome: "met" as const,
              note: "Learner asked for concrete history and prior actions.",
              evidence: concreteHistoryTurns.map((turn) =>
                evidenceFromTurn(
                  turn,
                  "Concrete history question",
                  "Question requested specific past behavior."
                )
              )
            }
          : {
              outcome: "missed" as const,
              note: "No concrete-history prompt was detected.",
              evidence: firstEvidence(learnerTurns, "Speculative question pattern")
            };

      const followingUpOnVagueAnswers =
        vaguePersonaTurns.length === 0
          ? {
              outcome: "partial" as const,
              note: "No clear vague-response moments to evaluate follow-up behavior.",
              evidence: []
            }
          : followingUpEvidence.length > 0
            ? {
                outcome: "met" as const,
                note: "Learner converted vague signals into concrete follow-up.",
                evidence: followingUpEvidence.map((turn) =>
                  evidenceFromTurn(
                    turn,
                    "Vague-answer follow-up",
                    "Follow-up moved from social signal to concrete behavior."
                  )
                )
              }
            : {
                outcome: "missed" as const,
                note: "Vague signals were not followed by concrete questions.",
                evidence: vaguePersonaTurns.map((turn) =>
                  evidenceFromTurn(
                    turn,
                    "Vague persona signal",
                    "Learner did not convert this into concrete follow-up."
                  )
                )
              };

      const resistingCompliments =
        complimentTurns.length === 0
          ? {
              outcome: "partial" as const,
              note: "No explicit compliment moments to evaluate.",
              evidence: []
            }
          : complimentResistEvidence.length > 0
            ? {
                outcome: "met" as const,
                note: "Learner resisted praise and asked for customer reality.",
                evidence: complimentResistEvidence.map((turn) =>
                  evidenceFromTurn(
                    turn,
                    "Compliment resistance",
                    "Learner asked concrete follow-up after praise."
                  )
                )
              }
            : {
                outcome: "missed" as const,
                note: "Praise was accepted without grounding questions.",
                evidence: complimentTurns.map((turn) =>
                  evidenceFromTurn(
                    turn,
                    "Compliment trap triggered",
                    "No concrete follow-up after praise."
                  )
                )
              };

      const fitRequiresDiscovery = generatedSessionCase.customerFit !== "strong-fit";
      const identifyingBadFitPersonas = fitRequiresDiscovery
        ? badFitEvidence.length > 0
          ? {
              outcome: "met" as const,
              note: "Learner probed whether this persona is the real customer.",
              evidence: badFitEvidence.map((turn) =>
                evidenceFromTurn(
                  turn,
                  "Bad-fit detection question",
                  "Question tested buyer or user fit."
                )
              )
            }
          : {
              outcome: "missed" as const,
              note: "No fit-discovery question appeared for non-strong-fit persona.",
              evidence: firstEvidence(learnerTurns, "Missing fit validation")
            }
        : {
            outcome: "partial" as const,
            note: "Strong-fit persona made bad-fit detection less central this session.",
            evidence: []
          };

      const uncoveringWorkaroundsOrDecisionProcess =
        workaroundPromptTurns.length > 0 && workaroundResponseTurns.length > 0
          ? {
              outcome: "met" as const,
              note: "Learner uncovered concrete workaround or decision-process detail.",
              evidence: workaroundPromptTurns.map((turn) =>
                evidenceFromTurn(
                  turn,
                  "Workaround/decision discovery",
                  "Question surfaced current process constraints."
                )
              )
            }
          : workaroundPromptTurns.length > 0
            ? {
                outcome: "partial" as const,
                note: "Learner asked about process but transcript evidence stayed thin.",
                evidence: workaroundPromptTurns.map((turn) =>
                  evidenceFromTurn(
                    turn,
                    "Process probe",
                    "Question aimed at workarounds or decisions."
                  )
                )
              }
            : {
                outcome: "missed" as const,
                note: "No workaround or decision-process probing detected.",
                evidence: firstEvidence(learnerTurns, "Missing process discovery")
              };

      const twoOrMoreBehaviorWins = [
        askingConcreteHistory,
        followingUpOnVagueAnswers,
        resistingCompliments,
        identifyingBadFitPersonas,
        uncoveringWorkaroundsOrDecisionProcess
      ].filter((assessment) => assessment.outcome === "met").length >= 2;

      const highQualityBadFitDiscovery =
        generatedSessionCase.customerFit !== "strong-fit" &&
        identifyingBadFitPersonas.outcome === "met" &&
        askingConcreteHistory.outcome === "met";

      const learningSignal = highQualityBadFitDiscovery
        ? {
            quality: "high" as const,
            summary:
              "High-quality outcome: learner discovered this persona may not be the real customer.",
            evidence: [
              ...identifyingBadFitPersonas.evidence,
              ...askingConcreteHistory.evidence
            ]
          }
        : twoOrMoreBehaviorWins
          ? {
              quality: "medium" as const,
              summary:
                "Useful learning signal: transcript contains evidence of concrete discovery behavior.",
              evidence: [
                ...askingConcreteHistory.evidence,
                ...uncoveringWorkaroundsOrDecisionProcess.evidence
              ]
            }
          : {
              quality: "low" as const,
              summary:
                "Learning signal stayed shallow; social validation outweighed customer evidence.",
              evidence: avoidingPitching.evidence
            };

      const trapOutcome = resolveTrapOutcome({
        avoidingPitchingOutcome: avoidingPitching.outcome,
        resistingComplimentsOutcome: resistingCompliments.outcome
      });
      const trapEvidence = [
        ...avoidingPitching.evidence.slice(0, 1),
        ...resistingCompliments.evidence.slice(0, 1)
      ];
      const trapResults = generatedSessionCase.traps.map((trap) => ({
        trapId: trap.id,
        trapLabel: trap.label,
        outcome: trapOutcome,
        detail:
          trapOutcome === "triggered"
            ? trap.weakBehavior
            : trapOutcome === "avoided"
              ? "Learner avoided social validation bait and kept discovery grounded."
              : "Learner partially recovered after early social-validation behavior.",
        evidence: trapEvidence
      }));

      return {
        status: "ready",
        evaluation: {
          interviewBehavior: {
            avoidingPitching,
            askingConcreteHistory,
            followingUpOnVagueAnswers,
            resistingCompliments,
            identifyingBadFitPersonas,
            uncoveringWorkaroundsOrDecisionProcess
          },
          learningSignal,
          trapResults,
          excludedDimensions: {
            accent: "not-scored",
            charisma: "not-scored",
            vocalPolish: "not-scored",
            soundingConfident: "not-scored"
          }
        }
      };
    }
  };
}

function resolveTrapOutcome(input: {
  avoidingPitchingOutcome: "met" | "missed" | "partial";
  resistingComplimentsOutcome: "met" | "missed" | "partial";
}) {
  if (
    input.avoidingPitchingOutcome === "missed" &&
    input.resistingComplimentsOutcome === "missed"
  ) {
    return "triggered" as const;
  }
  if (
    input.avoidingPitchingOutcome === "met" &&
    input.resistingComplimentsOutcome === "met"
  ) {
    return "avoided" as const;
  }
  return "partial" as const;
}

function nextLearnerTurn(
  transcript: SessionTranscriptTurn[],
  afterSequence: number
): SessionTranscriptTurn | undefined {
  return transcript.find(
    (turn) => turn.speaker === "learner" && turn.sequence > afterSequence
  );
}

function isVagueSignalTurn(turn: SessionTranscriptTurn): boolean {
  const cue = turn.metadata?.cue?.toLowerCase();
  if (
    cue === "praise" ||
    cue === "politeness" ||
    cue === "speculation" ||
    cue === "vague-interest"
  ) {
    return true;
  }
  return containsAny(turn.text, ["maybe", "interesting", "sounds good", "exciting"]);
}

function isComplimentTurn(turn: SessionTranscriptTurn): boolean {
  const cue = turn.metadata?.cue?.toLowerCase();
  return cue === "praise" || containsAny(turn.text, complimentTerms);
}

function isConcreteFollowUp(text: string): boolean {
  return (
    containsAny(text, concreteHistoryQuestionTerms) ||
    containsAny(text, workaroundTerms) ||
    containsAny(text, decisionTerms)
  );
}

function containsAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function evidenceFromTurn(
  turn: SessionTranscriptTurn,
  title: string,
  detail: string
): PersonaEvidenceRef {
  return {
    sequence: turn.sequence,
    turnId: turn.turnId,
    snippet: turn.text,
    title,
    detail
  };
}

function firstEvidence(
  turns: SessionTranscriptTurn[],
  title: string
): PersonaEvidenceRef[] {
  if (turns.length === 0) {
    return [];
  }
  return [
    evidenceFromTurn(
      turns[0],
      title,
      "First learner turn used as representative evidence."
    )
  ];
}
