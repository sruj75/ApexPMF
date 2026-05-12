import { Effect } from "effect";
import {
  VoiceRuntimeConfigurationError,
  VoiceRuntimeConnectionError,
  VoiceRuntimeGracefulEndError,
  VoiceRuntimeInterruptionError,
  VoiceRuntimeSpeechSendError,
  type VoiceRuntime,
  type VoiceRuntimeError,
  type VoiceRuntimeOperation
} from "@/src/domain/session/voice-runtime";

export type GeminiVoiceRuntimeDependencies = {
  apiKey: string;
};

// Placeholder seam for future Gemini Live integration behind the Voice Runtime boundary.
export function createGeminiVoiceRuntime(
  dependencies: GeminiVoiceRuntimeDependencies
): VoiceRuntime {
  const state = createRuntimeState(dependencies);

  return {
    startSession() {
      return placeholderFailure(state, "start-session");
    },
    subscribe() {
      return () => {};
    },
    sendLearnerSpeech() {
      return placeholderFailure(state, "send-learner-speech");
    },
    interrupt() {
      return placeholderFailure(state, "interrupt");
    },
    end() {
      return placeholderFailure(state, "end");
    }
  };
}

type GeminiVoiceRuntimeState =
  | {
      status: "not-configured";
      failure: VoiceRuntimeConfigurationError;
    }
  | {
      status: "placeholder";
    };

type PlaceholderOperation = Exclude<VoiceRuntimeOperation, "configuration">;

function createRuntimeState(
  dependencies: GeminiVoiceRuntimeDependencies
): GeminiVoiceRuntimeState {
  if (!dependencies.apiKey) {
    return {
      status: "not-configured",
      failure: new VoiceRuntimeConfigurationError({
        operation: "configuration",
        message: "createGeminiVoiceRuntime requires a Gemini API key."
      })
    };
  }

  return {
    status: "placeholder"
  };
}

function placeholderFailure(
  state: GeminiVoiceRuntimeState,
  operation: PlaceholderOperation
): Effect.Effect<void, VoiceRuntimeError, never> {
  if (state.status === "not-configured") {
    return Effect.fail(state.failure);
  }

  return Effect.fail(unimplementedFailure(operation));
}

function unimplementedFailure(operation: PlaceholderOperation): VoiceRuntimeError {
  switch (operation) {
    case "start-session":
      return new VoiceRuntimeConnectionError({
        operation,
        message:
          "createGeminiVoiceRuntime is not implemented yet. Use a fake Voice Runtime in tests."
      });
    case "send-learner-speech":
      return new VoiceRuntimeSpeechSendError({
        operation,
        message:
          "Gemini Voice Runtime speech sending is not implemented yet."
      });
    case "interrupt":
      return new VoiceRuntimeInterruptionError({
        operation,
        message: "Gemini Voice Runtime interruption is not implemented yet."
      });
    case "end":
      return new VoiceRuntimeGracefulEndError({
        operation,
        message: "Gemini Voice Runtime graceful ending is not implemented yet."
      });
    default:
      return assertNever(operation);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Gemini Voice Runtime operation: ${String(value)}`);
}
