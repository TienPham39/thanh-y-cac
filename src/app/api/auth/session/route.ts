import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth-password";
import { ADMIN_SESSION_COOKIE, createSessionToken, SESSION_TTL_SECONDS } from "@/lib/auth-session";

export const runtime = "nodejs";

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function error(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.AUTH_SECRET;
  if (!configuredEmail || !passwordHash || !secret)
    return error("AUTH_NOT_CONFIGURED", "Đăng nhập quản trị chưa được cấu hình.", 503);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return error("INVALID_REQUEST", "Dữ liệu đăng nhập không hợp lệ.", 400);
  }
  if (!input || typeof input !== "object")
    return error("INVALID_REQUEST", "Dữ liệu đăng nhập không hợp lệ.", 400);

  const { identifier, password } = input as Record<string, unknown>;
  if (typeof identifier !== "string" || typeof password !== "string" || identifier.length > 191 || password.length > 256)
    return error("INVALID_REQUEST", "Vui lòng nhập đúng email và mật khẩu.", 422);

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwarded || "local";
  const now = Date.now();
  const current = attempts.get(clientKey);
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS)
    return error("TOO_MANY_ATTEMPTS", "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.", 429);
  if (!current || current.resetAt <= now) attempts.set(clientKey, { count: 0, resetAt: now + ATTEMPT_WINDOW_MS });

  const emailMatches = identifier.trim().toLowerCase() === configuredEmail;
  const passwordMatches = await verifyPassword(password, passwordHash);
  if (!emailMatches || !passwordMatches) {
    const attempt = attempts.get(clientKey)!;
    attempt.count += 1;
    return error("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401);
  }

  attempts.delete(clientKey);
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;
  const token = await createSessionToken({ email: configuredEmail, expiresAt }, secret);
  const response = NextResponse.json({ data: { email: configuredEmail } });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ data: { signedOut: true } });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
