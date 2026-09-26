import assert from "node:assert/strict";
import test from "node:test";
import { isSameOriginRequest } from "./request-origin.ts";

function headers(values: Record<string, string>) {
  const normalized = new Map(Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]));
  return { get: (name: string) => normalized.get(name.toLowerCase()) ?? null };
}

test("accepts localhost requests when the server listens on an internal address", () => {
  assert.equal(isSameOriginRequest("http://0.0.0.0:3000/api/admin/products/publication", headers({
    origin: "http://localhost:3000",
    host: "localhost:3000",
  })), true);
});

test("accepts the public origin behind a trusted reverse proxy", () => {
  assert.equal(isSameOriginRequest("http://127.0.0.1:3000/api/admin/products/publication", headers({
    origin: "https://thanhycac.vn",
    host: "127.0.0.1:3000",
    "x-forwarded-host": "thanhycac.vn",
    "x-forwarded-proto": "https",
  })), true);
});

test("rejects missing, malformed, and cross-origin requests", () => {
  assert.equal(isSameOriginRequest("http://localhost:3000/api", headers({ host: "localhost:3000" })), false);
  assert.equal(isSameOriginRequest("http://localhost:3000/api", headers({ origin: "not-a-url", host: "localhost:3000" })), false);
  assert.equal(isSameOriginRequest("http://localhost:3000/api", headers({ origin: "https://example.com", host: "localhost:3000" })), false);
});
