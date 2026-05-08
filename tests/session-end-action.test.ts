import { beforeEach, describe, expect, it, vi } from "vitest";
import { endSessionAction } from "../app/practice/[sessionId]/actions";

const { redirect, recordUserQuitIntent } = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  recordUserQuitIntent: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect
}));

vi.mock("@/src/application/end-session/user-quit-intent", () => ({
  recordUserQuitIntent
}));

describe("End Session action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records user-quit intent and redirects to Practice Dashboard", async () => {
    const formData = new FormData();
    formData.set("sessionId", "session-case-abc");

    await expect(endSessionAction(formData)).rejects.toThrow("REDIRECT:/dashboard");
    expect(recordUserQuitIntent).toHaveBeenCalledWith({
      sessionId: "session-case-abc"
    });
  });
});
