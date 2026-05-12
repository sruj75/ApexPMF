import { describe, expect, it, vi } from "vitest";
import { Effect, Layer } from "effect";
import {
  HiddenEvaluationCapability,
  OpenRouterChatClientService,
  PersonaGenerationCapability,
  degradableHiddenEvaluationCapabilityLayerFromEnv,
  hiddenEvaluationCapabilityLayer,
  openRouterChatClientLayerFromEnv,
  personaGenerationCapabilityLayer,
  requiredPersonaGenerationCapabilityLayerFromEnv
} from "../src/application/llm-runtime/llm-runtime-layers";
import {
  OpenRouterProviderError,
  type OpenRouterChatClient
} from "../src/infrastructure/llm/openrouter";
import { NonLiveLlmProviderUnavailableError } from "../src/application/non-live-llm-policy";

const recordingChatClient = (): {
  client: OpenRouterChatClient;
  callCount: () => number;
} => {
  const fn = vi.fn(() =>
    Effect.fail(
      new OpenRouterProviderError({
        phase: "request_failed",
        message: "test sentinel — chat client was invoked"
      })
    )
  );
  return {
    client: { createStructuredJsonCompletion: fn },
    callCount: () => fn.mock.calls.length
  };
};

describe("PersonaGenerationCapability layer", () => {
  it("constructs a persona generator that delegates to the OpenRouterChatClientService", async () => {
    const { client, callCount } = recordingChatClient();

    const program = Effect.gen(function* () {
      const personaGenerator = yield* PersonaGenerationCapability;
      yield* personaGenerator.generateSessionCase({
        sessionSource: {
          kind: "broad-practice-pool",
          label: "Broad Practice Pool"
        },
        generationNonce: "nonce-1"
      });
    });

    await Effect.runPromise(
      program.pipe(
        Effect.provide(
          personaGenerationCapabilityLayer.pipe(
            Layer.provide(Layer.succeed(OpenRouterChatClientService, client))
          )
        ),
        Effect.catchAll(() => Effect.void)
      )
    );

    expect(callCount()).toBe(1);
  });
});

describe("HiddenEvaluationCapability layer", () => {
  it("constructs a hidden evaluation engine that delegates to the OpenRouterChatClientService", async () => {
    const { client, callCount } = recordingChatClient();

    const program = Effect.gen(function* () {
      const engine = yield* HiddenEvaluationCapability;
      yield* engine.evaluateEndedSession({
        generatedSessionCase: endedFixture,
        transcript: longEnoughTranscript
      });
    });

    await Effect.runPromise(
      program.pipe(
        Effect.provide(
          hiddenEvaluationCapabilityLayer.pipe(
            Layer.provide(Layer.succeed(OpenRouterChatClientService, client))
          )
        )
      )
    );

    expect(callCount()).toBe(1);
  });
});

describe("OpenRouter chat client layer from env", () => {
  it("fails layer construction when OPENROUTER_API_KEY is missing", async () => {
    const layer = openRouterChatClientLayerFromEnv({});
    const program = Effect.gen(function* () {
      yield* OpenRouterChatClientService;
    });

    const thrown = await Effect.runPromise(
      program.pipe(Effect.provide(layer), Effect.flip)
    );

    expect(thrown).toBeInstanceOf(NonLiveLlmProviderUnavailableError);
  });
});

describe("requiredPersonaGenerationCapabilityLayerFromEnv", () => {
  it("propagates unavailable failure at layer construction when API key is missing", async () => {
    const layer = requiredPersonaGenerationCapabilityLayerFromEnv({});
    const program = Effect.gen(function* () {
      yield* PersonaGenerationCapability;
    });

    const thrown = await Effect.runPromise(
      program.pipe(Effect.provide(layer), Effect.flip)
    );

    expect(thrown).toBeInstanceOf(NonLiveLlmProviderUnavailableError);
  });
});

describe("degradableHiddenEvaluationCapabilityLayerFromEnv", () => {
  it("gracefully provides an insufficient-evidence engine when API key is missing", async () => {
    const layer = degradableHiddenEvaluationCapabilityLayerFromEnv({});
    const program = Effect.gen(function* () {
      const engine = yield* HiddenEvaluationCapability;
      return yield* engine.evaluateEndedSession({
        generatedSessionCase: endedFixture,
        transcript: longEnoughTranscript
      });
    });

    const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));

    expect(result).toEqual({
      status: "insufficient-evidence",
      reason: "provider-failure"
    });
  });
});

const longEnoughTranscript = Array.from({ length: 6 }, (_, index) => ({
  speaker: index % 2 === 0 ? ("learner" as const) : ("persona" as const),
  text: `turn ${index}`
})) as unknown as Parameters<
  ReturnType<typeof import("../src/domain/session/hidden-evaluation-engine").createHiddenEvaluationEngine>["evaluateEndedSession"]
>[0]["transcript"];

const endedFixture = {
  id: "session-case-1",
  learnerId: "learner-1",
  generationNonce: "nonce-1",
  sessionSource: {
    kind: "broad-practice-pool" as const,
    label: "Broad Practice Pool"
  },
  customerPersona: {
    lightPersonaLabel: "Finance operator",
    interviewRole: "Controller",
    publicContext: "Owns reporting.",
    privateConstraints: []
  },
  openingContext: "ctx",
  hiddenBackstory: "bs",
  customerFit: "strong-fit" as const,
  hiddenTestPlan: {
    focusAreas: ["Concrete History"],
    successSignals: ["Asks about recent attempts"],
    failureSignals: ["Accepts vague praise"]
  },
  personaBehavior: {
    conversationalFriction: [
      "hesitation",
      "rambling",
      "vague-answers",
      "mild-discomfort",
      "interruption",
      "questions-back"
    ] as const,
    weakQuestionSocialSignals: [
      "politeness",
      "praise",
      "speculation",
      "vague-interest"
    ] as const,
    strongQuestionTruthAnchors: [
      "paid-consultant-attempt",
      "manual-rebuild-weekend"
    ] as const,
    trapDelivery: "natural-hidden" as const
  },
  traps: [
    {
      id: "trap-1",
      label: "Compliment Trap",
      setup: "Persona praises the framing.",
      weakBehavior: "Learner accepts validation without probing."
    }
  ],
  generationAudit: {
    provider: "test",
    model: "fake"
  },
  sessionLifecycle: {
    sessionStatus: "ended" as const,
    endedReason: "learner-requested" as const,
    endedAt: new Date().toISOString()
  },
  sessionTranscript: longEnoughTranscript,
  reportStatus: "not-requested" as const,
  createdAt: new Date().toISOString()
} as unknown as Parameters<
  ReturnType<typeof import("../src/domain/session/hidden-evaluation-engine").createHiddenEvaluationEngine>["evaluateEndedSession"]
>[0]["generatedSessionCase"];
