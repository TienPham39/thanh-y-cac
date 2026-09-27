import assert from "node:assert/strict";
import test from "node:test";
import { blankProduct, categories, nextProductCode } from "./admin-products.ts";

test("short codes advance beyond existing codes", () => {
  assert.equal(blankProduct().code, "TYC-CD01");
  assert.equal(blankProduct([{ code: "TYC-CD01" }, { code: "tyc-cd08" }, { code: "TYC-HP99" }]).code, "TYC-CD09");
  assert.equal(blankProduct([{ code: "TYC-CD99" }]).code, "TYC-CD100");
});

test("each category has an independent code sequence", () => {
  assert.equal(nextProductCode("Danh mục mới", [{code:"TYC-NM04"}], {"Danh mục mới":"NM"}), "TYC-NM05");
  assert.deepEqual(categories.map(category => nextProductCode(category)), [
    "TYC-CD01", "TYC-TH01", "TYC-CP01", "TYC-HP01", "TYC-DQ01", "TYC-KH01",
  ]);
  const existing = [{ code: "TYC-CD25" }, { code: "tyc-th03" }];
  assert.equal(nextProductCode("Tiên hiệp", existing), "TYC-TH04");
  assert.equal(nextProductCode("Cung đình", existing), "TYC-CD26");
  assert.equal(nextProductCode("Hỷ phục", existing), "TYC-HP01");
});
