import { blankProduct, type AdminProduct } from "./admin-products.ts";
import type { CatalogProduct } from "./catalog-types.ts";

export type AdminCatalogRow = CatalogProduct & {
  categoryName?: string;
  rentalStatus?: "rented" | "ready";
  published: boolean;
  popularity: number;
};

function categoryFor(row: AdminCatalogRow) {
  if (row.categoryName) return row.categoryName;
  if (row.categorySlug === "duong-trieu") return "Cung đình";
  if (row.categorySlug === "dan-quoc") return "Dân Quốc";
  if (row.categorySlug === "kiem-hiep")
    return row.tags.some(tag => tag.toLocaleLowerCase("vi").includes("tiên")) ? "Tiên hiệp" : "Kiếm hiệp";
  if (row.categorySlug === "han-trieu" && row.tags.some(tag => tag.toLocaleLowerCase("vi").includes("hỷ")))
    return "Hỷ phục";
  return "Cổ phục";
}

export function mergeAdminCatalog(catalog: AdminCatalogRow[], drafts: AdminProduct[]): AdminProduct[] {
  const draftsByCode = new Map(drafts.filter(row => row.code).map(row => [row.code.toUpperCase(), row]));
  const catalogCodes = new Set(catalog.map(row => row.code.toUpperCase()));
  const databaseRows = catalog.map(row => {
    const draft = draftsByCode.get(row.code.toUpperCase());
    return {
      ...blankProduct(),
      ...draft,
      id: draft?.id ?? row.slug,
      code: row.code,
      slug: row.slug,
      name: row.name,
      description: row.description,
      images: row.images?.length ? row.images : [row.image, ...(draft?.images ?? []).filter(image => image !== row.image)],
      price: row.price,
      extraDay: row.extraDay ?? draft?.extraDay ?? row.price,
      deposit: row.deposit ?? draft?.deposit ?? 0,
      accessoryFee: row.accessoryFee ?? draft?.accessoryFee ?? 0,
      category: categoryFor(row),
      status: row.rentalStatus === "rented" ? "Đang cho thuê" : "Sẵn sàng",
      gender: row.gender === "male" ? "Nam" : row.gender === "unisex" ? "Unisex" : "Nữ",
      minHeight: row.minHeight,
      maxHeight: row.maxHeight,
      minWeight: row.minWeight,
      maxWeight: row.maxWeight,
      tags: row.tags.join(", "),
      accessories: row.accessories.join(", "),
      badge: row.badge,
      rentalCount: row.popularity,
      published: row.published,
    } satisfies AdminProduct;
  });
  const localDrafts = drafts
    .filter(row => !catalogCodes.has(row.code.toUpperCase()) && !row.id.startsWith("sample-"))
    .map(row => ({ ...row, status: "Sẵn sàng", published: false }));
  return [...databaseRows, ...localDrafts];
}
