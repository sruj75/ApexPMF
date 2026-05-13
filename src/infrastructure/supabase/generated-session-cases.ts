import type { SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import type { GeneratedSessionCaseRepository } from "@/src/domain/session/generated-session-case-repository";
import { decodeGeneratedSessionCaseRow, toInsertRow, toLifecycleUpdateRow } from "./generated-session-cases-mapper";
import { generatedSessionCaseColumns } from "./generated-session-cases-schema";
import { querySupabase } from "./generated-session-cases-query";

export function createSupabaseGeneratedSessionCaseRepository(
  supabase: SupabaseClient
): GeneratedSessionCaseRepository {
  return {
    create(learnerId, input) {
      return Effect.gen(function* () {
        const result = yield* querySupabase({
          operation: "create",
          run: () =>
            supabase
              .from("generated_session_cases")
              .insert(toInsertRow(learnerId, input))
              .select(generatedSessionCaseColumns)
              .single()
        });

        return yield* decodeGeneratedSessionCaseRow(result.data, "create");
      });
    },

    getForLearner(learnerId, sessionCaseId) {
      return Effect.gen(function* () {
        const result = yield* querySupabase({
          operation: "getForLearner",
          run: () =>
            supabase
              .from("generated_session_cases")
              .select(generatedSessionCaseColumns)
              .eq("learner_id", learnerId)
              .eq("id", sessionCaseId)
              .maybeSingle()
        });

        if (!result.data) {
          return null;
        }

        return yield* decodeGeneratedSessionCaseRow(result.data, "getForLearner");
      });
    },

    updateSessionLifecycleForLearner(input) {
      return Effect.gen(function* () {
        const existing = yield* querySupabase({
          operation: "getForLearner",
          run: () =>
            supabase
              .from("generated_session_cases")
              .select(generatedSessionCaseColumns)
              .eq("learner_id", input.learnerId)
              .eq("id", input.sessionCaseId)
              .maybeSingle()
        });

        if (!existing.data) {
          return null;
        }

        const current = yield* decodeGeneratedSessionCaseRow(
          existing.data,
          "getForLearner"
        );
        const nextLifecycle = input.updater(current.sessionLifecycle);
        const updated = yield* querySupabase({
          operation: "updateSessionLifecycleForLearner",
          run: () =>
            supabase
              .from("generated_session_cases")
              .update(toLifecycleUpdateRow(nextLifecycle))
              .eq("learner_id", input.learnerId)
              .eq("id", input.sessionCaseId)
              .select(generatedSessionCaseColumns)
              .single()
        });

        return yield* decodeGeneratedSessionCaseRow(
          updated.data,
          "updateSessionLifecycleForLearner"
        );
      });
    },

    updateReportArtifactsForLearner(input) {
      return Effect.gen(function* () {
        const updated = yield* querySupabase({
          operation: "updateReportArtifactsForLearner",
          run: () =>
            supabase
              .from("generated_session_cases")
              .update({
                report_status: input.reportStatus,
                report_ready_at: input.reportReadyAt?.toISOString() ?? null,
                session_report: input.sessionReport,
                session_transcript: input.sessionTranscript,
                session_evaluation: input.sessionEvaluation
              })
              .eq("learner_id", input.learnerId)
              .eq("id", input.sessionCaseId)
              .eq("report_status", "generating")
              .select(generatedSessionCaseColumns)
              .maybeSingle()
        });

        if (!updated.data) {
          return null;
        }

        return yield* decodeGeneratedSessionCaseRow(
          updated.data,
          "updateReportArtifactsForLearner"
        );
      });
    },

    updateCreditChargeForLearner(input) {
      return Effect.gen(function* () {
        const updated = yield* querySupabase({
          operation: "updateCreditChargeForLearner",
          run: () =>
            supabase
              .from("generated_session_cases")
              .update({
                credit_charge: input.creditCharge
              })
              .eq("learner_id", input.learnerId)
              .eq("id", input.sessionCaseId)
              .select(generatedSessionCaseColumns)
              .maybeSingle()
        });

        if (!updated.data) {
          return null;
        }

        return yield* decodeGeneratedSessionCaseRow(
          updated.data,
          "updateCreditChargeForLearner"
        );
      });
    }
  };
}
