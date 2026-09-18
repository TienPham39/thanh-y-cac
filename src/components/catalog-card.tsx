import { AnimatedProductCard } from "./animated-product-card";
import Image from "next/image";
import { Icon } from "./icon";
import type { CatalogProduct } from "@/lib/catalog-types";
import { formatPrice } from "@/lib/home-data";
export function CatalogCard({
  product,
  favorite,
  onFavorite,
  onDetail,
}: {
  product: CatalogProduct;
  favorite: boolean;
  onFavorite: () => void;
  onDetail: () => void;
}) {
  const tones: Record<string, string> = {
    red: "bg-[#80151c]",
    green: "bg-[#183e34]",
    gold: "bg-[#805d17]",
  };
  return (
    <AnimatedProductCard className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#eddad2] bg-white">
      <div className="group/product-image relative h-[260px] sm:h-[280px] 2xl:h-[300px] overflow-hidden">
        <button
          onClick={onDetail}
          aria-label={`Xem chi tiết ${product.name}`}
          className="absolute inset-0"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1640px) 412px, (min-width: 1280px) 30vw, (min-width: 1024px) 45vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-[350ms] ease-out motion-safe:group-hover/product-image:scale-[1.07] motion-reduce:transition-none"
          />
        </button>
        <span
          className={`pointer-events-none absolute left-3 top-3 rounded-lg px-3 py-1.5 font-['Inter'] text-sm font-semibold text-white ${tones[product.badgeTone] ?? tones.red}`}
        >
          {product.badge}
        </span>
        <button
          aria-label={`${favorite ? "Bỏ yêu thích" : "Yêu thích"} ${product.name}`}
          aria-pressed={favorite}
          onClick={onFavorite}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#80151c] ${favorite ? "ring-2 ring-[#80151c]" : ""}`}
        >
          <Icon name="heart" className={favorite ? "fill-[#80151c]" : ""} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold tracking-wider text-[#826e66]">
          {product.code}
        </p>
        <h2 className="mb-2 mt-2 min-h-14 text-xl font-bold leading-snug text-[#701019]">
          <button onClick={onDetail} className="text-left hover:underline">
            {product.name}
          </button>
        </h2>
        <div className="mb-3 flex flex-wrap gap-2 font-['Inter'] text-xs font-medium text-[#8b242b]">
          {product.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-[#fcf0ed] px-2 py-1">
              ❖ {tag}
            </span>
          ))}
        </div>
        <p className="mb-3 line-clamp-2 min-h-11 font-['Inter'] text-sm leading-relaxed text-[#75645f]">
          {product.description}
        </p>
        <p className="mt-auto border-y border-[#f2e5df] py-2.5 font-['Inter'] text-xs text-[#75645f]">
          Cao: {product.minHeight}–{product.maxHeight} cm · Nặng:{" "}
          {product.minWeight}–{product.maxWeight} kg
        </p>
        <div className="my-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xl font-bold text-[#80151c]">
            {formatPrice(product.price)}
            <span className="ml-1 font-['Inter'] text-xs font-normal text-[#75645f]">
              /ngày
            </span>
          </p>
          <span
            className={`rounded-full px-2 py-1 font-['Inter'] text-xs font-semibold ${product.availability === "advance" ? "bg-[#ffe1db] text-[#8b242b]" : "bg-[#e0f1e8] text-[#245441]"}`}
          >
            {product.availability === "advance"
              ? "Đặt trước 3 ngày"
              : "Liên hệ kiểm tra lịch"}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_1.2fr] gap-2 font-['Inter'] text-sm font-semibold">
          <button
            onClick={onDetail}
            className="min-h-11 whitespace-nowrap rounded-lg border border-[#eddad2] px-2 text-[#80151c] hover:bg-[#fcf0ed]"
          >
            Xem chi tiết
          </button>
          <a
            href={`https://zalo.me/0779312303`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Đặt lịch thử ${product.name} qua Zalo`}
            className="flex min-h-11 whitespace-nowrap items-center justify-center gap-1 rounded-lg bg-[#80151c] px-2 text-white hover:bg-[#650c13]"
          >
            <Icon name="calendar" className="!h-3.5 !w-3.5" />
            Đặt lịch thử đồ
          </a>
        </div>
      </div>
    </AnimatedProductCard>
  );
}
