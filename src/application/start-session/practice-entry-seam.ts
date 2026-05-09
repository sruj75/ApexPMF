import { type EntryFailure } from "@/src/application/start-session/entry-failure";
import {
  createNonLiveLlmRuntimePolicy,
  type NonLiveLlmRuntimePolicy
} from "@/src/application/non-live-llm-policy";
import { createSessionOrchestrator } from "@/src/application/end-session/session-orchestrator";
import type { SessionOrchestrator } from "@/src/application/end-session/session-orchestrator";
import { createReportGenerationCoordinator } from "@/src/application/generate-report/report-generation-coordinator";
import type { SessionEndReason } from "@/src/domain/session/session-lifecycle";
import { startPracticeForLearner } from "@/src/application/start-session/start-practice";
import {
  getSupabaseLearnerEntryContext,
  type SupabaseLearnerEntryContextResult
} from "@/src/infrastructure/supabase/learner-entry-context";

export type LearnerEntryContextResult =
  | {
      ok: true;
      learnerId: string;
      idealCustomerProfileRepository: Extract<
        SupabaseLearnerEntryContextResult,
        { ok: true }
      >["idealCustomerProfileRepository"];
      generatedSessionCaseRepository: Extract<
        SupabaseLearnerEntryContextResult,
        { ok: true }
      >["generatedSessionCaseRepository"];
    }
  | {
      ok: false;
      reason: "unauthenticated";
    };

export type StartPracticeSeamResult =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      failure: EntryFailure;
    };

export async function getLearnerEntryContext(): Promise<LearnerEntryContextResult> {
  return getSupabaseLearnerEntryContext();
}

export type LearnerSessionRuntimeResult =
  | {
      ok: false;
      reason: "unauthenticated";
    }
  | {
      ok: true;
      endSessionForLearner(input: {
        sessionId: string;
        reason: SessionEndReason;
      }): ReturnType<SessionOrchestrator["endSessionForLearner"]>;
      runReportGeneratingFlowForLearner(input: {
        sessionId: string;
      }): ReturnType<SessionOrchestrator["runReportGeneratingFlowForLearner"]>;
    };

/**
 * Learner-scoped Session Orchestrator wiring for end-session and report-generating flows.
 * Call sites use this instead of assembling repositories and coordinators directly.
 */
export async function getLearnerSessionRuntime(): Promise<LearnerSessionRuntimeResult> {
  const context = await getLearnerEntryContext();
  if (!context.ok) {
    return { ok: false, reason: "unauthenticated" };
  }

  const orchestrator = createSessionOrchestrator({
    generatedSessionCaseRepository: context.generatedSessionCaseRepository,
    reportGenerationCoordinator: createReportGenerationCoordinator()
  });

  const { learnerId } = context;

  return {
    ok: true,
    endSessionForLearner({ sessionId, reason }) {
      return orchestrator.endSessionForLearner({
        learnerId,
        sessionId,
        reason
      });
    },
    runReportGeneratingFlowForLearner({ sessionId }) {
      return orchestrator.runReportGeneratingFlowForLearner({
        learnerId,
        sessionId
      });
    }
  };
}

export async function startPracticeFromEntryContext(context: {
  learnerId: string;
  idealCustomerProfileRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["idealCustomerProfileRepository"];
  generatedSessionCaseRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["generatedSessionCaseRepository"];
},
input?: {
  nonLiveLlmRuntimePolicy?: NonLiveLlmRuntimePolicy;
}): Promise<StartPracticeSeamResult> {
  const nonLiveLlmRuntimePolicy =
    input?.nonLiveLlmRuntimePolicy ?? createNonLiveLlmRuntimePolicy();

  try {
    const startedSession = await startPracticeForLearner(context.learnerId, {
      idealCustomerProfileRepository: context.idealCustomerProfileRepository,
      generatedSessionCaseRepository: context.generatedSessionCaseRepository,
      personaGenerator: nonLiveLlmRuntimePolicy.composePersonaGenerator()
    });

    return {
      ok: true,
      sessionId: startedSession.sessionId
    };
  } catch (cause) {
    return {
      ok: false,
      failure: nonLiveLlmRuntimePolicy.mapStartSessionFailure(cause)
    };
  }
}
