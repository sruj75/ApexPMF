import {
  applySessionReportToProgression,
  resolveGlobalRankingState,
  type GlobalRankingState
} from "@/src/domain/progression/progression";
import type {
  ProgressionRepository,
  ProgressionRepositoryError
} from "@/src/domain/progression/progression-repository";
import type { SessionReport } from "@/src/domain/session/session-report";
import { Effect } from "effect";

export type ProgressionUpdateResult = {
  completedSessionCount: number;
  progressionScore: number;
  unlockedAchievementIds: string[];
  globalRankingState: GlobalRankingState;
};

export type ProgressionUpdater = {
  applyCompletedSession(input: {
    learnerId: string;
    sessionId: string;
    sessionReport: SessionReport;
    completedAt: Date;
  }): Effect.Effect<ProgressionUpdateResult, ProgressionRepositoryError>;
};

export function createProgressionUpdater(input: {
  progressionRepository: ProgressionRepository;
}): ProgressionUpdater {
  const { progressionRepository } = input;

  return {
    applyCompletedSession({ learnerId, sessionId, sessionReport, completedAt }) {
      return Effect.gen(function* () {
        const current = yield* progressionRepository.getOrInitializeForLearner(learnerId);

        const update = applySessionReportToProgression(
          current,
          sessionReport,
          sessionId,
          completedAt
        );

        yield* progressionRepository.applyUpdate(learnerId, update);

        const globalRankingState = resolveGlobalRankingState(
          update.newCompletedSessionCount,
          update.newProgressionScore
        );

        return {
          completedSessionCount: update.newCompletedSessionCount,
          progressionScore: update.newProgressionScore,
          unlockedAchievementIds: update.unlockedAchievements.map(a => a.id),
          globalRankingState
        };
      });
    }
  };
}
