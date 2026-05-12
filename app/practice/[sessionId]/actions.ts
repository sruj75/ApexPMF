"use server";

import { redirect } from "next/navigation";
import { getLearnerSessionRuntime } from "@/src/application/start-session/practice-entry-web-adapter";

export async function endSessionAction(formData: FormData) {
  const sessionId = stringFromFormData(formData, "sessionId");
  if (!sessionId) {
    redirect("/practice?error=session_creation_failed");
  }

  const runtime = await getLearnerSessionRuntime();
  if (!runtime.ok) {
    redirect("/login");
  }

  const outcome = await runtime.endSessionForLearner({
    sessionId,
    reason: "user-quit"
  });

  redirect(outcome.nextPath);
}

function stringFromFormData(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
