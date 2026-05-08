import { describe, expect, it, vi } from "vitest";
import {
  createOpenRouterPersonaGenerator,
  PersonaGenerationDecodeError
} from "../src/domain/persona/openrouter-persona-generator";
import { createOpenRouterChatClient } from "../src/infrastructure/llm/openrouter";

describe("OpenRouter Persona Generation", () => {
  it("requests structured JSON and maps a valid Generated Session Case draft", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        id: "completion-1",
        model: "openai/gpt-5.2",
        choices: [
          {
            message: {
              content: JSON.stringify(validPersonaGenerationResponse)
            }
          }
        ]
      })
    );
    const personaGenerator = createOpenRouterPersonaGenerator({
      chatClient: createOpenRouterChatClient({
        apiKey: "openrouter-key",
        model: "openai/gpt-5.2",
        appTitle: "The Mom Test Simulator",
        siteUrl: "https://example.test",
        fetch
      })
    });

    const generated = await personaGenerator.generateSessionCase({
      generationNonce: "nonce-1",
      sessionSource: {
        kind: "broad-practice-pool",
        label: "Broad Practice Pool"
      }
    });

    expect(generated).toEqual({
      ...validPersonaGenerationResponse,
      generationAudit: {
        provider: "openrouter",
        model: "openai/gpt-5.2",
        responseId: "completion-1"
      }
    });
    expect(fetch).toHaveBeenCalledOnce();

    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer openrouter-key",
      "Content-Type": "application/json",
      "HTTP-Referer": "https://example.test",
      "X-Title": "The Mom Test Simulator"
    });
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      model: "openai/gpt-5.2",
      stream: false,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "generated_session_case",
          strict: true
        }
      }
    });
    expect(body.response_format.json_schema.schema.required).toContain(
      "hiddenBackstory"
    );
    expect(body.response_format.json_schema.schema.required).toContain(
      "personaBehavior"
    );
    expect(JSON.stringify(body.messages)).toContain("personaBehavior");
    expect(JSON.stringify(body.messages)).toContain("Broad Practice Pool");
  });

  it("rejects malformed Persona Generation JSON before it enters the domain", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        id: "completion-2",
        model: "openai/gpt-5.2",
        choices: [
          {
            message: {
              content: JSON.stringify({
                ...(() => {
                  const invalidResponse = { ...validPersonaGenerationResponse };
                  delete invalidResponse.hiddenBackstory;
                  return invalidResponse;
                })()
              })
            }
          }
        ]
      })
    );
    const personaGenerator = createOpenRouterPersonaGenerator({
      chatClient: createOpenRouterChatClient({
        apiKey: "openrouter-key",
        model: "openai/gpt-5.2",
        fetch
      })
    });

    await expect(
      personaGenerator.generateSessionCase({
        generationNonce: "nonce-2",
        sessionSource: {
          kind: "active-ideal-customer-profile",
          idealCustomerProfile: {
            id: "profile-1",
            name: "Finance operators",
            customerDescription: "Controllers at growing SaaS companies",
            notes: null
          }
        }
      })
    ).rejects.toBeInstanceOf(PersonaGenerationDecodeError);
    await expect(
      personaGenerator.generateSessionCase({
        generationNonce: "nonce-2",
        sessionSource: {
          kind: "active-ideal-customer-profile",
          idealCustomerProfile: {
            id: "profile-1",
            name: "Finance operators",
            customerDescription: "Controllers at growing SaaS companies",
            notes: null
          }
        }
      })
    ).rejects.toMatchObject({
      reason: "schema_validation_failed"
    });
  });

  it("rejects invalid JSON responses before schema validation", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        id: "completion-3",
        model: "openai/gpt-5.2",
        choices: [
          {
            message: {
              content: "{this is not valid json"
            }
          }
        ]
      })
    );
    const personaGenerator = createOpenRouterPersonaGenerator({
      chatClient: createOpenRouterChatClient({
        apiKey: "openrouter-key",
        model: "openai/gpt-5.2",
        fetch
      })
    });

    await expect(
      personaGenerator.generateSessionCase({
        generationNonce: "nonce-3",
        sessionSource: {
          kind: "broad-practice-pool",
          label: "Broad Practice Pool"
        }
      })
    ).rejects.toBeInstanceOf(PersonaGenerationDecodeError);
    await expect(
      personaGenerator.generateSessionCase({
        generationNonce: "nonce-3",
        sessionSource: {
          kind: "broad-practice-pool",
          label: "Broad Practice Pool"
        }
      })
    ).rejects.toMatchObject({
      reason: "invalid_json"
    });
  });

  it("rejects quality-gate failures before the domain consumes the response", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        id: "completion-4",
        model: "openai/gpt-5.2",
        choices: [
          {
            message: {
              content: JSON.stringify({
                ...validPersonaGenerationResponse,
                traps: []
              })
            }
          }
        ]
      })
    );
    const personaGenerator = createOpenRouterPersonaGenerator({
      chatClient: createOpenRouterChatClient({
        apiKey: "openrouter-key",
        model: "openai/gpt-5.2",
        fetch
      })
    });

    await expect(
      personaGenerator.generateSessionCase({
        generationNonce: "nonce-4",
        sessionSource: {
          kind: "broad-practice-pool",
          label: "Broad Practice Pool"
        }
      })
    ).rejects.toBeInstanceOf(PersonaGenerationDecodeError);
    await expect(
      personaGenerator.generateSessionCase({
        generationNonce: "nonce-4",
        sessionSource: {
          kind: "broad-practice-pool",
          label: "Broad Practice Pool"
        }
      })
    ).rejects.toMatchObject({
      reason: "quality_gate_failed"
    });
  });
});

const validPersonaGenerationResponse = {
  openingContext:
    "You are speaking with a controller who recently tried to reduce month-end reporting delays.",
  customerPersona: {
    lightPersonaLabel: "SaaS controller",
    interviewRole: "Controller at a 90-person SaaS company",
    publicContext:
      "Owns month-end close and coordinates reporting with department leaders.",
    privateConstraints: [
      "VP Finance owns budget",
      "Recently tried an automation consultant"
    ]
  },
  hiddenBackstory:
    "The controller lost two weekends rebuilding reports after a failed automation handoff.",
  customerFit: "strong-fit",
  hiddenTestPlan: {
    focusAreas: ["Concrete History", "decision process"],
    successSignals: ["Asks about recent attempts"],
    failureSignals: ["Pitches before understanding workflow"]
  },
  personaBehavior: {
    conversationalFriction: [
      "hesitation",
      "rambling",
      "vague-answers",
      "mild-discomfort",
      "interruption",
      "questions-back"
    ],
    weakQuestionSocialSignals: [
      "politeness",
      "praise",
      "speculation",
      "vague-interest"
    ],
    strongQuestionTruthAnchors: [
      "paid-consultant-attempt",
      "manual-rebuild-weekend"
    ],
    trapDelivery: "natural-hidden"
  },
  traps: [
    {
      id: "trap-1",
      label: "Vague Interest Trap",
      setup: "Persona says better reporting sounds useful.",
      weakBehavior: "Learner treats polite interest as validation."
    }
  ]
};
