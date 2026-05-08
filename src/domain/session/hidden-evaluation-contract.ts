import { Schema } from "effect";
import type {
  SessionEvaluationArtifact,
  SessionEvaluationInsufficientReason
} from "./session-evaluation";

const BehaviorOutcomeSchema = Schema.Literal("met", "missed", "partial");

const EvidenceRefSchema = Schema.Struct({
  sequence: Schema.Number,
  turnId: Schema.NullOr(Schema.String),
  snippet: Schema.NullOr(Schema.String),
  title: Schema.String,
  detail: Schema.String
});

const BehaviorAssessmentSchema = Schema.Struct({
  outcome: BehaviorOutcomeSchema,
  note: Schema.String,
  evidence: Schema.Array(EvidenceRefSchema)
});

const SessionEvaluationArtifactSchema = Schema.Struct({
  interviewBehavior: Schema.Struct({
    avoidingPitching: BehaviorAssessmentSchema,
    askingConcreteHistory: BehaviorAssessmentSchema,
    followingUpOnVagueAnswers: BehaviorAssessmentSchema,
    resistingCompliments: BehaviorAssessmentSchema,
    identifyingBadFitPersonas: BehaviorAssessmentSchema,
    uncoveringWorkaroundsOrDecisionProcess: BehaviorAssessmentSchema
  }),
  learningSignal: Schema.Struct({
    quality: Schema.Literal("high", "medium", "low"),
    summary: Schema.String,
    evidence: Schema.Array(EvidenceRefSchema)
  }),
  trapResults: Schema.Array(
    Schema.Struct({
      trapId: Schema.String,
      trapLabel: Schema.String,
      outcome: Schema.Literal("triggered", "avoided", "partial"),
      detail: Schema.String,
      evidence: Schema.Array(EvidenceRefSchema)
    })
  ),
  excludedDimensions: Schema.Struct({
    accent: Schema.Literal("not-scored"),
    charisma: Schema.Literal("not-scored"),
    vocalPolish: Schema.Literal("not-scored"),
    soundingConfident: Schema.Literal("not-scored")
  })
});

const ReadyEvaluationResponseSchema = Schema.Struct({
  status: Schema.Literal("ready"),
  reasonIfInsufficient: Schema.Null,
  evaluation: SessionEvaluationArtifactSchema
});

const InsufficientEvaluationResponseSchema = Schema.Struct({
  status: Schema.Literal("insufficient-evidence"),
  reasonIfInsufficient: Schema.String,
  evaluation: Schema.Null
});

const HiddenEvaluationResponseSchema = Schema.Union(
  ReadyEvaluationResponseSchema,
  InsufficientEvaluationResponseSchema
);

type HiddenEvaluationResponse = Schema.Schema.Type<
  typeof HiddenEvaluationResponseSchema
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
        {
          type: "object",
          additionalProperties: false,
          required: [
            "interviewBehavior",
            "learningSignal",
            "trapResults",
            "excludedDimensions"
          ],
          properties: {
            interviewBehavior: {
              type: "object",
              additionalProperties: false,
              required: [
                "avoidingPitching",
                "askingConcreteHistory",
                "followingUpOnVagueAnswers",
                "resistingCompliments",
                "identifyingBadFitPersonas",
                "uncoveringWorkaroundsOrDecisionProcess"
              ],
              properties: {
                avoidingPitching: behaviorAssessmentJsonSchema(),
                askingConcreteHistory: behaviorAssessmentJsonSchema(),
                followingUpOnVagueAnswers: behaviorAssessmentJsonSchema(),
                resistingCompliments: behaviorAssessmentJsonSchema(),
                identifyingBadFitPersonas: behaviorAssessmentJsonSchema(),
                uncoveringWorkaroundsOrDecisionProcess:
                  behaviorAssessmentJsonSchema()
              }
            },
            learningSignal: {
              type: "object",
              additionalProperties: false,
              required: ["quality", "summary", "evidence"],
              properties: {
                quality: {
                  type: "string",
                  enum: ["high", "medium", "low"]
                },
                summary: { type: "string" },
                evidence: evidenceRefArrayJsonSchema()
              }
            },
            trapResults: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "trapId",
                  "trapLabel",
                  "outcome",
                  "detail",
                  "evidence"
                ],
                properties: {
                  trapId: { type: "string" },
                  trapLabel: { type: "string" },
                  outcome: {
                    type: "string",
                    enum: ["triggered", "avoided", "partial"]
                  },
                  detail: { type: "string" },
                  evidence: evidenceRefArrayJsonSchema()
                }
              }
            },
            excludedDimensions: {
              type: "object",
              additionalProperties: false,
              required: [
                "accent",
                "charisma",
                "vocalPolish",
                "soundingConfident"
              ],
              properties: {
                accent: { type: "string", enum: ["not-scored"] },
                charisma: { type: "string", enum: ["not-scored"] },
                vocalPolish: { type: "string", enum: ["not-scored"] },
                soundingConfident: { type: "string", enum: ["not-scored"] }
              }
            }
          }
        }
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

  const decoded = Schema.decodeUnknownEither(HiddenEvaluationResponseSchema)(parsed);
  if (decoded._tag === "Left") {
    return {
      ok: false,
      reason: "schema_validation_failed"
    };
  }

  if (!passesQualityGate(decoded.right)) {
    return {
      ok: false,
      reason: "quality_gate_failed"
    };
  }

  if (decoded.right.status === "ready") {
    return {
      ok: true,
      value: {
        status: "ready",
        evaluation: decoded.right.evaluation as SessionEvaluationArtifact
      }
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

function passesQualityGate(response: HiddenEvaluationResponse): boolean {
  if (response.status === "insufficient-evidence") {
    return response.evaluation === null && response.reasonIfInsufficient.trim().length > 0;
  }

  if (response.reasonIfInsufficient !== null || response.evaluation === null) {
    return false;
  }

  const behaviorAssessments = Object.values(response.evaluation.interviewBehavior);
  const nonPartialAssessmentsHaveEvidence = behaviorAssessments.every((assessment) =>
    assessment.outcome === "partial" ? true : assessment.evidence.length > 0
  );

  const trapResultsHaveEvidence = response.evaluation.trapResults.every(
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

function evidenceRefJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["sequence", "turnId", "snippet", "title", "detail"],
    properties: {
      sequence: { type: "number" },
      turnId: { type: ["string", "null"] },
      snippet: { type: ["string", "null"] },
      title: { type: "string" },
      detail: { type: "string" }
    }
  } as const;
}

function evidenceRefArrayJsonSchema() {
  return {
    type: "array",
    items: evidenceRefJsonSchema()
  } as const;
}

function behaviorAssessmentJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["outcome", "note", "evidence"],
    properties: {
      outcome: {
        type: "string",
        enum: ["met", "missed", "partial"]
      },
      note: { type: "string" },
      evidence: evidenceRefArrayJsonSchema()
    }
  } as const;
}
