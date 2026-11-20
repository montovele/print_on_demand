import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { HttpError } from "./http.js";

function getEncryptionKey(): Buffer {
  const key = config.ENCRYPTION_KEY;
  if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new HttpError(503, "La clave de cifrado no está configurada correctamente.", "ENCRYPTION_NOT_CONFIGURED");
  }
  return Buffer.from(key, "hex");
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(value: string): string {
  const [version, ivText, tagText, encryptedText] = value.split(":");
  if (version !== "v1" || !ivText || !tagText || !encryptedText) {
    throw new HttpError(500, "No se pudo descifrar la credencial almacenada.", "CREDENTIAL_FORMAT_INVALID");
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivText, "base64"));
    decipher.setAuthTag(Buffer.from(tagText, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedText, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new HttpError(500, "No se pudo descifrar la credencial almacenada.", "CREDENTIAL_DECRYPTION_FAILED");
  }
}
