import { notFound, redirect } from "next/navigation";
import { toStartedSession } from "@/src/domain/session/generated-session-case";
import { createSupabaseGeneratedSessionCaseRepository } from "@/src/infrastructure/supabase/generated-session-cases";
import { createSupabaseServerClient } from "@/src/infrastructure/supabase/server";
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
