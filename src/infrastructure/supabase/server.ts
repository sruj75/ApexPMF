import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return {
    supabaseUrl,
    supabasePublishableKey
  };
}

export async function createSupabaseServerClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnvironment();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
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
  });
}
