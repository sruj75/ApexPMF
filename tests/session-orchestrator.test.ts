import { describe, expect, it, vi } from "vitest";
import {
  SessionCaseNotFoundError,
  createSessionOrchestrator
} from "../src/application/end-session/session-orchestrator";
import { createInMemoryGeneratedSessionCaseRepository } from "../src/domain/session/generated-session-case-repository";
import type { GeneratedSessionCaseRepository } from "../src/domain/session/generated-session-case-repository";
import { createInMemoryCreditLedgerRepository } from "../src/domain/credits/credit-ledger-repository";
import { createProgressionUpdater } from "../src/application/update-progression/progression-updater";
import { createInMemoryProgressionRepository } from "../src/domain/progression/progression-repository";
import { Effect } from "effect";

const learnerId = "learner-1";

describe("Session Orchestrator", () => {
  it("accepts every supported Session end reason and returns deterministic routing", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      }
    });

    await expect(
      Effect.runPromise(
        orchestrator.endSessionForLearner({
          learnerId,
          sessionId: sessionIds.userQuit,
          reason: "user-quit"
        })
      )
    ).resolves.toMatchObject({
      nextPath: "/dashboard",
      sessionStatus: "ended",
      endedReason: "user-quit"
    });

    await expect(
      Effect.runPromise(
        orchestrator.endSessionForLearner({
          learnerId,
          sessionId: sessionIds.naturalConclusion,
          reason: "natural-conclusion"
        })
      )
    ).resolves.toMatchObject({
      nextPath: `/practice/${sessionIds.naturalConclusion}/report-generating`,
      sessionStatus: "ended",
      endedReason: "natural-conclusion",
      reportStatus: "generating"
    });

    await expect(
      Effect.runPromise(
        orchestrator.endSessionForLearner({
          learnerId,
          sessionId: sessionIds.timeCap,
          reason: "60-minute cap"
        })
      )
    ).resolves.toMatchObject({
      nextPath: `/practice/${sessionIds.timeCap}/report-generating`,
      sessionStatus: "ended",
      endedReason: "60-minute cap",
      reportStatus: "generating"
    });

    await expect(
      Effect.runPromise(
        orchestrator.endSessionForLearner({
          learnerId,
          sessionId: sessionIds.creditExhaustion,
          reason: "credit-exhaustion"
        })
      )
    ).resolves.toMatchObject({
      nextPath: `/practice/${sessionIds.creditExhaustion}/report-generating`,
      sessionStatus: "ended",
      endedReason: "credit-exhaustion",
      reportStatus: "generating"
    });

    await expect(
      Effect.runPromise(
        orchestrator.endSessionForLearner({
          learnerId,
          sessionId: sessionIds.voiceFailure,
          reason: "voice-failure"
        })
      )
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
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      }
    });

    const outcome = await Effect.runPromise(
      orchestrator.handleVoiceFailureForLearner({
        learnerId,
        sessionId: sessionIds.voiceFailure,
        recoverable: true
      })
    );

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
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      }
    });

    await expect(
      Effect.runPromise(
        orchestrator.handleVoiceFailureForLearner({
          learnerId,
          sessionId: sessionIds.voiceFailure,
          recoverable: false
        })
      )
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
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      }
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion,
        reason: "natural-conclusion"
      })
    );

    await expect(
      Effect.runPromise(
        orchestrator.runReportGeneratingFlowForLearner({
          learnerId,
          sessionId: sessionIds.naturalConclusion
        })
      )
    ).resolves.toEqual({
      reportStatus: "ready",
      nextPath: `/practice/${sessionIds.naturalConclusion}/report`
    });
  });

  it("skips report generation for user-quit Sessions and routes to Practice Dashboard", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    let generationCount = 0;
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          generationCount += 1;
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      }
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.userQuit,
        reason: "user-quit"
      })
    );

    await expect(
      Effect.runPromise(
        orchestrator.runReportGeneratingFlowForLearner({
          learnerId,
          sessionId: sessionIds.userQuit
        })
      )
    ).resolves.toEqual({
      reportStatus: "insufficient-evidence",
      nextPath: "/dashboard"
    });

    expect(generationCount).toBe(0);
  });

  it("skips report generation for active Voice Conversation Sessions and preserves route path", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    let generationCount = 0;
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          generationCount += 1;
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      }
    });

    await expect(
      Effect.runPromise(
        orchestrator.runReportGeneratingFlowForLearner({
          learnerId,
          sessionId: sessionIds.voiceFailure
        })
      )
    ).resolves.toEqual({
      reportStatus: "insufficient-evidence",
      nextPath: `/practice/${sessionIds.voiceFailure}`
    });

    expect(generationCount).toBe(0);
  });

  it("persists structured report artifacts when report output is ready", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed({
            status: "ready",
            report: {
              outcome: {
                summary: "Session ended with reason: natural-conclusion."
              },
              missedSignals: [],
              badQuestions: [],
              strongQuestions: [],
              trapResults: [],
              skillMovement: [],
              nextPracticeFocus: {
                title: "Ask behavior-first follow-ups",
                description:
                  "After any social signal, ask about past actions before discussing solutions."
              },
              sourceContext: "Broad Practice Pool",
              lightPersonaLabel: "Finance operator",
              expandableEvidence: []
            },
            transcript: [
              {
                sequence: 1,
                turnId: "turn-1",
                speaker: "learner",
                text: "What did you try recently?"
              }
            ],
            evaluation: {
              interviewBehavior: {
                avoidingPitching: {
                  outcome: "missed",
                  note: "Pitch-first opener detected.",
                  evidence: []
                },
                askingConcreteHistory: {
                  outcome: "met",
                  note: "Concrete history question detected.",
                  evidence: []
                },
                followingUpOnVagueAnswers: {
                  outcome: "met",
                  note: "Vague answer followed by concrete question.",
                  evidence: []
                },
                resistingCompliments: {
                  outcome: "met",
                  note: "Praise resisted with follow-up.",
                  evidence: []
                },
                identifyingBadFitPersonas: {
                  outcome: "partial",
                  note: "Not central in this fit context.",
                  evidence: []
                },
                uncoveringWorkaroundsOrDecisionProcess: {
                  outcome: "met",
                  note: "Workaround discovery detected.",
                  evidence: []
                }
              },
              learningSignal: {
                quality: "medium",
                summary: "Useful discovery evidence appeared.",
                evidence: []
              },
              trapResults: [
                {
                  trapId: "trap-1",
                  trapLabel: "Compliment Trap",
                  outcome: "partial",
                  detail: "Learner partially recovered from praise bait.",
                  evidence: []
                }
              ],
              excludedDimensions: {
                accent: "not-scored",
                charisma: "not-scored",
                vocalPolish: "not-scored",
                soundingConfident: "not-scored"
              }
            }
          });
        }
      }
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion,
        reason: "natural-conclusion"
      })
    );

    await Effect.runPromise(
      orchestrator.runReportGeneratingFlowForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion
      })
    );

    const persisted = await Effect.runPromise(
      repository.getForLearner(learnerId, sessionIds.naturalConclusion)
    );

    expect(persisted?.sessionReport?.outcome.summary).toBe(
      "Session ended with reason: natural-conclusion."
    );
    expect(persisted?.sessionTranscript).toEqual([
      {
        sequence: 1,
        turnId: "turn-1",
        speaker: "learner",
        text: "What did you try recently?"
      }
    ]);
    expect(persisted?.sessionEvaluation?.trapResults[0]?.outcome).toBe("partial");
  });

  it("routes report-generating flow to Practice Dashboard when evidence is insufficient", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed({
            status: "insufficient-evidence",
            reason: "invalid-judge-output"
          });
        }
      }
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.creditExhaustion,
        reason: "credit-exhaustion"
      })
    );

    await expect(
      Effect.runPromise(
        orchestrator.runReportGeneratingFlowForLearner({
          learnerId,
          sessionId: sessionIds.creditExhaustion
        })
      )
    ).resolves.toEqual({
      reportStatus: "insufficient-evidence",
      nextPath: "/dashboard"
    });
  });

  it("does not clobber an already-ready report when report-generating route is revisited", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    let generationCount = 0;
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          generationCount += 1;
          if (generationCount === 1) {
            return Effect.succeed(makeReadyReportGenerationResult());
          }
          return Effect.succeed({
            status: "insufficient-evidence",
            reason: "provider-failure"
          });
        }
      }
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion,
        reason: "natural-conclusion"
      })
    );

    await expect(
      Effect.runPromise(
        orchestrator.runReportGeneratingFlowForLearner({
          learnerId,
          sessionId: sessionIds.naturalConclusion
        })
      )
    ).resolves.toEqual({
      reportStatus: "ready",
      nextPath: `/practice/${sessionIds.naturalConclusion}/report`
    });

    await expect(
      Effect.runPromise(
        orchestrator.runReportGeneratingFlowForLearner({
          learnerId,
          sessionId: sessionIds.naturalConclusion
        })
      )
    ).resolves.toEqual({
      reportStatus: "ready",
      nextPath: `/practice/${sessionIds.naturalConclusion}/report`
    });

    const persisted = await Effect.runPromise(
      repository.getForLearner(learnerId, sessionIds.naturalConclusion)
    );

    expect(generationCount).toBe(1);
    expect(persisted?.sessionLifecycle.reportStatus).toBe("ready");
    expect(persisted?.sessionReport).not.toBeNull();
    expect(persisted?.sessionTranscript).not.toBeNull();
    expect(persisted?.sessionEvaluation).not.toBeNull();
  });

  it("fails with SessionCaseNotFoundError when report-generating is requested for a missing Session", async () => {
    const repository = createInMemoryGeneratedSessionCaseRepository();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      }
    });

    const result = await Effect.runPromise(
      orchestrator
        .runReportGeneratingFlowForLearner({
          learnerId,
          sessionId: "00000000-0000-4000-8000-000000000001"
        })
        .pipe(Effect.either)
    );

    expect(result._tag).toBe("Left");
    if (result._tag !== "Left") {
      throw new Error("Expected SessionCaseNotFoundError.");
    }
    expect(result.left).toBeInstanceOf(SessionCaseNotFoundError);
  });

  it("uses injected Effect clock dependency for deterministic lifecycle timestamps", async () => {
    const fixedEndedAt = new Date("2026-05-08T10:00:00.000Z");
    const fixedReportReadyAt = new Date("2026-05-08T10:30:00.000Z");
    const timestamps = [fixedEndedAt, fixedReportReadyAt];
    const now = () => Effect.succeed(timestamps.shift() ?? fixedReportReadyAt);
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      },
      now
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion,
        reason: "natural-conclusion"
      })
    );
    await Effect.runPromise(
      orchestrator.runReportGeneratingFlowForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion
      })
    );

    const persisted = await Effect.runPromise(
      repository.getForLearner(learnerId, sessionIds.naturalConclusion)
    );
    expect(persisted?.sessionLifecycle.endedAt?.toISOString()).toBe(
      "2026-05-08T10:00:00.000Z"
    );
    expect(persisted?.sessionLifecycle.reportReadyAt?.toISOString()).toBe(
      "2026-05-08T10:30:00.000Z"
    );
  });

  it("finalizes Credits when ending a paid Session with credit context", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const creditLedgerRepository = createInMemoryCreditLedgerRepository([
      { learnerId, freeTrialUsed: true, subscriptionCredits: 5, topUpCredits: 0 }
    ]);
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
        sessionId: sessionIds.naturalConclusion,
        reason: "natural-conclusion",
        creditFinalization: {
          sessionCreditContext: { kind: "paid", estimatedCredits: 3, availableCredits: 5 },
          actualDurationMinutes: 7,
          usableDurationMinutes: 7,
          creditLedgerRepository
        }
      })
    );

    expect(outcome.endedReason).toBe("natural-conclusion");
    expect(outcome.creditChargeResult).toEqual({
      kind: "charged",
      billed: {
        actualDurationMinutes: 7,
        billedDurationMinutes: 10,
        creditsCharged: 2
      }
    });

    const ledger = await Effect.runPromise(
      creditLedgerRepository.getOrInitializeForLearner(learnerId)
    );
    expect(ledger.subscriptionCredits).toBe(3);

    const persisted = await Effect.runPromise(
      repository.getForLearner(learnerId, sessionIds.naturalConclusion)
    );
    expect(persisted?.creditCharge).toEqual(outcome.creditChargeResult);
  });

  it("applies fair Voice Failure credit handling through the orchestrator", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const creditLedgerRepository = createInMemoryCreditLedgerRepository([
      { learnerId, freeTrialUsed: true, subscriptionCredits: 5, topUpCredits: 0 }
    ]);
    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      }
    });

    const outcome = await Effect.runPromise(
      orchestrator.handleVoiceFailureForLearner({
        learnerId,
        sessionId: sessionIds.voiceFailure,
        recoverable: false,
        creditFinalization: {
          sessionCreditContext: { kind: "paid", estimatedCredits: 3, availableCredits: 5 },
          actualDurationMinutes: 12,
          usableDurationMinutes: 8,
          creditLedgerRepository
        }
      })
    );

    expect(outcome.behavior).toBe("end-session");

    const ledger = await Effect.runPromise(
      creditLedgerRepository.getOrInitializeForLearner(learnerId)
    );
    expect(ledger.subscriptionCredits).toBe(3);
  });
});

describe("Session Orchestrator — Progression integration", () => {
  it("triggers progression update when report generation succeeds", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const progressionRepository = createInMemoryProgressionRepository();
    const progressionUpdater = createProgressionUpdater({ progressionRepository });
    const applyCompletedSessionSpy = vi.spyOn(progressionUpdater, "applyCompletedSession");

    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      },
      progressionUpdater
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion,
        reason: "natural-conclusion"
      })
    );

    await Effect.runPromise(
      orchestrator.runReportGeneratingFlowForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion
      })
    );

    expect(applyCompletedSessionSpy).toHaveBeenCalledTimes(1);
    expect(applyCompletedSessionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        learnerId,
        sessionId: sessionIds.naturalConclusion
      })
    );

    const progression = await Effect.runPromise(
      progressionRepository.getOrInitializeForLearner(learnerId)
    );
    expect(progression.completedSessionCount).toBe(1);
    expect(progression.achievementNodes).toContainEqual(
      expect.objectContaining({ id: "first-session" })
    );
  });

  it("does not trigger progression update when report evidence is insufficient", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const progressionRepository = createInMemoryProgressionRepository();
    const progressionUpdater = createProgressionUpdater({ progressionRepository });
    const applyCompletedSessionSpy = vi.spyOn(progressionUpdater, "applyCompletedSession");

    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed({
            status: "insufficient-evidence" as const,
            reason: "too-few-turns"
          });
        }
      },
      progressionUpdater
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion,
        reason: "natural-conclusion"
      })
    );

    await Effect.runPromise(
      orchestrator.runReportGeneratingFlowForLearner({
        learnerId,
        sessionId: sessionIds.naturalConclusion
      })
    );

    expect(applyCompletedSessionSpy).toHaveBeenCalledTimes(0);
  });

  it("does not trigger progression update for user-quit sessions", async () => {
    const { repository, sessionIds } = await createRepositoryWithEndedSessionFixtures();
    const progressionRepository = createInMemoryProgressionRepository();
    const progressionUpdater = createProgressionUpdater({ progressionRepository });
    const applyCompletedSessionSpy = vi.spyOn(progressionUpdater, "applyCompletedSession");

    const orchestrator = createSessionOrchestrator({
      generatedSessionCaseRepository: repository,
      reportGenerationCoordinator: {
        generateForEndedSession() {
          return Effect.succeed(makeReadyReportGenerationResult());
        }
      },
      progressionUpdater
    });

    await Effect.runPromise(
      orchestrator.endSessionForLearner({
        learnerId,
        sessionId: sessionIds.userQuit,
        reason: "user-quit"
      })
    );

    await Effect.runPromise(
      orchestrator.runReportGeneratingFlowForLearner({
        learnerId,
        sessionId: sessionIds.userQuit
      })
    );

    expect(applyCompletedSessionSpy).toHaveBeenCalledTimes(0);
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
  return Effect.runPromise(
    repository.create(learnerId, {
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
    })
  );
}

function makeReadyReportGenerationResult() {
  return {
    status: "ready" as const,
    report: {
      outcome: {
        summary: "Session ended with reason: natural-conclusion."
      },
      missedSignals: [],
      badQuestions: [],
      strongQuestions: [],
      trapResults: [],
      skillMovement: [],
      nextPracticeFocus: {
        title: "Ask behavior-first follow-ups",
        description:
          "After social signals, ask about past behavior before solutions."
      },
      sourceContext: "Broad Practice Pool",
      lightPersonaLabel: "Finance operator",
      expandableEvidence: []
    },
    transcript: [
      {
        sequence: 1,
        speaker: "learner" as const,
        text: "What did you try recently?"
      }
    ],
    evaluation: {
      interviewBehavior: {
        avoidingPitching: {
          outcome: "missed" as const,
          note: "Pitch-first opener detected.",
          evidence: []
        },
        askingConcreteHistory: {
          outcome: "met" as const,
          note: "Concrete history question detected.",
          evidence: []
        },
        followingUpOnVagueAnswers: {
          outcome: "met" as const,
          note: "Vague answer followed by concrete question.",
          evidence: []
        },
        resistingCompliments: {
          outcome: "met" as const,
          note: "Praise resisted with follow-up.",
          evidence: []
        },
        identifyingBadFitPersonas: {
          outcome: "partial" as const,
          note: "Not central in this fit context.",
          evidence: []
        },
        uncoveringWorkaroundsOrDecisionProcess: {
          outcome: "met" as const,
          note: "Workaround discovery detected.",
          evidence: []
        }
      },
      learningSignal: {
        quality: "medium" as const,
        summary: "Useful discovery evidence appeared.",
        evidence: []
      },
      trapResults: [
        {
          trapId: "trap-1",
          trapLabel: "Compliment Trap",
          outcome: "partial" as const,
          detail: "Learner partially recovered from praise bait.",
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
