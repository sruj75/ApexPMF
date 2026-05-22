import { describe, expect, it } from "vitest";
import { presentProgressionForDashboard } from "../src/application/dashboard/progression-dashboard-presenter";
import type { LearnerProgression } from "../src/domain/progression/progression";

function makeFreshProgression(learnerId = "learner-1"): LearnerProgression {
  return {
    learnerId,
    completedSessionCount: 0,
    progressionScore: 0,
    achievementNodes: []
  };
}

describe("Progression Dashboard Presenter", () => {
  it("presents empty state for a fresh learner with no sessions", () => {
    const progression = makeFreshProgression();

    const view = presentProgressionForDashboard(progression);

    expect(view.completedSessionCount).toBe(0);
    expect(view.progressionScore).toBe(0);
    expect(view.achievementPath).toEqual([
      { id: "first-session", label: "First Session", unlocked: false }
    ]);
    expect(view.globalRanking).toEqual({
      kind: "insufficient-data",
      completedSessions: 0,
      requiredSessions: 3,
      label: "Insufficient Data"
    });
  });

  it("shows first-session unlocked after one completed session", () => {
    const completedAt = new Date("2026-05-13T10:00:00Z");
    const progression: LearnerProgression = {
      learnerId: "learner-1",
      completedSessionCount: 1,
      progressionScore: 7,
      achievementNodes: [
        { id: "first-session", sessionId: "session-1", unlockedAt: completedAt }
      ]
    };

    const view = presentProgressionForDashboard(progression);

    expect(view.completedSessionCount).toBe(1);
    expect(view.achievementPath).toEqual([
      {
        id: "first-session",
        label: "First Session",
        unlocked: true,
        unlockedAt: completedAt
      }
    ]);
    expect(view.globalRanking.kind).toBe("insufficient-data");
  });

  it("shows ranked percentile band after enough sessions with quality", () => {
    const progression: LearnerProgression = {
      learnerId: "learner-1",
      completedSessionCount: 3,
      progressionScore: 36,
      achievementNodes: [
        {
          id: "first-session",
          sessionId: "session-1",
          unlockedAt: new Date("2026-05-11T10:00:00Z")
        }
      ]
    };

    const view = presentProgressionForDashboard(progression);

    expect(view.globalRanking).toEqual({
      kind: "ranked",
      percentileBand: "top-10",
      label: "Top 10%"
    });
  });
});
