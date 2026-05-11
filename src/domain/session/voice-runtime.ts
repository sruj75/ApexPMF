import { Data, Effect } from "effect";

export type VoiceRuntimeEvent =
  | {
      type: "learner-speech-input";
      text: string;
    }
  | {
      type: "persona-output";
      text: string;
    }
  | {
      type: "transcript-turn";
      speaker: "learner" | "persona";
      text: string;
    }
  | {
      type: "interruption";
      interruptedBy: "learner" | "persona";
    }
  | {
      type: "latency";
      phase: "speech-to-transcript" | "persona-response";
      milliseconds: number;
    }
  | {
      type: "failure";
      stage: "input" | "output" | "transcription" | "connection";
      recoverable: boolean;
      message: string;
    };

export type VoiceRuntimeStartInput = {
  sessionId: string;
};

export type VoiceRuntimeSpeechInput = {
  text: string;
};

export type VoiceRuntimeInterruptInput = {
  reason: "learner" | "persona";
};

export type VoiceRuntimeEndInput = {
  reason: "user-quit" | "natural-conclusion" | "voice-failure" | "credit-exhaustion";
};

export type VoiceRuntimeOperation =
  | "configuration"
  | "start-session"
  | "send-learner-speech"
  | "interrupt"
  | "end";

export class VoiceRuntimeConfigurationError extends Data.TaggedError(
  "VoiceRuntimeConfigurationError"
)<{
  operation: "configuration";
  message: string;
  cause?: unknown;
}> {}

export class VoiceRuntimeConnectionError extends Data.TaggedError(
  "VoiceRuntimeConnectionError"
)<{
  operation: "start-session";
  message: string;
  cause?: unknown;
}> {}

export class VoiceRuntimeSpeechSendError extends Data.TaggedError(
  "VoiceRuntimeSpeechSendError"
)<{
  operation: "send-learner-speech";
  message: string;
  cause?: unknown;
}> {}

export class VoiceRuntimeInterruptionError extends Data.TaggedError(
  "VoiceRuntimeInterruptionError"
)<{
  operation: "interrupt";
  message: string;
  cause?: unknown;
}> {}

export class VoiceRuntimeGracefulEndError extends Data.TaggedError(
  "VoiceRuntimeGracefulEndError"
)<{
  operation: "end";
  message: string;
  cause?: unknown;
}> {}

export type VoiceRuntimeError =
  | VoiceRuntimeConfigurationError
  | VoiceRuntimeConnectionError
  | VoiceRuntimeSpeechSendError
  | VoiceRuntimeInterruptionError
  | VoiceRuntimeGracefulEndError;

export type VoiceRuntime = {
  startSession(
    input: VoiceRuntimeStartInput
  ): Effect.Effect<void, VoiceRuntimeError, never>;
  subscribe(listener: (event: VoiceRuntimeEvent) => void): () => void;
  sendLearnerSpeech(
    input: VoiceRuntimeSpeechInput
  ): Effect.Effect<void, VoiceRuntimeError, never>;
  interrupt(
    input: VoiceRuntimeInterruptInput
  ): Effect.Effect<void, VoiceRuntimeError, never>;
  end(input: VoiceRuntimeEndInput): Effect.Effect<void, VoiceRuntimeError, never>;
};

type ScriptedVoiceRuntimeScript = {
  onStart?: readonly VoiceRuntimeEvent[];
  onLearnerSpeech?: readonly VoiceRuntimeEvent[];
  onInterrupt?: readonly VoiceRuntimeEvent[];
  onEnd?: readonly VoiceRuntimeEvent[];
};

export function createScriptedVoiceRuntime(
  script: ScriptedVoiceRuntimeScript = {}
): VoiceRuntime {
  const listeners = new Set<(event: VoiceRuntimeEvent) => void>();

  const emit = (events: readonly VoiceRuntimeEvent[] | undefined) => {
    for (const event of events ?? []) {
      for (const listener of listeners) {
        listener(event);
      }
    }
  };

  return {
    startSession() {
      return Effect.sync(() => {
      emit(script.onStart);
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    sendLearnerSpeech() {
      return Effect.sync(() => {
      emit(script.onLearnerSpeech);
      });
    },
    interrupt() {
      return Effect.sync(() => {
      emit(script.onInterrupt);
      });
    },
    end() {
      return Effect.sync(() => {
      emit(script.onEnd);
      });
    }
  };
}
