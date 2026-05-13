import { describe, expect, it } from "vitest";
import { createInMemoryProgressionRepository } from "../src/domain/progression/progression-repository";
import { Effect } from "effect";

const learnerId = "learner-1";

describe("Progression Repository — in-memory", () => {
  it("initializes fresh progression for unknown learner", async () => {
    const repository = createInMemoryProgressionRepository();

    const progression = await Effect.runPromise(
      repository.getOrInitializeForLearner(learnerId)
    );

    expect(progression).toEqual({
      learnerId,
      completedSessionCount: 0,
      progressionScore: 0,
      achievementNodes: []
    });
  });

  it("applies progression update and returns updated state", async () => {
    const repository = createInMemoryProgressionRepository();

    await Effect.runPromise(
      repository.getOrInitializeForLearner(learnerId)
    );

    const updated = await Effect.runPromise(
      repository.applyUpdate(learnerId, {
        scoreContribution: 12,
        newCompletedSessionCount: 1,
        newProgressionScore: 12,
        unlockedAchievements: [
          { id: "first-session", sessionId: "session-1", unlockedAt: new Date("2026-05-13T10:00:00Z") }
        ]
      })
    );

    expect(updated.completedSessionCount).toBe(1);
    expect(updated.progressionScore).toBe(12);
    expect(updated.achievementNodes).toHaveLength(1);
    expect(updated.achievementNodes[0].id).toBe("first-session");

    const readBack = await Effect.runPromise(
      repository.getOrInitializeForLearner(learnerId)
    );
    expect(readBack.completedSessionCount).toBe(1);
    expect(readBack.progressionScore).toBe(12);
  });
});
