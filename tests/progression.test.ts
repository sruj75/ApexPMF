import { describe, expect, it } from "vitest";
import {
  computeProgressionContribution,
  applySessionReportToProgression,
  resolveGlobalRankingState,
  GLOBAL_RANKING_REQUIRED_SESSIONS,
  type SessionReport,
  type LearnerProgression
} from "../src/domain/progression/progression";

function makeSessionReport(
  overrides?: Partial<SessionReport>
): SessionReport {
  return {
    outcome: { summary: "Session completed." },
    missedSignals: [],
    badQuestions: [],
    strongQuestions: [],
    trapResults: [],
    skillMovement: [],
    nextPracticeFocus: { title: "Next focus", description: "Description" },
    sourceContext: "Broad Practice Pool",
    lightPersonaLabel: "Finance operator",
    expandableEvidence: [],
    ...overrides
  };
}

describe("Progression — computeProgressionContribution", () => {
  it("produces a meaningful contribution for a report with skill-up movements", () => {
    const report = makeSessionReport({
      skillMovement: [
        { skill: "Asking Concrete History", movement: "up", rationale: "Good" },
        { skill: "Resisting Compliments", movement: "up", rationale: "Good" }
      ]
    });

    const contribution = computeProgressionContribution(report);

    expect(contribution).toBeGreaterThan(0);
    expect(contribution).toBeGreaterThan(5);
  });

  it("produces a small but positive contribution for all-flat movements", () => {
    const report = makeSessionReport({
      skillMovement: [
        { skill: "Asking Concrete History", movement: "flat", rationale: "No change" },
        { skill: "Resisting Compliments", movement: "flat", rationale: "No change" }
      ]
    });

    const contribution = computeProgressionContribution(report);

    expect(contribution).toBeGreaterThan(0);
  });

  it("produces less contribution for skill-down movements than skill-up", () => {
    const upReport = makeSessionReport({
      skillMovement: [
        { skill: "Asking Concrete History", movement: "up", rationale: "Good" },
        { skill: "Resisting Compliments", movement: "up", rationale: "Good" }
      ]
    });

    const downReport = makeSessionReport({
      skillMovement: [
        { skill: "Asking Concrete History", movement: "down", rationale: "Regressed" },
        { skill: "Resisting Compliments", movement: "down", rationale: "Regressed" }
      ]
    });

    const upContribution = computeProgressionContribution(upReport);
    const downContribution = computeProgressionContribution(downReport);

    expect(upContribution).toBeGreaterThan(downContribution);
  });
});

function makeFreshProgression(learnerId = "learner-1"): LearnerProgression {
  return {
    learnerId,
    completedSessionCount: 0,
    progressionScore: 0,
    achievementNodes: []
  };
}

describe("Progression — Achievement Node unlocking", () => {
  it("unlocks first-session achievement on the first completed session", () => {
    const current = makeFreshProgression();
    const report = makeSessionReport({
      skillMovement: [
        { skill: "Asking Concrete History", movement: "up", rationale: "Good" }
      ]
    });
    const now = new Date("2026-05-13T10:00:00Z");

    const update = applySessionReportToProgression(
      current,
      report,
      "session-1",
      now
    );

    expect(update.unlockedAchievements).toContainEqual(
      expect.objectContaining({ id: "first-session", sessionId: "session-1", unlockedAt: now })
    );
  });

  it("does not re-unlock first-session on the second completed session", () => {
    const current: LearnerProgression = {
      learnerId: "learner-1",
      completedSessionCount: 1,
      progressionScore: 12,
      achievementNodes: [
        { id: "first-session", sessionId: "session-1", unlockedAt: new Date("2026-05-12T10:00:00Z") }
      ]
    };
    const report = makeSessionReport({
      skillMovement: [
        { skill: "Asking Concrete History", movement: "up", rationale: "Good" }
      ]
    });

    const update = applySessionReportToProgression(
      current,
      report,
      "session-2",
      new Date("2026-05-13T10:00:00Z")
    );

    const firstSessionNodes = update.unlockedAchievements.filter(a => a.id === "first-session");
    expect(firstSessionNodes).toHaveLength(0);
  });

  it("records sessionId and unlockedAt on the achievement node", () => {
    const current = makeFreshProgression();
    const report = makeSessionReport();
    const completedAt = new Date("2026-05-13T14:30:00Z");

    const update = applySessionReportToProgression(
      current,
      report,
      "session-abc",
      completedAt
    );

    const firstSession = update.unlockedAchievements.find(a => a.id === "first-session");
    expect(firstSession).toBeDefined();
    expect(firstSession!.sessionId).toBe("session-abc");
    expect(firstSession!.unlockedAt).toEqual(completedAt);
  });
});

describe("Progression — Global Ranking gating", () => {
  it("shows insufficient-data after one completed session", () => {
    const state = resolveGlobalRankingState(1, 12);

    expect(state).toEqual({
      kind: "insufficient-data",
      completedSessions: 1,
      requiredSessions: GLOBAL_RANKING_REQUIRED_SESSIONS
    });
  });

  it("shows insufficient-data after two completed sessions", () => {
    const state = resolveGlobalRankingState(2, 24);

    expect(state).toEqual({
      kind: "insufficient-data",
      completedSessions: 2,
      requiredSessions: GLOBAL_RANKING_REQUIRED_SESSIONS
    });
  });

  it("transitions to ranked after enough completed sessions", () => {
    const state = resolveGlobalRankingState(3, 30);

    expect(state.kind).toBe("ranked");
    if (state.kind === "ranked") {
      expect(["top-10", "top-25", "top-50", "bottom-50"]).toContain(state.percentileBand);
    }
  });
});
