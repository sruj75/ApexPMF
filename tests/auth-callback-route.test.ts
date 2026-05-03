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
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard"
    );
  });
});
