import { describe, expect, it } from "vitest";
import {
  StartPracticeNonce,
  StartPracticeInsufficientCreditsError,
  startPracticeForLearner
} from "../src/application/start-session/start-practice";
import { createInMemoryIdealCustomerProfileRepository } from "../src/domain/persona/ideal-customer-profile-repository";
import type {
  PersonaGenerationInput,
  PersonaGenerator
} from "../src/domain/persona/persona-generation";
import { createInMemoryGeneratedSessionCaseRepository } from "../src/domain/session/generated-session-case-repository";
import { createInMemoryCreditLedgerRepository } from "../src/domain/credits/credit-ledger-repository";
import { PersonaGenerationCapability } from "../src/application/llm-runtime/llm-runtime-layers";
import { Effect, Layer } from "effect";

const provideStartPracticeServices = (
  generator: PersonaGenerator,
  nonce: string
) =>
  Effect.provide(
    Layer.mergeAll(
      Layer.succeed(PersonaGenerationCapability, generator),
      Layer.succeed(StartPracticeNonce, {
        create: () => nonce
      })
    )
  );

const learnerId = "learner-1";

describe("Start Practice — Credit Gating", () => {
  it("allows a new Learner to start a Free Trial Session and marks trial as used", async () => {
    const creditLedgerRepository = createInMemoryCreditLedgerRepository();
    const personaGenerator = createRecordingPersonaGenerator();

    const started = await Effect.runPromise(
      startPracticeForLearner(learnerId, {
        idealCustomerProfileRepository: createInMemoryIdealCustomerProfileRepository(),
        generatedSessionCaseRepository: createInMemoryGeneratedSessionCaseRepository(),
        creditLedgerRepository
      }).pipe(provideStartPracticeServices(personaGenerator, "nonce-trial"))
    );

    expect(started.creditContext).toEqual({ kind: "free-trial" });

    const ledger = await Effect.runPromise(
      creditLedgerRepository.getOrInitializeForLearner(learnerId)
    );
    expect(ledger.freeTrialUsed).toBe(true);
  });

  it("blocks Start Practice with insufficient Credits and does not call persona generation", async () => {
    const creditLedgerRepository = createInMemoryCreditLedgerRepository([
      {
        learnerId,
        freeTrialUsed: true,
        subscriptionCredits: 0,
        topUpCredits: 0
      }
    ]);
    const personaGenerator = createRecordingPersonaGenerator();

    const result = await Effect.runPromise(
      Effect.either(
        startPracticeForLearner(learnerId, {
          idealCustomerProfileRepository: createInMemoryIdealCustomerProfileRepository(),
          generatedSessionCaseRepository: createInMemoryGeneratedSessionCaseRepository(),
          creditLedgerRepository
        }).pipe(provideStartPracticeServices(personaGenerator, "nonce-blocked"))
      )
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(StartPracticeInsufficientCreditsError);
    }
    expect(personaGenerator.inputs).toHaveLength(0);
  });

  it("allows a paid Learner with Credits to start and returns credit estimate", async () => {
    const creditLedgerRepository = createInMemoryCreditLedgerRepository([
      {
        learnerId,
        freeTrialUsed: true,
        subscriptionCredits: 5,
        topUpCredits: 0
      }
    ]);
    const personaGenerator = createRecordingPersonaGenerator();

    const started = await Effect.runPromise(
      startPracticeForLearner(learnerId, {
        idealCustomerProfileRepository: createInMemoryIdealCustomerProfileRepository(),
        generatedSessionCaseRepository: createInMemoryGeneratedSessionCaseRepository(),
        creditLedgerRepository
      }).pipe(provideStartPracticeServices(personaGenerator, "nonce-paid"))
    );

    expect(started.creditContext).toEqual({
      kind: "paid",
      estimatedCredits: 3
    });
    expect(personaGenerator.inputs).toHaveLength(1);
  });
});

function createRecordingPersonaGenerator(): PersonaGenerator & {
  inputs: PersonaGenerationInput[];
} {
  const inputs: PersonaGenerationInput[] = [];

  return {
    inputs,
    generateSessionCase(input) {
      inputs.push(input);
      return Effect.succeed({
        openingContext: "Opening context for credit gating test.",
        customerPersona: {
          lightPersonaLabel: "Finance operator",
          interviewRole: "Controller",
          publicContext: "Owns reporting",
          privateConstraints: ["Budget owner is VP Finance"]
        },
        hiddenBackstory: "Hidden backstory",
        customerFit: "strong-fit",
        hiddenTestPlan: {
          focusAreas: ["Concrete History"],
          successSignals: ["Asked about recent attempts"],
          failureSignals: ["Accepted vague praise"]
        },
        personaBehavior: {
          conversationalFriction: ["hesitation"],
          weakQuestionSocialSignals: ["politeness"],
          strongQuestionTruthAnchors: ["paid-consultant-attempt"],
          trapDelivery: "natural-hidden"
        },
        traps: [
          {
            id: "trap-1",
            label: "Compliment Trap",
            setup: "Persona praises the pitch.",
            weakBehavior: "Learner accepts praise."
          }
        ],
        generationAudit: { provider: "test", model: "test-model" }
      });
    }
  };
}
