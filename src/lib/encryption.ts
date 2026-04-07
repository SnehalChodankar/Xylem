import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Returns the 32-byte encryption key from the environment variables.
 * If running on the edge/client where process.env is not fully populated,
 * or if the key is missing, this throws an error.
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.SMS_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("Missing SMS_ENCRYPTION_KEY in environment variables.");
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypts a plaintext string into a secure AES-256-GCM ciphertext format.
 * Returns: `ivHex:authTagHex:encryptedTextHex`
 */
export function encryptSms(text: string): string {
  if (!text) return text;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted `iv:authTag:ciphertext` string.
 * Gracefully handles parsing failures by returning the original text
 * (useful if the database contains older unencrypted plaintext rows).
 */
export function decryptSms(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  if (!encryptedData.includes(":")) return encryptedData; // Fallback for old unencrypted text
  
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) return encryptedData;
    
    const [ivHex, authTagHex, encryptedTextHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedTextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    console.error("Failed to decrypt SMS payload:", err);
    return "[Encrypted Error - Unreadable]";
  }
}
