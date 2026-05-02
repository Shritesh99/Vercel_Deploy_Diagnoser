import { createHmac, timingSafeEqual } from "node:crypto";

function normalizeHex(input: string): string {
  return input.startsWith("sha1=") || input.startsWith("sha256=")
    ? input.split("=")[1]
    : input;
}

function isValidHex(hex: string): boolean {
  return /^[a-fA-F0-9]+$/.test(hex);
}

export function verifyVercelSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;

  if (!secret || !signatureHeader) {
    return false;
  }

  const normalized = normalizeHex(signatureHeader.trim());
  if (!isValidHex(normalized)) {
    return false;
  }

  const expectedSha1 = createHmac("sha1", secret).update(rawBody).digest("hex");
  const expectedSha256 = createHmac("sha256", secret).update(rawBody).digest("hex");

  const provided = Buffer.from(normalized, "hex");
  const sha1Buf = Buffer.from(expectedSha1, "hex");
  const sha256Buf = Buffer.from(expectedSha256, "hex");

  return (
    (provided.length === sha1Buf.length && timingSafeEqual(provided, sha1Buf)) ||
    (provided.length === sha256Buf.length && timingSafeEqual(provided, sha256Buf))
  );
}
