import assert from "node:assert/strict";
import test from "node:test";
import { imageSelectionError } from "./admin-image-upload.ts";

test("accepts common photos larger than the old 750 KB limit for browser optimization", () => {
  assert.equal(imageSelectionError([
    { name: "anh-trang-phuc.jpg", type: "image/jpeg", size: 2_500_000 },
  ], 0), "");
});

test("accepts a supported file extension when the browser omits the MIME type", () => {
  assert.equal(imageSelectionError([
    { name: "anh-trang-phuc.WEBP", type: "", size: 500_000 },
  ], 0), "");
});

test("reports the exact invalid file instead of a generic upload warning", () => {
  assert.match(imageSelectionError([
    { name: "anh-trang-phuc.heic", type: "image/heic", size: 500_000 },
  ], 0), /anh-trang-phuc\.heic/);
  assert.match(imageSelectionError([
    { name: "anh-qua-lon.png", type: "image/png", size: 16_000_000 },
  ], 0), /15 MB/);
  assert.match(imageSelectionError([
    { name: "anh-thu-8.png", type: "image/png", size: 100_000 },
  ], 8), /tối đa 8 ảnh/);
});
