import { notFound, redirect } from "next/navigation";
import { resolvePracticeRouteDecision } from "@/src/application/practice-route/practice-route-decision";
import { SessionStartView } from "./session-start-view";

export const dynamic = "force-dynamic";

type PracticeSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function PracticeSessionPage({
  params
}: PracticeSessionPageProps) {
  const { sessionId } = await params;

  const decision = await resolvePracticeRouteDecision({
    intent: "practice-session",
    sessionId
  });
  if (decision.action === "not-found") {
    notFound();
  }
  if (decision.action === "redirect") {
    redirect(decision.path);
  }
  if (decision.action !== "render-practice-session") {
    notFound();
  }

  return <SessionStartView startedSession={decision.startedSession} />;
}
