import type { ProgressionRepository, ProgressionRepositoryError } from "@/src/domain/progression/progression-repository";
import {
  presentProgressionForDashboard,
  type DashboardProgressionView
} from "./progression-dashboard-presenter";
import { Effect } from "effect";

export function getDashboardProgressionData(input: {
  learnerId: string;
  progressionRepository: ProgressionRepository;
}): Effect.Effect<DashboardProgressionView, ProgressionRepositoryError> {
  return Effect.gen(function* () {
    const progression = yield* input.progressionRepository.getOrInitializeForLearner(
      input.learnerId
    );
    return presentProgressionForDashboard(progression);
  });
}
