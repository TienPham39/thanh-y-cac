"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
import type { CatalogProduct, CatalogResponse } from "@/lib/catalog-types";
import ProductDetailPage from "./product-detail-page";

export default function StaticProductDetail() {
  const slug = useSearchParams().get("slug") ?? "";
  return <Detail key={slug} slug={slug} />;
}

function Detail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [related, setRelated] = useState<CatalogProduct[]>([]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    setError("");
    if (!/^[a-z0-9-]{1,100}$/.test(slug)) {
      setError("Không tìm thấy trang phục.");
      return () => abort.abort();
    }
    async function load() {
      try {
        const response = await apiFetch(`/api/products/${encodeURIComponent(slug)}`, { signal: abort.signal });
        if (response.status === 404) throw new Error("Không tìm thấy trang phục.");
        if (!response.ok) throw new Error("Chưa tải được trang phục. Vui lòng thử lại.");
        const body: { data: CatalogProduct } = await response.json();
        if (abort.signal.aborted) return;
        setProduct(body.data);
        // Related items are optional; a failed list request must not hide the product.
        const query = new URLSearchParams({ category: body.data.categorySlug, pageSize: "5" });
        try {
          const list = await apiFetch(`/api/products?${query}`, { signal: abort.signal });
          if (list.ok) {
            const items: CatalogResponse = await list.json();
            if (!abort.signal.aborted) setRelated(items.data.filter(item => item.slug !== slug).slice(0, 4));
          }
        } catch { /* Keep the product visible when related items are unavailable. */ }
      } catch (error) {
        if (!abort.signal.aborted) setError(error instanceof Error ? error.message : "Chưa tải được trang phục.");
      }
    }
    void load();
    return () => abort.abort();
  }, [slug, retry]);

  if (error) return <main className="p-12 text-center">
    <p role="alert">{error}</p>
    <button className="m-4 underline" onClick={() => setRetry(value => value + 1)}>Thử lại</button>
    <Link className="underline" href="/trang-phuc">Xem danh sách trang phục</Link>
  </main>;
  if (!product) return <p role="status" className="p-12 text-center">Đang tải trang phục…</p>;
  return <ProductDetailPage product={product} related={related} />;
}
