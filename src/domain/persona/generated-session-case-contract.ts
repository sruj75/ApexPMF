import { Schema } from "effect";
import type { GeneratedSessionCaseDraft } from "./persona-generation";

const CustomerFitSchema = Schema.Literal(
  "strong-fit",
  "weak-fit",
  "bad-fit",
  "buyer-user-mismatch",
  "influencer"
);

const GeneratedSessionCaseResponseSchema = Schema.Struct({
  openingContext: Schema.String,
  customerPersona: Schema.Struct({
    lightPersonaLabel: Schema.String,
    interviewRole: Schema.String,
    publicContext: Schema.String,
    privateConstraints: Schema.Array(Schema.String)
  }),
  hiddenBackstory: Schema.String,
  customerFit: CustomerFitSchema,
  hiddenTestPlan: Schema.Struct({
    focusAreas: Schema.Array(Schema.String),
    successSignals: Schema.Array(Schema.String),
    failureSignals: Schema.Array(Schema.String)
  }),
  personaBehavior: Schema.Struct({
    conversationalFriction: Schema.Array(
      Schema.Literal(
        "hesitation",
        "rambling",
        "vague-answers",
        "mild-discomfort",
        "interruption",
        "questions-back"
      )
    ),
    weakQuestionSocialSignals: Schema.Array(
      Schema.Literal(
        "politeness",
        "praise",
        "speculation",
        "vague-interest"
      )
    ),
    strongQuestionTruthAnchors: Schema.Array(Schema.String),
    trapDelivery: Schema.Literal("natural-hidden")
  }),
  traps: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      label: Schema.String,
      setup: Schema.String,
      weakBehavior: Schema.String
    })
  )
});

type GeneratedSessionCaseResponse = Schema.Schema.Type<
  typeof GeneratedSessionCaseResponseSchema
>;

export type GeneratedSessionCaseContractResponse = Omit<
  GeneratedSessionCaseDraft,
  "generationAudit"
>;

export type GeneratedSessionCaseContractFailureReason =
  | "invalid_json"
  | "schema_validation_failed"
  | "quality_gate_failed";

export type DecodeGeneratedSessionCaseResponseResult =
  | {
      ok: true;
      value: GeneratedSessionCaseContractResponse;
    }
  | {
      ok: false;
      reason: GeneratedSessionCaseContractFailureReason;
    };

export const generatedSessionCaseResponseSchemaName = "generated_session_case";

export const generatedSessionCaseResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "openingContext",
    "customerPersona",
    "hiddenBackstory",
    "customerFit",
    "hiddenTestPlan",
    "personaBehavior",
    "traps"
  ],
  properties: {
    openingContext: { type: "string" },
    customerPersona: {
      type: "object",
      additionalProperties: false,
      required: [
        "lightPersonaLabel",
        "interviewRole",
        "publicContext",
        "privateConstraints"
      ],
      properties: {
        lightPersonaLabel: { type: "string" },
        interviewRole: { type: "string" },
        publicContext: { type: "string" },
        privateConstraints: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    hiddenBackstory: { type: "string" },
    customerFit: {
      type: "string",
      enum: [
        "strong-fit",
        "weak-fit",
        "bad-fit",
        "buyer-user-mismatch",
        "influencer"
      ]
    },
    hiddenTestPlan: {
      type: "object",
      additionalProperties: false,
      required: ["focusAreas", "successSignals", "failureSignals"],
      properties: {
        focusAreas: {
          type: "array",
          items: { type: "string" }
        },
        successSignals: {
          type: "array",
          items: { type: "string" }
        },
        failureSignals: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    personaBehavior: {
      type: "object",
      additionalProperties: false,
      required: [
        "conversationalFriction",
        "weakQuestionSocialSignals",
        "strongQuestionTruthAnchors",
        "trapDelivery"
      ],
      properties: {
        conversationalFriction: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "hesitation",
              "rambling",
              "vague-answers",
              "mild-discomfort",
              "interruption",
              "questions-back"
            ]
          }
        },
        weakQuestionSocialSignals: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "politeness",
              "praise",
              "speculation",
              "vague-interest"
            ]
          }
        },
        strongQuestionTruthAnchors: {
          type: "array",
          items: {
            type: "string"
          }
        },
        trapDelivery: {
          type: "string",
          enum: ["natural-hidden"]
        }
      }
    },
    traps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "setup", "weakBehavior"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          setup: { type: "string" },
          weakBehavior: { type: "string" }
        }
      }
    }
  }
} as const;

export function decodeGeneratedSessionCaseResponse(
  content: string
): DecodeGeneratedSessionCaseResponseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      ok: false,
      reason: "invalid_json"
    };
  }

  const decoded = Schema.decodeUnknownEither(
    GeneratedSessionCaseResponseSchema
  )(parsed);

  if (decoded._tag === "Left") {
    return {
      ok: false,
      reason: "schema_validation_failed"
    };
  }

  if (!passesQualityGate(decoded.right)) {
    return {
      ok: false,
      reason: "quality_gate_failed"
    };
  }

  return {
    ok: true,
    value: decoded.right
  };
}

function passesQualityGate(response: GeneratedSessionCaseResponse): boolean {
  return (
    response.openingContext.trim().length > 0 &&
    !openingContextLeaksHiddenMechanics(response.openingContext) &&
    response.customerPersona.lightPersonaLabel.trim().length > 0 &&
    response.customerPersona.interviewRole.trim().length > 0 &&
    response.customerPersona.publicContext.trim().length > 0 &&
    response.customerPersona.privateConstraints.length > 0 &&
    response.customerPersona.privateConstraints.every(
      (constraint) => constraint.trim().length > 0
    ) &&
    response.hiddenBackstory.trim().length > 0 &&
    response.hiddenTestPlan.focusAreas.length > 0 &&
    response.hiddenTestPlan.successSignals.length > 0 &&
    response.hiddenTestPlan.failureSignals.length > 0 &&
    response.personaBehavior.conversationalFriction.length > 0 &&
    response.personaBehavior.weakQuestionSocialSignals.length > 0 &&
    response.personaBehavior.strongQuestionTruthAnchors.length > 0 &&
    response.personaBehavior.strongQuestionTruthAnchors.every(
      (anchor) => anchor.trim().length > 0
    ) &&
    response.traps.length > 0 &&
    response.traps.every(
      (trap) =>
        trap.id.trim().length > 0 &&
        trap.label.trim().length > 0 &&
        trap.setup.trim().length > 0 &&
        trap.weakBehavior.trim().length > 0
    )
  );
}

const hiddenMechanicLeakTerms = [
  "hidden test plan",
  "hidden backstory",
  "customer fit",
  "trap",
  "strong-fit",
  "weak-fit",
  "bad-fit",
  "buyer-user-mismatch",
  "influencer"
];

function openingContextLeaksHiddenMechanics(openingContext: string): boolean {
  const normalizedOpeningContext = openingContext.toLowerCase();
  return hiddenMechanicLeakTerms.some((term) =>
    normalizedOpeningContext.includes(term)
  );
}
