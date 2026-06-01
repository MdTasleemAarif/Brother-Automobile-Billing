import { createHmac, timingSafeEqual } from "crypto";

const SHARE_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

type BillPdfSharePayload = {
  billId: string;
  exp: number;
};

function getSecret() {
  return process.env.AUTH_SECRET || "";
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf8");
}

function signPayload(encodedPayload: string, secret: string) {
  return toBase64Url(createHmac("sha256", secret).update(encodedPayload).digest());
}

export function createBillPdfShareToken(billId: string) {
  const secret = getSecret();
  if (!secret) return "";

  const payload: BillPdfSharePayload = {
    billId,
    exp: Date.now() + SHARE_TOKEN_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyBillPdfShareToken(billId: string, token: string | null) {
  const secret = getSecret();
  if (!secret || !token) return false;

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return false;

  try {
    const expectedSignature = signPayload(encodedPayload, secret);
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return false;
    }

    const payload = JSON.parse(fromBase64Url(encodedPayload)) as BillPdfSharePayload;
    return payload.billId === billId && Date.now() <= payload.exp;
  } catch {
    return false;
  }
}
