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

export type VoiceRuntime = {
  startSession(input: VoiceRuntimeStartInput): Promise<void>;
  subscribe(listener: (event: VoiceRuntimeEvent) => void): () => void;
  sendLearnerSpeech(input: VoiceRuntimeSpeechInput): Promise<void>;
  interrupt(input: VoiceRuntimeInterruptInput): Promise<void>;
  end(input: VoiceRuntimeEndInput): Promise<void>;
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
    async startSession() {
      emit(script.onStart);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async sendLearnerSpeech() {
      emit(script.onLearnerSpeech);
    },
    async interrupt() {
      emit(script.onInterrupt);
    },
    async end() {
      emit(script.onEnd);
    }
  };
}
