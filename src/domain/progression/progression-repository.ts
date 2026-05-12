import type { LearnerProgression, ProgressionUpdate } from "./progression";
import { Data, Effect } from "effect";

export type ProgressionRepositoryOperation =
  | "getOrInitializeForLearner"
  | "applyUpdate";

export class ProgressionRepositoryPersistenceError extends Data.TaggedError(
  "ProgressionRepositoryPersistenceError"
)<{
  operation: ProgressionRepositoryOperation;
  cause: unknown;
}> {}

export class ProgressionRepositoryDecodeError extends Data.TaggedError(
  "ProgressionRepositoryDecodeError"
)<{
  operation: ProgressionRepositoryOperation;
  cause: unknown;
}> {}

export type ProgressionRepositoryError =
  | ProgressionRepositoryPersistenceError
  | ProgressionRepositoryDecodeError;

export type ProgressionRepository = {
  getOrInitializeForLearner(
    learnerId: string
  ): Effect.Effect<LearnerProgression, ProgressionRepositoryError>;
  applyUpdate(
    learnerId: string,
    update: ProgressionUpdate
  ): Effect.Effect<LearnerProgression, ProgressionRepositoryError>;
};

export function createInMemoryProgressionRepository(
  initialProgressions?: LearnerProgression[]
): ProgressionRepository {
  const store = new Map<string, LearnerProgression>();

  for (const progression of initialProgressions ?? []) {
    store.set(progression.learnerId, { ...progression, achievementNodes: [...progression.achievementNodes] });
  }

  function getOrCreate(learnerId: string): LearnerProgression {
    const existing = store.get(learnerId);
    if (existing) return existing;

    const fresh: LearnerProgression = {
      learnerId,
      completedSessionCount: 0,
      progressionScore: 0,
      achievementNodes: []
    };
    store.set(learnerId, fresh);
    return fresh;
  }

  return {
    getOrInitializeForLearner(learnerId) {
      const p = getOrCreate(learnerId);
      return Effect.succeed({ ...p, achievementNodes: [...p.achievementNodes] });
    },

    applyUpdate(learnerId, update) {
      const p = getOrCreate(learnerId);
      p.completedSessionCount = update.newCompletedSessionCount;
      p.progressionScore = update.newProgressionScore;
      p.achievementNodes = [...p.achievementNodes, ...update.unlockedAchievements];
      return Effect.succeed({ ...p, achievementNodes: [...p.achievementNodes] });
    }
  };
}
