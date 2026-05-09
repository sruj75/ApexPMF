import {
  decodeHiddenEvaluationResponse,
  hiddenEvaluationResponseJsonSchema,
  hiddenEvaluationResponseSchemaName
} from "./hidden-evaluation-contract";
import type { HiddenEvaluationJudge } from "./hidden-evaluation-judge";
import {
  createPinnedHiddenEvaluationPromptSource,
  type HiddenEvaluationPromptSource
} from "./hidden-evaluation-prompt-source";
import type { GeneratedSessionCase } from "./generated-session-case";
import type {
  SessionEvaluationArtifact,
  SessionEvaluationInsufficientReason
} from "./session-evaluation";
import type { SessionTranscriptTurn } from "./session-report";

const minimumTranscriptTurns = 5;

export type HiddenEvaluationResult =
  | {
      status: "ready";
      evaluation: SessionEvaluationArtifact;
    }
  | {
      status: "insufficient-evidence";
      reason: SessionEvaluationInsufficientReason;
    };

export type HiddenEvaluationEngine = {
  evaluateEndedSession(input: {
    generatedSessionCase: GeneratedSessionCase;
    transcript: SessionTranscriptTurn[];
  }): Promise<HiddenEvaluationResult>;
};

export function createHiddenEvaluationEngine(input: {
  judge: HiddenEvaluationJudge;
  promptSource?: HiddenEvaluationPromptSource;
}): HiddenEvaluationEngine {
  const promptSource =
    input.promptSource ?? createPinnedHiddenEvaluationPromptSource();

  return {
    async evaluateEndedSession({ generatedSessionCase, transcript }) {
      if (generatedSessionCase.sessionLifecycle.sessionStatus !== "ended") {
        return {
          status: "insufficient-evidence",
          reason: "not-ended"
        };
      }

      if (generatedSessionCase.sessionLifecycle.endedReason === "user-quit") {
        return {
          status: "insufficient-evidence",
          reason: "user-quit"
        };
      }

      if (transcript.length < minimumTranscriptTurns) {
        return {
          status: "insufficient-evidence",
          reason: "transcript-too-short"
        };
      }

      const hasLearnerTurn = transcript.some((turn) => turn.speaker === "learner");
      const hasPersonaTurn = transcript.some((turn) => turn.speaker === "persona");
      if (!hasLearnerTurn || !hasPersonaTurn) {
        return {
          status: "insufficient-evidence",
          reason: "transcript-missing-speakers"
        };
      }

      const completion = await requestJudgeCompletion({
        judge: input.judge,
        promptSource,
        generatedSessionCase,
        transcript
      });

      if (completion.ok) {
        return completion.value;
      }

      if (completion.reason === "provider-failure") {
        return {
          status: "insufficient-evidence",
          reason: "provider-failure"
        };
      }

      const repairedCompletion = await requestJudgeCompletion({
        judge: input.judge,
        promptSource,
        generatedSessionCase,
        transcript,
        repairContent: completion.content
      });

      if (repairedCompletion.ok) {
        return repairedCompletion.value;
      }

      return {
        status: "insufficient-evidence",
        reason:
          repairedCompletion.reason === "provider-failure"
            ? "provider-failure"
            : "invalid-judge-output"
      };
    }
  };
}

async function requestJudgeCompletion(input: {
  judge: HiddenEvaluationJudge;
  promptSource: HiddenEvaluationPromptSource;
  generatedSessionCase: GeneratedSessionCase;
  transcript: SessionTranscriptTurn[];
  repairContent?: string;
}): Promise<
  | {
      ok: true;
      value: HiddenEvaluationResult;
    }
  | {
      ok: false;
      reason: "provider-failure" | "invalid-judge-output";
      content?: string;
    }
> {
  try {
    const completion = await input.judge.createStructuredJsonCompletion({
      responseSchemaName: hiddenEvaluationResponseSchemaName,
      responseJsonSchema: hiddenEvaluationResponseJsonSchema,
      messages: await buildMessages(input)
    });
    const decoded = decodeHiddenEvaluationResponse(completion.content);
    if (!decoded.ok) {
      return {
        ok: false,
        reason: "invalid-judge-output",
        content: completion.content
      };
    }

    if (decoded.value.status === "ready") {
      if (
        !allSequencesExist(
          decoded.value.evaluation,
          input.transcript.map((turn) => turn.sequence)
        )
      ) {
        return {
          ok: false,
          reason: "invalid-judge-output",
          content: completion.content
        };
      }
      return {
        ok: true,
        value: {
          status: "ready",
          evaluation: decoded.value.evaluation
        }
      };
    }

    return {
      ok: true,
      value: {
        status: "insufficient-evidence",
        reason: decoded.value.reason
      }
    };
  } catch {
    return {
      ok: false,
      reason: "provider-failure"
    };
  }
}

async function buildMessages(input: {
  promptSource: HiddenEvaluationPromptSource;
  generatedSessionCase: GeneratedSessionCase;
  transcript: SessionTranscriptTurn[];
  repairContent?: string;
}) {
  const promptBundle = await input.promptSource.getPromptBundle();
  const sessionCaseJson = JSON.stringify(input.generatedSessionCase, null, 2);
  const transcriptJson = JSON.stringify(input.transcript, null, 2);

  const baseUserPrompt = [
    promptBundle.evaluationInstruction,
    "",
    "<generated_session_case_json>",
    sessionCaseJson,
    "</generated_session_case_json>",
    "",
    "<session_transcript_json>",
    transcriptJson,
    "</session_transcript_json>"
  ].join("\n");

  if (!input.repairContent) {
    return [
      {
        role: "system" as const,
        content: promptBundle.systemPrompt
      },
      {
        role: "user" as const,
        content: baseUserPrompt
      }
    ];
  }

  return [
    {
      role: "system" as const,
      content: promptBundle.systemPrompt
    },
    {
      role: "user" as const,
      content: baseUserPrompt
    },
    {
      role: "assistant" as const,
      content: input.repairContent
    },
    {
      role: "user" as const,
      content: promptBundle.repairInstruction
    }
  ];
}

function allSequencesExist(
  evaluation: SessionEvaluationArtifact,
  sequences: number[]
) {
  const sequenceSet = new Set(sequences);
  const behaviorEvidence = Object.values(evaluation.interviewBehavior).flatMap(
    (assessment) => assessment.evidence
  );
  const learningEvidence = evaluation.learningSignal.evidence;
  const trapEvidence = evaluation.trapResults.flatMap((trap) => trap.evidence);
  return [...behaviorEvidence, ...learningEvidence, ...trapEvidence].every(
    (evidence) => sequenceSet.has(evidence.sequence)
  );
}
