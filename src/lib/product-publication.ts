type PublicationInput = {
  code: string;
  published: boolean;
  create: {
    code: string;
    slug: string;
    name: string;
    description: string;
    image: string;
    images?: string[];
    price: number;
    categorySlug: string;
    gender: string;
    availability: string;
    minHeight: number;
    maxHeight: number;
    minWeight: number;
    maxWeight: number;
    tags: string[];
    accessories: string[];
    badge: string;
    badgeTone: string;
    published: boolean;
  };
};

const categorySlugs: Record<string, string> = {
  "Cung đình": "duong-trieu",
  "Tiên hiệp": "kiem-hiep",
  "Cổ phục": "minh-trieu",
  "Hỷ phục": "han-trieu",
  "Dân Quốc": "dan-quoc",
  "Kiếm hiệp": "kiem-hiep",
};

const badgeTones: Record<string, string> = {
  "Nổi bật": "red",
  "Mẫu mới": "green",
  "Được yêu thích": "gold",
};

export function parsePublicationInput(value: unknown): PublicationInput | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.code !== "string" || !/^[A-Za-z0-9-]{1,40}$/.test(row.code) || typeof row.published !== "boolean") return null;
  if (typeof row.slug !== "string" || !/^[a-z0-9-]{1,100}$/.test(row.slug)) return null;
  if (typeof row.name !== "string" || !row.name.trim() || row.name.length > 191) return null;
  if (typeof row.description !== "string" || row.description.length > 10000) return null;
  if (typeof row.price !== "number" || !Number.isSafeInteger(row.price) || row.price < 0) return null;
  if (typeof row.category !== "string" || !Object.hasOwn(categorySlugs, row.category)) return null;
  if (typeof row.gender !== "string" || !["Nữ", "Nam", "Unisex"].includes(row.gender)) return null;
  if (typeof row.status !== "string") return null;
  if (typeof row.tags !== "string" || row.tags.length > 1000) return null;
  if (typeof row.accessories !== "undefined" && (typeof row.accessories !== "string" || row.accessories.length > 1000)) return null;
  if (typeof row.badge !== "string" || row.badge.length > 80) return null;
  for (const key of ["minHeight", "maxHeight", "minWeight", "maxWeight"] as const)
    if (typeof row[key] !== "number" || !Number.isSafeInteger(row[key]) || row[key] < 0 || row[key] > 300) return null;
  if ((row.minHeight as number) > (row.maxHeight as number) || (row.minWeight as number) > (row.maxWeight as number)) return null;

  const safeImage = (value: unknown): value is string => typeof value === "string" && value.length <= 500 && /^\/(?:images|uploads)\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp)$/i.test(value);
  if (row.images !== undefined && (!Array.isArray(row.images) || row.images.length < 1 || row.images.length > 8 || !row.images.every(safeImage))) return null;
  const images = Array.isArray(row.images) ? [...new Set(row.images as string[])] : undefined;
  const image = safeImage(row.image)
    ? row.image : "/images/logo.png";
  return {
    code: row.code,
    published: row.published,
    create: {
      code: row.code,
      slug: row.slug,
      name: row.name.trim(),
      description: row.description,
      image: images?.[0] ?? image,
      ...(images ? { images } : {}),
      price: row.price,
      categorySlug: categorySlugs[row.category],
      gender: row.gender === "Nữ" ? "female" : row.gender === "Nam" ? "male" : "unisex",
      availability: row.status === "Sẵn sàng" ? "available" : "advance",
      minHeight: row.minHeight as number,
      maxHeight: row.maxHeight as number,
      minWeight: row.minWeight as number,
      maxWeight: row.maxWeight as number,
      tags: row.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      accessories: typeof row.accessories === "string" ? row.accessories.split(",").map(item => item.trim()).filter(Boolean) : [],
      badge: row.badge,
      badgeTone: badgeTones[row.badge] ?? "red",
      published: row.published,
    },
  };
}
