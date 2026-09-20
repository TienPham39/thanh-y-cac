export const ADMIN_SESSION_COOKIE = "thanh_y_cac_admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type AdminSession = {
  email: string;
  expiresAt: number;
};

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(payload: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return encodeBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

export async function createSessionToken(session: AdminSession, secret: string) {
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(session)));
  return `${payload}.${await sign(payload, secret)}`;
}

export async function verifySessionToken(token: string, secret: string, now = Date.now()) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !secret) return null;

  try {
    const expected = await sign(payload, secret);
    if (signature.length !== expected.length) return null;
    let mismatch = 0;
    for (let index = 0; index < signature.length; index += 1)
      mismatch |= signature.charCodeAt(index) ^ expected.charCodeAt(index);
    if (mismatch !== 0) return null;

    const parsed = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as Partial<AdminSession>;
    if (typeof parsed.email !== "string" || typeof parsed.expiresAt !== "number" || parsed.expiresAt < now)
      return null;
    return { email: parsed.email, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}
