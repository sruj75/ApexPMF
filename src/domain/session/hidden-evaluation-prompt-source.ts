import { hiddenEvaluationJudgePrompt } from "./hidden-evaluation-prompt";

export type HiddenEvaluationPromptBundle = {
  systemPrompt: string;
  evaluationInstruction: string;
  repairInstruction: string;
};

export type HiddenEvaluationPromptSource = {
  getPromptBundle(): Promise<HiddenEvaluationPromptBundle>;
};

/**
 * Optional async loader for a prompt bundle (for composition or tests).
 * Production Hidden Evaluation uses repo-owned prompts via {@link createPinnedHiddenEvaluationPromptSource}.
 */
export type HiddenEvaluationPromptBundleLoader = {
  fetchPromptBundle(): Promise<HiddenEvaluationPromptBundle>;
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
    async getPromptBundle() {
      return promptBundle;
    }
  };
}

export function createLoaderBackedHiddenEvaluationPromptSource(input: {
  loader: HiddenEvaluationPromptBundleLoader;
}): HiddenEvaluationPromptSource {
  return {
    async getPromptBundle() {
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
      async fetchPromptBundle() {
        throw new Error(failureMessage);
      }
    }
  });
}

export function createFallbackHiddenEvaluationPromptSource(input: {
  primary: HiddenEvaluationPromptSource;
  fallback: HiddenEvaluationPromptSource;
}): HiddenEvaluationPromptSource {
  return {
    async getPromptBundle() {
      try {
        return await input.primary.getPromptBundle();
      } catch {
        return input.fallback.getPromptBundle();
      }
    }
  };
}
