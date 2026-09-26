import assert from "node:assert/strict";
import test from "node:test";
import { paginationItems } from "./admin-pagination.ts";

test("shows every page for short result sets", () => {
  assert.deepEqual(paginationItems(1, 2), [1, 2]);
  assert.deepEqual(paginationItems(3, 5), [1, 2, 3, 4, 5]);
});

test("keeps the active area and separates distant pages", () => {
  assert.deepEqual(paginationItems(1, 14), [1, 2, 3, "ellipsis", 14]);
  assert.deepEqual(paginationItems(7, 14), [1, "ellipsis", 7, "ellipsis", 14]);
  assert.deepEqual(paginationItems(14, 14), [1, "ellipsis", 12, 13, 14]);
});
