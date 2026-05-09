import type { VoiceRuntime } from "@/src/domain/session/voice-runtime";

export type GeminiVoiceRuntimeDependencies = {
  apiKey: string;
};

// Placeholder seam for future Gemini Live integration behind the Voice Runtime boundary.
export function createGeminiVoiceRuntime(
  dependencies: GeminiVoiceRuntimeDependencies
): VoiceRuntime {
  if (!dependencies.apiKey) {
    throw new Error("createGeminiVoiceRuntime requires a Gemini API key.");
  }

  throw new Error(
    "createGeminiVoiceRuntime is not implemented yet. Use a fake Voice Runtime in tests."
  );
}
