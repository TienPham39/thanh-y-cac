import assert from "node:assert/strict";
import test from "node:test";
import { rentalQuote } from "./rental-pricing.ts";
test("deposit is deducted, extra days and accessory fee charged once", () => {
  assert.deepEqual(rentalQuote(3, {price:450000,extraDay:50000,deposit:50000,accessoryFee:0}), {total:550000,deposit:50000,remaining:500000,extraDay:50000,accessoryFee:0});
  assert.equal(rentalQuote(1,{price:450000,extraDay:0,accessoryFee:20000}).total,470000);
  assert.equal(rentalQuote(3,{price:450000,extraDay:0}).total,450000);
  assert.equal(rentalQuote(3,{price:450000}).total,1350000);
});
