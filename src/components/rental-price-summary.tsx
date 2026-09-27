import { rentalDayCount, type RentalRange } from "@/lib/rental-calendar";
import { formatPrice } from "@/lib/home-data";
import { rentalQuote, type RentalRates } from "@/lib/rental-pricing";

export function RentalPriceSummary({ range, ...rates }: { range: RentalRange } & RentalRates) {
  const days = rentalDayCount(range.start, range.end);
  const quote = rentalQuote(days || 1, rates);
  return <div aria-live="polite" className="mt-4 rounded-md border border-stone-200 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-stone-700">Tổng tiền thuê tạm tính</p><strong className="text-xl font-semibold tabular-nums text-[#781216]">{days ? formatPrice(quote.total) : "—"}</strong></div>
    {days ? <dl className="mt-3 space-y-2 text-sm">
      <div className="flex justify-between gap-3"><dt>Ngày đầu</dt><dd>{formatPrice(rates.price)}</dd></div>
      {days > 1 && <div className="flex justify-between gap-3"><dt>{days - 1} ngày tiếp × {formatPrice(quote.extraDay)}</dt><dd>{formatPrice((days - 1) * quote.extraDay)}</dd></div>}
      {quote.accessoryFee > 0 && <div className="flex justify-between gap-3"><dt>Phí phụ kiện (một lần)</dt><dd>{formatPrice(quote.accessoryFee)}</dd></div>}
      <div className="flex justify-between gap-3 border-t pt-2"><dt>Cọc giữ lịch</dt><dd>{formatPrice(quote.deposit)}</dd></div>
      <div className="flex justify-between gap-3 font-semibold"><dt>Còn thanh toán sau khi cọc</dt><dd>{formatPrice(quote.remaining)}</dd></div>
    </dl> : <p>Chọn ngày nhận và ngày trả để xem tổng tiền.</p>}
    {days && <p className="mt-3 text-xs leading-5 text-stone-500">Cọc được trừ vào tiền thuê, chỉ ghi nhận khi cửa hàng xác nhận. Tối thiểu 1 ngày. Trả sớm không tự giảm tiền thuê đã chốt.</p>}
  </div>;
}
