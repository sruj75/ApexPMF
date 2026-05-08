import type { OpenRouterChatClient } from "@/src/infrastructure/llm/openrouter";
import {
  decodeHiddenEvaluationResponse,
  hiddenEvaluationResponseJsonSchema,
  hiddenEvaluationResponseSchemaName
} from "./hidden-evaluation-contract";
import { hiddenEvaluationJudgePrompt } from "./hidden-evaluation-prompt";
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
  chatClient: OpenRouterChatClient;
}): HiddenEvaluationEngine {
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
        chatClient: input.chatClient,
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
        chatClient: input.chatClient,
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
  chatClient: OpenRouterChatClient;
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
    const completion = await input.chatClient.createStructuredJsonCompletion({
      responseSchemaName: hiddenEvaluationResponseSchemaName,
      responseJsonSchema: hiddenEvaluationResponseJsonSchema,
      messages: buildMessages(input)
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

function buildMessages(input: {
  generatedSessionCase: GeneratedSessionCase;
  transcript: SessionTranscriptTurn[];
  repairContent?: string;
}) {
  const sessionCaseJson = JSON.stringify(input.generatedSessionCase, null, 2);
  const transcriptJson = JSON.stringify(input.transcript, null, 2);

  const baseUserPrompt = [
    "Evaluate this completed Session.",
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
        content: hiddenEvaluationJudgePrompt
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
      content: hiddenEvaluationJudgePrompt
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
      content:
        "Repair your previous response to strict JSON schema compliance only. Keep decisions unchanged where possible. Return JSON only."
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
