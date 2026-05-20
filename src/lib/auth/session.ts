export const SESSION_COOKIE_NAME = "garage_billing_session";

export type AuthSession = {
  sub: string;
  name: string;
  email: string;
  exp: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodePayload(payload: AuthSession) {
  return bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
}

function decodePayload(value: string) {
  return JSON.parse(decoder.decode(base64UrlToBytes(value))) as AuthSession;
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(payload: AuthSession, secret: string) {
  const encodedPayload = encodePayload(payload);
  const signature = await sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return null;

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return null;

  try {
    const expectedSignature = await sign(encodedPayload, secret);
    if (providedSignature !== expectedSignature) return null;

    const payload = decodePayload(encodedPayload);
    if (!payload.exp || Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export function getSessionExpiry(maxAgeSeconds: number) {
  return Date.now() + maxAgeSeconds * 1000;
}
