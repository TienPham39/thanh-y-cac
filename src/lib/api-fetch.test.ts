import assert from "node:assert/strict";
import { test } from "node:test";
import { apiFetch } from "./api-fetch.ts";

test("catalog requests bypass cached redirects and stale responses", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_path, init) => {
      assert.equal(init?.cache, "no-store");
      return Response.json({ data: [] });
    };
    await apiFetch("/api/product-categories");
  } finally { globalThis.fetch = original; }
});

test("HTML error pages produce a readable message instead of a JSON parsing exception", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("<!DOCTYPE html><h1>Not found</h1>", { status: 404, headers: { "Content-Type": "text/html" } });
    await assert.rejects(apiFetch("/api/products"), /Không kết nối được dịch vụ dữ liệu/);
  } finally { globalThis.fetch = original; }
});

test("JSON API errors remain available to callers", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ error: { message: "Chưa tải được dữ liệu." } }, { status: 503 });
    const response = await apiFetch("/api/products");
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.message, "Chưa tải được dữ liệu.");
  } finally { globalThis.fetch = original; }
});
