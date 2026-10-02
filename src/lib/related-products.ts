import type { CatalogProduct } from "./catalog-types";

export function selectRelatedProducts<T extends Pick<CatalogProduct, "slug" | "categorySlug">>(
  products: T[], currentSlug: string,
): T[] {
  const categories = new Set<string>();
  return products.filter(product => {
    if (product.slug === currentSlug || !product.categorySlug || categories.has(product.categorySlug)) return false;
    categories.add(product.categorySlug);
    return true;
  }).slice(0, 4);
}
