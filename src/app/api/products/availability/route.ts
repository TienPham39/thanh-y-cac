import { NextRequest } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { vietnamToday } from "@/lib/rental-calendar";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) return new Response(null, { status: 422 });
  try {
    const product = await getPrisma().costumeProduct.findUnique({ where: { slug }, select: { published: true } });
    if (!product?.published) return new Response(null, { status: 404 });
    const data = await getPrisma().rentalRequest.findMany({ where: { productSlug: slug, status: "confirmed", end: { gte: vietnamToday() } }, select: { start: true, end: true }, orderBy: { start: "asc" } });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Chưa tải được lịch đã đặt." }, { status: 503 }); }
}
