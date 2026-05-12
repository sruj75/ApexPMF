import { describe, expect, it } from "vitest";
import { createProgressionUpdater } from "../src/application/update-progression/progression-updater";
import { createInMemoryProgressionRepository } from "../src/domain/progression/progression-repository";
import { GLOBAL_RANKING_REQUIRED_SESSIONS } from "../src/domain/progression/progression";
import type { SessionReport } from "../src/domain/session/session-report";
import { Effect } from "effect";

const learnerId = "learner-1";

function makeSessionReport(
  overrides?: Partial<SessionReport>
): SessionReport {
  return {
    outcome: { summary: "Session completed." },
    missedSignals: [],
    badQuestions: [],
    strongQuestions: [],
    trapResults: [],
    skillMovement: [
      { skill: "Asking Concrete History", movement: "up", rationale: "Good" }
    ],
    nextPracticeFocus: { title: "Next focus", description: "Description" },
    sourceContext: "Broad Practice Pool",
    lightPersonaLabel: "Finance operator",
    expandableEvidence: [],
    ...overrides
  };
}

describe("ProgressionUpdater", () => {
  it("unlocks first-session achievement on first completed session report", async () => {
    const progressionRepository = createInMemoryProgressionRepository();
    const updater = createProgressionUpdater({ progressionRepository });

    await Effect.runPromise(
      updater.applyCompletedSession({
        learnerId,
        sessionId: "session-1",
        sessionReport: makeSessionReport(),
        completedAt: new Date("2026-05-13T10:00:00Z")
      })
    );

    const progression = await Effect.runPromise(
      progressionRepository.getOrInitializeForLearner(learnerId)
    );

    expect(progression.completedSessionCount).toBe(1);
    expect(progression.achievementNodes).toHaveLength(1);
    expect(progression.achievementNodes[0]).toMatchObject({
      id: "first-session",
      sessionId: "session-1"
    });
    expect(progression.progressionScore).toBeGreaterThan(0);
  });

  it("keeps global ranking in insufficient-data state after first session", async () => {
    const progressionRepository = createInMemoryProgressionRepository();
    const updater = createProgressionUpdater({ progressionRepository });

    const result = await Effect.runPromise(
      updater.applyCompletedSession({
        learnerId,
        sessionId: "session-1",
        sessionReport: makeSessionReport(),
        completedAt: new Date("2026-05-13T10:00:00Z")
      })
    );

    expect(result.globalRankingState).toEqual({
      kind: "insufficient-data",
      completedSessions: 1,
      requiredSessions: GLOBAL_RANKING_REQUIRED_SESSIONS
    });
  });
});
