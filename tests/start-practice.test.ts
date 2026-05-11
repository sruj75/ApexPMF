import { describe, expect, it } from "vitest";
import { makeIdealCustomerProfile } from "./fixtures/ideal-customer-profile";
import {
  StartPracticeNonce,
  startPracticeForLearner
} from "../src/application/start-session/start-practice";
import { createInMemoryIdealCustomerProfileRepository } from "../src/domain/persona/ideal-customer-profile-repository";
import type {
  PersonaGenerationInput,
  PersonaGenerator
} from "../src/domain/persona/persona-generation";
import { createInMemoryGeneratedSessionCaseRepository } from "../src/domain/session/generated-session-case-repository";
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

describe("Start Practice", () => {
  it("creates a persisted Generated Session Case and returns only learner-safe Session start data", async () => {
    const generatedSessionCases = createInMemoryGeneratedSessionCaseRepository();
    const personaGenerator = createRecordingPersonaGenerator();

    const started = await Effect.runPromise(
      startPracticeForLearner(learnerId, {
        idealCustomerProfileRepository: createInMemoryIdealCustomerProfileRepository(),
        generatedSessionCaseRepository: generatedSessionCases
      }).pipe(provideStartPracticeServices(personaGenerator, "nonce-1"))
    );

    expect(started).toEqual({
      sessionId: "session-case-1",
      openingContext:
        "You are speaking with a finance operator who recently tried to improve month-end close.",
      sessionSourceLabel: "Broad Practice Pool",
      lightPersonaLabel: "Finance operator"
    });
    expect((started as Record<string, unknown>).personaBehavior).toBeUndefined();
    expect(personaGenerator.inputs).toMatchObject([
      {
        generationNonce: "nonce-1",
        sessionSource: {
          kind: "broad-practice-pool",
          label: "Broad Practice Pool"
        }
      }
    ]);

    const persisted = await Effect.runPromise(
      generatedSessionCases.getForLearner(learnerId, started.sessionId)
    );
    expect(persisted).toMatchObject({
      id: "session-case-1",
      learnerId,
      generationNonce: "nonce-1",
      sessionSource: {
        kind: "broad-practice-pool",
        label: "Broad Practice Pool"
      },
      customerPersona: {
        lightPersonaLabel: "Finance operator"
      },
      hiddenBackstory: "Has tried spreadsheets, consultants, and a failed automation pilot.",
      customerFit: "strong-fit",
      hiddenTestPlan: {
        focusAreas: ["Concrete History", "budget owner"]
      },
      personaBehavior: {
        trapDelivery: "natural-hidden"
      },
      traps: [
        {
          id: "trap-1",
          label: "Compliment Trap"
        }
      ]
    });
  });

  it("passes the Active Ideal Customer Profile into Persona Generation and snapshots it on the Generated Session Case", async () => {
    const profile = makeIdealCustomerProfile({
      id: "profile-42",
      isActive: true,
      name: "Clinical operators",
      customerDescription: "Practice managers in small clinics",
      notes: "Probe scheduling workarounds."
    });
    const generatedSessionCases = createInMemoryGeneratedSessionCaseRepository();
    const personaGenerator = createRecordingPersonaGenerator();

    const started = await Effect.runPromise(
      startPracticeForLearner(learnerId, {
        idealCustomerProfileRepository:
          createInMemoryIdealCustomerProfileRepository([profile]),
        generatedSessionCaseRepository: generatedSessionCases
      }).pipe(provideStartPracticeServices(personaGenerator, "nonce-profile"))
    );

    expect(started.sessionSourceLabel).toBe("Clinical operators");
    expect(personaGenerator.inputs[0]?.sessionSource).toEqual({
      kind: "active-ideal-customer-profile",
      idealCustomerProfile: {
        id: "profile-42",
        name: "Clinical operators",
        customerDescription: "Practice managers in small clinics",
        notes: "Probe scheduling workarounds."
      }
    });
    await expect(
      Effect.runPromise(
        generatedSessionCases.getForLearner(learnerId, started.sessionId)
      )
    ).resolves.toMatchObject({
      sessionSource: {
        kind: "active-ideal-customer-profile",
        idealCustomerProfile: {
          id: "profile-42",
          name: "Clinical operators",
          customerDescription: "Practice managers in small clinics",
          notes: "Probe scheduling workarounds."
        }
      }
    });
  });

  it("uses the Broad Practice Pool when no Active Ideal Customer Profile exists", async () => {
    const personaGenerator = createRecordingPersonaGenerator();

    const started = await Effect.runPromise(
      startPracticeForLearner(learnerId, {
        idealCustomerProfileRepository: createInMemoryIdealCustomerProfileRepository(),
        generatedSessionCaseRepository:
          createInMemoryGeneratedSessionCaseRepository()
      }).pipe(provideStartPracticeServices(personaGenerator, "nonce-broad"))
    );

    expect(started.sessionSourceLabel).toBe("Broad Practice Pool");
    expect(personaGenerator.inputs[0]?.sessionSource.kind).toBe(
      "broad-practice-pool"
    );
  });

  it("creates a fresh non-retryable Generated Session Case for each Start Practice call", async () => {
    const generatedSessionCases = createInMemoryGeneratedSessionCaseRepository();
    const personaGenerator = createRecordingPersonaGenerator();
    const nonces = ["nonce-a", "nonce-b"];

    const deps = {
      idealCustomerProfileRepository:
        createInMemoryIdealCustomerProfileRepository([
          makeIdealCustomerProfile({ isActive: true })
        ]),
      generatedSessionCaseRepository: generatedSessionCases
    };
    const nonceLayer = Layer.succeed(StartPracticeNonce, {
      create: () => nonces.shift() ?? "unexpected-nonce"
    });

    const first = await Effect.runPromise(
      startPracticeForLearner(learnerId, deps).pipe(
        Effect.provide(nonceLayer),
        Effect.provide(Layer.succeed(PersonaGenerationCapability, personaGenerator))
      )
    );
    const second = await Effect.runPromise(
      startPracticeForLearner(learnerId, deps).pipe(
        Effect.provide(nonceLayer),
        Effect.provide(Layer.succeed(PersonaGenerationCapability, personaGenerator))
      )
    );

    expect(first.sessionId).not.toBe(second.sessionId);
    expect(personaGenerator.inputs.map((input) => input.generationNonce)).toEqual(
      ["nonce-a", "nonce-b"]
    );
    await expect(
      Effect.runPromise(
        generatedSessionCases.getForLearner(learnerId, first.sessionId)
      )
    ).resolves.toMatchObject({ generationNonce: "nonce-a" });
    await expect(
      Effect.runPromise(
        generatedSessionCases.getForLearner(learnerId, second.sessionId)
      )
    ).resolves.toMatchObject({ generationNonce: "nonce-b" });
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
        openingContext:
          "You are speaking with a finance operator who recently tried to improve month-end close.",
        customerPersona: {
          lightPersonaLabel: "Finance operator",
          interviewRole: "Controller at a growing SaaS company",
          publicContext:
            "Owns reporting and coordinates month-end work across finance.",
          privateConstraints: [
            "Budget owner is the VP Finance",
            "Recent automation pilot failed"
          ]
        },
        hiddenBackstory:
          "Has tried spreadsheets, consultants, and a failed automation pilot.",
        customerFit: "strong-fit",
        hiddenTestPlan: {
          focusAreas: ["Concrete History", "budget owner"],
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
            label: "Compliment Trap",
            setup: "Persona praises the Learner's product framing.",
            weakBehavior: "Learner accepts validation without probing history."
          }
        ],
        generationAudit: {
          provider: "test",
          model: "fake-persona-generator"
        }
      });
    }
  };
}
