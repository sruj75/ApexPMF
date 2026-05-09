import { notFound, redirect } from "next/navigation";
import { resolvePracticeRouteDecision } from "@/src/application/practice-route/practice-route-decision";

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

  const decision = await resolvePracticeRouteDecision({
    intent: "report-generating",
    sessionId
  });
  if (decision.action === "not-found") {
    notFound();
  }
  if (decision.action !== "redirect") {
    notFound();
  }
  redirect(decision.path);
}
