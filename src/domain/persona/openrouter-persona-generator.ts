import type { OpenRouterChatClient } from "@/src/infrastructure/llm/openrouter";
import { PRODUCT_APP_NAME } from "@/src/product/brand";
import { Effect } from "effect";
import {
  decodeGeneratedSessionCaseResponse,
  generatedSessionCaseResponseJsonSchema,
  generatedSessionCaseResponseSchemaName,
  type GeneratedSessionCaseContractResponse
} from "./generated-session-case-contract";
import type {
  PersonaGenerationInput,
  PersonaGenerator
} from "./persona-generation";
import {
  PersonaGenerationDecodeError,
  PersonaGenerationProviderError
} from "./persona-generation";
import type { SessionSource } from "./session-source";

type OpenRouterPersonaGeneratorOptions = {
  chatClient: OpenRouterChatClient;
};

export function createOpenRouterPersonaGenerator({
  chatClient
}: OpenRouterPersonaGeneratorOptions): PersonaGenerator {
  return {
    generateSessionCase(input) {
      return chatClient
        .createStructuredJsonCompletion({
          messages: buildMessages(input),
          responseSchemaName: generatedSessionCaseResponseSchemaName,
          responseJsonSchema: generatedSessionCaseResponseJsonSchema
        })
        .pipe(
          Effect.mapError(
            (cause) =>
              new PersonaGenerationProviderError({
                message: cause.message,
                cause
              })
          ),
          Effect.flatMap((completion) =>
            decodePersonaGenerationResponse(completion.content).pipe(
              Effect.map((generated) => ({
                ...generated,
                generationAudit: {
                  provider: "openrouter",
                  model: completion.model,
                  responseId: completion.id
                }
              }))
            )
          )
        );
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
        `Create a Generated Session Case for ${PRODUCT_APP_NAME}.`,
        `Generation nonce: ${input.generationNonce}`,
        `Session source: ${describeSessionSource(input.sessionSource)}`,
        "The Customer Persona must include Concrete History, a hidden Customer Fit, a Hidden Test Plan, and natural Traps.",
        "Include personaBehavior with conversationalFriction cues, weakQuestionSocialSignals, strongQuestionTruthAnchors, and trapDelivery='natural-hidden'.",
        "Weak questions should surface unreliable social signals. Strong questions should reveal truthful Concrete History anchored to the generated case.",
        "The Opening Context must not reveal hidden backstory, Customer Fit, Hidden Test Plan, or Traps."
      ].join("\n")
    }
  ];
}

function decodePersonaGenerationResponse(
  content: string
): Effect.Effect<
  GeneratedSessionCaseContractResponse,
  PersonaGenerationDecodeError,
  never
> {
  const decoded = decodeGeneratedSessionCaseResponse(content);

  if (decoded.ok) {
    return Effect.succeed(decoded.value);
  }

  switch (decoded.reason) {
    case "invalid_json":
      return Effect.fail(
        new PersonaGenerationDecodeError({
          reason: "invalid_json",
          message: "Persona Generation response is not valid JSON."
        })
      );
    case "schema_validation_failed":
      return Effect.fail(
        new PersonaGenerationDecodeError({
          reason: "schema_validation_failed",
          message: "Persona Generation response failed schema validation."
        })
      );
    case "quality_gate_failed":
      return Effect.fail(
        new PersonaGenerationDecodeError({
          reason: "quality_gate_failed",
          message: "Persona Generation response failed quality gate."
        })
      );
    default: {
      const unexpectedReason: never = decoded.reason;
      return Effect.die(
        new Error(
          `Unknown Persona Generation contract error: ${String(unexpectedReason)}`
        )
      );
    }
  }
}

export { PersonaGenerationDecodeError };

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

