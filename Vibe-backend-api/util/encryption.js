const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended length for GCM

function getKey() {
  const key = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY is not set in environment variables",
    );
  }
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY must be a 32-byte key (64 hex characters)",
    );
  }
  return keyBuffer;
}

function encrypt(text) {
  if (text === undefined || text === null || text === "") return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(payload) {
  if (payload === undefined || payload === null || payload === "")
    return payload;
  const parts = payload.split(":");
  if (parts.length !== 3) {
    // Not our encrypted format (e.g. legacy plaintext) — return unchanged
    return payload;
  }
  const [ivHex, authTagHex, dataHex] = parts;
  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encryptedText = Buffer.from(dataHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    // Bad/corrupted ciphertext — fail safe rather than crashing the request
    return "[unable to decrypt message]";
  }
}

module.exports = { encrypt, decrypt };
