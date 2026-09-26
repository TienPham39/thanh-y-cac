import assert from "node:assert/strict";
import test from "node:test";
import { blankProduct, sampleProducts } from "./admin-products.ts";
import { mergeAdminCatalog, type AdminCatalogRow } from "./admin-catalog.ts";

const catalog: AdminCatalogRow[] = [{
  slug: "lam-sac", code: "TYC-TH12", name: "Tên đang bán", description: "Mô tả trên web",
  image: "/images/banner-3.png", price: 380000, categorySlug: "kiem-hiep",
  gender: "female", availability: "available", minHeight: 152, maxHeight: 168,
  minWeight: 42, maxWeight: 58, tags: ["Tiên hiệp"], accessories: ["fan"],
  badge: "Mẫu mới", badgeTone: "green", published: true, popularity: 99,
}];

test("saved gallery takes precedence over stale local images", () => {
  const images = ["/images/banner-3.png", "/images/example-2.png"];
  const draft = { ...blankProduct(), code: "TYC-TH12", images: ["/images/example-1.png"] };
  assert.deepEqual(mergeAdminCatalog([{ ...catalog[0], images }], [draft])[0].images, images);
});

test("admin rows use the public catalog as the source of product identity and visible fields", () => {
  const rows = mergeAdminCatalog(catalog, sampleProducts());
  assert.equal(rows.length, 1);
  assert.equal(rows[0].code, "TYC-TH12");
  assert.equal(rows[0].name, "Tên đang bán");
  assert.equal(rows[0].images[0], "/images/banner-3.png");
  assert.equal(rows[0].published, true);
});

test("local unsynced drafts remain in admin and stay hidden from customers", () => {
  const draft = { ...blankProduct(), id: "new-local", code: "TYC-NEW", name: "Bản nháp mới", published: true };
  const rows = mergeAdminCatalog(catalog, [draft]);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].name, "Bản nháp mới");
  assert.equal(rows[1].published, false);
});

test("admin keeps products that customers cannot see after they are hidden", () => {
  const rows = mergeAdminCatalog([{ ...catalog[0], published: false }], []);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].published, false);
});
