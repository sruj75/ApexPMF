import { describe, expect, it, vi } from "vitest";
import { createSupabaseGeneratedSessionCaseRepository } from "../src/infrastructure/supabase/generated-session-cases";
import { Effect } from "effect";

describe("Generated Session Case Supabase mapping", () => {
  it("preserves broad-practice-pool label from source_snapshot on readback", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        source_kind: "broad-practice-pool",
        source_profile_id: null,
        source_snapshot: {
          label: "Custom Broad Pool Label"
        }
      }
    });

    const sessionCase = await repository.getForLearner(
      "learner-1",
      "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
    );

    expect(sessionCase?.sessionSource).toEqual({
      kind: "broad-practice-pool",
      label: "Custom Broad Pool Label"
    });
    expect(sessionCase?.personaBehavior).toEqual({
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
    });
  });

  it("falls back to default broad-practice-pool label when source_snapshot label is invalid", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        source_kind: "broad-practice-pool",
        source_profile_id: null,
        source_snapshot: {
          label: 123
        }
      }
    });

    const sessionCase = await repository.getForLearner(
      "learner-1",
      "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
    );

    expect(sessionCase?.sessionSource).toEqual({
      kind: "broad-practice-pool",
      label: "Broad Practice Pool"
    });
  });

  it("decodes legacy rows with null credit_context as Free Trial Sessions", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        credit_context: null
      }
    });

    const sessionCase = await repository.getForLearner(
      "learner-1",
      "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
    );

    expect(sessionCase?.creditContext).toEqual({
      kind: "free-trial",
      maxDurationMinutes: 15
    });
  });

  it("throws typed decode errors when nested JSON shape is invalid", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        traps: "not-an-array"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toMatchObject({
      _tag: "GeneratedSessionCaseRepositoryDecodeError",
      operation: "getForLearner"
    });
  });

  it("throws typed decode errors when persona_behavior is invalid", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        persona_behavior: "not-an-object"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toMatchObject({
      _tag: "GeneratedSessionCaseRepositoryDecodeError"
    });
  });

  it("throws typed decode errors when required row fields are invalid", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        created_at: "not-a-date"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toMatchObject({
      _tag: "GeneratedSessionCaseRepositoryDecodeError"
    });
  });

  it("throws typed decode errors when session lifecycle status is invalid", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        session_status: "invalid-status"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toMatchObject({
      _tag: "GeneratedSessionCaseRepositoryDecodeError"
    });
  });

  it("throws typed decode errors when ended reason is invalid", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        session_status: "ended",
        ended_reason: "not-a-real-reason"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toMatchObject({
      _tag: "GeneratedSessionCaseRepositoryDecodeError"
    });
  });

  it("throws typed decode errors when session_report payload is malformed", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        session_report: "not-a-report"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toMatchObject({
      _tag: "GeneratedSessionCaseRepositoryDecodeError"
    });
  });

  it("throws typed decode errors when session_transcript payload is malformed", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        session_transcript: "not-a-transcript"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toMatchObject({
      _tag: "GeneratedSessionCaseRepositoryDecodeError"
    });
  });

  it("throws typed decode errors when session_evaluation payload is malformed", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        session_evaluation: "not-an-evaluation"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toMatchObject({
      _tag: "GeneratedSessionCaseRepositoryDecodeError"
    });
  });

  it("accepts null evidence fields in persisted evaluation artifacts", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        session_status: "ended",
        ended_reason: "natural-conclusion",
        ended_at: "2026-05-08T09:00:00.000Z",
        report_status: "ready",
        report_ready_at: "2026-05-08T09:30:00.000Z",
        session_report: {
          outcome: {
            summary: "Session ended with reason: natural-conclusion."
          },
          missedSignals: [],
          badQuestions: [],
          strongQuestions: [],
          trapResults: [
            {
              trapLabel: "Compliment Trap",
              outcome: "partial",
              detail: "Learner partially recovered from praise bait.",
              evidence: [
                {
                  sequence: 2,
                  turnId: null,
                  snippet: null,
                  title: "Trap response",
                  detail: "Evidence with null optional fields."
                }
              ]
            }
          ],
          skillMovement: [],
          nextPracticeFocus: {
            title: "Ask behavior-first follow-ups",
            description:
              "After social signals, ask about past behavior before solutions."
          },
          sourceContext: "Broad Practice Pool",
          lightPersonaLabel: "Finance operator",
          expandableEvidence: [
            {
              sequence: 2,
              turnId: null,
              snippet: null,
              title: "Expandable evidence",
              detail: "Evidence with null optional fields."
            }
          ]
        },
        session_transcript: [
          {
            sequence: 1,
            speaker: "learner",
            text: "What did you try recently?"
          },
          {
            sequence: 2,
            speaker: "persona",
            text: "We tried a paid consultant last quarter."
          }
        ],
        session_evaluation: {
          interviewBehavior: {
            avoidingPitching: {
              outcome: "missed",
              note: "Pitch-first opener detected.",
              evidence: [
                {
                  sequence: 1,
                  turnId: null,
                  snippet: null,
                  title: "Pitch turn",
                  detail: "Pitch language present."
                }
              ]
            },
            askingConcreteHistory: {
              outcome: "met",
              note: "Concrete history detected.",
              evidence: [
                {
                  sequence: 2,
                  turnId: null,
                  snippet: null,
                  title: "History turn",
                  detail: "Specific attempt described."
                }
              ]
            },
            followingUpOnVagueAnswers: {
              outcome: "partial",
              note: "Follow-up was delayed.",
              evidence: []
            },
            resistingCompliments: {
              outcome: "partial",
              note: "Mixed response to praise.",
              evidence: []
            },
            identifyingBadFitPersonas: {
              outcome: "partial",
              note: "Not central in this fit context.",
              evidence: []
            },
            uncoveringWorkaroundsOrDecisionProcess: {
              outcome: "met",
              note: "Workaround/decision probe detected.",
              evidence: [
                {
                  sequence: 2,
                  turnId: null,
                  snippet: null,
                  title: "Workaround turn",
                  detail: "Decision process surfaced."
                }
              ]
            }
          },
          learningSignal: {
            quality: "medium",
            summary: "Useful discovery evidence appeared.",
            evidence: [
              {
                sequence: 2,
                turnId: null,
                snippet: null,
                title: "Learning evidence",
                detail: "Concrete evidence present."
              }
            ]
          },
          trapResults: [
            {
              trapId: "trap-1",
              trapLabel: "Compliment Trap",
              outcome: "partial",
              detail: "Learner partially recovered from praise bait.",
              evidence: [
                {
                  sequence: 2,
                  turnId: null,
                  snippet: null,
                  title: "Trap evidence",
                  detail: "Recovered after trap."
                }
              ]
            }
          ],
          excludedDimensions: {
            accent: "not-scored",
            charisma: "not-scored",
            vocalPolish: "not-scored",
            soundingConfident: "not-scored"
          }
        }
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).resolves.toMatchObject({
      sessionLifecycle: {
        reportStatus: "ready"
      }
    });
  });

  it("maps Supabase query errors into typed persistence errors", async () => {
    const repository = createRepositoryForGetForLearner({
      data: null,
      error: {
        message: "database is unavailable"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toMatchObject({
      _tag: "GeneratedSessionCaseRepositoryPersistenceError"
    });
  });

  it("encodes lifecycle status updates with persisted session/report fields", async () => {
    const { repository, update } = createRepositoryForLifecycleUpdate({
      existing: validGeneratedSessionCaseRow
    });

    await repository.updateSessionLifecycleForLearner({
      learnerId: "learner-1",
      sessionCaseId: "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec",
      updater: (current) => ({
        ...current,
        sessionStatus: "ended",
        endedReason: "60-minute cap",
        endedAt: new Date("2026-05-08T09:00:00.000Z"),
        reportStatus: "generating",
        reportReadyAt: null
      })
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        session_status: "ended",
        ended_reason: "60-minute cap",
        ended_at: "2026-05-08T09:00:00.000Z",
        report_status: "generating",
        report_ready_at: null
      })
    );
  });

  it("encodes report artifacts update with JSON report and transcript payloads", async () => {
    const { repository, update } = createRepositoryForReportArtifactsUpdate();

    await repository.updateReportArtifactsForLearner({
      learnerId: "learner-1",
      sessionCaseId: "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec",
      reportStatus: "ready",
      reportReadyAt: new Date("2026-05-08T09:30:00.000Z"),
      sessionReport: {
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
      sessionTranscript: [
        {
          sequence: 1,
          speaker: "learner",
          text: "What did you try recently?"
        }
      ],
      sessionEvaluation: {
        interviewBehavior: {
          avoidingPitching: {
            outcome: "missed",
            note: "Pitch-first opener detected.",
            evidence: []
          },
          askingConcreteHistory: {
            outcome: "met",
            note: "Concrete history detected.",
            evidence: []
          },
          followingUpOnVagueAnswers: {
            outcome: "met",
            note: "Concrete follow-up after vague answer.",
            evidence: []
          },
          resistingCompliments: {
            outcome: "met",
            note: "Compliment resisted with follow-up.",
            evidence: []
          },
          identifyingBadFitPersonas: {
            outcome: "partial",
            note: "Not central in this fit context.",
            evidence: []
          },
          uncoveringWorkaroundsOrDecisionProcess: {
            outcome: "met",
            note: "Workaround/decision probe detected.",
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

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        report_status: "ready",
        report_ready_at: "2026-05-08T09:30:00.000Z",
        session_report: expect.objectContaining({
          outcome: {
            summary: "Session ended with reason: natural-conclusion."
          }
        }),
        session_transcript: [
          {
            sequence: 1,
            speaker: "learner",
            text: "What did you try recently?"
          }
        ],
        session_evaluation: expect.objectContaining({
          learningSignal: expect.objectContaining({
            quality: "medium"
          })
        })
      })
    );
  });
});

function createRepositoryForGetForLearner(input: {
  data: unknown;
  error?: { message: string } | null;
}) {
  const maybeSingle = vi.fn(async () => ({
    data: input.data,
    error: input.error ?? null
  }));

  const queryBuilder = {
    select: vi.fn(() => queryBuilder),
    eq: vi.fn(() => queryBuilder),
    maybeSingle
  };

  const supabase = {
    from: vi.fn(() => queryBuilder)
  };

  return toPromiseRepository(
    createSupabaseGeneratedSessionCaseRepository(supabase as never)
  );
}

function createRepositoryForLifecycleUpdate(input: { existing: unknown }) {
  const maybeSingle = vi.fn(async () => ({
    data: input.existing,
    error: null
  }));
  const updateSingle = vi.fn(async () => ({
    data: {
      ...validGeneratedSessionCaseRow,
      session_status: "ended",
      ended_reason: "60-minute cap",
      ended_at: "2026-05-08T09:00:00.000Z",
      report_status: "generating",
      report_ready_at: null
    },
    error: null
  }));

  const update = vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: updateSingle
        }))
      }))
    }))
  }));

  const queryBuilder = {
    select: vi.fn(() => queryBuilder),
    eq: vi.fn(() => queryBuilder),
    maybeSingle
  };

  const supabase = {
    from: vi.fn(() => ({
      ...queryBuilder,
      update
    }))
  };

  return {
    repository: toPromiseRepository(
      createSupabaseGeneratedSessionCaseRepository(supabase as never)
    ),
    update
  };
}

function createRepositoryForReportArtifactsUpdate() {
  const updateMaybeSingle = vi.fn(async () => ({
    data: {
      ...validGeneratedSessionCaseRow,
      report_status: "ready",
      report_ready_at: "2026-05-08T09:30:00.000Z",
      session_report: {
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
      session_transcript: [
        {
          sequence: 1,
          speaker: "learner",
          text: "What did you try recently?"
        }
      ],
      session_evaluation: {
        interviewBehavior: {
          avoidingPitching: {
            outcome: "missed",
            note: "Pitch-first opener detected.",
            evidence: []
          },
          askingConcreteHistory: {
            outcome: "met",
            note: "Concrete history detected.",
            evidence: []
          },
          followingUpOnVagueAnswers: {
            outcome: "met",
            note: "Concrete follow-up after vague answer.",
            evidence: []
          },
          resistingCompliments: {
            outcome: "met",
            note: "Compliment resisted with follow-up.",
            evidence: []
          },
          identifyingBadFitPersonas: {
            outcome: "partial",
            note: "Not central in this fit context.",
            evidence: []
          },
          uncoveringWorkaroundsOrDecisionProcess: {
            outcome: "met",
            note: "Workaround/decision probe detected.",
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
    },
    error: null
  }));

  const update = vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          maybeSingle: updateMaybeSingle
        }))
      }))
    }))
  }));

  const queryBuilder = {
    select: vi.fn(() => queryBuilder),
    eq: vi.fn(() => queryBuilder),
    maybeSingle: vi.fn(async () => ({
      data: validGeneratedSessionCaseRow,
      error: null
    }))
  };

  const supabase = {
    from: vi.fn(() => ({
      ...queryBuilder,
      update
    }))
  };

  return {
    repository: toPromiseRepository(
      createSupabaseGeneratedSessionCaseRepository(supabase as never)
    ),
    update
  };
}

function toPromiseRepository(
  repository: ReturnType<typeof createSupabaseGeneratedSessionCaseRepository>
) {
  return {
    create: (
      learnerId: Parameters<typeof repository.create>[0],
      input: Parameters<typeof repository.create>[1]
    ) => runEffectOrThrow(repository.create(learnerId, input)),
    getForLearner: (
      learnerId: Parameters<typeof repository.getForLearner>[0],
      sessionCaseId: Parameters<typeof repository.getForLearner>[1]
    ) => runEffectOrThrow(repository.getForLearner(learnerId, sessionCaseId)),
    updateSessionLifecycleForLearner: (
      input: Parameters<typeof repository.updateSessionLifecycleForLearner>[0]
    ) => runEffectOrThrow(repository.updateSessionLifecycleForLearner(input)),
    updateReportArtifactsForLearner: (
      input: Parameters<typeof repository.updateReportArtifactsForLearner>[0]
    ) => runEffectOrThrow(repository.updateReportArtifactsForLearner(input))
  };
}

async function runEffectOrThrow<Success, Error>(
  effect: Effect.Effect<Success, Error, never>
): Promise<Success> {
  const result = await Effect.runPromise(Effect.either(effect));
  if (result._tag === "Left") {
    throw result.left;
  }
  return result.right;
}

const validGeneratedSessionCaseRow = {
  id: "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec",
  learner_id: "learner-1",
  source_kind: "active-ideal-customer-profile",
  source_profile_id: "profile-1",
  source_snapshot: {
    id: "profile-1",
    name: "Finance operators",
    customerDescription: "Controllers at growth SaaS companies",
    notes: null
  },
  opening_context: "Opening context",
  light_persona_label: "Finance operator",
  customer_persona: {
    lightPersonaLabel: "Finance operator",
    interviewRole: "Controller",
    publicContext: "Owns reporting",
    privateConstraints: ["Budget owner is VP Finance"]
  },
  hidden_backstory: "Hidden backstory",
  customer_fit: "strong-fit",
  hidden_test_plan: {
    focusAreas: ["Concrete History"],
    successSignals: ["Asked about recent attempts"],
    failureSignals: ["Pitched before diagnosis"]
  },
  persona_behavior: {
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
  generation_nonce: "nonce-1",
  generation_audit: {
    provider: "test",
    model: "test-model"
  },
  created_at: "2026-05-05T00:00:00.000Z",
  session_status: "voice-conversation",
  ended_reason: null,
  ended_at: null,
  report_status: "not-requested",
  report_ready_at: null,
  session_report: null,
  session_transcript: null,
  session_evaluation: null,
  credit_context: {
    kind: "free-trial",
    maxDurationMinutes: 15
  },
  credit_charge: null
};
