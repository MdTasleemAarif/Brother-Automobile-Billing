import { pbkdf2Sync, timingSafeEqual } from "crypto";

const HASH_PREFIX = "pbkdf2_sha256";
const KEY_LENGTH = 32;

export function verifyPassword(password: string, storedHash: string | undefined) {
  if (!storedHash) return false;

  const separator = storedHash.includes(":") ? ":" : "$";
  const [prefix, iterationText, salt, hash] = storedHash.split(separator);
  const iterations = Number(iterationText);

  if (prefix !== HASH_PREFIX || !iterations || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, "sha256");

  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

export function normalizeLoginIdentifier(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
