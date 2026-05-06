import type { SupabaseClient } from "@supabase/supabase-js";
import { Schema } from "effect";
import type {
  IdealCustomerProfile,
  IdealCustomerProfileInput
} from "@/src/domain/persona/ideal-customer-profile";
import type { IdealCustomerProfileRepository } from "@/src/domain/persona/ideal-customer-profile-repository";
import {
  formatParseErrorDetails,
  SupabaseRowDecodeError
} from "./supabase-row-decode-error";

const adapterName = "ideal_customer_profiles";
const idealCustomerProfileColumns =
  "id, learner_id, name, customer_description, notes, is_active, created_at, updated_at";

const IdealCustomerProfileRowSchema = Schema.Struct({
  id: Schema.String,
  learner_id: Schema.String,
  name: Schema.String,
  customer_description: Schema.String,
  notes: Schema.NullOr(Schema.String),
  is_active: Schema.Boolean,
  created_at: Schema.Date,
  updated_at: Schema.Date
});

type IdealCustomerProfileRow = Schema.Schema.Type<
  typeof IdealCustomerProfileRowSchema
>;

export function createSupabaseIdealCustomerProfileRepository(
  supabase: SupabaseClient
): IdealCustomerProfileRepository {
  return {
    async listForLearner(learnerId) {
      const { data, error } = await supabase
        .from("ideal_customer_profiles")
        .select(idealCustomerProfileColumns)
        .eq("learner_id", learnerId)
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return decodeRowsOrThrow(data ?? [], "listForLearner").map(
        toIdealCustomerProfile
      );
    },

    async getActiveForLearner(learnerId) {
      const { data, error } = await supabase
        .from("ideal_customer_profiles")
        .select(idealCustomerProfileColumns)
        .eq("learner_id", learnerId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return null;
      }

      return toIdealCustomerProfile(
        decodeRowOrThrow(data, "getActiveForLearner")
      );
    },

    async create(learnerId, input) {
      const { data, error } = await supabase
        .from("ideal_customer_profiles")
        .insert(toInsertRow(learnerId, input))
        .select(idealCustomerProfileColumns)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return toIdealCustomerProfile(decodeRowOrThrow(data, "create"));
    },

    async update(learnerId, profileId, input) {
      const { data, error } = await supabase
        .from("ideal_customer_profiles")
        .update({
          name: input.name,
          customer_description: input.customerDescription,
          notes: input.notes
        })
        .eq("learner_id", learnerId)
        .eq("id", profileId)
        .select(idealCustomerProfileColumns)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return toIdealCustomerProfile(decodeRowOrThrow(data, "update"));
    },

    async selectActive(_learnerId, profileId) {
      const { error } = await supabase.rpc(
        "select_active_ideal_customer_profile",
        {
          profile_id: profileId
        }
      );

      if (error) {
        throw new Error(error.message);
      }
    },

    async clearActive() {
      const { error } = await supabase.rpc(
        "clear_active_ideal_customer_profile"
      );

      if (error) {
        throw new Error(error.message);
      }
    }
  };
}

function toInsertRow(learnerId: string, input: IdealCustomerProfileInput) {
  return {
    learner_id: learnerId,
    name: input.name,
    customer_description: input.customerDescription,
    notes: input.notes
  };
}

function decodeRowsOrThrow(
  rows: unknown[],
  operation: "listForLearner"
): IdealCustomerProfileRow[] {
  return rows.map((row, index) => decodeRowOrThrow(row, operation, index));
}

function decodeRowOrThrow(
  row: unknown,
  operation: "listForLearner" | "getActiveForLearner" | "create" | "update",
  rowIndex?: number
): IdealCustomerProfileRow {
  const decoded = Schema.decodeUnknownEither(IdealCustomerProfileRowSchema)(row);

  if (decoded._tag === "Left") {
    throw new SupabaseRowDecodeError({
      adapter: adapterName,
      operation,
      rowIndex,
      details: formatParseErrorDetails(decoded.left)
    });
  }

  return decoded.right;
}

function toIdealCustomerProfile(row: IdealCustomerProfileRow): IdealCustomerProfile {
  return {
    id: row.id,
    learnerId: row.learner_id,
    name: row.name,
    customerDescription: row.customer_description,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
