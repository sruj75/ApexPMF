export type FounderApiKeyValidationOutcome =
  | { kind: "valid" }
  | { kind: "invalid" }
  | { kind: "transient-failure"; reason: string };

export async function validateFounderApiKeyLive(input: {
  apiKey: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<FounderApiKeyValidationOutcome> {
  const timeoutMs = input.timeoutMs ?? 2000;
  const fetchImpl = input.fetchImpl ?? fetch;

  if (!input.apiKey.trim()) {
    return { kind: "invalid" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(input.apiKey)}`,
      {
        method: "GET",
        signal: controller.signal
      }
    );

    if (response.status === 200) {
      return { kind: "valid" };
    }

    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return { kind: "invalid" };
    }

    return {
      kind: "transient-failure",
      reason: `provider-status-${response.status}`
    };
  } catch (error) {
    return {
      kind: "transient-failure",
      reason: error instanceof Error ? error.message : "network"
    };
  } finally {
    clearTimeout(timeout);
  }
}

export {
  createFounderApiKeyCipher,
  readFounderApiKeyCipherConfig
} from "./founder-api-key-cipher";
