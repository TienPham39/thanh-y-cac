import assert from "node:assert/strict";
import test from "node:test";
import { parseDeleteProductCodes } from "./admin-product-delete.ts";

test("accepts valid product codes and removes duplicates", () => {
  assert.deepEqual(parseDeleteProductCodes({ codes: ["TYC-CD01", "TYC-CD01", "TYC-TH12"] }), ["TYC-CD01", "TYC-TH12"]);
});

test("rejects empty, oversized, and unsafe delete requests", () => {
  assert.equal(parseDeleteProductCodes({ codes: [] }), null);
  assert.equal(parseDeleteProductCodes({ codes: Array.from({ length: 101 }, (_, index) => `TYC-${index}`) }), null);
  assert.equal(parseDeleteProductCodes({ codes: ["../../database"] }), null);
});
