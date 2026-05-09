import { Effect } from "effect";
import {
  createBroadPracticePoolSessionSource,
  type SessionSource
} from "@/src/domain/persona/session-source";
import type {
  CreateGeneratedSessionCaseInput,
  GeneratedSessionCase
} from "@/src/domain/session/generated-session-case";
import {
  GeneratedSessionCaseRepositoryDecodeError,
  type GeneratedSessionCaseRepositoryOperation
} from "@/src/domain/session/generated-session-case-repository";
import type { SessionEvaluationArtifact } from "@/src/domain/session/session-evaluation";
import type { SessionLifecycleState } from "@/src/domain/session/session-lifecycle";
import type {
  SessionReport,
  SessionTranscriptTurn
} from "@/src/domain/session/session-report";
import {
  decodeActiveIdealCustomerProfileSourceSnapshot,
  decodeGeneratedSessionCaseRowSchema,
  type GeneratedSessionCaseRow
} from "./generated-session-cases-schema";

export function decodeGeneratedSessionCaseRow(
  row: unknown,
  operation: GeneratedSessionCaseRepositoryOperation
): Effect.Effect<
  GeneratedSessionCase,
  GeneratedSessionCaseRepositoryDecodeError,
  never
> {
  return Effect.try({
    try: () => {
      const decodedRow = decodeGeneratedSessionCaseRowSchema(row, operation);
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

export function toInsertRow(
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

export function toLifecycleUpdateRow(state: SessionLifecycleState) {
  return {
    session_status: state.sessionStatus,
    ended_reason: state.endedReason,
    ended_at: state.endedAt?.toISOString() ?? null,
    report_status: state.reportStatus,
    report_ready_at: state.reportReadyAt?.toISOString() ?? null
  };
}

function decodeSessionSourceOrThrow(
  row: GeneratedSessionCaseRow,
  operation: GeneratedSessionCaseRepositoryOperation
): SessionSource {
  if (row.source_kind === "active-ideal-customer-profile") {
    const decodedSnapshot = decodeActiveIdealCustomerProfileSourceSnapshot(
      row.source_snapshot,
      operation
    );

    return {
      kind: "active-ideal-customer-profile",
      idealCustomerProfile: decodedSnapshot
    };
  }

  const label = readBroadPracticeLabel(row.source_snapshot);
  return createBroadPracticePoolSessionSource({ label });
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

function cloneUnknownOrNull<T>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  return structuredClone(value) as T;
}

function assertNeverSessionSource(sessionSource: never): never {
  throw new Error(`Unknown Session source kind: ${String(sessionSource)}`);
}
