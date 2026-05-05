import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/infrastructure/supabase/server";
import { safeNextPath } from "@/src/infrastructure/http/safe-next-path";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));
  const host = request.headers.get("host") ?? requestUrl.host;

  if (host.startsWith("127.0.0.1")) {
    const canonicalLocalUrl = new URL(requestUrl);
    canonicalLocalUrl.hostname = "localhost";
    canonicalLocalUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(canonicalLocalUrl);
  }

  const callbackUrl = new URL("/auth/callback", requestUrl.origin);
  callbackUrl.searchParams.set("next", nextPath);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString()
    }
  });

  if (error || !data.url) {
    console.error(
      "[auth/start] OAuth initiation failed:",
      error?.message ?? "No redirect URL returned"
    );
    return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));
  }

  return NextResponse.redirect(data.url);
}
