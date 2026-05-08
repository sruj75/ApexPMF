import { describe, expect, it } from "vitest";
import { createSessionOrchestrator } from "../src/application/end-session/session-orchestrator";
import { createInMemoryGeneratedSessionCaseRepository } from "../src/domain/session/generated-session-case-repository";
import type { GeneratedSessionCaseRepository } from "../src/domain/session/generated-session-case-repository";

const learnerId = "learner-1";

describe("Session Orchestrator", () => {
  it("accepts every supported Session end reason and returns deterministic routing", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        async generateForEndedSession() {
          return {
            status: "ready"
          };
        }
      }
    });

    await expect(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.userQuit,
        reason: "user-quit"
      })
    ).resolves.toMatchObject({
      nextPath: "/dashboard",
      sessionStatus: "ended",
      endedReason: "user-quit"
    });

    await expect(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion,
        reason: "natural-conclusion"
      })
    ).resolves.toMatchObject({
      nextPath: `/practice/${sessionIds.naturalConclusion}/report-generating`,
      sessionStatus: "ended",
      endedReason: "natural-conclusion",
      reportStatus: "generating"
    });

    await expect(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.timeCap,
        reason: "time-cap"
      })
    ).resolves.toMatchObject({
      nextPath: `/practice/${sessionIds.timeCap}/report-generating`,
      sessionStatus: "ended",
      endedReason: "time-cap",
      reportStatus: "generating"
    });

    await expect(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.creditExhaustion,
        reason: "credit-exhaustion"
      })
    ).resolves.toMatchObject({
      nextPath: `/practice/${sessionIds.creditExhaustion}/report-generating`,
      sessionStatus: "ended",
      endedReason: "credit-exhaustion",
      reportStatus: "generating"
    });

    await expect(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.voiceFailure,
        reason: "voice-failure"
      })
    ).resolves.toMatchObject({
      nextPath: `/practice/${sessionIds.voiceFailure}/report-generating`,
      sessionStatus: "ended",
      endedReason: "voice-failure",
      reportStatus: "generating"
    });
  });

  it("keeps recoverable Voice Failure in Voice Conversation and never routes to text fallback", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        async generateForEndedSession() {
          return {
            status: "ready"
          };
        }
      }
    });

    const outcome = await orchestrator.handleVoiceFailureForLearner({
      learnerId,
      sessionId: sessionIds.voiceFailure,
      recoverable: true
    });

    expect(outcome).toEqual({
      behavior: "resume-voice-conversation",
      nextPath: `/practice/${sessionIds.voiceFailure}`
    });
    expect((outcome as Record<string, unknown>).textFallbackPath).toBeUndefined();
  });

  it("ends unrecoverable Voice Failure through report-generating flow", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        async generateForEndedSession() {
          return {
            status: "ready"
          };
        }
      }
    });

    await expect(
      orchestrator.handleVoiceFailureForLearner({
        learnerId,
        sessionId: sessionIds.voiceFailure,
        recoverable: false
      })
    ).resolves.toEqual({
      behavior: "end-session",
      nextPath: `/practice/${sessionIds.voiceFailure}/report-generating`
    });
  });

  it("routes report-generating flow to Session Report when report evidence is ready", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        async generateForEndedSession() {
          return {
            status: "ready"
          };
        }
      }
    });

    await orchestrator.endSessionForLearner({
      learnerId,
      sessionId: sessionIds.naturalConclusion,
      reason: "natural-conclusion"
    });

    await expect(
      orchestrator.runReportGeneratingFlowForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion
      })
    ).resolves.toEqual({
      reportStatus: "ready",
      nextPath: `/practice/${sessionIds.naturalConclusion}/report`
    });
  });

  it("routes report-generating flow to Practice Dashboard when evidence is insufficient", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        async generateForEndedSession() {
          return {
            status: "insufficient-evidence"
          };
        }
      }
    });

    await orchestrator.endSessionForLearner({
      learnerId,
      sessionId: sessionIds.creditExhaustion,
      reason: "credit-exhaustion"
    });

    await expect(
      orchestrator.runReportGeneratingFlowForLearner({
        learnerId,
        sessionId: sessionIds.creditExhaustion
      })
    ).resolves.toEqual({
      reportStatus: "insufficient-evidence",
      nextPath: "/dashboard"
    });
  });
});

async function createRepositoryWithEndedSessionFixtures(): Promise<{
  repository: GeneratedSessionCaseRepository;
  sessionIds: {
    userQuit: string;
    naturalConclusion: string;
    timeCap: string;
    creditExhaustion: string;
    voiceFailure: string;
  };
}> {
  const repository = createInMemoryGeneratedSessionCaseRepository();

  const userQuit = await createSessionCase(repository, "nonce-user-quit");
  const naturalConclusion = await createSessionCase(repository, "nonce-natural");
  const timeCap = await createSessionCase(repository, "nonce-time-cap");
  const creditExhaustion = await createSessionCase(repository, "nonce-credit");
  const voiceFailure = await createSessionCase(repository, "nonce-voice");

  return {
    repository,
    sessionIds: {
      userQuit: userQuit.id,
      naturalConclusion: naturalConclusion.id,
      timeCap: timeCap.id,
      creditExhaustion: creditExhaustion.id,
      voiceFailure: voiceFailure.id
    }
  };
}

async function createSessionCase(
  repository: GeneratedSessionCaseRepository,
  generationNonce: string
) {
  return repository.create(learnerId, {
    sessionSource: {
      kind: "broad-practice-pool",
      label: "Broad Practice Pool"
    },
    openingContext: "Opening context",
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
    generationNonce,
    generationAudit: {
      provider: "test",
      model: "test-model"
    }
  });
}
