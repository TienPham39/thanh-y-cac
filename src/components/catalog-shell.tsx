import { rentalSteps } from "@/lib/home-data";
export function CatalogRental() {
  return (
    <section
      id="quy-trinh"
      className="border-y border-[#f1e4de] bg-[#fcf0ed] px-5 py-16 sm:py-20"
    >
      <div className="relative z-[2] mx-auto max-w-[1600px]">
        <div data-catalog-reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 font-['Inter'] text-xs font-semibold tracking-wider text-[#80151c]">
            TRẢI NGHIỆM AN TÂM & NHANH CHÓNG
          </p>
          <h2 className="text-2xl font-bold text-[#650c13] sm:text-4xl">
            Quy Trình Thuê Đồ Chuẩn 4 Bước
          </h2>
          <p className="mt-4 font-['Inter'] text-sm leading-relaxed text-[#75645f]">
            Thanh Y Các tối ưu hóa mọi thủ tục để quý khách có thể hóa thân
            thành nhân vật cổ trang trọn vẹn nhất.
          </p>
        </div>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rentalSteps.map((step, i) => (
            <li
              key={step.title}
              data-catalog-reveal
              className="rounded-2xl border border-[#eddad2] bg-white p-6"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#80151c] text-xl font-bold text-[#FFDEAC]">
                0{i + 1}
              </span>
              <h3 className="mb-3 mt-6 min-h-14 text-base font-bold">
                {step.title}
              </h3>
              <p className="font-['Inter'] text-sm leading-relaxed text-[#75645f]">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
