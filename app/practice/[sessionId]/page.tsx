import { notFound, redirect } from "next/navigation";
import { toStartedSession } from "@/src/domain/session/generated-session-case";
import { createSupabaseGeneratedSessionCaseRepository } from "@/src/infrastructure/supabase/generated-session-cases";
import { createSupabaseServerClient } from "@/src/infrastructure/supabase/server";
import { SessionStartView } from "./session-start-view";

type PracticeSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function PracticeSessionPage({
  params
}: PracticeSessionPageProps) {
  const { sessionId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const repository = createSupabaseGeneratedSessionCaseRepository(supabase);
  const generatedSessionCase = await repository.getForLearner(
    user.id,
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
