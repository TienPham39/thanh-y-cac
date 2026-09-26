"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "@/lib/api-fetch";
import type { CatalogCategory, CatalogProduct, CatalogResponse } from "@/lib/catalog-types";
import { formatPrice } from "@/lib/home-data";
import { AnimatedProductCard } from "./animated-product-card";
import { Icon } from "./icon";

export function HomeCollection() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ pageSize: "4", sort: "popular" });
    if (category) query.set("category", category);
    Promise.all([
      apiFetch(`/api/products?${query}`, { signal: abort.signal }).then(async response => {
        if (!response.ok) throw new Error("Chưa tải được trang phục. Vui lòng thử lại.");
        return response.json() as Promise<CatalogResponse>;
      }),
      apiFetch("/api/product-categories", { signal: abort.signal }).then(async response => {
        if (!response.ok) throw new Error("Chưa tải được danh mục. Vui lòng thử lại.");
        return response.json() as Promise<{ data: CatalogCategory[] }>;
      }),
    ]).then(([result, groups]) => {
      if (abort.signal.aborted) return;
      setProducts(result.data);
      setCategories(groups.data);
    }).catch(cause => {
      if (!abort.signal.aborted) setError(cause.message || "Chưa tải được bộ sưu tập.");
    }).finally(() => {
      if (!abort.signal.aborted) setLoading(false);
    });
    return () => abort.abort();
  }, [category, retry]);

  return <>
    <div className="category-tabs" role="group" aria-label="Lọc trang phục">
      {[{ slug: "", name: "Tất cả" }, ...categories].map(item => (
        <button key={item.slug} aria-pressed={category === item.slug}
          className={category === item.slug ? "active" : ""}
          onClick={() => setCategory(item.slug)}>{item.name}</button>
      ))}
    </div>
    <div className="product-grid" aria-live="polite" aria-busy={loading}>
      {loading ? <p className="empty-state" role="status">Đang tải bộ sưu tập…</p>
        : error ? <div className="empty-state" role="alert">
          <p>{error}</p>
          <button className="button button-outline" onClick={() => setRetry(value => value + 1)}>Thử lại</button>
        </div>
        : products.length === 0 ? <div className="empty-state">
          <Icon name="hanger" />
          <h3>Bộ sưu tập đang được cập nhật</h3>
          <button className="button button-outline" onClick={() => setCategory("")}>Xem tất cả trang phục</button>
        </div>
        : products.map(product => (
          <AnimatedProductCard className="product-card" key={product.slug}>
            <Link href={`/trang-phuc/${product.slug}`} className="product-picture" aria-label={`Xem ${product.name}`}>
              <Image src={product.image} alt={product.name} fill sizes="(max-width: 460px) 90vw, (max-width: 900px) 45vw, 23vw" />
              {product.tags[0] && <span className="accessory">{product.tags[0]}</span>}
            </Link>
            <div className="product-body">
              <p className="product-label">{categories.find(item => item.slug === product.categorySlug)?.name}</p>
              <h3><Link href={`/trang-phuc/${product.slug}`}>{product.name}</Link></h3>
              <p className="product-description">{product.description}</p>
              <div className="product-price">
                <div><span>Giá thuê 24h</span><strong>{formatPrice(product.price)}</strong></div>
                <Link href={`/trang-phuc/${product.slug}`} className="calendar-button" aria-label={`Đặt thuê ${product.name}`}><Icon name="calendar" /></Link>
              </div>
            </div>
          </AnimatedProductCard>
        ))}
    </div>
  </>;
}
