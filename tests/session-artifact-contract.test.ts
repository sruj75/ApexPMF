import { describe, expect, it } from "vitest";
import { decodeSessionEvaluationArtifact } from "../src/domain/session/session-artifact-contract";

describe("session artifact contract", () => {
  it("decodes a valid evaluation artifact", () => {
    const decoded = decodeSessionEvaluationArtifact(makeEvaluationArtifact());

    expect(decoded._tag).toBe("Right");
    if (decoded._tag !== "Right") {
      throw new Error("Expected evaluation artifact to decode.");
    }

    expect(decoded.right.learningSignal.quality).toBe("high");
    expect(decoded.right.trapResults[0]?.outcome).toBe("avoided");
  });

  it("normalizes null evidence optional fields to optional shape", () => {
    const decoded = decodeSessionEvaluationArtifact(
      makeEvaluationArtifact({
        turnId: null,
        snippet: null
      })
    );

    expect(decoded._tag).toBe("Right");
    if (decoded._tag !== "Right") {
      throw new Error("Expected evaluation artifact to decode.");
    }

    const evidence = decoded.right.interviewBehavior.avoidingPitching.evidence[0];
    expect(evidence).toEqual({
      sequence: 1,
      title: "Speculative opener",
      detail: "Validation-seeking appeared early."
    });
    expect("turnId" in evidence).toBe(false);
    expect("snippet" in evidence).toBe(false);
  });

  it("fails when nested evaluation shape is invalid", () => {
    const decoded = decodeSessionEvaluationArtifact({
      ...makeEvaluationArtifact(),
      interviewBehavior: {
        ...makeEvaluationArtifact().interviewBehavior,
        resistingCompliments: {
          outcome: "wrong-value",
          note: "invalid",
          evidence: []
        }
      }
    });

    expect(decoded._tag).toBe("Left");
  });
});

function makeEvaluationArtifact(
  evidenceOverrides?: {
    turnId?: string | null;
    snippet?: string | null;
  }
) {
  const evidence = {
    sequence: 1,
    turnId:
      evidenceOverrides?.turnId === undefined
        ? "turn-1"
        : evidenceOverrides.turnId,
    snippet:
      evidenceOverrides?.snippet === undefined
        ? "Would this be useful for your team?"
        : evidenceOverrides.snippet,
    title: "Speculative opener",
    detail: "Validation-seeking appeared early."
  };

  return {
    interviewBehavior: {
      avoidingPitching: {
        outcome: "missed",
        note: "Pitch-first opener detected.",
        evidence: [evidence]
      },
      askingConcreteHistory: {
        outcome: "met",
        note: "Concrete history question detected.",
        evidence: [evidence]
      },
      followingUpOnVagueAnswers: {
        outcome: "partial",
        note: "Some follow-up happened.",
        evidence: []
      },
      resistingCompliments: {
        outcome: "met",
        note: "Compliment resisted with behavior-first question.",
        evidence: [evidence]
      },
      identifyingBadFitPersonas: {
        outcome: "partial",
        note: "Not enough data for strong fit call.",
        evidence: []
      },
      uncoveringWorkaroundsOrDecisionProcess: {
        outcome: "met",
        note: "Decision process surfaced.",
        evidence: [evidence]
      }
    },
    learningSignal: {
      quality: "high",
      summary: "Learner extracted concrete evidence.",
      evidence: [evidence]
    },
    trapResults: [
      {
        trapId: "trap-1",
        trapLabel: "Compliment Trap",
        outcome: "avoided",
        detail: "Learner redirected to prior behavior.",
        evidence: [evidence]
      }
    ],
    excludedDimensions: {
      accent: "not-scored",
      charisma: "not-scored",
      vocalPolish: "not-scored",
      soundingConfident: "not-scored"
    }
  };
}
