import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createScriptedVoiceRuntime,
  VoiceRuntimeConfigurationError,
  VoiceRuntimeConnectionError,
  VoiceRuntimeGracefulEndError,
  VoiceRuntimeInterruptionError,
  VoiceRuntimeSpeechSendError,
  type VoiceRuntimeEvent
} from "../src/domain/session/voice-runtime";
import { createGeminiVoiceRuntime } from "../src/infrastructure/gemini/voice-runtime";

describe("Voice Runtime boundary", () => {
  it("emits speech, persona, transcript, interruption, latency, and failure events through the public contract", async () => {
    const events: VoiceRuntimeEvent[] = [];
    const runtime = createScriptedVoiceRuntime({
      onStart: [
        {
          type: "learner-speech-input",
          text: "I just started the call."
        },
        {
          type: "persona-output",
          text: "Thanks for taking the time."
        }
      ],
      onLearnerSpeech: [
        {
          type: "transcript-turn",
          speaker: "learner",
          text: "What did you try before this?"
        }
      ],
      onInterrupt: [
        {
          type: "interruption",
          interruptedBy: "learner"
        }
      ],
      onEnd: [
        {
          type: "latency",
          phase: "persona-response",
          milliseconds: 420
        },
        {
          type: "failure",
          stage: "transcription",
          recoverable: false,
          message: "transcript stream disconnected"
        }
      ]
    });

    runtime.subscribe((event) => {
      events.push(event);
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        yield* runtime.startSession({
          sessionId: "session-case-1"
        });
        yield* runtime.sendLearnerSpeech({
          text: "Tell me about your last workflow."
        });
        yield* runtime.interrupt({
          reason: "learner"
        });
        yield* runtime.end({
          reason: "user-quit"
        });
      })
    );

    expect(events.map((event) => event.type)).toEqual([
      "learner-speech-input",
      "persona-output",
      "transcript-turn",
      "interruption",
      "latency",
      "failure"
    ]);
  });

  it("preserves interruption ordering when interruption is emitted with adjacent runtime events", async () => {
    const events: VoiceRuntimeEvent[] = [];
    const runtime = createScriptedVoiceRuntime({
      onInterrupt: [
        {
          type: "persona-output",
          text: "I was still explaining that point."
        },
        {
          type: "interruption",
          interruptedBy: "learner"
        },
        {
          type: "transcript-turn",
          speaker: "persona",
          text: "I was still explaining that point."
        }
      ]
    });

    runtime.subscribe((event) => {
      events.push(event);
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        yield* runtime.startSession({
          sessionId: "session-case-2"
        });
        yield* runtime.interrupt({
          reason: "learner"
        });
      })
    );

    expect(events).toEqual([
      {
        type: "persona-output",
        text: "I was still explaining that point."
      },
      {
        type: "interruption",
        interruptedBy: "learner"
      },
      {
        type: "transcript-turn",
        speaker: "persona",
        text: "I was still explaining that point."
      }
    ]);
  });

  it("propagates latency and failure signals with payload fidelity", async () => {
    const events: VoiceRuntimeEvent[] = [];
    const runtime = createScriptedVoiceRuntime({
      onLearnerSpeech: [
        {
          type: "latency",
          phase: "speech-to-transcript",
          milliseconds: 975
        },
        {
          type: "failure",
          stage: "output",
          recoverable: true,
          message: "audio output reconnecting"
        }
      ]
    });

    runtime.subscribe((event) => {
      events.push(event);
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        yield* runtime.startSession({
          sessionId: "session-case-3"
        });
        yield* runtime.sendLearnerSpeech({
          text: "How are you doing this now?"
        });
      })
    );

    expect(events).toEqual([
      {
        type: "latency",
        phase: "speech-to-transcript",
        milliseconds: 975
      },
      {
        type: "failure",
        stage: "output",
        recoverable: true,
        message: "audio output reconnecting"
      }
    ]);
  });

  it("returns typed configuration failure for missing Gemini credentials", async () => {
    const runtime = createGeminiVoiceRuntime({
      apiKey: ""
    });

    const failures = await Promise.all([
      Effect.runPromise(
        Effect.flip(runtime.startSession({ sessionId: "session-case-4" }))
      ),
      Effect.runPromise(
        Effect.flip(runtime.sendLearnerSpeech({ text: "Hello?" }))
      ),
      Effect.runPromise(Effect.flip(runtime.interrupt({ reason: "learner" }))),
      Effect.runPromise(Effect.flip(runtime.end({ reason: "user-quit" })))
    ]);

    expect(failures).toHaveLength(4);
    for (const failure of failures) {
      expect(failure).toBeInstanceOf(VoiceRuntimeConfigurationError);
      expect(failure).toMatchObject({
        operation: "configuration"
      });
    }
  });

  it("keeps Gemini placeholder failures typed by runtime operation", async () => {
    const runtime = createGeminiVoiceRuntime({
      apiKey: "test-key"
    });

    const cases = [
      {
        effect: runtime.startSession({ sessionId: "session-case-5" }),
        error: VoiceRuntimeConnectionError,
        operation: "start-session"
      },
      {
        effect: runtime.sendLearnerSpeech({ text: "Tell me more." }),
        error: VoiceRuntimeSpeechSendError,
        operation: "send-learner-speech"
      },
      {
        effect: runtime.interrupt({ reason: "learner" }),
        error: VoiceRuntimeInterruptionError,
        operation: "interrupt"
      },
      {
        effect: runtime.end({ reason: "user-quit" }),
        error: VoiceRuntimeGracefulEndError,
        operation: "end"
      }
    ];

    for (const testCase of cases) {
      const failure = await Effect.runPromise(Effect.flip(testCase.effect));

      expect(failure).toBeInstanceOf(testCase.error);
      expect(failure).toMatchObject({
        operation: testCase.operation
      });
    }
  });
});
