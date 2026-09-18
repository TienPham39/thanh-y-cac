"use client";
/* THESIS: Browse the reference costume collection with real search and filters.
 OWN-WORLD: Existing burgundy, gold, palace imagery; Noto Serif titles and Inter controls.
 STORY: Explore, compare sizes and prices, then contact the Cần Thơ showroom.
 FIRST VIEWPORT: Palace banner, overlapping toolbar, left filters and three photo columns.
 FORM: User-pinned reference; preserve its composition with responsive controls. */
import { PageReveal } from "./page-reveal";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CatalogRental } from "./catalog-shell";
import { useSiteState } from "./site-layout";
import { CatalogCard } from "./catalog-card";
import { CatalogFilters, control } from "./catalog-filters";
import { Icon } from "./icon";
import { formatPrice } from "@/lib/home-data";
import type {
  CatalogCategory,
  CatalogProduct,
  CatalogResponse,
} from "@/lib/catalog-types";
export default function CatalogPage() {
  const router = useRouter();
  const search = useSearchParams();
  const query = search.toString();
  const params = new URLSearchParams(query);
  const savedOnly = false;
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [result, setResult] = useState<CatalogResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [keyword, setKeyword] = useState(params.get("q") ?? "");
  const { favorites, setFavorites } = useSiteState();
  const [detail, setDetail] = useState<CatalogProduct | null>(null);
  const [detailError, setDetailError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    setKeyword(new URLSearchParams(query).get("q") ?? "");
  }, [query]);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`/api/products?${query}`, { signal: abort.signal }).then(
        async (r) => {
          const body = await r.json();
          if (!r.ok) throw new Error(body.error?.message);
          return body as CatalogResponse;
        },
      ),
      fetch("/api/product-categories", { signal: abort.signal }).then(
        async (r) => {
          if (!r.ok) throw new Error("Chưa tải được danh mục.");
          return r.json();
        },
      ),
    ])
      .then(([items, groups]) => {
        setResult(items);
        setCategories(groups.data);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.message || "Chưa tải được trang phục. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [query, retry]);
  useEffect(() => {
    if (!detail) return;
    const modal = dialog.current;
    modal?.showModal();
    return () => modal?.close();
  }, [detail]);
  function change(key: string, value: string, multiple = false) {
    const next = new URLSearchParams(query);
    next.delete("page");
    if (multiple) {
      const values = next.getAll(key);
      next.delete(key);
      (values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value]
      ).forEach((v) => next.append(key, v));
    } else {
      next.delete(key);
      if (value) next.set(key, value);
    }
    router.push(`/trang-phuc?${next}`, { scroll: false });
  }
  function selectCategory(slug: string) {
    const next = new URLSearchParams(query);
    next.delete("category");
    next.delete("page");
    if (slug) next.set("category", slug);
    router.push(`/trang-phuc?${next}`, { scroll: false });
  }
  async function openDetail(slug: string) {
    setDetailError("");
    try {
      const r = await fetch(`/api/products/${slug}`);
      if (!r.ok) throw new Error();
      setDetail((await r.json()).data);
    } catch {
      setDetailError("Chưa tải được chi tiết. Vui lòng thử lại.");
    }
  }
  const reset = () => router.push("/trang-phuc", { scroll: false });
  return (
    <>
      <PageReveal />
      <main>
        <section className="relative flex min-h-56 items-center justify-center overflow-hidden px-5 py-12 sm:min-h-64">
          <Image
            src="/images/banner-4.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-white/35" />
          <h1 data-catalog-reveal className="relative z-[2] max-w-4xl text-center text-3xl font-bold leading-snug text-[#650c13] sm:text-4xl lg:text-[44px]">
            Khám Phá Thế Giới Cổ Phục Thanh Y Các
          </h1>
        </section>
        <section
          id="catalog"
          className="bg-[#fffbf8] bg-[url('/images/background-san-pham.png')] bg-cover bg-top px-5 pb-12"
        >
          <div className="relative z-[2] mx-auto max-w-[1600px]">
            <div data-catalog-reveal
              className="relative -top-6 rounded-2xl border border-[#eddad2] bg-white p-5 font-['Inter']">
              <div
                className="flex gap-2 overflow-x-auto pb-4"
                role="group"
                aria-label="Danh mục trang phục"
              >
                {[
                  {
                    slug: "",
                    name: "❖ Tất Cả",
                    count: categories.reduce((n, c) => n + c.count, 0),
                  },
                  ...categories,
                ].map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => selectCategory(c.slug)}
                    aria-pressed={
                      c.slug
                        ? params.getAll("category").length === 1 &&
                          params.get("category") === c.slug
                        : !params.has("category")
                    }
                    className={`min-h-10 shrink-0 rounded-lg border px-3 text-sm font-semibold ${c.slug ? (params.getAll("category").length === 1 && params.get("category") === c.slug ? "border-[#80151c] bg-[#80151c] text-white" : "border-[#eddad2] bg-[#fdf5f2] text-[#66534c]") : !params.has("category") ? "border-[#80151c] bg-[#80151c] text-white" : "border-[#eddad2] text-[#66534c]"}`}
                  >
                    {c.name}{" "}
                    <span className="ml-1 opacity-80">({c.count})</span>
                  </button>
                ))}
              </div>
              <div className="grid gap-3 border-t border-[#f1e4de] pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    change("q", keyword.trim());
                  }}
                  role="search"
                  className="flex min-h-14 min-w-0 overflow-hidden rounded-full border-2 border-[#80151c] bg-white focus-within:ring-2 focus-within:ring-[#80151c]/25 focus-within:ring-offset-2 sm:col-span-2 lg:col-span-4"
                >
                  <input
                    type="search"
                    aria-label="Tìm tên trang phục, triều đại hoặc mã số"
                    placeholder="Tìm tên trang phục, triều đại hoặc mã số…"
                    maxLength={100}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-3 pl-5 pr-3 text-base text-[#4f3c35] outline-none placeholder:text-[#75645f] sm:pl-6"
                  />
                  <button
                    aria-label="Tìm kiếm"
                    className="flex w-16 shrink-0 items-center justify-center bg-[#80151c] text-white transition-colors hover:bg-[#650c13] focus-visible:!outline-offset-[-5px] sm:w-20"
                  >
                    <Icon name="search" className="!h-6 !w-6" />
                  </button>
                </form>
                {[
                  [
                    "gender",
                    "Giới tính",
                    [
                      ["", "Tất cả"],
                      ["female", "Nữ"],
                      ["male", "Nam"],
                      ["unisex", "Unisex"],
                    ],
                  ],
                  [
                    "price",
                    "Giá thuê",
                    [
                      ["", "Mọi mức giá"],
                      ["under300", "Dưới 300.000đ"],
                      ["300to500", "300.000–500.000đ"],
                      ["over500", "Trên 500.000đ"],
                    ],
                  ],
                  [
                    "availability",
                    "Tình trạng",
                    [
                      ["", "Tất cả"],
                      ["available", "Có thể hỏi lịch"],
                      ["advance", "Cần đặt trước"],
                    ],
                  ],
                  [
                    "sort",
                    "Sắp xếp",
                    [
                      ["popular", "Phổ biến nhất"],
                      ["newest", "Mới nhất"],
                      ["price-asc", "Giá tăng dần"],
                      ["price-desc", "Giá giảm dần"],
                    ],
                  ],
                ].map(([key, label, options]) => (
                  <select
                    key={key as string}
                    aria-label={label as string}
                    value={
                      params.get(key as string) ??
                      (key === "sort" ? "popular" : "")
                    }
                    onChange={(e) => change(key as string, e.target.value)}
                    className={control}
                  >
                    {(options as string[][]).map(([value, text]) => (
                      <option key={value} value={value}>
                        {label as string}: {text}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
              <CatalogFilters
                categories={categories}
                params={params}
                change={change}
                reset={reset}
              />
              <div aria-busy={loading}>
                <p
                  className="mb-4 font-['Inter'] text-sm text-[#75645f]"
                  role="status"
                  data-catalog-reveal
                >
                  {loading
                    ? "Đang tải trang phục…"
                    : error
                      ? ""
                      : `${result?.pagination.total ?? 0} trang phục · Bộ sưu tập mẫu, liên hệ xác nhận giá và lịch thuê.`}
                </p>
                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-[#eddad2] bg-white p-8"
                  >
                    <p>{error}</p>
                    <button
                      onClick={() => setRetry((n) => n + 1)}
                      className="mt-4 rounded-lg bg-[#80151c] px-5 py-3 text-white"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : loading ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5 2xl:grid-cols-3">
                    {Array.from({ length: 9 }, (_, i) => (
                      <div
                        key={i}
                        className="h-[560px] animate-pulse rounded-2xl bg-[#f3e6df] motion-reduce:animate-none"
                      />
                    ))}
                  </div>
                ) : (savedOnly
                    ? result?.data.filter((p) => favorites.includes(p.slug))
                    : result?.data
                  )?.length ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5 2xl:grid-cols-3">
                    {result?.data
                      .filter((p) => !savedOnly || favorites.includes(p.slug))
                      .map((product) => (
                        <CatalogCard
                          key={product.slug}
                          product={product}
                          favorite={favorites.includes(product.slug)}
                          onFavorite={() =>
                            setFavorites((v) =>
                              v.includes(product.slug)
                                ? v.filter((s) => s !== product.slug)
                                : [...v, product.slug],
                            )
                          }
                          onDetail={() => openDetail(product.slug)}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#eddad2] bg-white px-6 py-16 text-center">
                    <Icon
                      name="hanger"
                      className="mx-auto !h-10 !w-10 text-[#80151c]"
                    />
                    <h2 className="mt-5 text-xl font-bold">
                      {savedOnly
                        ? "Chưa có trang phục yêu thích ở trang này"
                        : "Chưa có trang phục phù hợp"}
                    </h2>
                    <p className="my-4 text-sm">
                      {savedOnly
                        ? "Bấm biểu tượng trái tim trên sản phẩm để lưu trong phiên này."
                        : "Thử từ khóa khác hoặc bỏ bớt bộ lọc."}
                    </p>
                    <button
                      onClick={reset}
                      className="rounded-lg bg-[#80151c] px-5 py-3 text-white"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
                {detailError && (
                  <p role="alert" className="mt-4 text-[#80151c]">
                    {detailError}
                  </p>
                )}
                {!loading &&
                  !error &&
                  result &&
                  result.pagination.totalPages > 1 && (
                    <nav
                      aria-label="Phân trang"
                      data-catalog-reveal
                      className="mt-8 flex justify-end gap-2 border-t border-[#eddad2] pt-6"
                    >
                      {Array.from(
                        { length: result.pagination.totalPages },
                        (_, i) => i + 1,
                      )
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === result.pagination.totalPages ||
                            Math.abs(p - result.pagination.page) <= 2,
                        )
                        .map((page) => (
                          <button
                            key={page}
                            aria-current={
                              result.pagination.page === page
                                ? "page"
                                : undefined
                            }
                            onClick={() => {
                              const next = new URLSearchParams(query);
                              next.set("page", String(page));
                              router.push(`/trang-phuc?${next}`, {
                                scroll: false,
                              });
                            }}
                            className={`h-11 min-w-11 rounded-lg border border-[#eddad2] ${result.pagination.page === page ? "bg-[#80151c] text-white" : "bg-white text-[#80151c]"}`}
                          >
                            {page}
                          </button>
                        ))}
                    </nav>
                  )}
              </div>
            </div>
          </div>
        </section>
        <CatalogRental />
      </main>
      <dialog
        ref={dialog}
        onCancel={() => setDetail(null)}
        aria-labelledby="catalog-detail-title"
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-[#eddad2] bg-white p-6 backdrop:bg-black/50"
      >
        {detail && (
          <>
            <button
              autoFocus
              aria-label="Đóng chi tiết"
              onClick={() => setDetail(null)}
              className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg text-[#80151c]"
            >
              <Icon name="close" />
            </button>
            <p className="text-sm text-[#75645f]">{detail.code}</p>
            <h2
              id="catalog-detail-title"
              className="my-4 text-2xl font-bold text-[#80151c]"
            >
              {detail.name}
            </h2>
            <p className="leading-relaxed">{detail.description}</p>
            <p className="my-4 text-xl font-bold text-[#80151c]">
              {formatPrice(detail.price)} / 24 giờ
            </p>
            <p className="text-sm">
              Chiều cao {detail.minHeight}–{detail.maxHeight} cm · Cân nặng{" "}
              {detail.minWeight}–{detail.maxWeight} kg.
            </p>
            <p className="my-4 text-sm text-[#75645f]">
              Mẫu giới thiệu. Liên hệ để xác nhận ảnh thực tế, giá và lịch còn
              trống. Gửi mã {detail.code} khi đặt lịch.
            </p>
            <a
              href="https://zalo.me/0779312303"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg bg-[#80151c] px-5 py-3 text-white"
            >
              Đặt lịch thử qua Zalo
            </a>
          </>
        )}
      </dialog>
    </>
  );
}
