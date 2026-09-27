import assert from "node:assert/strict";
import { test } from "node:test";
import { productUrl } from "./product-url.ts";

test("product links target an exported page on DirectAdmin", () => {
  const previous = process.env.NEXT_PUBLIC_STATIC_SITE;
  try {
    process.env.NEXT_PUBLIC_STATIC_SITE = "true";
    assert.equal(productUrl("ao-do"), "/chi-tiet-trang-phuc/?slug=ao-do");
    process.env.NEXT_PUBLIC_STATIC_SITE = "false";
    assert.equal(productUrl("ao-do"), "/chi-tiet-trang-phuc/?slug=ao-do");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_STATIC_SITE;
    else process.env.NEXT_PUBLIC_STATIC_SITE = previous;
  }
});
