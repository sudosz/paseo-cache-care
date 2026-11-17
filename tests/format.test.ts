import { test } from "node:test";
import assert from "node:assert/strict";
import { formatBytes } from "../shared/format";

test("measured cache sizes use binary units", () => {
  assert.equal(formatBytes(0), "0.0 MiB");
  assert.equal(formatBytes(512 * 1024 ** 2), "512.0 MiB");
  assert.equal(formatBytes(2.5 * 1024 ** 3), "2.50 GiB");
});

test("unknown sizes distinguish path caches from native commands", () => {
  assert.equal(formatBytes(null), "Unmeasured");
  assert.equal(formatBytes(null, { native: true }), "Native cleanup");
});
