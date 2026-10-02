import assert from "node:assert/strict";
import test from "node:test";
import { uploadProductImages, saveRequest, imageUploadForm } from "./admin-product-save.ts";

test("uploads binary images as multipart without base64 JSON expansion", async () => {
  const form = imageUploadForm("data:image/png;base64,AQIDBA==");
  const image = form.get("image") as File;
  assert.equal(image.type, "image/png");
  assert.equal(image.size, 4);
  assert.deepEqual([...new Uint8Array(await image.arrayBuffer())], [1, 2, 3, 4]);
  assert.throws(() => imageUploadForm("data:text/html;base64,AQID"), /Ảnh/);
});

test("uploads gallery and accessory images together, limits concurrency and preserves positions", async () => {
  let active = 0, peak = 0;
  const calls: string[] = [];
  const result = await uploadProductImages(
    ["data:image/a", "/images/existing.webp", "data:image/b"],
    ["", "data:image/a", "data:image/c"], new Map(),
    async image => {
      calls.push(image); active++; peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 5)); active--;
      return `/uploads/${image.slice(-1)}.webp`;
    }, () => {},
  );
  assert.equal(peak, 2);
  assert.equal(calls.length, 3);
  assert.deepEqual(result, {
    images: ["/uploads/a.webp", "/images/existing.webp", "/uploads/b.webp"],
    componentImages: ["", "/uploads/a.webp", "/uploads/c.webp"],
  });
});

test("retry only uploads failed images and keeps completed uploads", async () => {
  const cache = new Map<string, string>();
  const calls: string[] = [];
  let fail = true;
  const upload = async (image: string) => {
    calls.push(image);
    if (image.endsWith("b") && fail) throw new Error("offline");
    return `/uploads/${image.slice(-1)}.webp`;
  };
  await assert.rejects(uploadProductImages(["data:image/a", "data:image/b"], [], cache, upload, () => {}), /offline/);
  fail = false;
  await uploadProductImages(["data:image/a", "data:image/b"], [], cache, upload, () => {});
  assert.deepEqual(calls, ["data:image/a", "data:image/b", "data:image/b"]);
});

test("an unresponsive save is aborted and returns an actionable timeout", async () => {
  const fetcher: typeof fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  });
  await assert.rejects(saveRequest("/api/admin/products", {}, "Kiểm tra danh sách trước khi thử lại.", 10, fetcher), /Kiểm tra danh sách/);
});

test("HTML errors from hosting produce a readable message", async () => {
  const fetcher: typeof fetch = async () => new Response("<html>Bad gateway</html>", { status: 502 });
  await assert.rejects(saveRequest("/api/admin/uploads", {}, "timeout", 100, fetcher), /502/);
});
