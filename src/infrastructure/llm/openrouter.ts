export type OpenRouterChatMessage = {
  role: "system" | "user";
  content: string;
};

export type OpenRouterChatClient = {
  createStructuredJsonCompletion(
    request: OpenRouterStructuredJsonRequest
  ): Promise<OpenRouterStructuredJsonCompletion>;
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
    async createStructuredJsonCompletion(request) {
      const response = await fetchImplementation(
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

      if (!response.ok) {
        throw new Error("OpenRouter request failed.");
      }

      const body = (await response.json()) as OpenRouterCompletionResponse;
      return parseCompletionResponse(body);
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
    throw new Error("OpenRouter response is invalid.");
  }

  return {
    id: body.id,
    model: body.model,
    content
  };
}
