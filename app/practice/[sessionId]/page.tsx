import { notFound, redirect } from "next/navigation";
import {
  createPracticeSessionCaseRepository,
  getLearnerEntryContext
} from "@/src/application/start-session/practice-entry-seam";
import { toStartedSession } from "@/src/domain/session/generated-session-case";
import { SessionStartView } from "./session-start-view";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PracticeSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function PracticeSessionPage({
  params
}: PracticeSessionPageProps) {
  const { sessionId } = await params;

  if (!uuidPattern.test(sessionId)) {
    notFound();
  }

  const context = await getLearnerEntryContext();
  if (!context.ok) {
    redirect("/login");
  }

  const repository = createPracticeSessionCaseRepository(context.supabase);
  const generatedSessionCase = await repository.getForLearner(
    context.learnerId,
    sessionId
  );

  if (!generatedSessionCase) {
    notFound();
  }

  return (
    <SessionStartView
      startedSession={toStartedSession(generatedSessionCase)}
    />
  );
}
