import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();

vi.mock("@/src/infrastructure/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession
    }
  }))
}));

describe("OAuth callback route", () => {
  beforeEach(() => {
    vi.resetModules();
    exchangeCodeForSession.mockReset();
  });

  it("exchanges the OAuth code and redirects to the Practice Dashboard", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=abc123&next=/dashboard"
      )
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard"
    );
  });

  it("redirects to login when code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("Invalid code") });

    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback?code=invalid")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=callback"
    );
  });

  it("redirects to login when code is missing", async () => {
    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback?next=/dashboard")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=missing-code"
    );
  });

  it("falls back to dashboard when next is unsafe", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=abc123&next=https://evil.example/phish"
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard"
    );
  });

  it("keeps valid internal next paths", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback?code=abc123&next=/profile")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/profile"
    );
  });
});
