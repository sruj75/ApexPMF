import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260526000100_platform_store_projects_and_founder_api_keys.sql"
  ),
  "utf-8"
);

describe("Platform store foundation migration", () => {
  it("creates projects and founder API key tables", () => {
    expect(migration).toContain("create table if not exists public.projects");
    expect(migration).toContain("create table if not exists public.founder_api_keys");
    expect(migration).toContain("unique (founder_id, slug)");
    expect(migration).toContain("validation_status text not null");
    expect(migration).toContain("last_validated_at timestamptz null");
    expect(migration).toContain("key_last4 text not null");
  });

  it("renames interview-table ownership columns and enforces project scoping", () => {
    expect(migration).toContain(
      "alter table public.generated_session_cases rename column learner_id to founder_id"
    );
    expect(migration).toContain(
      "alter table public.ideal_customer_profiles rename column learner_id to founder_id"
    );
    expect(migration).toContain(
      "alter table public.learner_progressions rename column learner_id to founder_id"
    );
    expect(migration).toContain("add column if not exists project_id uuid");
    expect(migration).toContain(
      "add constraint generated_session_cases_project_id_fkey"
    );
    expect(migration).toContain(
      "add constraint ideal_customer_profiles_project_id_fkey"
    );
    expect(migration).toContain(
      "add constraint learner_progressions_project_id_fkey"
    );
    expect(migration).toContain("alter column project_id set not null");
  });

  it("adds compatibility trigger for default project assignment", () => {
    expect(migration).toContain(
      "create or replace function public.resolve_default_project_id_for_founder"
    );
    expect(migration).toContain(
      "create or replace function public.assign_project_id_from_founder"
    );
    expect(migration).toContain("before insert on public.generated_session_cases");
    expect(migration).toContain("before insert on public.ideal_customer_profiles");
    expect(migration).toContain("before insert on public.learner_progressions");
  });
});
