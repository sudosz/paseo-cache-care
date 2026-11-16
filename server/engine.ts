/// <reference types="node" />
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { lstat, realpath, readdir, rm } from "node:fs/promises";
import { join, delimiter } from "node:path";
import { catalog, type Adapter } from "./catalog";
import type { Entry } from "../shared/contracts";
const exec = promisify(execFile);
export async function validDirectory(path: string) {
  try { return (await lstat(path)).isDirectory() && await realpath(path) === path; } catch { return false; }
}
export async function clearDirectory(path: string) {
  if (!await validDirectory(path)) throw new Error("Cache path missing or contains a symbolic link.");
  for (const name of await readdir(path)) await rm(join(path, name), { recursive: true, force: true });
}
async function commandExists(name: string) {
  for (const dir of (process.env.PATH ?? "").split(delimiter).filter(Boolean)) {
    try { await exec("test", ["-x", join(dir, name)], { timeout: 2000 }); return true; } catch {}
  }
  return false;
}
let snapshot: { token: string; at: number; adapters: Adapter[] } | undefined;
let busy = false;
export async function inspect() {
  if (busy) throw new Error("Cleanup is running. Scan after it finishes.");
  const adapters = catalog();
  // Immediate workspace roots only. Never traverse installed environments.
  try {
    for (const d of await readdir("/workspace", { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const root = join("/workspace", d.name);
      adapters.push({ id: `rust:${d.name}`, name: `${d.name} · Rust incremental`, layer: "Build", description: "Rebuildable debug incremental objects; release binaries are preserved.", path: join(root, "target/debug/incremental") });
      const { stdout } = await exec("find", [root, "-maxdepth", "7", "(", "-name", "node_modules", "-o", "-name", ".venv", "-o", "-name", "venv", "-o", "-name", ".git", "-o", "-name", "target", "-o", "-name", ".runtime", ")", "-prune", "-o", "-type", "d", "-name", "__pycache__", "-print0", "-prune"], { timeout: 10000, maxBuffer: 1024 * 1024 });
      stdout.split("\0").filter(Boolean).slice(0, 100).forEach(path => adapters.push({ id: `py:${path}`, name: `${d.name} · Python bytecode`, layer: "Build", description: "Regenerated Python bytecode.", path }));
    }
  } catch {}
  const entries: Entry[] = [];
  for (const a of adapters) {
    let available = !a.platforms || a.platforms.includes(process.platform);
    let reason = available ? "Ready" : "Unsupported operating system";
    if (available && a.command && !await commandExists(a.command)) { available = false; reason = `${a.command} not installed`; }
    if (available && a.path && !await validDirectory(a.path)) { available = false; reason = "Cache absent or linked path"; }
    if (available && a.root && process.getuid?.() !== 0) { available = false; reason = "Needs host root; no automatic sudo"; }
    if (available && a.command === "docker") {
      try { await exec("docker", ["info", "--format", "{{.ServerVersion}}"], { timeout: 5000 }); } catch { available = false; reason = "Docker daemon unavailable or access denied"; }
    }
    let bytes: number | null = null;
    if (available && a.path) { try { const { stdout } = await exec("du", ["-sk", a.path], { timeout: 10000 }); bytes = Number(stdout.split(/\s/)[0]) * 1024; } catch { reason = "Size unavailable"; } }
    entries.push({ id: a.id, name: a.name, layer: a.layer, description: a.description, available, reason: a.inspect && available ? "Inspection only" : reason, optional: !!a.optional, bytes, path: a.path ?? null, cleanable: available && !a.inspect });
  }
  snapshot = { token: randomUUID(), at: Date.now(), adapters: adapters.filter(a => entries.find(e => e.id === a.id)?.cleanable) };
  return { token: snapshot.token, platform: process.platform, entries };
}
export async function cleanup({ token, ids }: { token: string; ids: string[] }) {
  if (busy) throw new Error("Another cleanup is running.");
  if (!snapshot || token !== snapshot.token || Date.now() - snapshot.at > 300000) throw new Error("Scan expired. Scan again before cleanup.");
  const adapters = [...new Set(ids)].map(id => { const a = snapshot!.adapters.find(a => a.id === id); if (!a) throw new Error("Unknown or unavailable adapter."); return a; });
  snapshot = undefined;
  busy = true;
  try {
    const results = [];
    for (const a of adapters) {
      try {
        const { stdout } = await exec("ps", ["-eo", "comm="], { timeout: 5000 });
        if (/^(cargo|rustc|go|npm|pip|pip3|uv|yarn|pnpm|gradle|apt|apt-get|dnf|yum|pacman|zypper)$/m.test(stdout)) throw new Error("Build or package manager active. Retry when idle.");
        if (a.path) await clearDirectory(a.path);
        else { const result = await exec(a.command!, a.args!, { timeout: 120000, maxBuffer: 1024 * 1024 }); results.push({ id: a.id, ok: true, message: result.stdout.slice(-2000) || "Native cleanup completed." }); continue; }
        results.push({ id: a.id, ok: true, message: "Cache contents removed. Future builds may regenerate them." });
      } catch (e) { results.push({ id: a.id, ok: false, message: e instanceof Error ? e.message : String(e) }); }
    }
    return { results };
  } finally { busy = false; }
}
