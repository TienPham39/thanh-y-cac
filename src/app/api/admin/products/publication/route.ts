import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { getPrisma } from "@/lib/prisma";
import { parsePublicationInput } from "@/lib/product-publication";
import { isSameOriginRequest } from "@/lib/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorized(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return Boolean(secret && token && await verifySessionToken(token, secret));
}

function error(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

export async function GET(request: NextRequest) {
  if (!await authorized(request)) return error("UNAUTHORIZED", "Vui lòng đăng nhập lại.", 401);
  try {
    const rows = await getPrisma().costumeProduct.findMany({ select: { code: true, published: true } });
    return Response.json({ data: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Admin publication read failed", cause);
    return error("DATABASE_UNAVAILABLE", "Chưa đọc được trạng thái mở bán. Vui lòng thử lại.", 503);
  }
}

export async function PATCH(request: NextRequest) {
  if (!await authorized(request)) return error("UNAUTHORIZED", "Vui lòng đăng nhập lại.", 401);
  if (!isSameOriginRequest(request.url, request.headers))
    return error("INVALID_ORIGIN", "Địa chỉ gửi yêu cầu không khớp với website. Hãy tải lại trang rồi thử lại.", 403);
  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 32000) return error("INVALID_REQUEST", "Dữ liệu trang phục quá lớn.", 413);
    input = JSON.parse(body);
  } catch {
    return error("INVALID_REQUEST", "Dữ liệu trang phục không hợp lệ.", 400);
  }
  const publication = parsePublicationInput(input);
  if (!publication) return error("INVALID_REQUEST", "Thông tin trang phục không hợp lệ.", 422);
  try {
    const row = await getPrisma().costumeProduct.upsert({
      where: { code: publication.code },
      update: { published: publication.published },
      create: publication.create,
      select: { code: true, published: true },
    });
    return Response.json({ data: row }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Admin publication update failed", cause);
    return error("DATABASE_UNAVAILABLE", "Chưa đổi được trạng thái mở bán. Vui lòng thử lại.", 503);
  }
}
