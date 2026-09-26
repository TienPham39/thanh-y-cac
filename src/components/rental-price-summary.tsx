import { rentalDayCount, type RentalRange } from "@/lib/rental-calendar";
import { formatPrice } from "@/lib/home-data";

export function RentalPriceSummary({ range, price }: { range: RentalRange; price: number }) {
  const days = rentalDayCount(range.start, range.end);
  return <div aria-live="polite" className="mt-4 rounded-md border border-stone-200 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-stone-700">Tổng tiền thuê tạm tính</p><strong className="text-xl font-semibold tabular-nums text-[#781216]">{days ? formatPrice(days * price) : "—"}</strong></div>
    <p className="mt-1 text-xs leading-5 text-stone-600">{days ? `${days} ngày × ${formatPrice(price)} / ngày` : "Chọn ngày nhận và ngày trả để xem tổng tiền."}</p>
    {days && <p className="mt-1 text-xs leading-5 text-stone-500">Tính theo 24 giờ, tối thiểu 1 ngày. Chưa gồm tiền cọc và phí phát sinh (nếu có).</p>}
  </div>;
}
