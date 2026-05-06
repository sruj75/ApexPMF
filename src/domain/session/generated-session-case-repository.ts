import type {
  CreateGeneratedSessionCaseInput,
  GeneratedSessionCase
} from "./generated-session-case";

export type GeneratedSessionCaseRepository = {
  create(
    learnerId: string,
    input: CreateGeneratedSessionCaseInput
  ): Promise<GeneratedSessionCase>;
  getForLearner(
    learnerId: string,
    sessionCaseId: string
  ): Promise<GeneratedSessionCase | null>;
};

export function createInMemoryGeneratedSessionCaseRepository(
  initialCases: GeneratedSessionCase[] = []
): GeneratedSessionCaseRepository {
  let generatedSessionCases = [...initialCases];
  let nextId = generatedSessionCases.reduce((max, sessionCase) => {
    const match = /^session-case-(\d+)$/.exec(sessionCase.id);
    return match ? Math.max(max, Number.parseInt(match[1] ?? "0", 10) + 1) : max;
  }, 1);

  return {
    async create(learnerId, input) {
      const generatedSessionCase: GeneratedSessionCase = {
        ...input,
        id: `session-case-${nextId}`,
        learnerId,
        createdAt: new Date()
      };

      nextId += 1;
      generatedSessionCases = [...generatedSessionCases, generatedSessionCase];
      return generatedSessionCase;
    },

    async getForLearner(learnerId, sessionCaseId) {
      return (
        generatedSessionCases.find(
          (generatedSessionCase) =>
            generatedSessionCase.learnerId === learnerId &&
            generatedSessionCase.id === sessionCaseId
        ) ?? null
      );
    }
  };
}
