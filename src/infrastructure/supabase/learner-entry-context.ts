import type { GeneratedSessionCaseRepository } from "@/src/domain/session/generated-session-case-repository";
import type { IdealCustomerProfileRepository } from "@/src/domain/persona/ideal-customer-profile-repository";
import { createSupabaseGeneratedSessionCaseRepository } from "@/src/infrastructure/supabase/generated-session-cases";
import { createSupabaseIdealCustomerProfileRepository } from "@/src/infrastructure/supabase/ideal-customer-profiles";
import { createSupabaseServerClient } from "@/src/infrastructure/supabase/server";

export type SupabaseLearnerEntryContextResult =
  | {
      ok: true;
      learnerId: string;
      idealCustomerProfileRepository: IdealCustomerProfileRepository;
      generatedSessionCaseRepository: GeneratedSessionCaseRepository;
    }
  | {
      ok: false;
      reason: "unauthenticated";
    };

export async function getSupabaseLearnerEntryContext(): Promise<SupabaseLearnerEntryContextResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      reason: "unauthenticated"
    };
  }

  return {
    ok: true,
    learnerId: user.id,
    idealCustomerProfileRepository:
      createSupabaseIdealCustomerProfileRepository(supabase),
    generatedSessionCaseRepository:
      createSupabaseGeneratedSessionCaseRepository(supabase)
  };
}
