import type { SupabaseClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";
import type { LearnerProgression, AchievementNode } from "@/src/domain/progression/progression";
import {
  ProgressionRepositoryDecodeError,
  ProgressionRepositoryPersistenceError,
  type ProgressionRepository,
  type ProgressionRepositoryOperation
} from "@/src/domain/progression/progression-repository";
import { formatParseErrorDetails } from "./supabase-row-decode-error";

const progressionColumns =
  "founder_id, completed_session_count, progression_score, achievement_nodes";

const AchievementNodeRowSchema = Schema.Struct({
  id: Schema.String,
  sessionId: Schema.String,
  unlockedAt: Schema.String
});

const ProgressionRowSchema = Schema.Struct({
  founder_id: Schema.String,
  completed_session_count: Schema.Number,
  progression_score: Schema.Number,
  achievement_nodes: Schema.Array(AchievementNodeRowSchema)
});

type ProgressionRow = Schema.Schema.Type<typeof ProgressionRowSchema>;

export function createSupabaseProgressionRepository(
  supabase: SupabaseClient
): ProgressionRepository {
  return {
    getOrInitializeForLearner(learnerId) {
      return Effect.gen(function* () {
        const existing = yield* queryProgression({
          operation: "getOrInitializeForLearner",
          run: () =>
            supabase
              .from("learner_progressions")
              .select(progressionColumns)
              .eq("founder_id", learnerId)
              .maybeSingle()
        });

        if (existing.data) {
          return yield* decodeProgression(
            existing.data,
            "getOrInitializeForLearner"
          );
        }

        const created = yield* queryProgression({
          operation: "getOrInitializeForLearner",
          run: () =>
            supabase
              .from("learner_progressions")
              .insert({ founder_id: learnerId })
              .select(progressionColumns)
              .single()
        });

        return yield* decodeProgression(
          created.data,
          "getOrInitializeForLearner"
        );
      });
    },

    applyUpdate(learnerId, update) {
      return Effect.gen(function* () {
        // Ensure row exists first
        yield* createSupabaseProgressionRepository(supabase).getOrInitializeForLearner(
          learnerId
        );

        // Read current achievement nodes so we can merge
        const current = yield* queryProgression({
          operation: "applyUpdate",
          run: () =>
            supabase
              .from("learner_progressions")
              .select(progressionColumns)
              .eq("founder_id", learnerId)
              .single()
        });

        const currentProgression = yield* decodeProgression(
          current.data,
          "applyUpdate"
        );

        const mergedAchievements = [
          ...currentProgression.achievementNodes,
          ...update.unlockedAchievements
        ];

        const updated = yield* queryProgression({
          operation: "applyUpdate",
          run: () =>
            supabase
              .from("learner_progressions")
              .update({
                completed_session_count: update.newCompletedSessionCount,
                progression_score: update.newProgressionScore,
                achievement_nodes: mergedAchievements.map(
                  achievementNodeToRow
                )
              })
              .eq("founder_id", learnerId)
              .select(progressionColumns)
              .single()
        });

        return yield* decodeProgression(updated.data, "applyUpdate");
      });
    }
  };
}

function achievementNodeToRow(
  node: AchievementNode
): { id: string; sessionId: string; unlockedAt: string } {
  return {
    id: node.id,
    sessionId: node.sessionId,
    unlockedAt: node.unlockedAt.toISOString()
  };
}

function queryProgression<T>(input: {
  operation: ProgressionRepositoryOperation;
  run: () => PromiseLike<{ data: T; error: { message: string } | null }>;
}) {
  return Effect.tryPromise({
    try: input.run,
    catch: (cause) =>
      new ProgressionRepositoryPersistenceError({
        operation: input.operation,
        cause
      })
  }).pipe(
    Effect.flatMap((result) =>
      result.error
        ? Effect.fail(
            new ProgressionRepositoryPersistenceError({
              operation: input.operation,
              cause: new Error(result.error.message)
            })
          )
        : Effect.succeed(result)
    )
  );
}

function decodeProgression(
  row: unknown,
  operation: ProgressionRepositoryOperation
): Effect.Effect<LearnerProgression, ProgressionRepositoryDecodeError> {
  const decoded = Schema.decodeUnknownEither(ProgressionRowSchema)(row);
  if (decoded._tag === "Left") {
    return Effect.fail(
      new ProgressionRepositoryDecodeError({
        operation,
        cause: formatParseErrorDetails(decoded.left)
      })
    );
  }

  return Effect.succeed(toProgression(decoded.right));
}

function toProgression(row: ProgressionRow): LearnerProgression {
  return {
    learnerId: row.founder_id,
    completedSessionCount: row.completed_session_count,
    progressionScore: row.progression_score,
    achievementNodes: row.achievement_nodes.map((a) => ({
      id: a.id as LearnerProgression["achievementNodes"][number]["id"],
      sessionId: a.sessionId,
      unlockedAt: new Date(a.unlockedAt)
    }))
  };
}
