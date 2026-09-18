import { getPrisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/catalog";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,100}$/.test(slug))
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Không tìm thấy trang phục." } },
      { status: 404 },
    );
  try {
    const product = await getPrisma().costumeProduct.findFirst({
      where: { slug, published: true },
    });
    return product
      ? Response.json({ data: serializeProduct(product) })
      : Response.json(
          {
            error: { code: "NOT_FOUND", message: "Không tìm thấy trang phục." },
          },
          { status: 404 },
        );
  } catch {
    return Response.json(
      {
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Chưa tải được trang phục.",
        },
      },
      { status: 503 },
    );
  }
}
