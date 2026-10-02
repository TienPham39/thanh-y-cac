"use client";
import { useEffect, useState } from "react";
import { useSiteState } from "./site-layout";
import type { CatalogProduct } from "@/lib/catalog-types";
import { apiFetch } from "@/lib/api-fetch";
import { rentalQuote } from "@/lib/rental-pricing";
import { localToday } from "./admin/dashboard-date-filter";
export const checkoutButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#b8872e] bg-[#781216] px-5 text-sm font-semibold text-white transition hover:bg-[#590008] disabled:cursor-not-allowed disabled:opacity-40";
export const checkoutInput =
  "mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#781216] focus:ring-1 focus:ring-[#781216]";
export const money = (n: number) => `${n.toLocaleString("vi-VN")}đ`;
export function CheckoutSteps({ step }: { step: number }) {
  return (
    <ol
      aria-label="Các bước đặt thuê"
      className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {["Giỏ hàng", "Thông tin thuê", "Thanh toán cọc", "Kết quả"].map(
        (label, i) => (
          <li
            key={label}
            aria-current={step === i + 1 ? "step" : undefined}
            className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm ${i + 1 <= step ? "border-[#b8872e] bg-[#fff8f0] text-[#781216]" : "border-stone-200 text-stone-400"}`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i + 1 <= step ? "bg-[#781216] text-white" : "bg-stone-100"}`}
            >
              {i + 1}
            </span>
            {label}
          </li>
        ),
      )}
    </ol>
  );
}
export function useCartProducts() {
  const { cart, setCart } = useSiteState();
  const slugs = cart.map((i) => i.productSlug).join(",");
  const [products, setProducts] = useState<Record<string, CatalogProduct>>({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    if (!slugs) {
      setProducts({});
      setLoading(false);
      return;
    }
    Promise.all(
      slugs.split(",").map(async (slug) => {
        const r = await apiFetch(`/api/products/${encodeURIComponent(slug)}`, {
          signal: abort.signal,
        });
        const b = await r.json();
        if (!r.ok)
          throw Error(
            b.error?.message ||
              "Có trang phục không còn nhận thuê. Vui lòng bỏ khỏi giỏ và chọn lại.",
          );
        return [slug, b.data] as const;
      }),
    )
      .then((rows) => {
        if (!abort.signal.aborted) setProducts(Object.fromEntries(rows));
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [slugs]);
  const rows = cart.map((item) => {
    const product = products[item.productSlug];
    const days = Math.max(
      1,
      (Date.parse(item.end) - Date.parse(item.start)) / 86400000,
    );
    const valid =
      !!item.start &&
      !!item.end &&
      item.start >= localToday() &&
      item.end >= item.start &&
      days <= 365;
    return {
      ...item,
      product,
      valid,
      quote: product && valid ? rentalQuote(days, product) : null,
    };
  });
  return {
    cart,
    setCart,
    rows,
    loading,
    error,
    valid:
      cart.length > 0 &&
      !loading &&
      !error &&
      rows.every((i) => i.valid && i.product),
    total: rows.reduce((a, r) => a + (r.quote?.total || 0), 0),
    deposit: rows.reduce((a, r) => a + (r.quote?.deposit || 0), 0),
  };
}
