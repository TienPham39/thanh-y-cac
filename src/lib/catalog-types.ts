export type CatalogProduct = {
  slug: string;
  code: string;
  name: string;
  description: string;
  image: string;
  images?: string[];
  components?: string | null;
  componentImages?: string[] | null;
  price: number;
  extraDay?: number | null;
  deposit?: number | null;
  accessoryFee?: number | null;
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
  popularity: number;
  likes?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
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
