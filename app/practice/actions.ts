"use server";

import { redirect } from "next/navigation";
import {
  mapStartPracticeFailureToRedirectPath
} from "@/src/application/start-session/entry-failure";
import {
  startPracticeForCurrentLearner
} from "@/src/application/start-session/practice-entry-web-adapter";

export async function startPracticeAction(_formData: FormData) {
  void _formData;
  const startedSession = await startPracticeForCurrentLearner();
  if (!startedSession.ok) {
    console.error(
      "[practice/start] Failed to create practice session:",
      startedSession.failure
    );
    redirect(mapStartPracticeFailureToRedirectPath(startedSession.failure));
  }

  redirect(`/practice/${startedSession.sessionId}`);
}
