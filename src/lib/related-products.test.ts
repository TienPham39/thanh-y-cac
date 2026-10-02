import assert from "node:assert/strict";
import { test } from "node:test";
import { selectRelatedProducts } from "./related-products.ts";

test("related products exclude the current item and use four distinct categories", () => {
  const rows = [
    { slug: "current", categorySlug: "a" },
    { slug: "a-one", categorySlug: "a" },
    { slug: "a-two", categorySlug: "a" },
    ...["b", "c", "d", "e"].map(categorySlug => ({ slug: categorySlug, categorySlug })),
  ];
  assert.deepEqual(selectRelatedProducts(rows, "current").map(p => p.slug), ["a-one", "b", "c", "d"]);
});

test("fewer available categories are not padded with duplicates", () => {
  assert.deepEqual(selectRelatedProducts([
    { slug: "current", categorySlug: "a" },
    { slug: "b-one", categorySlug: "b" },
    { slug: "b-two", categorySlug: "b" },
  ], "current"), [{ slug: "b-one", categorySlug: "b" }]);
  assert.deepEqual(selectRelatedProducts([], "current"), []);
});
