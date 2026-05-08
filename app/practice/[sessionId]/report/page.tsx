import { notFound, redirect } from "next/navigation";
import { getLearnerEntryContext } from "@/src/application/start-session/practice-entry-seam";
import { SessionReportView } from "./report-view";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SessionReportPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SessionReportPage({
  params
}: SessionReportPageProps) {
  const { sessionId } = await params;

  if (!uuidPattern.test(sessionId)) {
    notFound();
  }

  const context = await getLearnerEntryContext();
  if (!context.ok) {
    redirect("/login");
  }

  const generatedSessionCase = await context.generatedSessionCaseRepository.getForLearner(
    context.learnerId,
    sessionId
  );

  if (!generatedSessionCase) {
    notFound();
  }

  if (generatedSessionCase.sessionLifecycle.endedReason === "user-quit") {
    redirect("/dashboard");
  }

  if (
    generatedSessionCase.sessionLifecycle.reportStatus ===
    "insufficient-evidence"
  ) {
    redirect("/dashboard");
  }

  if (generatedSessionCase.sessionLifecycle.reportStatus !== "ready") {
    redirect(`/practice/${sessionId}/report-generating`);
  }

  if (!generatedSessionCase.sessionReport || !generatedSessionCase.sessionTranscript) {
    redirect(`/practice/${sessionId}/report-generating`);
  }

  return (
    <SessionReportView
      report={generatedSessionCase.sessionReport}
      transcript={generatedSessionCase.sessionTranscript}
    />
  );
}
