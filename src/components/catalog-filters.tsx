import type { CatalogCategory } from "@/lib/catalog-types";
import { Icon } from "./icon";
export const control =
  "min-h-11 min-w-0 rounded-lg border border-[#eddad2] bg-white px-3 text-sm text-[#66534c] focus:border-[#80151c] focus:outline-none focus:ring-1 focus:ring-[#80151c]";
export function CatalogFilters({
  categories,
  params,
  change,
  reset,
}: {
  categories: CatalogCategory[];
  params: URLSearchParams;
  change: (key: string, value: string, multiple?: boolean) => void;
  reset: () => void;
}) {
  return (
    <aside className="self-start font-['Inter'] lg:sticky lg:top-4">
      <section data-catalog-reveal aria-labelledby="filter-title" className="rounded-2xl border border-[#eddad2] bg-white p-5">
        <div className="mb-1 flex items-center justify-between gap-2 border-b border-[#f1d5d5] pb-4">
          <h2 id="filter-title" className="flex items-center gap-2 !font-['Inter'] text-xl font-semibold text-[#4a2023]">
            <Icon name="tag" className="!h-6 !w-6 text-[#80151c]" />
            Bộ Lọc
          </h2>
          <button type="button" onClick={reset} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[#80151c] transition-colors hover:bg-[#fcf0ed]">
            <Icon name="reset" className="!h-4 !w-4" />
            Mặc định
          </button>
        </div>
        <fieldset className="py-4">
          <legend className="sr-only">Triều đại và phong cách</legend>
          <h2 className="mb-3 font-['Noto_Serif'] text-sm font-bold">
            Triều Đại & Phong Cách
          </h2>
          {categories.map((category) => (
            <label
              key={category.slug}
              className="flex min-h-10 cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={params.getAll("category").includes(category.slug)}
                onChange={() => change("category", category.slug, true)}
                className="h-4 w-4 accent-[#80151c]"
              />
              {category.name}
              <span className="ml-auto rounded-full bg-[#fcf0ed] px-2 text-[#826e66]">
                {category.count}
              </span>
            </label>
          ))}
        </fieldset>
        <fieldset className="border-t border-[#f1e4de] py-4">
          <legend className="sr-only">Chiều cao thích hợp</legend>
          <h2 className="mb-3 font-['Noto_Serif'] text-sm font-bold">
            Chiều Cao Thích Hợp
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["under155", "< 1m55"],
              ["155to165", "1m55 – 1m65"],
              ["165to175", "1m65 – 1m75"],
              ["over175", "> 1m75"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={params.get("height") === value}
                onClick={() =>
                  change("height", params.get("height") === value ? "" : value)
                }
                className={`min-h-10 rounded border text-sm ${params.get("height") === value ? "border-[#80151c] bg-[#fcf0ed] text-[#80151c]" : "border-[#eddad2]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="border-t border-[#f1e4de] pt-4">
          <legend className="sr-only">Phụ kiện đi kèm</legend>
          <h2 className="mb-3 font-['Noto_Serif'] text-sm font-bold">
            Phụ Kiện Đi Kèm
          </h2>
          {[
            ["hairpin", "Trâm cài & trang sức"],
            ["fan", "Quạt lụa / quạt xếp"],
            ["sword", "Kiếm / sáo trúc"],
            ["embroidered", "Áo thêu hoa cổ trang"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-10 cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={params.getAll("accessory").includes(value)}
                onChange={() => change("accessory", value, true)}
                className="h-4 w-4 accent-[#80151c]"
              />
              {label}
            </label>
          ))}
        </fieldset>
      </section>
      <div data-catalog-reveal className="mt-6 rounded-2xl bg-[#650c13] p-5 text-[#FFDEAC]">
        <h2 className="font-['Noto_Serif'] text-lg font-bold">
          Tư Vấn Chọn Size
        </h2>
        <p className="my-4 text-sm leading-relaxed">
          Chưa rõ số đo hoặc cần phối phụ kiện? Gửi số đo và concept bạn muốn,
          Thanh Y Các sẽ hỗ trợ chọn trang phục phù hợp.
        </p>
        <a
          href="https://zalo.me/0779312303"
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#FFDEAC] px-3 text-sm font-semibold text-[#650c13]"
        >
          <Icon name="chat" />
          Tư Vấn Zalo Trực Tiếp
        </a>
      </div>
    </aside>
  );
}
