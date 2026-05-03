import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateGeneratedSessionCaseInput,
  GeneratedSessionCase
} from "@/src/domain/session/generated-session-case";
import type { GeneratedSessionCaseRepository } from "@/src/domain/session/generated-session-case-repository";
import type { SessionSource } from "@/src/domain/persona/session-source";

type GeneratedSessionCaseRow = {
  id: string;
  learner_id: string;
  source_kind: "active-ideal-customer-profile" | "broad-practice-pool";
  source_profile_id: string | null;
  source_snapshot: unknown;
  opening_context: string;
  light_persona_label: string;
  customer_persona: unknown;
  hidden_backstory: string;
  customer_fit:
    | "strong-fit"
    | "weak-fit"
    | "bad-fit"
    | "buyer-user-mismatch"
    | "influencer";
  hidden_test_plan: unknown;
  traps: unknown;
  generation_nonce: string;
  generation_audit: unknown;
  created_at: string;
};

const generatedSessionCaseColumns = [
  "id",
  "learner_id",
  "source_kind",
  "source_profile_id",
  "source_snapshot",
  "opening_context",
  "light_persona_label",
  "customer_persona",
  "hidden_backstory",
  "customer_fit",
  "hidden_test_plan",
  "traps",
  "generation_nonce",
  "generation_audit",
  "created_at"
].join(", ");

export function createSupabaseGeneratedSessionCaseRepository(
  supabase: SupabaseClient
): GeneratedSessionCaseRepository {
  return {
    async create(learnerId, input) {
      const { data, error } = await supabase
        .from("generated_session_cases")
        .insert(toInsertRow(learnerId, input))
        .select(generatedSessionCaseColumns)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return toGeneratedSessionCase(data as unknown as GeneratedSessionCaseRow);
    },

    async getForLearner(learnerId, sessionCaseId) {
      const { data, error } = await supabase
        .from("generated_session_cases")
        .select(generatedSessionCaseColumns)
        .eq("learner_id", learnerId)
        .eq("id", sessionCaseId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data
        ? toGeneratedSessionCase(data as unknown as GeneratedSessionCaseRow)
        : null;
    }
  };
}

function toInsertRow(
  learnerId: string,
  input: CreateGeneratedSessionCaseInput
) {
  return {
    learner_id: learnerId,
    ...sourceColumns(input.sessionSource),
    opening_context: input.openingContext,
    light_persona_label: input.customerPersona.lightPersonaLabel,
    customer_persona: input.customerPersona,
    hidden_backstory: input.hiddenBackstory,
    customer_fit: input.customerFit,
    hidden_test_plan: input.hiddenTestPlan,
    traps: input.traps,
    generation_nonce: input.generationNonce,
    generation_audit: input.generationAudit
  };
}

function sourceColumns(sessionSource: SessionSource) {
  if (sessionSource.kind === "active-ideal-customer-profile") {
    return {
      source_kind: sessionSource.kind,
      source_profile_id: sessionSource.idealCustomerProfile.id,
      source_snapshot: sessionSource.idealCustomerProfile
    };
  }

  return {
    source_kind: sessionSource.kind,
    source_profile_id: null,
    source_snapshot: {
      label: sessionSource.label
    }
  };
}

function toGeneratedSessionCase(
  row: GeneratedSessionCaseRow
): GeneratedSessionCase {
  return {
    id: row.id,
    learnerId: row.learner_id,
    sessionSource: toSessionSource(row),
    openingContext: row.opening_context,
    customerPersona: row.customer_persona as GeneratedSessionCase["customerPersona"],
    hiddenBackstory: row.hidden_backstory,
    customerFit: row.customer_fit,
    hiddenTestPlan: row.hidden_test_plan as GeneratedSessionCase["hiddenTestPlan"],
    traps: row.traps as GeneratedSessionCase["traps"],
    generationNonce: row.generation_nonce,
    generationAudit:
      row.generation_audit as GeneratedSessionCase["generationAudit"],
    createdAt: new Date(row.created_at)
  };
}

function toSessionSource(row: GeneratedSessionCaseRow): SessionSource {
  if (row.source_kind === "active-ideal-customer-profile") {
    return {
      kind: "active-ideal-customer-profile",
      idealCustomerProfile:
        row.source_snapshot as Extract<
          SessionSource,
          { kind: "active-ideal-customer-profile" }
        >["idealCustomerProfile"]
    };
  }

  return {
    kind: "broad-practice-pool",
    label: "Broad Practice Pool"
  };
}
