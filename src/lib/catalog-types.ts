export type CatalogProduct = {
  slug: string;
  code: string;
  name: string;
  description: string;
  image: string;
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
};
export type CatalogCategory = { slug: string; name: string; count: number };
export type CatalogResponse = {
  data: CatalogProduct[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
