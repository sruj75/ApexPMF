import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Data, Effect } from "effect";
import { cookies } from "next/headers";

export class SupabaseServerConfigurationError extends Data.TaggedError(
  "SupabaseServerConfigurationError"
)<{
  message: string;
}> {}

export class SupabaseServerDependencyError extends Data.TaggedError(
  "SupabaseServerDependencyError"
)<{
  operation: "cookies" | "create-server-client" | "create-admin-client";
  cause: unknown;
}> {}

export type SupabaseServerClientError =
  | SupabaseServerConfigurationError
  | SupabaseServerDependencyError;

function getSupabaseEnvironment(): Effect.Effect<
  {
    supabaseUrl: string;
    supabasePublishableKey: string;
  },
  SupabaseServerConfigurationError,
  never
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return Effect.fail(
      new SupabaseServerConfigurationError({
        message:
          "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
      })
    );
  }

  return Effect.succeed({
    supabaseUrl,
    supabasePublishableKey
  });
}

function getSupabaseAdminEnvironment(): Effect.Effect<
  {
    supabaseUrl: string;
    supabaseServiceRoleKey: string;
  },
  SupabaseServerConfigurationError,
  never
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return Effect.fail(
      new SupabaseServerConfigurationError({
        message:
          "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      })
    );
  }

  return Effect.succeed({
    supabaseUrl,
    supabaseServiceRoleKey
  });
}

export function createSupabaseServerClientEffect(): Effect.Effect<
  ReturnType<typeof createServerClient>,
  SupabaseServerClientError,
  never
> {
  return Effect.gen(function* () {
    const { supabaseUrl, supabasePublishableKey } = yield* getSupabaseEnvironment();
    const cookieStore = yield* Effect.tryPromise({
      try: () => cookies(),
      catch: (cause) =>
        new SupabaseServerDependencyError({
          operation: "cookies",
          cause
        })
    });

    return yield* Effect.try({
      try: () =>
        createServerClient(supabaseUrl, supabasePublishableKey, {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              } catch (error) {
                // Server Components cannot set cookies; route handlers can.
                if (process.env.NODE_ENV === "development") {
                  console.debug(
                    "[supabase/server] Cookie set skipped in Server Component context.",
                    error
                  );
                }
              }
            }
          }
        }),
      catch: (cause) =>
        new SupabaseServerDependencyError({
          operation: "create-server-client",
          cause
        })
    });
  });
}

export async function createSupabaseServerClient() {
  return Effect.runPromise(createSupabaseServerClientEffect());
}

export function createSupabaseAdminClientEffect(): Effect.Effect<
  SupabaseClient,
  SupabaseServerClientError,
  never
> {
  return Effect.gen(function* () {
    const { supabaseUrl, supabaseServiceRoleKey } =
      yield* getSupabaseAdminEnvironment();

    return yield* Effect.try({
      try: () =>
        createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }),
      catch: (cause) =>
        new SupabaseServerDependencyError({
          operation: "create-admin-client",
          cause
        })
    });
  });
}
