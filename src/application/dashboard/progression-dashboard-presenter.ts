import {
  resolveGlobalRankingState,
  type LearnerProgression,
  type AchievementNodeId
} from "@/src/domain/progression/progression";

export type AchievementPathEntry = {
  id: AchievementNodeId;
  label: string;
  unlocked: boolean;
  unlockedAt?: Date;
};

export type DashboardRankingView =
  | {
      kind: "insufficient-data";
      completedSessions: number;
      requiredSessions: number;
      label: string;
    }
  | {
      kind: "ranked";
      percentileBand: string;
      label: string;
    };

export type DashboardProgressionView = {
  completedSessionCount: number;
  progressionScore: number;
  achievementPath: AchievementPathEntry[];
  globalRanking: DashboardRankingView;
};

const ACHIEVEMENT_DEFINITIONS: {
  id: AchievementNodeId;
  label: string;
}[] = [{ id: "first-session", label: "First Session" }];

export function presentProgressionForDashboard(
  progression: LearnerProgression
): DashboardProgressionView {
  const unlockedMap = new Map(
    progression.achievementNodes.map((a) => [a.id, a])
  );

  const achievementPath: AchievementPathEntry[] = ACHIEVEMENT_DEFINITIONS.map(
    (def) => {
      const unlocked = unlockedMap.get(def.id);
      return unlocked
        ? { id: def.id, label: def.label, unlocked: true, unlockedAt: unlocked.unlockedAt }
        : { id: def.id, label: def.label, unlocked: false };
    }
  );

  const rankingState = resolveGlobalRankingState(
    progression.completedSessionCount,
    progression.progressionScore
  );

  const globalRanking: DashboardRankingView =
    rankingState.kind === "insufficient-data"
      ? {
          kind: "insufficient-data",
          completedSessions: rankingState.completedSessions,
          requiredSessions: rankingState.requiredSessions,
          label: "Insufficient Data"
        }
      : {
          kind: "ranked",
          percentileBand: rankingState.percentileBand,
          label: formatPercentileBandLabel(rankingState.percentileBand)
        };

  return {
    completedSessionCount: progression.completedSessionCount,
    progressionScore: progression.progressionScore,
    achievementPath,
    globalRanking
  };
}

function formatPercentileBandLabel(band: string): string {
  switch (band) {
    case "top-10":
      return "Top 10%";
    case "top-25":
      return "Top 25%";
    case "top-50":
      return "Top 50%";
    case "bottom-50":
      return "Bottom 50%";
    default:
      return band;
  }
}
