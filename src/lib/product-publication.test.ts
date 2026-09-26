import assert from "node:assert/strict";
import test from "node:test";
import { parsePublicationInput } from "./product-publication.ts";

test("preserves gallery order and rejects unsafe or oversized galleries", () => {
  const input = {
    code: "TYC-CD08", published: true, slug: "phuong-cau-hoang", name: "Phượng Cầu Hoàng",
    description: "", image: "/images/example-1.png", price: 450000, category: "Cung đình",
    gender: "Nữ", status: "Sẵn sàng", minHeight: 155, maxHeight: 172, minWeight: 45,
    maxWeight: 65, tags: "", badge: "", images: ["/images/example-2.png", "/images/example-1.png"],
  };
  const result = parsePublicationInput(input);
  assert.deepEqual(result?.create.images, input.images);
  assert.equal(result?.create.image, input.images[0]);
  assert.equal(parsePublicationInput({ ...input, images: ["https://other.example/image.png"] }), null);
  assert.equal(parsePublicationInput({ ...input, images: ["/uploads/../secret.png"] }), null);
  assert.equal(parsePublicationInput({ ...input, images: Array(9).fill(input.image) }), null);
});

test("accepts a publish request with safe catalog fields", () => {
  const result = parsePublicationInput({
    code: "TYC-CD08", published: true, slug: "phuong-cau-hoang",
    name: "Phượng Cầu Hoàng", description: "Trang phục cổ phục",
    image: "/images/example-1.png", price: 450000, category: "Cung đình",
    gender: "Nữ", status: "Sẵn sàng", minHeight: 155, maxHeight: 172,
    minWeight: 45, maxWeight: 65, tags: "Cung đình, Hoàng gia", badge: "Độc quyền",
  });
  assert.equal(result?.published, true);
  assert.equal(result?.create.categorySlug, "duong-trieu");
  assert.deepEqual(result?.create.tags, ["Cung đình", "Hoàng gia"]);
});

test("rejects invalid publication state and product identity", () => {
  assert.equal(parsePublicationInput({ code: "TYC-01", published: "yes" }), null);
  assert.equal(parsePublicationInput({ code: "../../foo", published: true }), null);
});

test("does not accept arbitrary image URLs for a new public product", () => {
  const result = parsePublicationInput({
    code: "TYC-CD08", published: false, slug: "phuong-cau-hoang",
    name: "Phượng Cầu Hoàng", description: "Trang phục cổ phục",
    image: "https://other.example/image.png", price: 450000, category: "Cung đình",
    gender: "Nữ", status: "Sẵn sàng", minHeight: 155, maxHeight: 172,
    minWeight: 45, maxWeight: 65, tags: "", badge: "",
  });
  assert.equal(result?.create.image, "/images/logo.png");
});

test("accepts an image uploaded through the authenticated admin API", () => {
  const result = parsePublicationInput({
    code: "TYC-CD08", published: true, slug: "phuong-cau-hoang",
    name: "Phượng Cầu Hoàng", description: "Trang phục cổ phục",
    image: "/uploads/8aa154ed-9e97-4a1d-b3f3-4de093aa6a03.webp",
    price: 450000, category: "Cung đình", gender: "Nữ", status: "Sẵn sàng",
    minHeight: 155, maxHeight: 172, minWeight: 45, maxWeight: 65,
    tags: "Cung đình", badge: "",
  });
  assert.equal(result?.create.image, "/uploads/8aa154ed-9e97-4a1d-b3f3-4de093aa6a03.webp");
});

test("assigns a fixed color to each selectable image badge", () => {
  const tones = { "Nổi bật": "red", "Mẫu mới": "green", "Được yêu thích": "gold" } as const;
  for (const [badge, badgeTone] of Object.entries(tones)) {
    const result = parsePublicationInput({
      code: "TYC-CD08", published: true, slug: "phuong-cau-hoang",
      name: "Phượng Cầu Hoàng", description: "Trang phục cổ phục",
      image: "/images/example-1.png", price: 450000, category: "Cung đình",
      gender: "Nữ", status: "Sẵn sàng", minHeight: 155, maxHeight: 172,
      minWeight: 45, maxWeight: 65, tags: "Cung đình", badge,
    });
    assert.equal(result?.create.badgeTone, badgeTone);
  }
});
