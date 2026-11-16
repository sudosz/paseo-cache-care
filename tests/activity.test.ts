import { test } from "node:test";
import assert from "node:assert/strict";
import { blockingProcesses } from "../server/activity";

test("long-running Go and uv processes do not block unrelated caches", () => {
  const processes = "109448 Sl+ go\n179272 Sl uv\n179252 Sl npm exec codeba\n";
  assert.deepEqual(blockingProcesses("rust:gift-sniper", processes), []);
  assert.deepEqual(blockingProcesses("pip", processes), []);
  assert.deepEqual(blockingProcesses("py:/workspace/app/__pycache__", processes), []);
  assert.deepEqual(blockingProcesses("go", processes), ["go (PID 109448)"]);
  assert.deepEqual(blockingProcesses("uv", processes), ["uv (PID 179272)"]);
  assert.deepEqual(blockingProcesses("npm", processes), ["npm (PID 179252)"]);
});

test("Rust builds block Rust caches; zombie processes do not", () => {
  assert.deepEqual(blockingProcesses("rust:app", "42 Sl cargo\n43 R rustc\n44 Z rustc"), ["cargo (PID 42)", "rustc (PID 43)"]);
});
