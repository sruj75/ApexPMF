import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseProviderConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseServiceRoleKey?: string;
};

export function readSupabaseProviderConfig(
  env: NodeJS.ProcessEnv = process.env
): SupabaseProviderConfig {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY
  };
}

export function createSupabasePublishableClient(config: SupabaseProviderConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabasePublishableKey);
}

export function createSupabaseServiceRoleClient(config: SupabaseProviderConfig): SupabaseClient {
  if (!config.supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
