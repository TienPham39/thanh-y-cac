import { CatalogQueryError, listProducts } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    return Response.json(await listProducts(new URL(request.url).searchParams));
  } catch (error) {
    if (error instanceof CatalogQueryError)
      return Response.json(
        { error: { code: "INVALID_QUERY", message: error.message } },
        { status: 400 },
      );
    console.error("Catalog query failed", error);
    return Response.json(
      {
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Chưa tải được trang phục. Vui lòng thử lại.",
        },
      },
      { status: 503 },
    );
  }
}
