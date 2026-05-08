import { describe, expect, it, vi } from "vitest";
import { createSupabaseGeneratedSessionCaseRepository } from "../src/infrastructure/supabase/generated-session-cases";
import { SupabaseRowDecodeError } from "../src/infrastructure/supabase/supabase-row-decode-error";

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
      name: "SupabaseRowDecodeError",
      adapter: "generated_session_cases",
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
    ).rejects.toBeInstanceOf(SupabaseRowDecodeError);
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
    ).rejects.toBeInstanceOf(SupabaseRowDecodeError);
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
    ).rejects.toBeInstanceOf(SupabaseRowDecodeError);
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
    ).rejects.toBeInstanceOf(SupabaseRowDecodeError);
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
    ).rejects.toBeInstanceOf(SupabaseRowDecodeError);
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
    ).rejects.toBeInstanceOf(SupabaseRowDecodeError);
  });

  it("still throws Supabase query errors as plain Error", async () => {
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
    ).rejects.toThrow("database is unavailable");
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
        endedReason: "time-cap",
        endedAt: new Date("2026-05-08T09:00:00.000Z"),
        reportStatus: "generating",
        reportReadyAt: null
      })
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        session_status: "ended",
        ended_reason: "time-cap",
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
      ]
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
        ]
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

  return createSupabaseGeneratedSessionCaseRepository(supabase as never);
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
      ended_reason: "time-cap",
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
    repository: createSupabaseGeneratedSessionCaseRepository(supabase as never),
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
      ]
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
    repository: createSupabaseGeneratedSessionCaseRepository(supabase as never),
    update
  };
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
  session_transcript: null
};
