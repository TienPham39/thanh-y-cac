import { NextRequest } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-origin";
import { parseRentalRequest } from "@/lib/rental-request";
import { vietnamToday } from "@/lib/rental-calendar";
import { createRedis } from "@/lib/redis";
import { createHash } from "node:crypto";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request.url, request.headers)) return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  let input;
  try { const body = await request.text(); if (body.length > 10000) throw new Error(); input = parseRentalRequest(JSON.parse(body), vietnamToday()); } catch { return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  if (!input) return Response.json({ error: "Kiểm tra họ tên, số điện thoại, ngày nhận/trả và số đo." }, { status: 422 });
  const redis = createRedis();
  try {
    await redis.connect();
    const key = `rental-request:${createHash("sha256").update(input.phone).digest("hex")}`;
    const count = Number(await redis.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],600) end; return n", 1, key));
    if (count > 10) return Response.json({ error: "Bạn đã gửi nhiều yêu cầu. Vui lòng thử lại sau 10 phút." }, { status: 429 });
    const db = getPrisma();
    const product = await db.costumeProduct.findUnique({ where: { slug: input.productSlug } });
    if (!product?.published) return Response.json({ error: "Trang phục không còn nhận yêu cầu thuê." }, { status: 404 });
    const existing = await db.rentalRequest.findUnique({ where: { id: input.id }, select: { id: true } });
    if (existing) return Response.json({ id: existing.id }, { status: 201 });
    const conflict = await db.rentalReservedDay.findFirst({ where: { productSlug: input.productSlug, day: { gte: input.start, lte: input.end } }, select: { day: true } });
    if (conflict) return Response.json({ error: "Khoảng ngày này đã được đặt. Vui lòng tải lại lịch và chọn ngày khác." }, { status: 409 });
    const row = await db.rentalRequest.upsert({ where: { id: input.id }, update: {}, create: { ...input, productCode: product.code, productName: product.name } });
    return Response.json({ id: row.id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Chưa lưu được yêu cầu. Vui lòng thử lại, thông tin vẫn được giữ trên form." }, { status: 503 }); }
  finally { redis.disconnect(); }
}
