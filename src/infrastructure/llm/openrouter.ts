import type { HiddenEvaluationJudge } from "@/src/domain/session/hidden-evaluation-judge";
import { Effect } from "effect";

export type OpenRouterChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterChatClient = {
  createStructuredJsonCompletion(
    request: OpenRouterStructuredJsonRequest
  ): Effect.Effect<OpenRouterStructuredJsonCompletion, OpenRouterProviderError, never>;
};

export type OpenRouterStructuredJsonRequest = {
  messages: OpenRouterChatMessage[];
  responseSchemaName: string;
  responseJsonSchema: Record<string, unknown>;
};

export type OpenRouterStructuredJsonCompletion = {
  id: string;
  model: string;
  content: string;
};

export function createOpenRouterHiddenEvaluationJudge(input: {
  chatClient: OpenRouterChatClient;
}): HiddenEvaluationJudge {
  return {
    createStructuredJsonCompletion(request) {
      return Effect.runPromise(
        input.chatClient.createStructuredJsonCompletion(request).pipe(
          Effect.map((completion) => ({
            content: completion.content
          }))
        )
      );
    }
  };
}

export class OpenRouterProviderError extends Error {
  readonly name = "OpenRouterProviderError";
  readonly phase: "request_failed" | "invalid_response";
  readonly status?: number;
  readonly statusText?: string;
  readonly cause?: unknown;

  constructor(input: {
    message: string;
    phase: "request_failed" | "invalid_response";
    status?: number;
    statusText?: string;
    cause?: unknown;
  }) {
    super(input.message);
    this.phase = input.phase;
    this.status = input.status;
    this.statusText = input.statusText;
    this.cause = input.cause;
  }
}

type FetchLike = (
  input: string,
  init: RequestInit
) => Promise<Response>;

type OpenRouterChatClientOptions = {
  apiKey: string;
  model: string;
  appTitle?: string;
  siteUrl?: string;
  fetch?: FetchLike;
};

type OpenRouterCompletionResponse = {
  id?: unknown;
  model?: unknown;
  choices?: unknown;
};

export function createOpenRouterChatClient({
  apiKey,
  model,
  appTitle,
  siteUrl,
  fetch: fetchImplementation = fetch
}: OpenRouterChatClientOptions): OpenRouterChatClient {
  return {
    createStructuredJsonCompletion(request) {
      return Effect.tryPromise({
        try: async () => {
          let response: Response;

          try {
            response = await fetchImplementation(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",
                headers: headersForRequest({ apiKey, appTitle, siteUrl }),
                body: JSON.stringify({
                  model,
                  messages: request.messages,
                  stream: false,
                  response_format: {
                    type: "json_schema",
                    json_schema: {
                      name: request.responseSchemaName,
                      strict: true,
                      schema: request.responseJsonSchema
                    }
                  }
                })
              }
            );
          } catch (cause) {
            throw new OpenRouterProviderError({
              phase: "request_failed",
              message: "OpenRouter request failed before receiving a response.",
              cause
            });
          }

          if (!response.ok) {
            const errorBody = await response.text().catch(() => "");
            throw new OpenRouterProviderError({
              phase: "request_failed",
              status: response.status,
              statusText: response.statusText,
              message: `OpenRouter request failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ""}`
            });
          }

          let body: OpenRouterCompletionResponse;
          try {
            body = (await response.json()) as OpenRouterCompletionResponse;
          } catch (cause) {
            throw new OpenRouterProviderError({
              phase: "invalid_response",
              message: "OpenRouter response is not valid JSON.",
              cause
            });
          }

          return parseCompletionResponse(body);
        },
        catch: (cause) =>
          cause instanceof OpenRouterProviderError
            ? cause
            : new OpenRouterProviderError({
                phase: "request_failed",
                message: "OpenRouter request failed before receiving a response.",
                cause
              })
      });
    }
  };
}

function headersForRequest({
  apiKey,
  appTitle,
  siteUrl
}: {
  apiKey: string;
  appTitle?: string;
  siteUrl?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  if (siteUrl) {
    headers["HTTP-Referer"] = siteUrl;
  }

  if (appTitle) {
    headers["X-Title"] = appTitle;
  }

  return headers;
}

function parseCompletionResponse(
  body: OpenRouterCompletionResponse
): OpenRouterStructuredJsonCompletion {
  const firstChoice = Array.isArray(body.choices) ? body.choices[0] : null;
  const message =
    firstChoice &&
    typeof firstChoice === "object" &&
    "message" in firstChoice
      ? firstChoice.message
      : null;
  const content =
    message && typeof message === "object" && "content" in message
      ? message.content
      : null;

  if (
    typeof body.id !== "string" ||
    typeof body.model !== "string" ||
    typeof content !== "string"
  ) {
    throw new OpenRouterProviderError({
      phase: "invalid_response",
      message: "OpenRouter response is invalid."
    });
  }

  return {
    id: body.id,
    model: body.model,
    content
  };
}
