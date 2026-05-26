import { describe, expect, it } from "vitest";
import {
  createInMemoryPlatformShellRepository,
  createPlatformShellService,
  ProjectSlugConflictError,
  type FounderApiKeyValidationOutcome
} from "@/src/platform/shell/service";

describe("Platform shell service foundation", () => {
  it("creates projects with per-founder slug suffixes", async () => {
    const repository = createInMemoryPlatformShellRepository();
    const service = createPlatformShellService({
      repository,
      encrypt: (value) => `enc:${value}`,
      decrypt: (value) => value.replace(/^enc:/, ""),
      validateFounderApiKey: async () => ({ kind: "valid" })
    });

    const first = await service.createProject("founder-1", "Acme Health");
    const second = await service.createProject("founder-1", "Acme Health");
    const otherFounder = await service.createProject("founder-2", "Acme Health");

    expect(first.slug).toBe("acme-health");
    expect(second.slug).toBe("acme-health-2");
    expect(otherFounder.slug).toBe("acme-health");
  });

  it("maps missing and non-owner slug lookups to not-found", async () => {
    const repository = createInMemoryPlatformShellRepository();
    const service = createPlatformShellService({
      repository,
      encrypt: (value) => `enc:${value}`,
      decrypt: (value) => value.replace(/^enc:/, ""),
      validateFounderApiKey: async () => ({ kind: "valid" })
    });

    const project = await service.createProject("founder-1", "My Startup");
    const owner = await service.resolveProjectSlug("founder-1", project.slug);
    const nonOwner = await service.resolveProjectSlug("founder-2", project.slug);
    const missing = await service.resolveProjectSlug("founder-1", "does-not-exist");

    expect(owner).toMatchObject({ found: true, projectId: project.id });
    expect(nonOwner).toEqual({ found: false });
    expect(missing).toEqual({ found: false });
  });

  it("persists founder API key handle encrypted and returns typed gate states", async () => {
    const repository = createInMemoryPlatformShellRepository();

    let nextValidation: FounderApiKeyValidationOutcome = { kind: "valid" };

    const service = createPlatformShellService({
      repository,
      encrypt: (value) => `enc:${value}`,
      decrypt: (value) => value.replace(/^enc:/, ""),
      validateFounderApiKey: async () => nextValidation
    });

    const missing = await service.requireValidFounderApiKey("founder-1");
    expect(missing).toEqual({ kind: "missing" });

    await service.saveFounderApiKeyHandle("founder-1", "AIza_TEST_1234");

    const stored = await service.loadFounderApiKeyHandle("founder-1");
    expect(stored).toMatchObject({
      founderId: "founder-1",
      encryptedKey: "enc:AIza_TEST_1234",
      keyLast4: "1234",
      validationStatus: "valid"
    });

    nextValidation = { kind: "invalid" };
    const invalid = await service.requireValidFounderApiKey("founder-1");
    expect(invalid).toEqual({ kind: "invalid" });

    nextValidation = { kind: "transient-failure", reason: "network" };
    const transient = await service.requireValidFounderApiKey("founder-1");
    expect(transient).toEqual({ kind: "transient-failure", reason: "network" });
  });

  it("throws conflict from repo as typed error", async () => {
    const repository = createInMemoryPlatformShellRepository();
    repository.setConflictMode(true);

    const service = createPlatformShellService({
      repository,
      encrypt: (value) => value,
      decrypt: (value) => value,
      validateFounderApiKey: async () => ({ kind: "valid" })
    });

    await expect(service.createProject("founder-1", "Acme")).rejects.toBeInstanceOf(
      ProjectSlugConflictError
    );
  });
});
