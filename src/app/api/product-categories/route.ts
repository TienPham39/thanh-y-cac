import { listCategories } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json({ data: await listCategories() });
  } catch {
    return Response.json(
      {
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Chưa tải được danh mục.",
        },
      },
      { status: 503 },
    );
  }
}
