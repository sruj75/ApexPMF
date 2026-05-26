import { describe, expect, it } from "vitest";
import { createFounderApiKeyCipher } from "@/src/providers/gemini/founder-api-key-cipher";

describe("Founder API key cipher", () => {
  it("round-trips encrypted payloads without exposing plaintext", () => {
    const cipher = createFounderApiKeyCipher({
      secret: "0123456789abcdef0123456789abcdef"
    });

    const plaintext = "AIzaSyDUMMY_SECRET_KEY_1234";
    const encrypted = cipher.encrypt(plaintext);
    const decrypted = cipher.decrypt(encrypted);

    expect(encrypted).not.toContain(plaintext);
    expect(decrypted).toBe(plaintext);
  });
});
