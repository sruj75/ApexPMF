"use server";

import { redirect } from "next/navigation";
import {
  createEntryFailure,
  mapStartPracticeFailureToRedirectPath
} from "@/src/application/start-session/entry-failure";
import {
  getLearnerEntryContext,
  startPracticeFromEntryContext
} from "@/src/application/start-session/practice-entry-web-adapter";

export async function startPracticeAction(_formData: FormData) {
  void _formData;
  const context = await getLearnerEntryContext();
  if (!context.ok) {
    redirect(
      mapStartPracticeFailureToRedirectPath(
        createEntryFailure({ category: "auth_missing" })
      )
    );
  }

  const startedSession = await startPracticeFromEntryContext({
    learnerId: context.learnerId,
    idealCustomerProfileRepository: context.idealCustomerProfileRepository,
    generatedSessionCaseRepository: context.generatedSessionCaseRepository
  });
  if (!startedSession.ok) {
    console.error(
      "[practice/start] Failed to create practice session:",
      startedSession.failure
    );
    redirect(mapStartPracticeFailureToRedirectPath(startedSession.failure));
  }

  redirect(`/practice/${startedSession.sessionId}`);
}
