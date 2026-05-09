import { Schema } from "effect";
import type {
  SessionReport,
  SessionTranscriptTurn
} from "./session-report";
import type { SessionEvaluationArtifact } from "./session-evaluation";

const BehaviorOutcomeSchema = Schema.Literal("met", "missed", "partial");
const TrapOutcomeSchema = Schema.Literal("triggered", "avoided", "partial");

export const PersonaEvidenceRefSchema = Schema.Struct({
  sequence: Schema.Number,
  turnId: Schema.optional(Schema.String),
  snippet: Schema.optional(Schema.String),
  title: Schema.String,
  detail: Schema.String
});

const BehaviorAssessmentSchema = Schema.Struct({
  outcome: BehaviorOutcomeSchema,
  note: Schema.String,
  evidence: Schema.Array(PersonaEvidenceRefSchema)
});

export const SessionEvaluationArtifactSchema = Schema.Struct({
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
    evidence: Schema.Array(PersonaEvidenceRefSchema)
  }),
  trapResults: Schema.Array(
    Schema.Struct({
      trapId: Schema.String,
      trapLabel: Schema.String,
      outcome: TrapOutcomeSchema,
      detail: Schema.String,
      evidence: Schema.Array(PersonaEvidenceRefSchema)
    })
  ),
  excludedDimensions: Schema.Struct({
    accent: Schema.Literal("not-scored"),
    charisma: Schema.Literal("not-scored"),
    vocalPolish: Schema.Literal("not-scored"),
    soundingConfident: Schema.Literal("not-scored")
  })
});

const SkillMovementSchema = Schema.Struct({
  skill: Schema.String,
  movement: Schema.Literal("up", "flat", "down"),
  rationale: Schema.String
});

export const SessionReportSchema = Schema.Struct({
  outcome: Schema.Struct({
    summary: Schema.String
  }),
  missedSignals: Schema.Array(
    Schema.Struct({
      title: Schema.String,
      detail: Schema.String,
      evidence: Schema.Array(PersonaEvidenceRefSchema)
    })
  ),
  badQuestions: Schema.Array(
    Schema.Struct({
      question: Schema.String,
      whyItMissed: Schema.String,
      evidence: Schema.Array(PersonaEvidenceRefSchema)
    })
  ),
  strongQuestions: Schema.Array(
    Schema.Struct({
      question: Schema.String,
      whyItWorked: Schema.String,
      evidence: Schema.Array(PersonaEvidenceRefSchema)
    })
  ),
  trapResults: Schema.Array(
    Schema.Struct({
      trapLabel: Schema.String,
      outcome: TrapOutcomeSchema,
      detail: Schema.String,
      evidence: Schema.Array(PersonaEvidenceRefSchema)
    })
  ),
  skillMovement: Schema.Array(SkillMovementSchema),
  nextPracticeFocus: Schema.Struct({
    title: Schema.String,
    description: Schema.String
  }),
  sourceContext: Schema.String,
  lightPersonaLabel: Schema.String,
  expandableEvidence: Schema.Array(PersonaEvidenceRefSchema)
});

const SessionTranscriptTurnMetadataSchema = Schema.Struct({
  cue: Schema.optional(Schema.String),
  latencyMs: Schema.optional(Schema.Number)
});

export const SessionTranscriptTurnSchema = Schema.Struct({
  sequence: Schema.Number,
  turnId: Schema.optional(Schema.String),
  speaker: Schema.Literal("learner", "persona"),
  text: Schema.String,
  metadata: Schema.optional(SessionTranscriptTurnMetadataSchema)
});

const SessionTranscriptSchema = Schema.Array(SessionTranscriptTurnSchema);

export function decodeSessionEvaluationArtifact(
  value: unknown
) {
  return Schema.decodeUnknownEither(SessionEvaluationArtifactSchema)(
    normalizeNullOptionalTextFields(value)
  );
}

export function decodeSessionReport(value: unknown) {
  return Schema.decodeUnknownEither(SessionReportSchema)(
    normalizeNullOptionalTextFields(value)
  );
}

export function decodeSessionTranscript(value: unknown) {
  return Schema.decodeUnknownEither(SessionTranscriptSchema)(
    normalizeNullOptionalTextFields(value)
  );
}

export function normalizeNullOptionalTextFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeNullOptionalTextFields);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  const normalized: Record<string, unknown> = {};
  for (const [key, entryValue] of Object.entries(value)) {
    if ((key === "turnId" || key === "snippet") && entryValue === null) {
      continue;
    }

    normalized[key] = normalizeNullOptionalTextFields(entryValue);
  }

  return normalized;
}

export const sessionEvaluationArtifactJsonSchema = {
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
} as const;

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

export type SessionEvaluationArtifactSchemaTypeCheck = Schema.Schema.Type<
  typeof SessionEvaluationArtifactSchema
> extends SessionEvaluationArtifact
  ? true
  : never;

export type SessionReportSchemaTypeCheck = Schema.Schema.Type<
  typeof SessionReportSchema
> extends SessionReport
  ? true
  : never;

export type SessionTranscriptTurnSchemaTypeCheck = Schema.Schema.Type<
  typeof SessionTranscriptTurnSchema
> extends SessionTranscriptTurn
  ? true
  : never;
