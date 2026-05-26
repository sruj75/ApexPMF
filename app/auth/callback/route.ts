import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  safeNextPath
} from "@/src/platform/shell/service/auth-route-support";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing-code", requestUrl.origin)
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] OAuth callback error:", error.message);
    return NextResponse.redirect(
      new URL("/login?error=callback", requestUrl.origin)
    );
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
