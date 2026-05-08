"use server";

import { redirect } from "next/navigation";
import { createSessionOrchestrator } from "@/src/application/end-session/session-orchestrator";
import { createReportGenerationCoordinator } from "@/src/application/generate-report/report-generation-coordinator";
import { getLearnerEntryContext } from "@/src/application/start-session/practice-entry-seam";

export async function endSessionAction(formData: FormData) {
  const sessionId = stringFromFormData(formData, "sessionId");
  if (!sessionId) {
    throw new Error("Missing sessionId for endSessionAction.");
  }

  const context = await getLearnerEntryContext();
  if (!context.ok) {
    redirect("/login");
  }

  const orchestrator = createSessionOrchestrator({
    generatedSessionCaseRepository: context.generatedSessionCaseRepository,
    reportGenerationCoordinator: createReportGenerationCoordinator()
  });

  const outcome = await orchestrator.endSessionForLearner({
    learnerId: context.learnerId,
    sessionId,
    reason: "user-quit"
  });

  redirect(outcome.nextPath);
}

function stringFromFormData(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
