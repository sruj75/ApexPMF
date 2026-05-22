import { describe, expect, it } from "vitest";
import { getDashboardProgressionData } from "../src/application/dashboard/dashboard-page-data";
import { createInMemoryProgressionRepository } from "../src/domain/progression/progression-repository";
import { Effect } from "effect";

describe("Dashboard Page Data — progression", () => {
  it("returns progression view for a learner with no sessions", async () => {
    const progressionRepository = createInMemoryProgressionRepository();

    const result = await Effect.runPromise(
      getDashboardProgressionData({
        learnerId: "learner-1",
        progressionRepository
      })
    );

    expect(result.completedSessionCount).toBe(0);
    expect(result.progressionScore).toBe(0);
    expect(result.achievementPath[0]).toMatchObject({
      id: "first-session",
      unlocked: false
    });
    expect(result.globalRanking.kind).toBe("insufficient-data");
  });

  it("returns progression view with unlocked achievements for a returning learner", async () => {
    const progressionRepository = createInMemoryProgressionRepository([
      {
        learnerId: "learner-1",
        completedSessionCount: 1,
        progressionScore: 7,
        achievementNodes: [
          {
            id: "first-session",
            sessionId: "session-1",
            unlockedAt: new Date("2026-05-13T10:00:00Z")
          }
        ]
      }
    ]);

    const result = await Effect.runPromise(
      getDashboardProgressionData({
        learnerId: "learner-1",
        progressionRepository
      })
    );

    expect(result.completedSessionCount).toBe(1);
    expect(result.achievementPath[0]).toMatchObject({
      id: "first-session",
      unlocked: true
    });
  });
});
