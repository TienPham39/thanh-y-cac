"use client";
/* THESIS: A clear rental storefront: vertical thumbnails, large image, booking beside it.
 * OWN-WORLD: White canvas, neutral rules, wine accents only for actions and price.
 * STORY: Inspect the garment, choose a date range, then continue to rental details.
 * FIRST VIEWPORT: Gallery on the left, name/price/date selector and actions on the right.
 * FORM: User-supplied retail product layout without brand price or promotional claims. */
import { useState } from "react";
import { productUrl } from "@/lib/product-url";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CatalogProduct } from "@/lib/catalog-types";
import type { RentalRange } from "@/lib/rental-calendar";
import { formatPrice } from "@/lib/home-data";
import { useSiteState } from "./site-layout";
import { Icon } from "./icon";
import { CatalogCard } from "./catalog-card";
import ProductBookingPanel from "./product-booking-panel";
import ProductPolicies from "./product-policies";
import { ProductGallery } from "./product-gallery";
import { RentalDatePopover } from "./rental-date-popover";

const categories: Record<string, string> = {
  "duong-trieu": "Cung Đình Đường Triều",
  "minh-trieu": "Minh Triều & Cung Phi",
  "han-trieu": "Hán Triều Cổ Phong",
  "kiem-hiep": "Kiếm Hiệp & Tiên Hiệp",
  "dan-quoc": "Dân Quốc Tân Thời",
};
const accessories: Record<string, string> = {
  hairpin: "Trâm cài & trang sức",
  fan: "Quạt lụa / quạt xếp",
  sword: "Kiếm / sáo trúc",
  embroidered: "Áo thêu hoa cổ trang",
};

export default function ProductDetailPage({
  product,
  related,
}: {
  product: CatalogProduct;
  related: CatalogProduct[];
}) {
  const router = useRouter();
  const { favorites, setFavorites } = useSiteState();
  const [range, setRange] = useState<RentalRange>({ start: "", end: "" });
  const favorite = favorites.includes(product.slug);
  const toggleFavorite = (slug: string) =>
    setFavorites((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  const componentNames = product.components?.split("\n") ?? [];
  const included = componentNames.some(Boolean) ? componentNames : product.accessories.length
    ? product.accessories.map((item) => accessories[item] ?? item)
    : ["Trang phục chính theo mẫu", "Phụ kiện được xác nhận khi thử đồ"];

  return (
    <main className="product-detail-page bg-white text-[#302b29]">
      <div className="relative z-[2] bg-[#f5f4f2]">
        <nav
          aria-label="Đường dẫn"
          className="mx-auto flex max-w-[1280px] 2xl:max-w-[1440px] flex-wrap items-center gap-2 px-4 py-3 text-xs text-[#68635f] sm:px-6"
        >
          <Link href="/">Trang chủ</Link>
          <span aria-hidden="true">›</span>
          <Link href="/trang-phuc">Trang phục</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/trang-phuc?category=${product.categorySlug}`}>
            {categories[product.categorySlug] ?? product.categorySlug}
          </Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page" className="text-[#302b29]">
            {product.code} · {product.name}
          </span>
        </nav>
      </div>
      <div className="relative z-[2] mx-auto max-w-[1280px] 2xl:max-w-[1440px] px-4 pt-6 sm:px-6 lg:pt-6 2xl:pt-8">
        <section
          aria-label="Thông tin trang phục"
          className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-7 xl:gap-10 2xl:gap-12"
        >
          <div className="min-w-0">
          <ProductGallery
            key={product.slug}
            product={product}
            favorite={favorite}
            onFavorite={() => toggleFavorite(product.slug)}
          />
            {componentNames.some(Boolean) && (
              <section className="mt-5 border-t border-[#e6e2de] pt-5" aria-label="Trọn bộ trang phục gồm">
                <h2 className="text-base font-semibold">Trọn bộ trang phục gồm</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {componentNames.map((name, index) => name && (
                    <li key={`${index}-${name}`} className="flex items-center gap-3 rounded border border-[#e6e2de] p-3">
                      {product.componentImages?.[index] && (
                        <img src={product.componentImages[index]} alt={name} width={72} height={72} loading="lazy" className="h-[72px] w-[72px] shrink-0 rounded object-contain" />
                      )}
                      <span className="min-w-0 break-words text-sm">{name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <div className="min-w-0 lg:pt-1">
            <p className="text-sm font-semibold text-[#7B5815]">Thanh Y Các</p>
            <h1 className="mt-2 text-2xl leading-snug sm:text-[30px] lg:text-[26px] 2xl:text-[30px] text-[#781216] font-bold">
              {product.name}
            </h1>
            <p className="mt-3 text-xs text-[#68635f]">
              Mã trang phục: {product.code}{" "}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-[#68635f]" aria-label="Thống kê trang phục">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-lg leading-none text-[#926515]">★</span>
                <span className="text-sm font-semibold text-[#302b29]">{(product.rating ?? 0).toLocaleString("vi-VN")}<span className="font-normal text-[#68635f]">/5</span></span>
                <span>({(product.reviewCount ?? 0).toLocaleString("vi-VN")} đánh giá)</span>
              </div>
              <div className="flex items-center gap-4 border-l border-[#e6e2de] pl-5 max-[420px]:w-full max-[420px]:border-l-0 max-[420px]:pl-0">
                <span><strong className="font-semibold text-[#302b29]">{product.popularity.toLocaleString("vi-VN")}</strong> quan tâm</span>
                <span><strong className="font-semibold text-[#302b29]">{(product.likes ?? 0).toLocaleString("vi-VN")}</strong> yêu thích</span>
              </div>
            </div>
            <div className="mb-6 mt-7 lg:my-5 2xl:mb-6 2xl:mt-7 flex flex-wrap items-baseline gap-3">
              <span className="text-sm">Giá thuê</span>
              <strong className="text-2xl font-semibold text-[#80151c]">
                {formatPrice(product.price)}
              </strong>
              <span className="text-xs text-[#68635f]">/ 24 giờ</span>
            </div>
            <RentalDatePopover productSlug={product.slug}
              range={range}
              onChange={setRange}
              price={product.price}
              extraDay={product.extraDay}
              deposit={product.deposit}
              accessoryFee={product.accessoryFee}
            />
            <dl className="mt-6 grid grid-cols-[110px_1fr] gap-x-4 gap-y-4 lg:gap-y-3 2xl:gap-y-4 text-sm sm:grid-cols-[130px_1fr]">
              <dt className="text-[#68635f]">Chiều cao</dt>
              <dd>
                {product.minHeight}–{product.maxHeight} cm
              </dd>
              <dt className="text-[#68635f]">Cân nặng</dt>
              <dd>
                {product.minWeight}–{product.maxWeight} kg
              </dd>
              <dt className="text-[#68635f]">Phụ kiện</dt>
              <dd className="leading-6">{included.join(" · ")}</dd>
              <dt className="text-[#68635f]">Đặt cọc</dt>
              <dd>{formatPrice(product.deposit ?? 0)} — trừ vào tiền thuê</dd>
            </dl>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:mt-5 2xl:mt-7">
              <a
                href="https://zalo.me/0779312303"
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 bg-[#80151c] px-4 text-sm font-semibold text-white hover:bg-[#590008]"
              >
                <Icon name="chat" className="!h-4 !w-4" />
                Đặt thuê qua Zalo
              </a>
              <a
                href="#thong-tin-giu-do"
                className="flex min-h-12 items-center justify-center bg-[#302b29] px-4 text-sm font-semibold text-white hover:bg-black"
              >
                Đăng ký thuê
              </a>
            </div>
            <a
              href="https://zalo.me/0779312303"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-[#68635f] hover:text-[#80151c]"
            >
              <Icon name="chat" className="!h-4 !w-4" />
              Tư vấn kích cỡ và lịch thuê qua Zalo
            </a>
            <div className="mt-5 border-t border-[#e6e2de] pt-5">
              <h2 className="text-base font-semibold">Về trang phục</h2>
              <p className="mt-3 text-sm leading-7 text-[#68635f]">
                {product.description}
              </p>
            </div>
          </div>
        </section>
        <ProductBookingPanel
          key={product.slug}
          product={product}
          range={range}
          onReset={() => setRange({ start: "", end: "" })}
        />
      </div>
      <ProductPolicies />
      <div className="relative z-[2] mx-auto max-w-[1280px] 2xl:max-w-[1440px] px-4 pb-16 sm:px-6">
        {related.length > 0 && (
          <section
            aria-labelledby="related-title"
            className="mx-auto mt-12 w-full max-w-[1120px]"
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2
                id="related-title"
                className="text-2xl font-semibold sm:text-2xl text-[#80151c]"
              >
                Khám phá cùng bộ sưu tập
              </h2>
              <Link
                href="/trang-phuc"
                className="inline-flex min-h-11 items-center text-sm font-medium text-[#80151c] hover:underline"
              >
                Xem tất cả
              </Link>
            </div>
            <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {related.map((item) => (
                <CatalogCard
                  key={item.slug}
                  product={item}
                  favorite={favorites.includes(item.slug)}
                  onFavorite={() => toggleFavorite(item.slug)}
                  onDetail={() => router.push(productUrl(item.slug))}
                  animate={false}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
