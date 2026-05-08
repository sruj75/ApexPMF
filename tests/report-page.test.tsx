import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SessionReportPage from "../app/practice/[sessionId]/report/page";

const { redirect, notFound, getLearnerEntryContext } = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  getLearnerEntryContext: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect,
  notFound
}));

vi.mock("@/src/application/start-session/practice-entry-seam", () => ({
  getLearnerEntryContext
}));

describe("Session report page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders required report sections, source context, trap results, and inline transcript", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1",
      idealCustomerProfileRepository: {},
      generatedSessionCaseRepository: {
        getForLearner: vi.fn(async () => makeEndedReadySessionCase())
      }
    });

    render(
      await SessionReportPage({
        params: Promise.resolve({
          sessionId: "123e4567-e89b-12d3-a456-426614174000"
        })
      })
    );

    expect(screen.getByRole("heading", { name: /session report/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /outcome/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /missed signals/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /bad questions/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /strong questions/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /trap results/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /skill movement/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /next practice focus/i })).toBeVisible();

    expect(screen.getByText(/source context:/i)).toBeVisible();
    expect(screen.getByText(/broad practice pool/i)).toBeVisible();
    expect(screen.getByText(/persona label:/i)).toBeVisible();
    expect(screen.getByText(/finance operator/i)).toBeVisible();

    expect(screen.getByText(/compliment trap/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: /session transcript/i })).toBeVisible();
    expect(screen.getByText(/what did you try recently\?/i)).toBeVisible();

    expect(
      screen.queryByText(/the operator rebuilt reports manually after a failed automation handoff/i)
    ).not.toBeInTheDocument();
  });

  it("supports expand and collapse for evidence snippets without transcript deep links", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1",
      idealCustomerProfileRepository: {},
      generatedSessionCaseRepository: {
        getForLearner: vi.fn(async () => makeEndedReadySessionCase())
      }
    });

    render(
      await SessionReportPage({
        params: Promise.resolve({
          sessionId: "123e4567-e89b-12d3-a456-426614174000"
        })
      })
    );

    const toggle = screen.getByRole("button", {
      name: /show evidence: asked concrete history follow-up/i
    });

    expect(screen.queryByText(/turn 1:/i)).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByText(/turn 1:/i)).toBeVisible();

    fireEvent.click(toggle);
    expect(screen.queryByText(/turn 1:/i)).not.toBeInTheDocument();

    const transcriptLinks = screen.queryAllByRole("link", {
      name: /turn 1|transcript/i
    });
    expect(transcriptLinks.length).toBe(0);
  });
});

function makeEndedReadySessionCase() {
  return {
    id: "123e4567-e89b-12d3-a456-426614174000",
    learnerId: "learner-1",
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
    hiddenBackstory:
      "The operator rebuilt reports manually after a failed automation handoff.",
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
    generationNonce: "nonce-1",
    generationAudit: {
      provider: "test",
      model: "test-model"
    },
    createdAt: new Date("2026-05-08T08:00:00.000Z"),
    sessionLifecycle: {
      sessionStatus: "ended",
      endedReason: "natural-conclusion",
      endedAt: new Date("2026-05-08T09:00:00.000Z"),
      reportStatus: "ready",
      reportReadyAt: new Date("2026-05-08T09:01:00.000Z")
    },
    sessionReport: {
      outcome: {
        summary: "Session ended with reason: natural-conclusion."
      },
      missedSignals: [
        {
          title: "Polite praise treated as validation",
          detail: "Positive language was interpreted as buying intent.",
          evidence: [
            {
              sequence: 1,
              title: "Early social signal",
              detail: "The first turn invited speculation.",
              snippet: "Would this be useful for your team?"
            }
          ]
        }
      ],
      badQuestions: [
        {
          question: "Would this be useful for your team?",
          whyItMissed: "Allowed speculative sentiment.",
          evidence: []
        }
      ],
      strongQuestions: [
        {
          question: "What did you try in the last month?",
          whyItWorked: "Prompted concrete history.",
          evidence: []
        }
      ],
      trapResults: [
        {
          trapLabel: "Compliment Trap",
          outcome: "triggered",
          detail: "Learner accepted praise as validation.",
          evidence: []
        }
      ],
      skillMovement: [
        {
          skill: "Concrete History",
          movement: "flat",
          rationale: "Strong follow-up came late."
        }
      ],
      nextPracticeFocus: {
        title: "Ask behavior-first follow-ups",
        description: "Follow praise with a concrete history question."
      },
      sourceContext: "Broad Practice Pool",
      lightPersonaLabel: "Finance operator",
      expandableEvidence: [
        {
          sequence: 1,
          turnId: "turn-1",
          title: "Asked concrete history follow-up",
          detail:
            "Follow-up moved from speculation toward observable customer behavior.",
          snippet: "What did you try recently?"
        }
      ]
    },
    sessionTranscript: [
      {
        sequence: 1,
        turnId: "turn-1",
        speaker: "learner",
        text: "What did you try recently?"
      },
      {
        sequence: 2,
        turnId: "turn-2",
        speaker: "persona",
        text: "We paid a consultant and still rebuilt reports manually."
      }
    ]
  };
}
