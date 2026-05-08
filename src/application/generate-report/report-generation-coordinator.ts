import type { GeneratedSessionCase } from "@/src/domain/session/generated-session-case";

export type ReportGenerationResult =
  | {
      status: "ready";
    }
  | {
      status: "insufficient-evidence";
    };

export type ReportGenerationCoordinator = {
  generateForEndedSession(input: {
    generatedSessionCase: GeneratedSessionCase;
  }): Promise<ReportGenerationResult>;
};

export function createPlaceholderReportGenerationCoordinator(): ReportGenerationCoordinator {
  return {
    async generateForEndedSession() {
      return {
        status: "ready"
      };
    }
  };
}
