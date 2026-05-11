import { describe, expect, it, vi } from "vitest";
import {
  createOpenRouterHiddenEvaluationJudge,
  createOpenRouterChatClient,
  OpenRouterProviderError
} from "../src/infrastructure/llm/openrouter";
import { Effect, Schedule } from "effect";

const noDelayRetryTwice = Schedule.recurs(2);
const noRetries = Schedule.stop;

describe("OpenRouter chat client transport failures", () => {
  it("throws typed provider failure when request fails before receiving response", async () => {
    const transportFailure = new Error("network unavailable");
    const fetch = vi.fn(async () => {
      throw transportFailure;
    });
    const client = createOpenRouterChatClient({
      apiKey: "openrouter-key",
      model: "openai/gpt-5.2",
      fetch
    });

    const thrown = await Effect.runPromise(
      client.createStructuredJsonCompletion(validRequest).pipe(Effect.flip)
    );

    expect(thrown).toBeInstanceOf(OpenRouterProviderError);
    expect(thrown).toMatchObject({
      phase: "request_failed",
      message: "OpenRouter request failed before receiving a response.",
      cause: transportFailure
    });
  });

  it("throws typed provider failure with status context on non-2xx responses", async () => {
    const fetch = vi.fn(async () => new Response("upstream exploded", {
      status: 502,
      statusText: "Bad Gateway"
    }));
    const client = createOpenRouterChatClient({
      apiKey: "openrouter-key",
      model: "openai/gpt-5.2",
      fetch
    });

    const thrown = await Effect.runPromise(
      client.createStructuredJsonCompletion(validRequest).pipe(Effect.flip)
    );

    expect(thrown).toBeInstanceOf(OpenRouterProviderError);
    expect(thrown).toMatchObject({
      phase: "request_failed",
      status: 502,
      statusText: "Bad Gateway"
    });
  });

  it("throws typed provider failure when response envelope is invalid", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        id: "completion-1",
        model: "openai/gpt-5.2",
        choices: []
      })
    );
    const client = createOpenRouterChatClient({
      apiKey: "openrouter-key",
      model: "openai/gpt-5.2",
      fetch
    });

    const thrown = await Effect.runPromise(
      client.createStructuredJsonCompletion(validRequest).pipe(Effect.flip)
    );

    expect(thrown).toBeInstanceOf(OpenRouterProviderError);
    expect(thrown).toMatchObject({
      phase: "invalid_response"
    });
  });

  it("throws typed provider failure when a 2xx response body is not JSON", async () => {
    const fetch = vi.fn(
      async () =>
        new Response("<html>proxy error</html>", {
          status: 200,
          headers: { "content-type": "text/html" }
        })
    );
    const client = createOpenRouterChatClient({
      apiKey: "openrouter-key",
      model: "openai/gpt-5.2",
      fetch
    });

    const thrown = await Effect.runPromise(
      client.createStructuredJsonCompletion(validRequest).pipe(Effect.flip)
    );

    expect(thrown).toBeInstanceOf(OpenRouterProviderError);
    expect(thrown).toMatchObject({
      phase: "invalid_response"
    });
  });
});

describe("OpenRouter chat client retry policy", () => {
  it("retries transient 503 responses and succeeds on a subsequent attempt", async () => {
    const successBody = {
      id: "completion-1",
      model: "openai/gpt-5.2",
      choices: [{ message: { content: "{\"value\":\"ok\"}" } }]
    };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("upstream busy", { status: 503, statusText: "Service Unavailable" })
      )
      .mockResolvedValueOnce(Response.json(successBody));

    const client = createOpenRouterChatClient({
      apiKey: "openrouter-key",
      model: "openai/gpt-5.2",
      fetch,
      retrySchedule: noDelayRetryTwice
    });

    const completion = await Effect.runPromise(
      client.createStructuredJsonCompletion(validRequest)
    );

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(completion).toEqual({
      id: "completion-1",
      model: "openai/gpt-5.2",
      content: "{\"value\":\"ok\"}"
    });
  });
});

describe("OpenRouter chat client non-retryable failures", () => {
  it("does not retry on 400 Bad Request", async () => {
    const fetch = vi.fn(async () =>
      new Response("bad input", { status: 400, statusText: "Bad Request" })
    );
    const client = createOpenRouterChatClient({
      apiKey: "openrouter-key",
      model: "openai/gpt-5.2",
      fetch,
      retrySchedule: noDelayRetryTwice
    });

    const thrown = await Effect.runPromise(
      client.createStructuredJsonCompletion(validRequest).pipe(Effect.flip)
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(thrown).toMatchObject({ phase: "request_failed", status: 400 });
  });

  it("does not retry on invalid_response (non-JSON 2xx body)", async () => {
    const fetch = vi.fn(
      async () =>
        new Response("<html>proxy error</html>", {
          status: 200,
          headers: { "content-type": "text/html" }
        })
    );
    const client = createOpenRouterChatClient({
      apiKey: "openrouter-key",
      model: "openai/gpt-5.2",
      fetch,
      retrySchedule: noDelayRetryTwice
    });

    await Effect.runPromise(
      client.createStructuredJsonCompletion(validRequest).pipe(Effect.flip)
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry on 501 Not Implemented", async () => {
    const fetch = vi.fn(
      async () => new Response("nope", { status: 501, statusText: "Not Implemented" })
    );
    const client = createOpenRouterChatClient({
      apiKey: "openrouter-key",
      model: "openai/gpt-5.2",
      fetch,
      retrySchedule: noDelayRetryTwice
    });

    await Effect.runPromise(
      client.createStructuredJsonCompletion(validRequest).pipe(Effect.flip)
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("OpenRouter chat client per-attempt timeout", () => {
  it("maps a per-attempt timeout to a typed provider failure", async () => {
    const fetch = vi.fn(
      () =>
        new Promise<Response>(() => {
          /* never resolves */
        })
    );
    const client = createOpenRouterChatClient({
      apiKey: "openrouter-key",
      model: "openai/gpt-5.2",
      fetch,
      retrySchedule: noRetries,
      attemptTimeoutMillis: 10
    });

    const thrown = await Effect.runPromise(
      client.createStructuredJsonCompletion(validRequest).pipe(Effect.flip)
    );

    expect(thrown).toBeInstanceOf(OpenRouterProviderError);
    expect(thrown).toMatchObject({ phase: "request_failed" });
    expect((thrown as OpenRouterProviderError).message).toMatch(/timed out/i);
  });
});

describe("OpenRouter hidden evaluation judge adapter", () => {
  it("delegates structured completion requests to the OpenRouter chat client", async () => {
    const chatClient = {
      createStructuredJsonCompletion: vi.fn(() =>
        Effect.succeed({
          id: "completion-1",
          model: "openai/gpt-5.2",
          content: "{\"status\":\"ready\"}"
        })
      )
    };
    const judge = createOpenRouterHiddenEvaluationJudge({
      chatClient
    });

    const completion = await Effect.runPromise(
      judge.createStructuredJsonCompletion(validRequest)
    );

    expect(chatClient.createStructuredJsonCompletion).toHaveBeenCalledTimes(1);
    expect(chatClient.createStructuredJsonCompletion).toHaveBeenCalledWith(
      validRequest
    );
    expect(completion).toEqual({
      content: "{\"status\":\"ready\"}"
    });
  });

  it("rethrows provider errors from the OpenRouter chat client", async () => {
    const providerError = new OpenRouterProviderError({
      phase: "request_failed",
      message: "OpenRouter request failed: 503 Service Unavailable",
      status: 503,
      statusText: "Service Unavailable"
    });
    const judge = createOpenRouterHiddenEvaluationJudge({
      chatClient: {
        createStructuredJsonCompletion: vi.fn(() => Effect.fail(providerError))
      }
    });

    const thrown = await Effect.runPromise(
      judge.createStructuredJsonCompletion(validRequest).pipe(Effect.flip)
    );
    expect(thrown).toBe(providerError);
  });
});

const validRequest = {
  messages: [
    {
      role: "user" as const,
      content: "Generate one valid JSON object."
    }
  ],
  responseSchemaName: "test_schema",
  responseJsonSchema: {
    type: "object",
    additionalProperties: false,
    required: ["value"],
    properties: {
      value: { type: "string" }
    }
  }
};
