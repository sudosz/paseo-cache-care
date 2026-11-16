import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clearDirectory, validDirectory, cleanup } from "../server/engine";
import { catalog } from "../server/catalog";
test("cleanup refuses linked roots and preserves targets of nested symlinks", async () => {
  const root = await mkdtemp(join(tmpdir(), "care-test-"));
  try {
    const cache = join(root, "cache"), outside = join(root, "outside");
    await mkdir(cache); await mkdir(outside); await writeFile(join(outside, "keep"), "keep");
    await symlink(outside, join(cache, "link")); await symlink(cache, join(root, "alias"));
    assert.equal(await validDirectory(join(root, "alias")), false);
    await assert.rejects(clearDirectory(join(root, "alias")));
    await clearDirectory(cache);
    assert.deepEqual(await readdir(cache), []);
    assert.equal(await readFile(join(outside, "keep"), "utf8"), "keep");
  } finally { await rm(root, { recursive: true, force: true }); }
});
test("cleanup cannot execute without a valid scan", async () => {
  await assert.rejects(cleanup({ token: "forged", ids: ["npm"] }), /Scan expired/);
});
test("catalog keeps environment and device actions inspection-only", () => {
  for (const id of ["adb", "pyenv", "gradle"]) assert.equal(catalog().find(a => a.id === id)?.inspect, true);
  assert.ok(catalog().filter(a => a.command === "docker").every(a => !a.args?.includes("--volumes")));
});
