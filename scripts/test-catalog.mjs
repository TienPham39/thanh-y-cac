import assert from "node:assert/strict";
const base = process.env.CATALOG_BASE_URL ?? "http://localhost:3000";
async function get(path) {
  const response = await fetch(base + path);
  return [response, await response.json()];
}
const [response, catalog] = await get("/api/products");
assert.equal(response.status, 200);
assert.ok(
  catalog.pagination.total >= 10,
  "Run catalog seed before these integration checks",
);
assert.equal(catalog.pagination.pageSize, 9);
assert.equal(catalog.data.length, 9);
const [pageTwoResponse, pageTwo] = await get("/api/products?page=2");
assert.equal(pageTwoResponse.status, 200);
assert.ok(pageTwo.data.length > 0);
assert.ok(pageTwo.data.every(p => !catalog.data.some(first => first.slug === p.slug)));
let [r, body] = await get("/api/products?gender=male");
assert.ok(body.data.every((p) => p.gender === "male"));
[, body] = await get("/api/products?accessory=fan&accessory=hairpin");
assert.ok(
  body.data.length > 0 &&
    body.data.every(
      (p) => p.accessories.includes("fan") && p.accessories.includes("hairpin"),
    ),
);
[, body] = await get("/api/products?price=under300");
assert.ok(body.data.length > 0 && body.data.every((p) => p.price < 300000));
[, body] = await get("/api/products?pageSize=2&page=2&sort=price-asc");
assert.equal(body.data.length, 2);
assert.ok(body.pagination.totalPages >= 3);
assert.ok(body.data[0].price <= body.data[1].price);
[, body] = await get("/api/products?category=dan-quoc");
assert.ok(body.data.every((p) => p.categorySlug === "dan-quoc"));
[, body] = await get("/api/products?q=TYC-TH12");
assert.equal(body.data[0].slug, "lam-sac");
[, body] = await get(
  "/api/products?q=" + encodeURIComponent("Cung Đình Đường Triều"),
);
assert.ok(body.data.some((p) => p.slug === "mau-don"));
[, body] = await get("/api/products?height=over175");
assert.ok(body.data.length > 0 && body.data.every((p) => p.maxHeight >= 176));
for (const query of ["page=-1", "pageSize=25", "sort=unsafe", "unknown=x"]) {
  [r] = await get("/api/products?" + query);
  assert.equal(r.status, 400);
}
[r] = await get("/api/products/no-such-product");
assert.equal(r.status, 404);
[r, body] = await get("/api/products/mau-don");
assert.equal(r.status, 200);
assert.equal(body.data.code, "TYC-CD01");
[, body] = await get("/api/product-categories");
assert.equal(
  body.data.reduce((n, c) => n + c.count, 0),
  catalog.pagination.total,
);
console.log(
  "PASS: catalog integration checks (search, filters, sort, pagination, categories, details, invalid input)",
);
