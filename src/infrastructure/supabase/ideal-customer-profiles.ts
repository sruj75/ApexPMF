import type { SupabaseClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";
import type {
  IdealCustomerProfile,
  IdealCustomerProfileInput
} from "@/src/domain/persona/ideal-customer-profile";
import {
  IdealCustomerProfileRepositoryDecodeError,
  type IdealCustomerProfileRepositoryDecodeDetail,
  type IdealCustomerProfileRepositoryDecodeOperation,
  IdealCustomerProfileRepositoryNotFoundError,
  IdealCustomerProfileRepositoryPersistenceError,
  type IdealCustomerProfileRepository,
  type IdealCustomerProfileRepositoryOperation
} from "@/src/domain/persona/ideal-customer-profile-repository";
import {
  formatParseErrorDetails
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
    listForLearner(learnerId) {
      return Effect.gen(function* () {
        const result = yield* queryIdealCustomerProfiles({
          operation: "listForLearner",
          run: () =>
            supabase
              .from("ideal_customer_profiles")
              .select(idealCustomerProfileColumns)
              .eq("learner_id", learnerId)
              .order("updated_at", { ascending: false })
        });

        const rows = yield* decodeRows(result.data ?? [], "listForLearner");
        return rows.map(toIdealCustomerProfile);
      });
    },

    getActiveForLearner(learnerId) {
      return Effect.gen(function* () {
        const result = yield* queryIdealCustomerProfiles({
          operation: "getActiveForLearner",
          run: () =>
            supabase
              .from("ideal_customer_profiles")
              .select(idealCustomerProfileColumns)
              .eq("learner_id", learnerId)
              .eq("is_active", true)
              .maybeSingle()
        });

        if (!result.data) {
          return null;
        }

        const row = yield* decodeRow(result.data, "getActiveForLearner");
        return toIdealCustomerProfile(row);
      });
    },

    create(learnerId, input) {
      return Effect.gen(function* () {
        const result = yield* queryIdealCustomerProfiles({
          operation: "create",
          run: () =>
            supabase
              .from("ideal_customer_profiles")
              .insert(toInsertRow(learnerId, input))
              .select(idealCustomerProfileColumns)
              .single()
        });

        const row = yield* decodeRow(result.data, "create");
        return toIdealCustomerProfile(row);
      });
    },

    update(learnerId, profileId, input) {
      return Effect.gen(function* () {
        const result = yield* queryIdealCustomerProfiles({
          operation: "update",
          run: () =>
            supabase
              .from("ideal_customer_profiles")
              .update({
                name: input.name,
                customer_description: input.customerDescription,
                notes: input.notes
              })
              .eq("learner_id", learnerId)
              .eq("id", profileId)
              .select(idealCustomerProfileColumns)
              .maybeSingle()
        });

        if (!result.data) {
          return yield* Effect.fail(
            new IdealCustomerProfileRepositoryNotFoundError({
              learnerId,
              profileId,
              operation: "update"
            })
          );
        }

        const row = yield* decodeRow(result.data, "update");
        return toIdealCustomerProfile(row);
      });
    },

    selectActive(_learnerId, profileId) {
      return queryIdealCustomerProfiles({
        operation: "selectActive",
        run: () =>
          supabase.rpc("select_active_ideal_customer_profile", {
            profile_id: profileId
          })
      }).pipe(Effect.asVoid);
    },

    clearActive() {
      return queryIdealCustomerProfiles({
        operation: "clearActive",
        run: () => supabase.rpc("clear_active_ideal_customer_profile")
      }).pipe(Effect.asVoid);
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

function queryIdealCustomerProfiles<T>(input: {
  operation: IdealCustomerProfileRepositoryOperation;
  run: () => PromiseLike<{ data: T; error: { message: string } | null }>;
}): Effect.Effect<
  { data: T; error: { message: string } | null },
  IdealCustomerProfileRepositoryPersistenceError,
  never
> {
  return Effect.tryPromise({
    try: input.run,
    catch: (cause) =>
      new IdealCustomerProfileRepositoryPersistenceError({
        operation: input.operation,
        cause
      })
  }).pipe(
    Effect.flatMap((result) =>
      result.error
        ? Effect.fail(
            new IdealCustomerProfileRepositoryPersistenceError({
              operation: input.operation,
              cause: new Error(result.error.message)
            })
          )
        : Effect.succeed(result)
    )
  );
}

function decodeRows(
  rows: unknown[],
  operation: "listForLearner"
): Effect.Effect<IdealCustomerProfileRow[], IdealCustomerProfileRepositoryDecodeError> {
  return Effect.forEach(rows, (row, index) => decodeRow(row, operation, index));
}

function decodeRow(
  row: unknown,
  operation: IdealCustomerProfileRepositoryDecodeOperation,
  rowIndex?: number
): Effect.Effect<IdealCustomerProfileRow, IdealCustomerProfileRepositoryDecodeError> {
  const decoded = Schema.decodeUnknownEither(IdealCustomerProfileRowSchema)(row);
  if (decoded._tag === "Left") {
    return Effect.fail(
      new IdealCustomerProfileRepositoryDecodeError({
        operation,
        cause: decodeDetail({
          operation,
          rowIndex,
          details: formatParseErrorDetails(decoded.left)
        })
      })
    );
  }

  return Effect.succeed(decoded.right);
}

function decodeDetail(input: {
  operation: IdealCustomerProfileRepositoryDecodeOperation;
  rowIndex?: number;
  details: readonly string[];
}): IdealCustomerProfileRepositoryDecodeDetail {
  return {
    _tag: "IdealCustomerProfileRepositoryDecodeDetail",
    adapter: adapterName,
    operation: input.operation,
    ...(typeof input.rowIndex === "number" ? { rowIndex: input.rowIndex } : {}),
    details: input.details
  };
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
