"use client";

/* THESIS: A showroom album with a full portrait and selectable detail photographs.
 * OWN-WORLD: White canvas, neutral selection outline, compact portrait thumbnails.
 * STORY: See the silhouette, switch angles, enlarge the selected photograph.
 * FIRST VIEWPORT: Vertical thumbnail rail left of the main image; horizontal on mobile.
 * FORM: User-pinned gallery within the existing product dossier. */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { Icon } from "./icon";

export function ProductGallery({ product }: {
  product: CatalogProduct; favorite: boolean; onFavorite: () => void;
}) {
  const images = [...new Set([product.image, ...(product.images ?? [])].filter(Boolean))];
  const [active, setActive] = useState(0);
  const [popupActive, setPopupActive] = useState(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.min(active, images.length - 1);
  const src = images[index];
  const hasMultiple = images.length > 1;
  const imageFailed = failed.includes(src);

  useEffect(() => {
    if (!expanded) return;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    modal?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      modal?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  function move(offset: number) {
    setPopupActive(current => (current + offset + images.length) % images.length);
  }

  return <section aria-label={`Bộ ảnh ${product.name}`} className="grid min-w-0 content-start gap-4 lg:gap-3 lg:grid-cols-[64px_minmax(0,1fr)] 2xl:gap-4 2xl:grid-cols-[72px_minmax(0,1fr)]">
    <div className="relative w-full max-w-[680px] overflow-hidden bg-[#f5f4f2] lg:col-start-2 lg:row-start-1">
      <button type="button" aria-label={`Phóng to ảnh ${index + 1}: ${product.name}`} onClick={() => { setPopupActive(index); setExpanded(true); }}
        className="relative block aspect-[680/646] w-full cursor-zoom-in">
        {imageFailed ? <span className="absolute inset-0 flex items-center justify-center px-8 text-sm text-[#765f5a]">Ảnh chưa tải được. Vui lòng chọn ảnh khác.</span>
          : <Image key={src} src={src} alt={`${product.name} — ảnh ${index + 1}`} fill priority={index === 0}
            sizes="(min-width:1536px) 680px, (min-width:1024px) 45vw, (min-width:768px) 680px, 100vw" className="object-contain"
            onError={() => setFailed(current => [...current, src])} />}
        <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white/95 text-[#80151c]" aria-hidden="true"><Icon name="search" /></span>
      </button>
      {hasMultiple && <span className="pointer-events-none absolute left-4 top-4 rounded bg-white/95 px-3 py-1.5 text-xs font-medium tabular-nums text-[#74131b]" aria-live="polite">{index + 1} / {images.length}</span>}
    </div>
    {images.length > 0 && <div role="group" aria-label="Chọn ảnh trang phục" className="flex gap-3 overflow-x-auto p-1 lg:col-start-1 lg:row-start-1 lg:max-h-[700px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
      {images.map((image, imageIndex) => <button key={image} type="button" ref={node => { thumbnailRefs.current[imageIndex] = node; }}
        aria-label={`Xem ảnh ${imageIndex + 1} của ${product.name}`} aria-pressed={index === imageIndex}
        onClick={() => setActive(imageIndex)}
        onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? images.length - 1 : (imageIndex + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + images.length) % images.length;
          setActive(next);
          thumbnailRefs.current[next]?.focus();
        }}
        className={`relative aspect-square min-w-14 basis-[calc((100%-48px)/5)] shrink-0 overflow-hidden border lg:aspect-[2/3] lg:w-full lg:basis-auto transition-colors ${index === imageIndex ? "border-[#38322e]" : "border-transparent opacity-60 hover:border-[#a69b92] hover:opacity-100"}`}>
        <Image src={image} alt={`Ảnh thu nhỏ ${imageIndex + 1}`} fill sizes="100px" className="object-cover" />
      </button>)}
    </div>}
    <dialog ref={dialog} aria-label={`Xem ảnh phóng to: ${product.name}`} onCancel={() => setExpanded(false)}
      onClick={event => { if (event.target === event.currentTarget) setExpanded(false); }}
      onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
      className="fixed inset-0 m-auto h-[94dvh] max-h-[900px] w-[min(720px,96vw)] max-w-none overflow-hidden rounded-[2px] bg-white p-0 text-[#302b29] backdrop:bg-black/60">
      {expanded && <div className="flex h-full flex-col px-4 pb-4 pt-12 sm:px-10 sm:pb-6">
        <button type="button" autoFocus aria-label="Đóng ảnh phóng to" onClick={() => setExpanded(false)} className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white hover:bg-stone-100"><Icon name="close" /></button>
        <div className="relative min-h-0 flex-1">
          <div role="region" aria-roledescription="carousel" aria-label="Ảnh trang phục phóng to" className="absolute inset-0 touch-pan-y overflow-hidden"
            onTouchStart={event => { const touch = event.touches[0]; swipeStart.current = { x: touch.clientX, y: touch.clientY }; }}
            onTouchCancel={() => { swipeStart.current = null; }}
            onTouchEnd={event => {
              const start = swipeStart.current;
              swipeStart.current = null;
              if (!start || !hasMultiple) return;
              const touch = event.changedTouches[0];
              const dx = touch.clientX - start.x;
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(touch.clientY - start.y)) move(dx < 0 ? 1 : -1);
            }}>
            <div className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${popupActive * 100}%)` }}>
              {images.map((image, i) => <div key={image} role="group" aria-roledescription="slide" aria-label={`Ảnh ${i + 1} / ${images.length}`} aria-hidden={popupActive !== i} className="relative h-full w-full shrink-0">
                {failed.includes(image) ? <p className="p-8 text-center">Ảnh chưa tải được. Vui lòng chọn ảnh khác.</p> : <Image src={image} alt={`${product.name} — ảnh phóng to ${i + 1}`} fill draggable={false} sizes="(min-width:720px) 640px, 90vw" className="select-none object-contain" onError={() => setFailed(current => [...current, image])} />}
              </div>)}
            </div>
          </div>
          {hasMultiple && <>
            <button type="button" aria-label="Ảnh trước" onClick={() => move(-1)} className="group/arrow absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 transition duration-200 ease-out hover:bg-[#781216]/10 hover:text-[#781216] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#781216] focus-visible:ring-offset-2 active:bg-[#781216]/20 motion-safe:active:scale-95 motion-reduce:transition-none"><Icon name="chevron" className="rotate-180 transition-transform duration-200 ease-out motion-safe:group-hover/arrow:-translate-x-1 motion-reduce:transition-none" /></button>
            <button type="button" aria-label="Ảnh tiếp theo" onClick={() => move(1)} className="group/arrow absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 transition duration-200 ease-out hover:bg-[#781216]/10 hover:text-[#781216] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#781216] focus-visible:ring-offset-2 active:bg-[#781216]/20 motion-safe:active:scale-95 motion-reduce:transition-none"><Icon name="chevron" className="transition-transform duration-200 ease-out motion-safe:group-hover/arrow:translate-x-1 motion-reduce:transition-none" /></button>
          </>}
        </div>
        <p aria-live="polite" className="sr-only">Ảnh {popupActive + 1} / {images.length}</p>
        <div className="flex shrink-0 justify-center py-2" aria-label="Vị trí ảnh">
          {images.map((image, i) => <button key={image} type="button" aria-label={`Chuyển đến ảnh ${i + 1}`} aria-pressed={popupActive === i} onClick={() => setPopupActive(i)} className="flex h-8 w-8 items-center justify-center"><span className={`h-2 w-2 rounded-full ${popupActive === i ? "bg-[#80151c]" : "bg-stone-300"}`} /></button>)}
        </div>
        <div role="group" aria-label="Ảnh thu nhỏ trong popup" className="mx-auto flex w-max max-w-full shrink-0 gap-3 overflow-x-auto py-1">
          {images.map((image, i) => <button key={image} type="button" aria-label={`Chọn ảnh phóng to ${i + 1}`} aria-pressed={popupActive === i} onClick={() => setPopupActive(i)} className={`relative h-20 w-16 shrink-0 border-2 p-0.5 transition-colors hover:border-[#781216] focus-visible:outline-[#781216] sm:h-24 sm:w-20 ${popupActive === i ? "border-[#781216]" : "border-transparent opacity-60 hover:opacity-100"}`}><span className="relative block h-full w-full"><Image src={image} alt={`Ảnh thu nhỏ ${i + 1}`} fill sizes="80px" className="object-cover" /></span></button>)}
        </div>
      </div>}
    </dialog>
  </section>;
}
