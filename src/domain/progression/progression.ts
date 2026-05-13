export type { SessionReport } from "@/src/domain/session/session-report";
import type { SessionReport } from "@/src/domain/session/session-report";

const SKILL_UP_POINTS = 5;
const SKILL_FLAT_POINTS = 1;
const SKILL_DOWN_POINTS = -1;
const COMPLETED_SESSION_BASELINE = 2;

export const GLOBAL_RANKING_REQUIRED_SESSIONS = 3;

export type AchievementNodeId = "first-session";

export type AchievementNode = {
  id: AchievementNodeId;
  sessionId: string;
  unlockedAt: Date;
};

export type LearnerProgression = {
  learnerId: string;
  completedSessionCount: number;
  progressionScore: number;
  achievementNodes: AchievementNode[];
};

export type ProgressionUpdate = {
  scoreContribution: number;
  newCompletedSessionCount: number;
  newProgressionScore: number;
  unlockedAchievements: AchievementNode[];
};

export function computeProgressionContribution(
  report: SessionReport
): number {
  let score = COMPLETED_SESSION_BASELINE;

  for (const movement of report.skillMovement) {
    if (movement.movement === "up") {
      score += SKILL_UP_POINTS;
    } else if (movement.movement === "flat") {
      score += SKILL_FLAT_POINTS;
    } else {
      score += SKILL_DOWN_POINTS;
    }
  }

  return Math.max(1, score);
}

export function applySessionReportToProgression(
  current: LearnerProgression,
  report: SessionReport,
  sessionId: string,
  completedAt: Date
): ProgressionUpdate {
  const scoreContribution = computeProgressionContribution(report);
  const newCompletedSessionCount = current.completedSessionCount + 1;
  const newProgressionScore = current.progressionScore + scoreContribution;

  const unlockedAchievements = resolveAchievementUnlocks(
    current,
    newCompletedSessionCount,
    sessionId,
    completedAt
  );

  return {
    scoreContribution,
    newCompletedSessionCount,
    newProgressionScore,
    unlockedAchievements
  };
}

function resolveAchievementUnlocks(
  current: LearnerProgression,
  newCompletedSessionCount: number,
  sessionId: string,
  completedAt: Date
): AchievementNode[] {
  const unlocked: AchievementNode[] = [];
  const alreadyUnlocked = new Set(current.achievementNodes.map(a => a.id));

  if (newCompletedSessionCount >= 1 && !alreadyUnlocked.has("first-session")) {
    unlocked.push({ id: "first-session", sessionId, unlockedAt: completedAt });
  }

  return unlocked;
}

export type PercentileBand = "top-10" | "top-25" | "top-50" | "bottom-50";

export type GlobalRankingState =
  | { kind: "insufficient-data"; completedSessions: number; requiredSessions: number }
  | { kind: "ranked"; percentileBand: PercentileBand };

export function resolveGlobalRankingState(
  completedSessionCount: number,
  progressionScore: number
): GlobalRankingState {
  if (completedSessionCount < GLOBAL_RANKING_REQUIRED_SESSIONS) {
    return {
      kind: "insufficient-data",
      completedSessions: completedSessionCount,
      requiredSessions: GLOBAL_RANKING_REQUIRED_SESSIONS
    };
  }

  const avgScore = progressionScore / completedSessionCount;

  if (avgScore >= 10) return { kind: "ranked", percentileBand: "top-10" };
  if (avgScore >= 7) return { kind: "ranked", percentileBand: "top-25" };
  if (avgScore >= 4) return { kind: "ranked", percentileBand: "top-50" };
  return { kind: "ranked", percentileBand: "bottom-50" };
}
