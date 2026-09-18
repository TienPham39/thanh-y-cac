import "server-only";
import { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma";
import type { CatalogProduct } from "./catalog-types";

export class CatalogQueryError extends Error {}
const allowed = new Set([
  "q",
  "category",
  "gender",
  "price",
  "availability",
  "height",
  "accessory",
  "sort",
  "page",
  "pageSize",
]);
function option(
  params: URLSearchParams,
  key: string,
  values: string[],
  fallback = "",
) {
  const value = params.get(key) ?? fallback;
  if (value && !values.includes(value))
    throw new CatalogQueryError(`Tham số ${key} không hợp lệ.`);
  return value;
}
function integer(
  params: URLSearchParams,
  key: string,
  fallback: number,
  max: number,
) {
  const value = params.get(key);
  if (value === null) return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > max)
    throw new CatalogQueryError(`Tham số ${key} không hợp lệ.`);
  return Number(value);
}
export async function listProducts(params: URLSearchParams) {
  for (const key of params.keys())
    if (!allowed.has(key))
      throw new CatalogQueryError(`Tham số ${key} không được hỗ trợ.`);
  const q = (params.get("q") ?? "").trim();
  if (q.length > 100) throw new CatalogQueryError("Từ khóa tối đa 100 ký tự.");
  const categories = params.getAll("category").filter(Boolean);
  if (
    categories.length > 10 ||
    categories.some((value) => !/^[a-z0-9-]{1,80}$/.test(value))
  )
    throw new CatalogQueryError("Danh mục không hợp lệ.");
  const gender = option(params, "gender", ["female", "male", "unisex"]);
  const availability = option(params, "availability", ["available", "advance"]);
  const price = option(params, "price", ["under300", "300to500", "over500"]);
  const height = option(params, "height", [
    "under155",
    "155to165",
    "165to175",
    "over175",
  ]);
  const sort = option(
    params,
    "sort",
    ["popular", "newest", "price-asc", "price-desc"],
    "popular",
  );
  const accessories = params.getAll("accessory");
  if (
    accessories.length > 4 ||
    accessories.some(
      (value) => !["hairpin", "fan", "sword", "embroidered"].includes(value),
    )
  )
    throw new CatalogQueryError("Phụ kiện không hợp lệ.");
  const page = integer(params, "page", 1, 10000);
  const pageSize = integer(params, "pageSize", 9, 24);
  const ranges: Record<string, [number, number]> = {
    under155: [0, 154],
    "155to165": [155, 165],
    "165to175": [166, 175],
    over175: [176, 250],
  };
  const where: Prisma.CostumeProductWhereInput = {
    published: true,
    ...(q && {
      OR: [
        { name: { contains: q } },
        { code: { contains: q } },
        { description: { contains: q } },
        { category: { name: { contains: q } } },
      ],
    }),
    ...(categories.length && { categorySlug: { in: categories } }),
    ...(gender && { gender }),
    ...(availability && { availability }),
    ...(price && {
      price:
        price === "under300"
          ? { lt: 300000 }
          : price === "300to500"
            ? { gte: 300000, lte: 500000 }
            : { gt: 500000 },
    }),
    ...(height && {
      minHeight: { lte: ranges[height][1] },
      maxHeight: { gte: ranges[height][0] },
    }),
    ...(accessories.length && {
      AND: accessories.map((value) => ({
        accessories: { array_contains: [value] },
      })),
    }),
  };
  const orderBy: Prisma.CostumeProductOrderByWithRelationInput =
    sort === "price-asc"
      ? { price: "asc" }
      : sort === "price-desc"
        ? { price: "desc" }
        : sort === "newest"
          ? { createdAt: "desc" }
          : { popularity: "desc" };
  const [rows, total] = await getPrisma().$transaction([
    getPrisma().costumeProduct.findMany({
      where,
      orderBy: [orderBy, { slug: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    getPrisma().costumeProduct.count({ where }),
  ]);
  return {
    data: rows.map(serializeProduct),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
export function serializeProduct(
  row: Omit<CatalogProduct, "tags" | "accessories"> & {
    tags: Prisma.JsonValue;
    accessories: Prisma.JsonValue;
  },
): CatalogProduct {
  return {
    slug: row.slug,
    code: row.code,
    name: row.name,
    description: row.description,
    image: row.image,
    price: row.price,
    categorySlug: row.categorySlug,
    gender: row.gender,
    availability: row.availability,
    minHeight: row.minHeight,
    maxHeight: row.maxHeight,
    minWeight: row.minWeight,
    maxWeight: row.maxWeight,
    tags: Array.isArray(row.tags)
      ? row.tags.filter((v): v is string => typeof v === "string")
      : [],
    accessories: Array.isArray(row.accessories)
      ? row.accessories.filter((v): v is string => typeof v === "string")
      : [],
    badge: row.badge,
    badgeTone: row.badgeTone,
  };
}
export async function listCategories() {
  const rows = await getPrisma().productCategory.findMany({
    orderBy: { position: "asc" },
    include: {
      _count: { select: { products: { where: { published: true } } } },
    },
  });
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    count: row._count.products,
  }));
}
