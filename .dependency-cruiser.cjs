/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "app-no-infrastructure",
      severity: "error",
      comment: "app/* must use platform/shell/service or nodes/*/service facades",
      from: { path: "^app/" },
      to: { path: "^src/infrastructure" }
    },
    {
      name: "app-no-providers",
      severity: "error",
      from: { path: "^app/" },
      to: { path: "^src/providers" }
    },
    {
      name: "app-no-domain",
      severity: "error",
      from: { path: "^app/" },
      to: { path: "^src/domain" }
    },
    {
      name: "app-no-effect",
      severity: "error",
      from: { path: "^app/" },
      to: { path: "^node_modules/effect" }
    },
    {
      name: "providers-no-slices",
      severity: "error",
      from: { path: "^src/providers/" },
      to: {
        path: "^src/(platform|journey|nodes|application|domain|infrastructure)"
      }
    },
    {
      name: "platform-no-node-repo-runtime",
      severity: "error",
      from: { path: "^src/platform/" },
      to: {
        path: "^src/nodes/[^/]+/(repo|runtime)"
      }
    },
    {
      name: "platform-no-journey-internals",
      severity: "error",
      from: { path: "^src/platform/" },
      to: {
        path: "^src/journey/brain/(repo|runtime)"
      }
    },
    {
      name: "platform-types-no-outer-layers",
      severity: "error",
      from: { path: "^src/platform/[^/]+/[^/]+/types/" },
      to: {
        path: "^src/platform/[^/]+/[^/]+/(config|repo|service|runtime)/"
      }
    },
    {
      name: "platform-no-legacy-infrastructure",
      severity: "error",
      comment:
        "Platform slice uses providers; only auth-route-support may re-export legacy infra during migration",
      from: {
        path: "^src/platform/",
        pathNot: "^src/platform/shell/service/auth-route-support\\.ts$"
      },
      to: { path: "^src/infrastructure/" }
    },
    {
      name: "domain-no-infrastructure",
      severity: "warn",
      comment:
        "Domain must not depend on infrastructure (warn until OpenRouter generator is removed)",
      from: {
        path: "^src/domain/",
        pathNot: "^src/domain/persona/openrouter-persona-generator\\.ts$"
      },
      to: { path: "^src/infrastructure/" }
    }
  ],
  options: {
    doNotFollow: {
      path: "node_modules"
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json"
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]
    }
  }
};
