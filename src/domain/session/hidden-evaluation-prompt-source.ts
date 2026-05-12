import { Data, Effect } from "effect";
import { hiddenEvaluationJudgePrompt } from "./hidden-evaluation-prompt";

export type HiddenEvaluationPromptBundle = {
  systemPrompt: string;
  evaluationInstruction: string;
  repairInstruction: string;
};

export class HiddenEvaluationPromptSourceError extends Data.TaggedError(
  "HiddenEvaluationPromptSourceError"
)<{
  message: string;
  cause?: unknown;
}> {}

export type HiddenEvaluationPromptSource = {
  getPromptBundle(): Effect.Effect<
    HiddenEvaluationPromptBundle,
    HiddenEvaluationPromptSourceError,
    never
  >;
};

/**
 * Optional async loader for a prompt bundle (for composition or tests).
 * Production Hidden Evaluation uses repo-owned prompts via {@link createPinnedHiddenEvaluationPromptSource}.
 */
export type HiddenEvaluationPromptBundleLoader = {
  fetchPromptBundle(): Effect.Effect<
    HiddenEvaluationPromptBundle,
    HiddenEvaluationPromptSourceError,
    never
  >;
};

const defaultPromptBundle: HiddenEvaluationPromptBundle = {
  systemPrompt: hiddenEvaluationJudgePrompt,
  evaluationInstruction: "Evaluate this completed Session.",
  repairInstruction:
    "Repair your previous response to strict JSON schema compliance only. Keep decisions unchanged where possible. Return JSON only."
};

export function createPinnedHiddenEvaluationPromptSource(
  overrides?: Partial<HiddenEvaluationPromptBundle>
): HiddenEvaluationPromptSource {
  const promptBundle: HiddenEvaluationPromptBundle = {
    ...defaultPromptBundle,
    ...overrides
  };

  return {
    getPromptBundle() {
      return Effect.succeed(promptBundle);
    }
  };
}

export function createLoaderBackedHiddenEvaluationPromptSource(input: {
  loader: HiddenEvaluationPromptBundleLoader;
}): HiddenEvaluationPromptSource {
  return {
    getPromptBundle() {
      return input.loader.fetchPromptBundle();
    }
  };
}

/** Test helper: a prompt source that always throws (exercises fallback composition). */
export function createStubFailingHiddenEvaluationPromptSource(input?: {
  failureMessage?: string;
}): HiddenEvaluationPromptSource {
  const failureMessage =
    input?.failureMessage ??
    "Primary prompt source failed (stub).";

  return createLoaderBackedHiddenEvaluationPromptSource({
    loader: {
      fetchPromptBundle() {
        return Effect.fail(
          new HiddenEvaluationPromptSourceError({
            message: failureMessage
          })
        );
      }
    }
  });
}

export function createFallbackHiddenEvaluationPromptSource(input: {
  primary: HiddenEvaluationPromptSource;
  fallback: HiddenEvaluationPromptSource;
}): HiddenEvaluationPromptSource {
  return {
    getPromptBundle() {
      return input.primary
        .getPromptBundle()
        .pipe(Effect.catchAll(() => input.fallback.getPromptBundle()));
    }
  };
}
