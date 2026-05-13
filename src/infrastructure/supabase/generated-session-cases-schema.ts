import { Schema } from "effect";
import {
  SessionEvaluationArtifactSchema,
  SessionReportSchema,
  SessionTranscriptTurnSchema,
  normalizeNullOptionalTextFields
} from "@/src/domain/session/session-artifact-contract";
import type { GeneratedSessionCaseRepositoryOperation } from "@/src/domain/session/generated-session-case-repository";
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
  session_evaluation: Schema.NullOr(SessionEvaluationArtifactSchema),
  credit_context: Schema.NullOr(
    Schema.Union(
      Schema.Struct({
        kind: Schema.Literal("free-trial"),
        maxDurationMinutes: Schema.Literal(15)
      }),
      Schema.Struct({
        kind: Schema.Literal("paid"),
        estimatedCredits: Schema.Number,
        availableCredits: Schema.Number
      })
    )
  ),
  credit_charge: Schema.NullOr(Schema.Unknown)
});

export type GeneratedSessionCaseRow = Schema.Schema.Type<
  typeof GeneratedSessionCaseRowSchema
>;

export const generatedSessionCaseColumns = [
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
  "session_evaluation",
  "credit_context",
  "credit_charge"
].join(", ");

export function decodeGeneratedSessionCaseRowSchema(
  row: unknown,
  operation: GeneratedSessionCaseRepositoryOperation
): GeneratedSessionCaseRow {
  return decodeWithSchemaOrThrow(GeneratedSessionCaseRowSchema, row, operation);
}

export function decodeActiveIdealCustomerProfileSourceSnapshot(
  value: unknown,
  operation: GeneratedSessionCaseRepositoryOperation
) {
  return decodeWithSchemaOrThrow(
    ActiveIdealCustomerProfileSourceSnapshotSchema,
    value,
    operation
  );
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
