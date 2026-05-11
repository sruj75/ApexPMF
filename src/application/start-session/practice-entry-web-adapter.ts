import { Effect } from "effect";
import type { SessionEndReason } from "@/src/domain/session/session-lifecycle";
import {
  parseIdealCustomerProfileInput,
  type IdealCustomerProfile,
  type IdealCustomerProfileInput
} from "@/src/domain/persona/ideal-customer-profile";
import { resolveNextSessionSource } from "@/src/domain/persona/session-source";
import type { IdealCustomerProfileRepository } from "@/src/domain/persona/ideal-customer-profile-repository";
import {
  presentSessionSourceForUi,
  type PresentedSessionSource
} from "@/src/application/start-session/session-source-presentation";
import {
  getLearnerEntryContextEffect,
  getLearnerSessionRuntimeEffect,
  startPracticeFromEntryContextEffect,
  type LearnerEntryContextResult,
  type StartPracticeEntryContext,
  type StartPracticeSeamResult
} from "@/src/application/start-session/practice-entry-seam";

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
      }): Promise<{
        nextPath: string;
        sessionStatus: "ended";
        endedReason: SessionEndReason;
        reportStatus: "not-requested" | "generating" | "ready" | "insufficient-evidence";
      }>;
      runReportGeneratingFlowForLearner(input: {
        sessionId: string;
      }): Promise<
        | {
            reportStatus: "not-found";
          }
        | {
            reportStatus: "ready" | "insufficient-evidence";
            nextPath: string;
          }
      >;
    };

export async function getLearnerEntryContext(): Promise<LearnerEntryContextResult> {
  return Effect.runPromise(getLearnerEntryContextEffect());
}

export async function getLearnerSessionRuntime(): Promise<LearnerSessionRuntimeResult> {
  const runtime = await Effect.runPromise(getLearnerSessionRuntimeEffect());
  if (!runtime.ok) {
    return runtime;
  }

  return {
    ok: true,
    endSessionForLearner: (input) => Effect.runPromise(runtime.endSessionForLearner(input)),
    runReportGeneratingFlowForLearner: (input) =>
      Effect.runPromise(runtime.runReportGeneratingFlowForLearner(input))
  };
}

export async function startPracticeFromEntryContext(
  context: StartPracticeEntryContext
): Promise<StartPracticeSeamResult> {
  return Effect.runPromise(startPracticeFromEntryContextEffect(context));
}

export type ProfilePageDataResult =
  | {
      ok: false;
      reason: "unauthenticated";
    }
  | {
      ok: true;
      profiles: IdealCustomerProfile[];
      presentedSessionSource: PresentedSessionSource;
      canClearActiveSource: boolean;
      learnerId: string;
      idealCustomerProfileRepository: Extract<
        LearnerEntryContextResult,
        { ok: true }
      >["idealCustomerProfileRepository"];
    };

export async function getProfilePageData(): Promise<ProfilePageDataResult> {
  return Effect.runPromise(
    Effect.gen(function* () {
      const context = yield* getLearnerEntryContextEffect();
      if (!context.ok) {
        return { ok: false as const, reason: "unauthenticated" as const };
      }

      const repository = context.idealCustomerProfileRepository;
      const [profiles, sessionSource] = yield* Effect.all([
        repository.listForLearner(context.learnerId),
        resolveNextSessionSource(context.learnerId, repository)
      ]);

      return {
        ok: true as const,
        profiles,
        presentedSessionSource: presentSessionSourceForUi(sessionSource),
        canClearActiveSource: sessionSource.kind === "active-ideal-customer-profile",
        learnerId: context.learnerId,
        idealCustomerProfileRepository: repository
      };
    })
  );
}

export type { IdealCustomerProfile } from "@/src/domain/persona/ideal-customer-profile";

export const parseProfileInput = parseIdealCustomerProfileInput;

export async function createIdealCustomerProfileForLearner(
  learnerId: string,
  repository: Pick<IdealCustomerProfileRepository, "create">,
  input: IdealCustomerProfileInput
): Promise<void> {
  await Effect.runPromise(repository.create(learnerId, input));
}

export async function updateIdealCustomerProfileForLearner(
  learnerId: string,
  repository: Pick<IdealCustomerProfileRepository, "update">,
  profileId: string,
  input: IdealCustomerProfileInput
): Promise<void> {
  await Effect.runPromise(repository.update(learnerId, profileId, input));
}

export async function selectActiveIdealCustomerProfileForLearner(
  learnerId: string,
  repository: Pick<IdealCustomerProfileRepository, "selectActive">,
  profileId: string
): Promise<void> {
  await Effect.runPromise(repository.selectActive(learnerId, profileId));
}

export async function clearActiveIdealCustomerProfileForLearner(
  learnerId: string,
  repository: Pick<IdealCustomerProfileRepository, "clearActive">
): Promise<void> {
  await Effect.runPromise(repository.clearActive(learnerId));
}
