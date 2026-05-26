export type ProjectRecord = {
  id: string;
  founderId: string;
  displayName: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FounderApiKeyValidationStatus = "valid" | "invalid" | "unknown";

export type FounderApiKeyHandleRecord = {
  founderId: string;
  encryptedKey: string;
  keyLast4: string;
  validationStatus: FounderApiKeyValidationStatus;
  lastValidatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FounderApiKeyValidationOutcome =
  | { kind: "valid" }
  | { kind: "invalid" }
  | { kind: "transient-failure"; reason: string };

export type RequireValidFounderApiKeyOutcome =
  | { kind: "missing" }
  | { kind: "valid" }
  | { kind: "invalid" }
  | { kind: "transient-failure"; reason: string };

export class ProjectSlugConflictError extends Error {
  readonly name = "ProjectSlugConflictError";

  constructor(message: string) {
    super(message);
  }
}

export interface PlatformShellRepository {
  createProject(input: {
    founderId: string;
    displayName: string;
    slug: string;
  }): Promise<ProjectRecord>;
  listProjects(founderId: string): Promise<ProjectRecord[]>;
  findProjectBySlugForFounder(input: {
    founderId: string;
    slug: string;
  }): Promise<ProjectRecord | null>;
  upsertFounderApiKeyHandle(input: {
    founderId: string;
    encryptedKey: string;
    keyLast4: string;
    validationStatus: FounderApiKeyValidationStatus;
    lastValidatedAt: Date | null;
  }): Promise<FounderApiKeyHandleRecord>;
  getFounderApiKeyHandle(founderId: string): Promise<FounderApiKeyHandleRecord | null>;
}

export function createPlatformShellService(input: {
  repository: PlatformShellRepository;
  encrypt: (value: string) => string;
  decrypt: (value: string) => string;
  validateFounderApiKey: (
    apiKey: string
  ) => Promise<FounderApiKeyValidationOutcome>;
}) {
  return {
    async createProject(founderId: string, displayName: string): Promise<ProjectRecord> {
      const baseSlug = slugify(displayName);
      const normalizedBaseSlug = baseSlug.length > 0 ? baseSlug : "project";

      for (let attempt = 1; attempt <= 50; attempt++) {
        const slug = attempt === 1 ? normalizedBaseSlug : `${normalizedBaseSlug}-${attempt}`;
        try {
          return await input.repository.createProject({
            founderId,
            displayName,
            slug
          });
        } catch (error) {
          if (!(error instanceof ProjectSlugConflictError)) {
            throw error;
          }
        }
      }

      throw new ProjectSlugConflictError(
        `Could not allocate a project slug for founder ${founderId}.`
      );
    },

    listProjects(founderId: string): Promise<ProjectRecord[]> {
      return input.repository.listProjects(founderId);
    },

    async resolveProjectSlug(founderId: string, slug: string): Promise<
      | {
          found: true;
          projectId: string;
          project: ProjectRecord;
        }
      | { found: false }
    > {
      const project = await input.repository.findProjectBySlugForFounder({
        founderId,
        slug
      });

      if (!project) {
        return { found: false };
      }

      return {
        found: true,
        projectId: project.id,
        project
      };
    },

    async saveFounderApiKeyHandle(
      founderId: string,
      plaintextApiKey: string
    ): Promise<FounderApiKeyHandleRecord> {
      const validation = await input.validateFounderApiKey(plaintextApiKey);
      const now = new Date();

      return input.repository.upsertFounderApiKeyHandle({
        founderId,
        encryptedKey: input.encrypt(plaintextApiKey),
        keyLast4: plaintextApiKey.slice(-4),
        validationStatus:
          validation.kind === "transient-failure"
            ? "unknown"
            : validation.kind,
        lastValidatedAt: validation.kind === "valid" || validation.kind === "invalid" ? now : null
      });
    },

    loadFounderApiKeyHandle(founderId: string): Promise<FounderApiKeyHandleRecord | null> {
      return input.repository.getFounderApiKeyHandle(founderId);
    },

    async requireValidFounderApiKey(
      founderId: string
    ): Promise<RequireValidFounderApiKeyOutcome> {
      const handle = await input.repository.getFounderApiKeyHandle(founderId);

      if (!handle) {
        return { kind: "missing" };
      }

      const decrypted = input.decrypt(handle.encryptedKey);
      const validation = await input.validateFounderApiKey(decrypted);

      if (validation.kind === "valid") {
        await input.repository.upsertFounderApiKeyHandle({
          founderId,
          encryptedKey: handle.encryptedKey,
          keyLast4: handle.keyLast4,
          validationStatus: "valid",
          lastValidatedAt: new Date()
        });

        return { kind: "valid" };
      }

      if (validation.kind === "invalid") {
        await input.repository.upsertFounderApiKeyHandle({
          founderId,
          encryptedKey: handle.encryptedKey,
          keyLast4: handle.keyLast4,
          validationStatus: "invalid",
          lastValidatedAt: new Date()
        });

        return { kind: "invalid" };
      }

      await input.repository.upsertFounderApiKeyHandle({
        founderId,
        encryptedKey: handle.encryptedKey,
        keyLast4: handle.keyLast4,
        validationStatus: "unknown",
        lastValidatedAt: handle.lastValidatedAt
      });

      return validation;
    }
  };
}

export function createInMemoryPlatformShellRepository(): PlatformShellRepository & {
  setConflictMode(enabled: boolean): void;
} {
  let conflictMode = false;
  const projects = new Map<string, ProjectRecord>();
  const apiKeys = new Map<string, FounderApiKeyHandleRecord>();

  return {
    setConflictMode(enabled: boolean) {
      conflictMode = enabled;
    },

    async createProject({ founderId, displayName, slug }) {
      if (conflictMode) {
        throw new ProjectSlugConflictError("Slug conflict simulated.");
      }

      const existing = Array.from(projects.values()).find(
        (project) => project.founderId === founderId && project.slug === slug
      );

      if (existing) {
        throw new ProjectSlugConflictError("Slug already exists for founder.");
      }

      const now = new Date();
      const record: ProjectRecord = {
        id: `project-${projects.size + 1}`,
        founderId,
        displayName,
        slug,
        createdAt: now,
        updatedAt: now
      };

      projects.set(record.id, record);
      return record;
    },

    async listProjects(founderId: string) {
      return Array.from(projects.values()).filter((project) => project.founderId === founderId);
    },

    async findProjectBySlugForFounder({ founderId, slug }) {
      return (
        Array.from(projects.values()).find(
          (project) => project.founderId === founderId && project.slug === slug
        ) ?? null
      );
    },

    async upsertFounderApiKeyHandle({
      founderId,
      encryptedKey,
      keyLast4,
      validationStatus,
      lastValidatedAt
    }) {
      const existing = apiKeys.get(founderId);
      const now = new Date();

      const record: FounderApiKeyHandleRecord = {
        founderId,
        encryptedKey,
        keyLast4,
        validationStatus,
        lastValidatedAt,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      apiKeys.set(founderId, record);
      return record;
    },

    async getFounderApiKeyHandle(founderId: string) {
      return apiKeys.get(founderId) ?? null;
    }
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
