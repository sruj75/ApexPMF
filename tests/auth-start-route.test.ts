import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn();

vi.mock("@/src/infrastructure/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      signInWithOAuth
    }
  }))
}));

describe("Google OAuth start route", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
  });

  it("moves local 127.0.0.1 auth starts to localhost before OAuth", async () => {
    const { GET } = await import("../app/auth/start/route");
    const response = await GET(
      new NextRequest("http://127.0.0.1:3000/auth/start?next=/dashboard", {
        headers: {
          host: "127.0.0.1:3000"
        }
      })
    );

    expect(signInWithOAuth).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/start?next=%2Fdashboard"
    );
  });

  it("redirects visitors to Supabase Google OAuth", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.example/oauth" },
      error: null
    });

    const { GET } = await import("../app/auth/start/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/auth/start?next=/dashboard")
    );

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback?next=%2Fdashboard"
      }
    });
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.example/oauth"
    );
  });
});
