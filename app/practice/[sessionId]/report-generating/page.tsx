import { redirect } from "next/navigation";
import { createSessionOrchestrator } from "@/src/application/end-session/session-orchestrator";
import { createReportGenerationCoordinator } from "@/src/application/generate-report/report-generation-coordinator";
import { getLearnerEntryContext } from "@/src/application/start-session/practice-entry-seam";

export const dynamic = "force-dynamic";

type ReportGeneratingPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function ReportGeneratingPage({
  params
}: ReportGeneratingPageProps) {
  const { sessionId } = await params;

  const context = await getLearnerEntryContext();
  if (!context.ok) {
    redirect("/login");
  }

  const orchestrator = createSessionOrchestrator({
    generatedSessionCaseRepository: context.generatedSessionCaseRepository,
    reportGenerationCoordinator: createReportGenerationCoordinator()
  });

  const outcome = await orchestrator.runReportGeneratingFlowForLearner({
    learnerId: context.learnerId,
    sessionId
  });

  redirect(outcome.nextPath);
}
