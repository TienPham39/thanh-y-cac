import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeProductComponents,
  parseProductComponents,
  serializeProductComponents,
} from "./admin-product-components.ts";

test("turns saved component lines into editable items", () => {
  assert.deepEqual(
    parseProductComponents("Mũ phượng\n\n Trâm cài \nKhăn vai"),
    ["Mũ phượng", "Trâm cài", "Khăn vai"],
  );
});

test("stores only non-empty component items", () => {
  assert.equal(
    serializeProductComponents([" Mũ phượng ", "", "Khăn vai"]),
    "Mũ phượng\nKhăn vai",
  );
});

test("keeps uploaded images aligned when empty component rows are removed", () => {
  assert.deepEqual(
    normalizeProductComponents(
      ["Mũ phượng", "", "Khăn vai"],
      ["/uploads/mu.webp", "/uploads/bo-qua.webp", "/uploads/khan.webp"],
    ),
    {
      components: "Mũ phượng\nKhăn vai",
      componentImages: ["/uploads/mu.webp", "/uploads/khan.webp"],
    },
  );
});
