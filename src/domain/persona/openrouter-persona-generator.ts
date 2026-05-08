import type { OpenRouterChatClient } from "@/src/infrastructure/llm/openrouter";
import {
  decodeGeneratedSessionCaseResponse,
  type GeneratedSessionCaseContractFailureReason,
  generatedSessionCaseResponseJsonSchema,
  generatedSessionCaseResponseSchemaName
} from "./generated-session-case-contract";
import type {
  PersonaGenerationInput,
  PersonaGenerator
} from "./persona-generation";
import type { SessionSource } from "./session-source";

type OpenRouterPersonaGeneratorOptions = {
  chatClient: OpenRouterChatClient;
};

export class PersonaGenerationDecodeError extends Error {
  readonly name = "PersonaGenerationDecodeError";
  readonly reason: GeneratedSessionCaseContractFailureReason;
  readonly cause?: unknown;

  constructor(input: {
    reason: GeneratedSessionCaseContractFailureReason;
    message: string;
    cause?: unknown;
  }) {
    super(input.message);
    this.reason = input.reason;
    this.cause = input.cause;
  }
}

export function createOpenRouterPersonaGenerator({
  chatClient
}: OpenRouterPersonaGeneratorOptions): PersonaGenerator {
  return {
    async generateSessionCase(input) {
      const completion = await chatClient.createStructuredJsonCompletion({
        messages: buildMessages(input),
        responseSchemaName: generatedSessionCaseResponseSchemaName,
        responseJsonSchema: generatedSessionCaseResponseJsonSchema
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
        "Include personaBehavior with conversationalFriction cues, weakQuestionSocialSignals, strongQuestionTruthAnchors, and trapDelivery='natural-hidden'.",
        "Weak questions should surface unreliable social signals. Strong questions should reveal truthful Concrete History anchored to the generated case.",
        "The Opening Context must not reveal hidden backstory, Customer Fit, Hidden Test Plan, or Traps."
      ].join("\n")
    }
  ];
}

function decodePersonaGenerationResponse(
  content: string
){
  const decoded = decodeGeneratedSessionCaseResponse(content);

  if (decoded.ok) {
    return decoded.value;
  }

  switch (decoded.reason) {
    case "invalid_json":
      throw new PersonaGenerationDecodeError({
        reason: "invalid_json",
        message: "Persona Generation response is not valid JSON."
      });
    case "schema_validation_failed":
      throw new PersonaGenerationDecodeError({
        reason: "schema_validation_failed",
        message: "Persona Generation response failed schema validation."
      });
    case "quality_gate_failed":
      throw new PersonaGenerationDecodeError({
        reason: "quality_gate_failed",
        message: "Persona Generation response failed quality gate."
      });
    default:
      return assertNever(decoded.reason);
  }
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

function assertNever(value: never): never {
  throw new Error(`Unknown Persona Generation contract error: ${String(value)}`);
}
