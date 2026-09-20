import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./auth-password.ts";

test("password hashes verify only the original password", async () => {
  const stored = await hashPassword("A-strong-password-123!");

  assert.equal(await verifyPassword("A-strong-password-123!", stored), true);
  assert.equal(await verifyPassword("wrong-password", stored), false);
});

test("malformed password hashes are rejected", async () => {
  assert.equal(await verifyPassword("anything", "not-a-valid-hash"), false);
});
