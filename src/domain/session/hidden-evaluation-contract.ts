import { Schema } from "effect";
import type {
  SessionEvaluationArtifact,
  SessionEvaluationInsufficientReason
} from "./session-evaluation";
import {
  decodeSessionEvaluationArtifact,
  sessionEvaluationArtifactJsonSchema
} from "./session-artifact-contract";

const ReadyEvaluationResponseEnvelopeSchema = Schema.Struct({
  status: Schema.Literal("ready"),
  reasonIfInsufficient: Schema.Null,
  evaluation: Schema.Unknown
});

const InsufficientEvaluationResponseEnvelopeSchema = Schema.Struct({
  status: Schema.Literal("insufficient-evidence"),
  reasonIfInsufficient: Schema.String,
  evaluation: Schema.Null
});

const HiddenEvaluationResponseEnvelopeSchema = Schema.Union(
  ReadyEvaluationResponseEnvelopeSchema,
  InsufficientEvaluationResponseEnvelopeSchema
);

type HiddenEvaluationResponseEnvelope = Schema.Schema.Type<
  typeof HiddenEvaluationResponseEnvelopeSchema
>;

export type HiddenEvaluationDecodeFailureReason =
  | "invalid_json"
  | "schema_validation_failed"
  | "quality_gate_failed";

export type DecodeHiddenEvaluationResponseResult =
  | {
      ok: true;
      value:
        | {
            status: "ready";
            evaluation: SessionEvaluationArtifact;
          }
        | {
            status: "insufficient-evidence";
            reason: SessionEvaluationInsufficientReason;
          };
    }
  | {
      ok: false;
      reason: HiddenEvaluationDecodeFailureReason;
    };

export const hiddenEvaluationResponseSchemaName = "hidden_evaluation";

export const hiddenEvaluationResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["status", "reasonIfInsufficient", "evaluation"],
  properties: {
    status: {
      type: "string",
      enum: ["ready", "insufficient-evidence"]
    },
    reasonIfInsufficient: {
      type: ["string", "null"]
    },
    evaluation: {
      anyOf: [
        { type: "null" },
        sessionEvaluationArtifactJsonSchema
      ]
    }
  }
} as const;

export function decodeHiddenEvaluationResponse(
  content: string
): DecodeHiddenEvaluationResponseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      ok: false,
      reason: "invalid_json"
    };
  }

  const decoded = Schema.decodeUnknownEither(HiddenEvaluationResponseEnvelopeSchema)(
    parsed
  );
  if (decoded._tag === "Left") {
    return {
      ok: false,
      reason: "schema_validation_failed"
    };
  }

  if (decoded.right.status === "ready") {
    const evaluation = decodeReadyEvaluationOrNull(decoded.right);
    if (evaluation === null) {
      return {
        ok: false,
        reason: "schema_validation_failed"
      };
    }

    if (!passesReadyEvaluationQualityGate(evaluation)) {
      return {
        ok: false,
        reason: "quality_gate_failed"
      };
    }

    return {
      ok: true,
      value: {
        status: "ready",
        evaluation
      }
    };
  }

  if (!passesInsufficientQualityGate(decoded.right.reasonIfInsufficient)) {
    return {
      ok: false,
      reason: "quality_gate_failed"
    };
  }

  return {
    ok: true,
    value: {
      status: "insufficient-evidence",
      reason: toInsufficientReason(decoded.right.reasonIfInsufficient)
    }
  };
}

function passesInsufficientQualityGate(reason: string): boolean {
  return reason.trim().length > 0;
}

function decodeReadyEvaluationOrNull(
  response: HiddenEvaluationResponseEnvelope
): SessionEvaluationArtifact | null {
  if (response.status !== "ready") {
    return null;
  }

  if (response.reasonIfInsufficient !== null || response.evaluation === null) {
    return null;
  }

  const decoded = decodeSessionEvaluationArtifact(response.evaluation);
  if (decoded._tag === "Left") {
    return null;
  }

  return structuredClone(decoded.right) as SessionEvaluationArtifact;
}

function passesReadyEvaluationQualityGate(
  evaluation: SessionEvaluationArtifact
): boolean {
  const behaviorAssessments = Object.values(evaluation.interviewBehavior);
  const nonPartialAssessmentsHaveEvidence = behaviorAssessments.every((assessment) =>
    assessment.outcome === "partial" ? true : assessment.evidence.length > 0
  );

  const trapResultsHaveEvidence = evaluation.trapResults.every(
    (trapResult) => trapResult.evidence.length > 0
  );

  return nonPartialAssessmentsHaveEvidence && trapResultsHaveEvidence;
}

function toInsufficientReason(
  reason: string
): SessionEvaluationInsufficientReason {
  const normalized = reason.trim().toLowerCase();
  switch (normalized) {
    case "not-ended":
    case "user-quit":
    case "transcript-too-short":
    case "transcript-missing-speakers":
    case "provider-failure":
    case "invalid-judge-output":
      return normalized;
    default:
      return "invalid-judge-output";
  }
}
