import { describe, expect, it } from "vitest";
import {
  decodeGeneratedSessionCaseResponse,
  generatedSessionCaseResponseJsonSchema,
  generatedSessionCaseResponseSchemaName
} from "../src/domain/persona/generated-session-case-contract";

describe("Generated Session Case contract", () => {
  it("exposes the shared structured response schema contract", () => {
    expect(generatedSessionCaseResponseSchemaName).toBe("generated_session_case");
    expect(generatedSessionCaseResponseJsonSchema.required).toContain("traps");
    expect(generatedSessionCaseResponseJsonSchema.required).toContain(
      "hiddenTestPlan"
    );
    expect(generatedSessionCaseResponseJsonSchema.required).toContain(
      "personaBehavior"
    );
  });

  it("returns invalid_json when the response is not valid JSON", () => {
    const decoded = decodeGeneratedSessionCaseResponse("{bad json");

    expect(decoded).toEqual({
      ok: false,
      reason: "invalid_json"
    });
  });

  it("returns schema_validation_failed when required fields are missing", () => {
    const withoutHiddenBackstory = {
      ...validGeneratedSessionCaseResponse
    };
    delete withoutHiddenBackstory.hiddenBackstory;

    const decoded = decodeGeneratedSessionCaseResponse(
      JSON.stringify(withoutHiddenBackstory)
    );

    expect(decoded).toEqual({
      ok: false,
      reason: "schema_validation_failed"
    });
  });

  it("returns quality_gate_failed when Hidden Test Plan or Trap invariants are invalid", () => {
    const invalidQualityResponse = {
      ...validGeneratedSessionCaseResponse,
      hiddenTestPlan: {
        ...validGeneratedSessionCaseResponse.hiddenTestPlan,
        failureSignals: []
      },
      traps: [
        {
          ...validGeneratedSessionCaseResponse.traps[0],
          weakBehavior: "   "
        }
      ]
    };

    const decoded = decodeGeneratedSessionCaseResponse(
      JSON.stringify(invalidQualityResponse)
    );

    expect(decoded).toEqual({
      ok: false,
      reason: "quality_gate_failed"
    });
  });

  it("returns quality_gate_failed when Opening Context leaks hidden mechanics", () => {
    const leakedOpeningContext = {
      ...validGeneratedSessionCaseResponse,
      openingContext:
        "Opening context that reveals Hidden Test Plan and trap details in advance."
    };

    const decoded = decodeGeneratedSessionCaseResponse(
      JSON.stringify(leakedOpeningContext)
    );

    expect(decoded).toEqual({
      ok: false,
      reason: "quality_gate_failed"
    });
  });

  it("returns decoded domain-safe response for valid content", () => {
    const decoded = decodeGeneratedSessionCaseResponse(
      JSON.stringify(validGeneratedSessionCaseResponse)
    );

    expect(decoded).toEqual({
      ok: true,
      value: validGeneratedSessionCaseResponse
    });
  });
});

const validGeneratedSessionCaseResponse = {
  openingContext:
    "You are speaking with a controller who recently tried to reduce month-end reporting delays.",
  customerPersona: {
    lightPersonaLabel: "SaaS controller",
    interviewRole: "Controller at a 90-person SaaS company",
    publicContext:
      "Owns month-end close and coordinates reporting with department leaders.",
    privateConstraints: [
      "VP Finance owns budget",
      "Recently tried an automation consultant"
    ]
  },
  hiddenBackstory:
    "The controller lost two weekends rebuilding reports after a failed automation handoff.",
  customerFit: "strong-fit",
  hiddenTestPlan: {
    focusAreas: ["Concrete History", "decision process"],
    successSignals: ["Asks about recent attempts"],
    failureSignals: ["Pitches before understanding workflow"]
  },
  personaBehavior: {
    conversationalFriction: [
      "hesitation",
      "rambling",
      "vague-answers",
      "mild-discomfort",
      "interruption",
      "questions-back"
    ],
    weakQuestionSocialSignals: [
      "politeness",
      "praise",
      "speculation",
      "vague-interest"
    ],
    strongQuestionTruthAnchors: [
      "paid-consultant-attempt",
      "manual-rebuild-weekend"
    ],
    trapDelivery: "natural-hidden"
  },
  traps: [
    {
      id: "trap-1",
      label: "Vague Interest Trap",
      setup: "Persona says better reporting sounds useful.",
      weakBehavior: "Learner treats polite interest as validation."
    }
  ]
};
