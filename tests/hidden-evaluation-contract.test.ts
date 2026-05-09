import { describe, expect, it } from "vitest";
import { decodeHiddenEvaluationResponse } from "../src/domain/session/hidden-evaluation-contract";

describe("hidden evaluation contract", () => {
  it("decodes ready payloads using the shared artifact contract", () => {
    const decoded = decodeHiddenEvaluationResponse(
      JSON.stringify({
        status: "ready",
        reasonIfInsufficient: null,
        evaluation: makeReadyEvaluation()
      })
    );

    expect(decoded).toMatchObject({
      ok: true,
      value: {
        status: "ready"
      }
    });
    if (!decoded.ok || decoded.value.status !== "ready") {
      throw new Error("Expected a ready hidden evaluation.");
    }

    const evidence = decoded.value.evaluation.learningSignal.evidence[0];
    expect(evidence).toEqual({
      sequence: 4,
      title: "Concrete workaround evidence",
      detail: "Persona described real past behavior."
    });
  });

  it("returns invalid_json for malformed JSON", () => {
    const decoded = decodeHiddenEvaluationResponse("{invalid-json");
    expect(decoded).toEqual({
      ok: false,
      reason: "invalid_json"
    });
  });

  it("returns schema_validation_failed when ready payload has invalid evaluation shape", () => {
    const decoded = decodeHiddenEvaluationResponse(
      JSON.stringify({
        status: "ready",
        reasonIfInsufficient: null,
        evaluation: {
          ...makeReadyEvaluation(),
          trapResults: "wrong-shape"
        }
      })
    );

    expect(decoded).toEqual({
      ok: false,
      reason: "schema_validation_failed"
    });
  });

  it("returns quality_gate_failed for insufficient payloads with blank reason", () => {
    const decoded = decodeHiddenEvaluationResponse(
      JSON.stringify({
        status: "insufficient-evidence",
        reasonIfInsufficient: "  ",
        evaluation: null
      })
    );

    expect(decoded).toEqual({
      ok: false,
      reason: "quality_gate_failed"
    });
  });

  it("returns quality_gate_failed when non-partial assessments have no evidence", () => {
    const badEvaluation = makeReadyEvaluation();
    badEvaluation.interviewBehavior.avoidingPitching.evidence = [];

    const decoded = decodeHiddenEvaluationResponse(
      JSON.stringify({
        status: "ready",
        reasonIfInsufficient: null,
        evaluation: badEvaluation
      })
    );

    expect(decoded).toEqual({
      ok: false,
      reason: "quality_gate_failed"
    });
  });
});

function makeReadyEvaluation() {
  return {
    interviewBehavior: {
      avoidingPitching: {
        outcome: "missed",
        note: "Pitch-first opener detected.",
        evidence: [
          {
            sequence: 1,
            turnId: "turn-1",
            snippet: "Would this be useful for your team?",
            title: "Speculative opener",
            detail: "Validation-seeking appeared early."
          }
        ]
      },
      askingConcreteHistory: {
        outcome: "met",
        note: "Concrete history question detected.",
        evidence: [
          {
            sequence: 3,
            turnId: "turn-3",
            snippet: "What did you try in the last month?",
            title: "Concrete history question",
            detail: "Asked for specific past attempts."
          }
        ]
      },
      followingUpOnVagueAnswers: {
        outcome: "met",
        note: "Vague answer followed with concrete probe.",
        evidence: [
          {
            sequence: 3,
            turnId: "turn-3",
            snippet: "What did you try in the last month?",
            title: "Follow-up",
            detail: "Converted social signal to discovery."
          }
        ]
      },
      resistingCompliments: {
        outcome: "met",
        note: "Compliment was not treated as proof.",
        evidence: [
          {
            sequence: 3,
            turnId: "turn-3",
            snippet: "What did you try in the last month?",
            title: "Compliment resistance",
            detail: "Asked behavior question after praise."
          }
        ]
      },
      identifyingBadFitPersonas: {
        outcome: "partial",
        note: "Not enough authority evidence.",
        evidence: []
      },
      uncoveringWorkaroundsOrDecisionProcess: {
        outcome: "met",
        note: "Decision process and workaround detail uncovered.",
        evidence: [
          {
            sequence: 5,
            turnId: "turn-5",
            snippet: "Who decides this purchase and budget?",
            title: "Decision process probe",
            detail: "Question targeted approval flow."
          }
        ]
      }
    },
    learningSignal: {
      quality: "high",
      summary: "Learner extracted useful customer truth.",
      evidence: [
        {
          sequence: 4,
          turnId: null,
          snippet: null,
          title: "Concrete workaround evidence",
          detail: "Persona described real past behavior."
        }
      ]
    },
    trapResults: [
      {
        trapId: "trap-1",
        trapLabel: "Compliment Trap",
        outcome: "partial",
        detail: "Early validation-seeking partially recovered with stronger follow-ups.",
        evidence: [
          {
            sequence: 1,
            turnId: "turn-1",
            snippet: "Would this be useful for your team?",
            title: "Trigger evidence",
            detail: "Validation-seeking opener."
          }
        ]
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
