import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailPage from "@/components/product-detail-page";
import { getProductBySlug, listRelatedProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return product
    ? {
        title: `${product.name} | Thanh Y Các`,
        description: product.description,
      }
    : { title: "Không tìm thấy trang phục | Thanh Y Các" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await listRelatedProducts(product);
  return <ProductDetailPage key={product.slug} product={product} related={related} />;
}
