import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { uploadResponse } from "./upload-response.ts";

test("serves an image created after an initial missing-image request", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "catalog-upload-"));
  const filename = "5245e16f-b578-42da-8788-ea8dd41cc923.webp";
  try {
    assert.equal((await uploadResponse(filename, directory)).status, 404);
    const bytes = Buffer.from("RIFFtestWEBP");
    await writeFile(path.join(directory, filename), bytes);
    const response = await uploadResponse(filename, directory);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "image/webp");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects traversal and non-image files", async () => {
  for (const filename of ["../.env", "..%2f.env", ".gitkeep", "test.svg"]) {
    assert.equal((await uploadResponse(filename)).status, 404);
  }
});
