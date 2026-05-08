import { describe, expect, it, vi } from "vitest";
import PracticeSessionPage from "../app/practice/[sessionId]/page";

const {
  redirect,
  notFound,
  getLearnerEntryContext,
  SessionStartView
} = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  getLearnerEntryContext: vi.fn(),
  SessionStartView: vi.fn(() => null)
}));

vi.mock("next/navigation", () => ({
  redirect,
  notFound
}));

vi.mock("@/src/application/start-session/practice-entry-seam", () => ({
  getLearnerEntryContext
}));

vi.mock("../app/practice/[sessionId]/session-start-view", () => ({
  SessionStartView
}));

describe("Practice session page lifecycle routing", () => {
  it("routes ended non-quit sessions to Report Generating State", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1",
      idealCustomerProfileRepository: {},
      generatedSessionCaseRepository: {
        getForLearner: vi.fn(async () => ({
          id: "123e4567-e89b-12d3-a456-426614174000",
          learnerId: "learner-1",
          sessionSource: {
            kind: "broad-practice-pool",
            label: "Broad Practice Pool"
          },
          generationNonce: "nonce-1",
          createdAt: new Date(),
          openingContext: "Opening context",
          customerPersona: {
            lightPersonaLabel: "Finance operator",
            interviewRole: "Controller",
            publicContext: "Owns reporting",
            privateConstraints: ["Budget owner is VP Finance"]
          },
          hiddenBackstory: "Hidden",
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
          generationAudit: {
            provider: "test",
            model: "test-model"
          },
          sessionLifecycle: {
            sessionStatus: "ended",
            endedReason: "credit-exhaustion",
            endedAt: new Date("2026-05-08T10:00:00.000Z"),
            reportStatus: "generating",
            reportReadyAt: null
          }
        }))
      }
    });

    await expect(
      PracticeSessionPage({
        params: Promise.resolve({
          sessionId: "123e4567-e89b-12d3-a456-426614174000"
        })
      })
    ).rejects.toThrow(
      "REDIRECT:/practice/123e4567-e89b-12d3-a456-426614174000/report-generating"
    );

    expect(SessionStartView).not.toHaveBeenCalled();
  });
});
