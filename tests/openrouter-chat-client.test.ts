import { describe, expect, it, vi } from "vitest";
import {
  createOpenRouterHiddenEvaluationJudge,
  createOpenRouterChatClient,
  OpenRouterProviderError
} from "../src/infrastructure/llm/openrouter";

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

    const thrown = await client
      .createStructuredJsonCompletion(validRequest)
      .catch((error) => error);

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

    const thrown = await client
      .createStructuredJsonCompletion(validRequest)
      .catch((error) => error);

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

    const thrown = await client
      .createStructuredJsonCompletion(validRequest)
      .catch((error) => error);

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

    const thrown = await client
      .createStructuredJsonCompletion(validRequest)
      .catch((error) => error);

    expect(thrown).toBeInstanceOf(OpenRouterProviderError);
    expect(thrown).toMatchObject({
      phase: "invalid_response"
    });
  });
});

describe("OpenRouter hidden evaluation judge adapter", () => {
  it("delegates structured completion requests to the OpenRouter chat client", async () => {
    const chatClient = {
      createStructuredJsonCompletion: vi.fn(async () => ({
        id: "completion-1",
        model: "openai/gpt-5.2",
        content: "{\"status\":\"ready\"}"
      }))
    };
    const judge = createOpenRouterHiddenEvaluationJudge({
      chatClient
    });

    const completion = await judge.createStructuredJsonCompletion(validRequest);

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
        createStructuredJsonCompletion: vi.fn(async () => {
          throw providerError;
        })
      }
    });

    const thrown = await judge
      .createStructuredJsonCompletion(validRequest)
      .catch((error) => error);
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
