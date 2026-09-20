import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, verifySessionToken } from "./auth-session.ts";

test("a signed session can be verified", async () => {
  const token = await createSessionToken(
    { email: "admin@thanhycac.com", expiresAt: 2_000 },
    "test-secret",
  );

  assert.deepEqual(await verifySessionToken(token, "test-secret", 1_000), {
    email: "admin@thanhycac.com",
    expiresAt: 2_000,
  });
});

test("tampered, expired, and differently signed sessions are rejected", async () => {
  const token = await createSessionToken(
    { email: "admin@thanhycac.com", expiresAt: 2_000 },
    "test-secret",
  );

  assert.equal(await verifySessionToken(`${token}x`, "test-secret", 1_000), null);
  assert.equal(await verifySessionToken(token, "another-secret", 1_000), null);
  assert.equal(await verifySessionToken(token, "test-secret", 2_001), null);
});
