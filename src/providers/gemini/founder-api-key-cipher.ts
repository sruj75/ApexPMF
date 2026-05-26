import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const IV_BYTE_LENGTH = 12;
const AUTH_TAG_BYTE_LENGTH = 16;

type CipherConfig = {
  secret: string;
};

export function readFounderApiKeyCipherConfig(
  env: NodeJS.ProcessEnv = process.env
): CipherConfig {
  const secret = env.FOUNDER_API_KEY_CIPHER_SECRET;

  if (!secret || secret.trim().length < 16) {
    throw new Error(
      "FOUNDER_API_KEY_CIPHER_SECRET must be set and at least 16 characters long."
    );
  }

  return { secret };
}

export function createFounderApiKeyCipher(config: CipherConfig) {
  const key = deriveKey(config.secret);

  return {
    encrypt(plaintext: string): string {
      const iv = randomBytes(IV_BYTE_LENGTH);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();

      return [iv, authTag, encrypted].map((chunk) => chunk.toString("base64url")).join(".");
    },

    decrypt(encoded: string): string {
      const [ivEncoded, tagEncoded, encryptedEncoded] = encoded.split(".");

      if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
        throw new Error("Invalid encrypted founder API key payload.");
      }

      const iv = Buffer.from(ivEncoded, "base64url");
      const tag = Buffer.from(tagEncoded, "base64url");
      const encrypted = Buffer.from(encryptedEncoded, "base64url");

      if (iv.byteLength !== IV_BYTE_LENGTH || tag.byteLength !== AUTH_TAG_BYTE_LENGTH) {
        throw new Error("Invalid encrypted founder API key payload.");
      }

      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);

      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    }
  };
}

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, "apexpmf-founder-api-key", 32);
}
