/// <reference types="node" />
import { homedir } from "node:os";
import { join } from "node:path";
export type Adapter = { id: string; name: string; layer: string; description: string; optional?: boolean; command?: string; args?: string[]; path?: string; root?: boolean; inspect?: boolean; platforms?: string[] };
export function catalog(home = homedir()): Adapter[] {
  const cache = (id: string, name: string, layer: string, description: string, path: string, command?: string): Adapter => ({ id, name, layer, description, path: join(home, path), command });
  return [
    cache("npm", "npm downloads", "Downloads", "Downloaded package blobs; installed node_modules and npx tools are preserved.", ".npm/_cacache", "npm"),
    cache("pip", "pip downloads", "Downloads", "Cached wheels and HTTP downloads; virtual environments are preserved.", ".cache/pip", "pip"),
    cache("cargo", "Cargo archives", "Downloads", "Downloaded crate archives; extracted sources and installed binaries are preserved.", ".cargo/registry/cache", "cargo"),
    cache("go", "Go build cache", "Build", "Rebuildable compiled objects and test results.", ".cache/go-build", "go"),
    { id: "uv", name: "uv unused cache", layer: "Downloads", description: "Native uv cache prune; removes unused cache entries.", command: "uv", args: ["cache", "prune"] },
    { id: "pnpm", name: "pnpm unused store", layer: "Downloads", description: "Native store prune removes unreferenced packages.", command: "pnpm", args: ["store", "prune"] },
    { id: "yarn", name: "Yarn cache", layer: "Downloads", description: "Native Yarn cache clean. Optional: may require downloads on the next install.", command: "yarn", args: ["cache", "clean"], optional: true },
    ...[
      ["apt-get", "APT downloads", ["clean"]],
      ["dnf", "DNF downloads", ["clean", "packages"]],
      ["yum", "YUM downloads", ["clean", "packages"]],
      ["zypper", "Zypper downloads", ["clean", "--packages"]],
      ["paccache", "Pacman old packages", ["-r", "-k", "2"]],
      ["apk", "APK cache", ["cache", "clean"]],
    ].map(([command, name, args]) => ({ id: String(command), name: String(name), layer: "System", description: "Package-manager cache only. No installed package removal. Requires an already privileged daemon.", command: String(command), args: args as string[], root: true, optional: true, platforms: ["linux"] })),
    { id: "brew", name: "Homebrew cache", layer: "System", description: "Remove stale downloads and old installed versions using native cleanup.", command: "brew", args: ["cleanup"], optional: true, platforms: ["darwin", "linux"] },
    { id: "docker-build", name: "Docker build cache", layer: "Containers", description: "Prune unused build cache older than seven days.", command: "docker", args: ["builder", "prune", "--force", "--filter", "until=168h"], optional: true },
    { id: "docker-images", name: "Dangling Docker images", layer: "Containers", description: "Remove dangling images only; tagged images and volumes are preserved.", command: "docker", args: ["image", "prune", "--force"], optional: true },
    { id: "docker-stopped", name: "Stopped Docker containers", layer: "Containers", description: "Delete containers stopped for at least seven days, including their writable layers. Volumes are preserved.", command: "docker", args: ["container", "prune", "--force", "--filter", "until=168h"], optional: true },
    { id: "go-mod", name: "Go module cache", layer: "Environments", description: "Remove downloaded modules; future builds download them again. Optional and separate from build cache.", command: "go", args: ["clean", "-modcache"], optional: true },
    { id: "conda", name: "Conda download cache", layer: "Downloads", description: "Remove package tarballs only; environments and extracted package directories stay.", command: "conda", args: ["clean", "--tarballs", "--yes"], optional: true },
    { id: "pyenv", name: "pyenv environments", layer: "Environments", description: "Detected for visibility. Installed Python versions require individual review; deletion is not automated.", command: "pyenv", inspect: true, optional: true },
    { id: "adb", name: "Android / ADB", layer: "Android", description: "Detect ADB availability. Device app data is not a host cache; device deletion is not automated.", command: "adb", inspect: true, optional: true },
    cache("gradle", "Gradle caches", "Android", "Build cache detection only; Gradle daemons may hold locks. Stop builds before manual maintenance.", ".gradle/caches", "gradle"),
  ].map(a => a.id === "gradle" ? { ...a, inspect: true, optional: true } : a);
}
