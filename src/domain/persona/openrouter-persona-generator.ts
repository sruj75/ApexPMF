import { Schema } from "effect";
import type { OpenRouterChatClient } from "@/src/infrastructure/llm/openrouter";
import type {
  GeneratedSessionCaseDraft,
  PersonaGenerationInput,
  PersonaGenerator
} from "./persona-generation";
import type { SessionSource } from "./session-source";

const CustomerFitSchema = Schema.Literal(
  "strong-fit",
  "weak-fit",
  "bad-fit",
  "buyer-user-mismatch",
  "influencer"
);

const PersonaGenerationResponseSchema = Schema.Struct({
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
  traps: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      label: Schema.String,
      setup: Schema.String,
      weakBehavior: Schema.String
    })
  )
});

type PersonaGenerationResponse = Schema.Schema.Type<
  typeof PersonaGenerationResponseSchema
>;

type OpenRouterPersonaGeneratorOptions = {
  chatClient: OpenRouterChatClient;
};

export function createOpenRouterPersonaGenerator({
  chatClient
}: OpenRouterPersonaGeneratorOptions): PersonaGenerator {
  return {
    async generateSessionCase(input) {
      const completion = await chatClient.createStructuredJsonCompletion({
        messages: buildMessages(input),
        responseSchemaName: "generated_session_case",
        responseJsonSchema: personaGenerationJsonSchema
      });
      const generated = decodePersonaGenerationResponse(completion.content);

      return {
        ...generated,
        generationAudit: {
          provider: "openrouter",
          model: completion.model,
          responseId: completion.id
        }
      };
    }
  };
}

function buildMessages(input: PersonaGenerationInput) {
  return [
    {
      role: "system" as const,
      content:
        "You generate one fresh customer discovery practice case. Return only JSON matching the schema. Keep hidden mechanics internal and make the Opening Context safe for the Learner."
    },
    {
      role: "user" as const,
      content: [
        "Create a Generated Session Case for The Mom Test Simulator.",
        `Generation nonce: ${input.generationNonce}`,
        `Session source: ${describeSessionSource(input.sessionSource)}`,
        "The Customer Persona must include Concrete History, a hidden Customer Fit, a Hidden Test Plan, and natural Traps.",
        "The Opening Context must not reveal hidden backstory, Customer Fit, Hidden Test Plan, or Traps."
      ].join("\n")
    }
  ];
}

function decodePersonaGenerationResponse(
  content: string
): GeneratedSessionCaseDraft {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Persona Generation response is invalid.");
  }

  const decoded = Schema.decodeUnknownEither(
    PersonaGenerationResponseSchema
  )(parsed);

  if (decoded._tag === "Left" || !passesQualityGate(decoded.right)) {
    throw new Error("Persona Generation response is invalid.");
  }

  return {
    ...decoded.right,
    generationAudit: {
      provider: "openrouter",
      model: "unknown"
    }
  };
}

function passesQualityGate(response: PersonaGenerationResponse): boolean {
  return (
    response.openingContext.trim().length > 0 &&
    response.customerPersona.lightPersonaLabel.trim().length > 0 &&
    response.hiddenBackstory.trim().length > 0 &&
    response.hiddenTestPlan.focusAreas.length > 0 &&
    response.hiddenTestPlan.successSignals.length > 0 &&
    response.hiddenTestPlan.failureSignals.length > 0 &&
    response.traps.length > 0
  );
}

function describeSessionSource(sessionSource: SessionSource): string {
  if (sessionSource.kind === "active-ideal-customer-profile") {
    return [
      `Active Ideal Customer Profile: ${sessionSource.idealCustomerProfile.name}`,
      `Customer description: ${sessionSource.idealCustomerProfile.customerDescription}`,
      `Notes: ${sessionSource.idealCustomerProfile.notes ?? "none"}`
    ].join("\n");
  }

  return "Broad Practice Pool";
}

const personaGenerationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "openingContext",
    "customerPersona",
    "hiddenBackstory",
    "customerFit",
    "hiddenTestPlan",
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
};
