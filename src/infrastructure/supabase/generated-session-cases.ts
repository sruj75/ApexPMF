import type { SupabaseClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";
import type {
  CreateGeneratedSessionCaseInput,
  GeneratedSessionCase
} from "@/src/domain/session/generated-session-case";
import {
  GeneratedSessionCaseRepositoryDecodeError,
  GeneratedSessionCaseRepositoryPersistenceError,
  type GeneratedSessionCaseRepository,
  type GeneratedSessionCaseRepositoryOperation
} from "@/src/domain/session/generated-session-case-repository";
import type {
  SessionReport,
  SessionTranscriptTurn
} from "@/src/domain/session/session-report";
import type { SessionEvaluationArtifact } from "@/src/domain/session/session-evaluation";
import {
  SessionEvaluationArtifactSchema,
  SessionReportSchema,
  SessionTranscriptTurnSchema,
  normalizeNullOptionalTextFields
} from "@/src/domain/session/session-artifact-contract";
import {
  createBroadPracticePoolSessionSource,
  type SessionSource
} from "@/src/domain/persona/session-source";
import type { SessionLifecycleState } from "@/src/domain/session/session-lifecycle";
import {
  formatParseErrorDetails,
  SupabaseRowDecodeError
} from "./supabase-row-decode-error";

const adapterName = "generated_session_cases";

const SourceKindSchema = Schema.Literal(
  "active-ideal-customer-profile",
  "broad-practice-pool"
);

const CustomerFitSchema = Schema.Literal(
  "strong-fit",
  "weak-fit",
  "bad-fit",
  "buyer-user-mismatch",
  "influencer"
);

const CustomerPersonaSchema = Schema.Struct({
  lightPersonaLabel: Schema.String,
  interviewRole: Schema.String,
  publicContext: Schema.String,
  privateConstraints: Schema.Array(Schema.String)
});

const HiddenTestPlanSchema = Schema.Struct({
  focusAreas: Schema.Array(Schema.String),
  successSignals: Schema.Array(Schema.String),
  failureSignals: Schema.Array(Schema.String)
});

const PersonaBehaviorSchema = Schema.Struct({
  conversationalFriction: Schema.Array(
    Schema.Literal(
      "hesitation",
      "rambling",
      "vague-answers",
      "mild-discomfort",
      "interruption",
      "questions-back"
    )
  ),
  weakQuestionSocialSignals: Schema.Array(
    Schema.Literal(
      "politeness",
      "praise",
      "speculation",
      "vague-interest"
    )
  ),
  strongQuestionTruthAnchors: Schema.Array(Schema.String),
  trapDelivery: Schema.Literal("natural-hidden")
});

const TrapSchema = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  setup: Schema.String,
  weakBehavior: Schema.String
});

const GenerationAuditSchema = Schema.Struct({
  provider: Schema.String,
  model: Schema.String,
  responseId: Schema.optional(Schema.String)
});

const ActiveIdealCustomerProfileSourceSnapshotSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  customerDescription: Schema.String,
  notes: Schema.NullOr(Schema.String)
});

const SessionStatusSchema = Schema.Literal("voice-conversation", "ended");

const SessionEndReasonSchema = Schema.NullOr(
  Schema.Literal(
    "user-quit",
    "natural-conclusion",
    "60-minute cap",
    "credit-exhaustion",
    "voice-failure"
  )
);

const ReportStatusSchema = Schema.Literal(
  "not-requested",
  "generating",
  "ready",
  "insufficient-evidence"
);

const GeneratedSessionCaseRowSchema = Schema.Struct({
  id: Schema.String,
  learner_id: Schema.String,
  source_kind: SourceKindSchema,
  source_profile_id: Schema.NullOr(Schema.String),
  source_snapshot: Schema.Unknown,
  opening_context: Schema.String,
  light_persona_label: Schema.String,
  customer_persona: CustomerPersonaSchema,
  hidden_backstory: Schema.String,
  customer_fit: CustomerFitSchema,
  hidden_test_plan: HiddenTestPlanSchema,
  persona_behavior: PersonaBehaviorSchema,
  traps: Schema.Array(TrapSchema),
  generation_nonce: Schema.String,
  generation_audit: GenerationAuditSchema,
  created_at: Schema.Date,
  session_status: SessionStatusSchema,
  ended_reason: SessionEndReasonSchema,
  ended_at: Schema.NullOr(Schema.Date),
  report_status: ReportStatusSchema,
  report_ready_at: Schema.NullOr(Schema.Date),
  session_report: Schema.NullOr(SessionReportSchema),
  session_transcript: Schema.NullOr(Schema.Array(SessionTranscriptTurnSchema)),
  session_evaluation: Schema.NullOr(SessionEvaluationArtifactSchema)
});

type GeneratedSessionCaseRow = Schema.Schema.Type<
  typeof GeneratedSessionCaseRowSchema
>;

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
  "persona_behavior",
  "traps",
  "generation_nonce",
  "generation_audit",
  "created_at",
  "session_status",
  "ended_reason",
  "ended_at",
  "report_status",
  "report_ready_at",
  "session_report",
  "session_transcript",
  "session_evaluation"
].join(", ");

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
    persona_behavior: input.personaBehavior,
    traps: input.traps,
    generation_nonce: input.generationNonce,
    generation_audit: input.generationAudit,
    session_status: "voice-conversation",
    ended_reason: null,
    ended_at: null,
    report_status: "not-requested",
    report_ready_at: null,
    session_report: null,
    session_transcript: null,
    session_evaluation: null
  };
}

function toLifecycleUpdateRow(state: SessionLifecycleState) {
  return {
    session_status: state.sessionStatus,
    ended_reason: state.endedReason,
    ended_at: state.endedAt?.toISOString() ?? null,
    report_status: state.reportStatus,
    report_ready_at: state.reportReadyAt?.toISOString() ?? null
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

  if (sessionSource.kind === "broad-practice-pool") {
    return {
      source_kind: sessionSource.kind,
      source_profile_id: null,
      source_snapshot: {
        label: sessionSource.label
      }
    };
  }

  return assertNeverSessionSource(sessionSource);
}

function querySupabase<T>(input: {
  operation: GeneratedSessionCaseRepositoryOperation;
  run: () => Promise<{ data: T; error: { message: string } | null }>;
}): Effect.Effect<
  { data: T; error: { message: string } | null },
  GeneratedSessionCaseRepositoryPersistenceError,
  never
> {
  return Effect.tryPromise({
    try: input.run,
    catch: (cause) =>
      new GeneratedSessionCaseRepositoryPersistenceError({
        operation: input.operation,
        cause
      })
  }).pipe(
    Effect.flatMap((result) =>
      result.error
        ? Effect.fail(
            new GeneratedSessionCaseRepositoryPersistenceError({
              operation: input.operation,
              cause: new Error(result.error.message)
            })
          )
        : Effect.succeed(result)
    )
  );
}

function decodeGeneratedSessionCaseRow(
  row: unknown,
  operation: GeneratedSessionCaseRepositoryOperation
): Effect.Effect<
  GeneratedSessionCase,
  GeneratedSessionCaseRepositoryDecodeError,
  never
> {
  return Effect.try({
    try: () => {
      const decodedRow = decodeWithSchemaOrThrow(
        GeneratedSessionCaseRowSchema,
        row,
        operation
      );

      return {
        id: decodedRow.id,
        learnerId: decodedRow.learner_id,
        sessionSource: decodeSessionSourceOrThrow(decodedRow, operation),
        openingContext: decodedRow.opening_context,
        customerPersona: decodedRow.customer_persona,
        hiddenBackstory: decodedRow.hidden_backstory,
        customerFit: decodedRow.customer_fit,
        hiddenTestPlan: decodedRow.hidden_test_plan,
        personaBehavior: decodedRow.persona_behavior,
        traps: decodedRow.traps,
        generationNonce: decodedRow.generation_nonce,
        generationAudit: decodedRow.generation_audit,
        createdAt: decodedRow.created_at,
        sessionLifecycle: {
          sessionStatus: decodedRow.session_status,
          endedReason: decodedRow.ended_reason,
          endedAt: decodedRow.ended_at,
          reportStatus: decodedRow.report_status,
          reportReadyAt: decodedRow.report_ready_at
        },
        sessionReport: cloneUnknownOrNull<SessionReport>(decodedRow.session_report),
        sessionTranscript: cloneUnknownOrNull<SessionTranscriptTurn[]>(
          decodedRow.session_transcript
        ),
        sessionEvaluation: cloneUnknownOrNull<SessionEvaluationArtifact>(
          decodedRow.session_evaluation
        )
      };
    },
    catch: (cause) =>
      new GeneratedSessionCaseRepositoryDecodeError({
        operation,
        cause
      })
  });
}

function decodeSessionSourceOrThrow(
  row: GeneratedSessionCaseRow,
  operation: GeneratedSessionCaseRepositoryOperation
): SessionSource {
  if (row.source_kind === "active-ideal-customer-profile") {
    const decodedSnapshot = decodeWithSchemaOrThrow(
      ActiveIdealCustomerProfileSourceSnapshotSchema,
      row.source_snapshot,
      operation
    );

    return {
      kind: "active-ideal-customer-profile",
      idealCustomerProfile: decodedSnapshot
    };
  }

  const label = readBroadPracticeLabel(row.source_snapshot);

  return createBroadPracticePoolSessionSource({
    label
  });
}

function readBroadPracticeLabel(sourceSnapshot: unknown): unknown {
  if (
    typeof sourceSnapshot === "object" &&
    sourceSnapshot !== null &&
    "label" in sourceSnapshot
  ) {
    return sourceSnapshot.label;
  }

  return undefined;
}

function decodeWithSchemaOrThrow<T, I>(
  schema: Schema.Schema<T, I, never>,
  value: unknown,
  operation: GeneratedSessionCaseRepositoryOperation
): T {
  const decoded = Schema.decodeUnknownEither(schema)(
    normalizeNullOptionalTextFields(value)
  );

  if (decoded._tag === "Left") {
    throw new SupabaseRowDecodeError({
      adapter: adapterName,
      operation,
      details: formatParseErrorDetails(decoded.left)
    });
  }

  return decoded.right;
}

function assertNeverSessionSource(sessionSource: never): never {
  throw new Error(`Unknown Session source kind: ${String(sessionSource)}`);
}

function cloneUnknownOrNull<T>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  return structuredClone(value) as T;
}
