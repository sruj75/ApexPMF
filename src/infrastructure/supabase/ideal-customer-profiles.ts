import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IdealCustomerProfile,
  IdealCustomerProfileInput
} from "@/src/domain/persona/ideal-customer-profile";
import type { IdealCustomerProfileRepository } from "@/src/domain/persona/ideal-customer-profile-repository";

type IdealCustomerProfileRow = {
  id: string;
  learner_id: string;
  name: string;
  customer_description: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function createSupabaseIdealCustomerProfileRepository(
  supabase: SupabaseClient
): IdealCustomerProfileRepository {
  return {
    async listForLearner(learnerId) {
      const { data, error } = await supabase
        .from("ideal_customer_profiles")
        .select(
          "id, learner_id, name, customer_description, notes, is_active, created_at, updated_at"
        )
        .eq("learner_id", learnerId)
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map(toIdealCustomerProfile);
    },

    async getActiveForLearner(learnerId) {
      const { data, error } = await supabase
        .from("ideal_customer_profiles")
        .select(
          "id, learner_id, name, customer_description, notes, is_active, created_at, updated_at"
        )
        .eq("learner_id", learnerId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data ? toIdealCustomerProfile(data) : null;
    },

    async create(learnerId, input) {
      const { data, error } = await supabase
        .from("ideal_customer_profiles")
        .insert(toInsertRow(learnerId, input))
        .select(
          "id, learner_id, name, customer_description, notes, is_active, created_at, updated_at"
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return toIdealCustomerProfile(data);
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
        .select(
          "id, learner_id, name, customer_description, notes, is_active, created_at, updated_at"
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return toIdealCustomerProfile(data);
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

function toIdealCustomerProfile(
  row: IdealCustomerProfileRow
): IdealCustomerProfile {
  return {
    id: row.id,
    learnerId: row.learner_id,
    name: row.name,
    customerDescription: row.customer_description,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
