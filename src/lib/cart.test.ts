import assert from "node:assert/strict";
import test from "node:test";
import { addToCart, parseCart } from "./cart.ts";
const item = { productSlug: "costume", start: "2026-10-02", end: "2026-10-03" };
test("cart survives malformed storage and removes duplicates", () => {
  assert.deepEqual(parseCart("{broken"), []);
  assert.deepEqual(
    parseCart(
      JSON.stringify([
        null,
        "legacy",
        item,
        item,
        { ...item, productSlug: "../invalid" },
      ]),
    ),
    [item],
  );
  assert.deepEqual(parseCart(JSON.stringify([{ ...item, start: "bad" }])), [
    { ...item, start: "" },
  ]);
});
test("adding an existing costume updates dates and the cart has eight slots", () => {
  assert.deepEqual(addToCart([item], { ...item, end: "2026-10-04" }), [
    { ...item, end: "2026-10-04" },
  ]);
  const items = Array.from({ length: 8 }, (_, i) => ({
    ...item,
    productSlug: `costume-${i}`,
  }));
  assert.deepEqual(addToCart(items, item), items);
  assert.equal(parseCart(JSON.stringify([...items, item])).length, 8);
});
