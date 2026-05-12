import { describe, expect, it } from "vitest";
import { createSessionOrchestrator } from "../src/application/end-session/session-orchestrator";
import { createInMemoryGeneratedSessionCaseRepository } from "../src/domain/session/generated-session-case-repository";
import type { GeneratedSessionCaseRepository } from "../src/domain/session/generated-session-case-repository";
import { createInMemoryCreditLedgerRepository } from "../src/domain/credits/credit-ledger-repository";
import { Effect } from "effect";

const learnerId = "learner-trial";

describe("Free Trial Session — report generation path", () => {
  it("routes to report-generating on natural-conclusion with zero credit charge", async () => {
    const { repository, sessionId } = await createFreeTrialSession();
    const creditLedgerRepository = createInMemoryCreditLedgerRepository();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      }
    });

    const outcome = await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId,
        reason: "natural-conclusion",
        creditFinalization: {
          sessionCreditContext: { kind: "free-trial", maxDurationMinutes: 15 },
          actualDurationMinutes: 12,
          usableDurationMinutes: 12,
          creditLedgerRepository
        }
      })
    );

    expect(outcome).toMatchObject({
      nextPath: `/practice/${sessionId}/report-generating`,
      sessionStatus: "ended",
      endedReason: "natural-conclusion",
      reportStatus: "generating",
      creditChargeResult: { kind: "free-trial", creditsCharged: 0 }
    });
  });

  it("generates a real Session Report when enough evidence exists", async () => {
    const { repository, sessionId } = await createFreeTrialSession();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      }
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId,
        reason: "natural-conclusion"
      })
    );

    const reportOutcome = await Effect.runPromise(
      orchestrator.runReportGeneratingFlowForLearner({ learnerId, sessionId })
    );

    expect(reportOutcome).toMatchObject({
      reportStatus: "ready",
      nextPath: `/practice/${sessionId}/report`
    });

    const persisted = await Effect.runPromise(
      repository.getForLearner(learnerId, sessionId)
    );
    expect(persisted!.sessionReport).not.toBeNull();
    expect(persisted!.sessionReport!.outcome.summary).toBeTruthy();
  });

  it("returns insufficient-evidence when report cannot be generated", async () => {
    const { repository, sessionId } = await createFreeTrialSession();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed({
            status: "insufficient-evidence" as const,
            reason: "too-few-turns"
          });
        }
      }
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId,
        reason: "natural-conclusion"
      })
    );

    const reportOutcome = await Effect.runPromise(
      orchestrator.runReportGeneratingFlowForLearner({ learnerId, sessionId })
    );

    expect(reportOutcome).toMatchObject({
      reportStatus: "insufficient-evidence",
      nextPath: "/dashboard"
    });
  });
});

async function createFreeTrialSession(): Promise<{
  repository: GeneratedSessionCaseRepository;
  sessionId: string;
}> {
  const repository = createInMemoryGeneratedSessionCaseRepository();
  const sessionCase = await Effect.runPromise(
    repository.create(learnerId, {
      sessionSource: {
        kind: "broad-practice-pool",
        label: "Broad Practice Pool"
      },
      openingContext: "Opening context for free trial",
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
          setup: "Persona praises the pitch.",
          weakBehavior: "Learner accepts praise as validation."
        }
      ],
      generationNonce: "free-trial-nonce",
      generationAudit: {
        provider: "test",
        model: "test-model"
      }
    })
  );

  return { repository, sessionId: sessionCase.id };
}

function makeReadyReportGenerationResult() {
  return {
    status: "ready" as const,
    report: {
      outcome: { summary: "Free trial session completed successfully." },
      missedSignals: [],
      badQuestions: [],
      strongQuestions: [
        {
          question: "What did you try recently?",
          whyItWorked: "Concrete history question.",
          evidence: []
        }
      ],
      trapResults: [
        {
          trapLabel: "Compliment Trap",
          outcome: "avoided" as const,
          detail: "Learner redirected praise to behavior.",
          evidence: []
        }
      ],
      skillMovement: [
        {
          skill: "Asking Concrete History",
          movement: "up" as const,
          rationale: "Consistently asked about past behavior."
        }
      ],
      nextPracticeFocus: {
        title: "Follow up on vague answers",
        description: "Dig deeper when persona gives non-specific responses."
      },
      sourceContext: "Broad Practice Pool",
      lightPersonaLabel: "Finance operator",
      expandableEvidence: []
    },
    transcript: [
      { sequence: 1, speaker: "learner" as const, text: "What did you try recently?" },
      { sequence: 2, speaker: "persona" as const, text: "We tried a few things last quarter." }
    ],
    evaluation: {
      interviewBehavior: {
        avoidingPitching: { outcome: "met" as const, note: "No pitching detected.", evidence: [] },
        askingConcreteHistory: { outcome: "met" as const, note: "Asked concrete history.", evidence: [] },
        followingUpOnVagueAnswers: { outcome: "partial" as const, note: "Some follow-up.", evidence: [] },
        resistingCompliments: { outcome: "met" as const, note: "Resisted compliments.", evidence: [] },
        identifyingBadFitPersonas: { outcome: "partial" as const, note: "Not central.", evidence: [] },
        uncoveringWorkaroundsOrDecisionProcess: { outcome: "met" as const, note: "Workaround found.", evidence: [] }
      },
      learningSignal: { quality: "medium" as const, summary: "Good discovery.", evidence: [] },
      trapResults: [
        {
          trapId: "trap-1",
          trapLabel: "Compliment Trap",
          outcome: "avoided" as const,
          detail: "Learner redirected praise.",
          evidence: []
        }
      ],
      excludedDimensions: {
        accent: "not-scored" as const,
        charisma: "not-scored" as const,
        vocalPolish: "not-scored" as const,
        soundingConfident: "not-scored" as const
      }
    }
  };
}
