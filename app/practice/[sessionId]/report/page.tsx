import { notFound, redirect } from "next/navigation";
import { resolvePracticeRouteDecision } from "@/src/application/practice-route/practice-route-decision";
import { SessionReportView } from "./report-view";

export const dynamic = "force-dynamic";

type SessionReportPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SessionReportPage({
  params
}: SessionReportPageProps) {
  const { sessionId } = await params;

  const decision = await resolvePracticeRouteDecision({
    intent: "session-report",
    sessionId
  });
  if (decision.action === "not-found") {
    notFound();
  }
  if (decision.action === "redirect") {
    redirect(decision.path);
  }

  return (
    <SessionReportView report={decision.report} transcript={decision.transcript} />
  );
}
