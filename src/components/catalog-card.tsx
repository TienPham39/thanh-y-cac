import { AnimatedProductCard } from "./animated-product-card";
import Image from "next/image";
import { Icon } from "./icon";
import type { CatalogProduct } from "@/lib/catalog-types";
import { formatPrice } from "@/lib/home-data";
export function CatalogCard({
  product,
  onDetail,
  animate = true,
}: {
  product: CatalogProduct;
  favorite: boolean;
  onFavorite: () => void;
  onDetail: () => void;
  animate?: boolean;
}) {
  return (
    <AnimatedProductCard enabled={animate} className="flex h-full min-w-0 flex-col overflow-hidden rounded-[2px] border border-[#eddad2] bg-white">
      <div className="group/product-image relative h-[360px] overflow-hidden sm:h-[380px] 2xl:h-[400px]">
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
            className="object-cover object-[center_45%] transition-transform duration-[350ms] ease-out motion-safe:group-hover/product-image:scale-[1.07] motion-reduce:transition-none"
          />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 font-['Inter'] text-xs font-medium">
          <p className="font-semibold tracking-wider text-[#9a6d16]">
            {product.code}
          </p>
          <div className="flex flex-wrap justify-end gap-2 text-[#8b242b]">
            {product.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#fcf0ed] px-2 py-1">
                ❖ {tag}
              </span>
            ))}
          </div>
        </div>
        <h2 className="mb-2 mt-2 text-lg font-bold leading-snug text-[#701019]">
          <button onClick={onDetail} className="text-left hover:underline">
            {product.name}
          </button>
        </h2>
        <div className="mb-3 mt-auto flex items-center border-t border-[#eddad2] pt-3">
          <p className="text-lg font-bold text-[#000000]">
            {formatPrice(product.price)}
            <span className="ml-1 font-['Inter'] text-xs font-normal text-[#75645f]">
              /ngày
            </span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 font-['Inter'] text-xs font-semibold">
          <button
            onClick={onDetail}
            className="min-h-8 min-w-0 rounded-lg border border-[#eddad2] px-2 text-[#80151c] hover:bg-[#fcf0ed]"
          >
            Xem chi tiết
          </button>
          <a
            href={`https://zalo.me/0779312303`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Đặt lịch thử ${product.name} qua Zalo`}
            className="flex min-h-8 min-w-0 items-center justify-center gap-1 rounded-lg bg-[#80151c] px-2 text-white hover:bg-[#650c13]"
          >
            <Icon name="calendar" className="!h-3.5 !w-3.5 shrink-0" />
            Đặt lịch
          </a>
        </div>
      </div>
    </AnimatedProductCard>
  );
}
