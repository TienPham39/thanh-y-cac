export type RentalRates = { price: number; extraDay?: number | null; deposit?: number | null; accessoryFee?: number | null };
export function rentalQuote(days: number, rates: RentalRates) {
  const extraDay = rates.extraDay ?? rates.price;
  const accessoryFee = rates.accessoryFee ?? 0;
  const deposit = rates.deposit ?? 0;
  const total = rates.price + Math.max(0, days - 1) * extraDay + accessoryFee;
  return { total, deposit, remaining: total - deposit, extraDay, accessoryFee };
}
