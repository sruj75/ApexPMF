/**
 * Auth route adapters for `app/auth/*` during platform migration.
 * Re-exports legacy infrastructure until OAuth lives under providers + shell service.
 */
export { createSupabaseServerClient } from "@/src/infrastructure/supabase/server";
export { safeNextPath } from "@/src/infrastructure/http/safe-next-path";
