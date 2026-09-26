import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { serializeProduct } from "@/lib/catalog";
import { getPrisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-origin";
import { parseDeleteProductCodes } from "@/lib/admin-product-delete";
import { parsePublicationInput } from "@/lib/product-publication";

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
    const rows = await getPrisma().costumeProduct.findMany({ orderBy: [{ popularity: "desc" }, { slug: "asc" }] });
    return Response.json({
      data: rows.map(row => ({ ...serializeProduct(row), published: row.published, popularity: row.popularity })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Admin catalog read failed", cause);
    return error("DATABASE_UNAVAILABLE", "Chưa tải được danh sách trang phục từ website.", 503);
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

  const parsed = parsePublicationInput(input);
  if (!parsed) return error("INVALID_REQUEST", "Thông tin trang phục không hợp lệ.", 422);

  try {
    const existing = await getPrisma().costumeProduct.findUnique({ where: { code: parsed.code }, select: { code: true } });
    if (!existing) return error("NOT_FOUND", "Không tìm thấy trang phục cần cập nhật.", 404);
    const updated = await getPrisma().costumeProduct.update({
      where: { code: parsed.code },
      data: parsed.create,
    });
    return Response.json({ data: { ...serializeProduct(updated), published: updated.published, popularity: updated.popularity } }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Admin catalog update failed", cause);
    return error("DATABASE_UNAVAILABLE", "Chưa cập nhật được trang phục. Vui lòng thử lại.", 503);
  }
}

export async function DELETE(request: NextRequest) {
  if (!await authorized(request)) return error("UNAUTHORIZED", "Vui lòng đăng nhập lại.", 401);
  if (!isSameOriginRequest(request.url, request.headers))
    return error("INVALID_ORIGIN", "Địa chỉ gửi yêu cầu không khớp với website. Hãy tải lại trang rồi thử lại.", 403);

  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 5000) return error("INVALID_REQUEST", "Danh sách trang phục cần xóa quá lớn.", 413);
    input = JSON.parse(body);
  } catch {
    return error("INVALID_REQUEST", "Dữ liệu xóa trang phục không hợp lệ.", 400);
  }

  const codes = parseDeleteProductCodes(input);
  if (!codes) return error("INVALID_REQUEST", "Danh sách mã trang phục cần xóa không hợp lệ.", 422);

  try {
    const result = await getPrisma().costumeProduct.deleteMany({ where: { code: { in: codes } } });
    return Response.json({ data: { deletedCount: result.count, codes } }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Admin catalog delete failed", cause);
    return error("DATABASE_UNAVAILABLE", "Chưa xóa được trang phục. Vui lòng thử lại.", 503);
  }
}
