# Paseo Cache Care

A native Paseo maintenance panel for developer machines. Discover tools automatically, inspect measured caches, and clean an explicit selection.

## Install

```sh
paseo plugin add git:sudosz/paseo-cache-care
```

Requires Paseo 0.15.4 or later. Open **Cache Care** in the sidebar, scan the host, select actions, then review and confirm cleanup.

## Included adapters

| Layer | Tools |
| --- | --- |
| Downloads | npm, pip, Cargo, uv, pnpm, Yarn, Conda |
| Build | Go build cache, workspace Rust incremental output, Python bytecode |
| System | APT, DNF, YUM, Zypper, Pacman via paccache, APK, Homebrew |
| Containers | Docker build cache, dangling images, old stopped containers |
| Environments | Optional Go module cleanup; pyenv detection |
| Android | ADB and Gradle detection (inspection only) |

Command availability, operating system, permissions, and cache directories are detected on demand. Unavailable adapters remain visible through **Show unavailable**. Native command sizes are shown as unknown, never as estimated reclaimed space.

## Boundaries

- Nothing runs on a schedule. Scanning does not delete files.
- Cleanup requires an explicit selection and confirmation. Scan tokens expire after five minutes and are consumed by cleanup.
- Fixed command arguments execute without a shell. No automatic sudo.
- Known cache paths are checked for symlinks. Nested symlinks are removed rather than followed.
- Protected roots (`/`, `/home/paseo`, `/opt/paseo`, `/workspace`, `/var`, …) and workspace project roots are refused even if a future catalog entry is wrong.
- Recognized build/package processes block cleanup. This is best effort: keep agents idle; a new process could start after the check.
- Docker volumes, agent history, databases, installed Python environments, and Android device data are not deleted.
- Homebrew cleanup and stopped-container cleanup are optional because they can remove old installed versions or writable container layers.
- Linux is the initial target. UI uses React Native primitives for desktop/mobile. Other platforms and native mobile rendering need wider testing.
- v0.1 project discovery scans immediate directories under `/workspace`. Custom roots, configurable retention, persistent history, environment selection, and further package managers are future work.
- Cache paths currently use common defaults; custom tool-specific cache locations are not inferred.

## Space visibility

The dashboard shows total/free/used disk space, warns below 10 GiB free, and lists the largest entries under `/workspace` as a read-only size map. After cleanup it reports the measured free-space change. These checks never delete anything.

Rows are labelled **Safe** or **Your call**; optional actions start unticked and are never selected by “Select all visible”.


## Develop

```sh
npm ci
npm run typecheck
npm test
```

Each adapter declares its layer, availability requirements, scope, and fixed command or cache path in `server/catalog.ts`. New destructive actions require tests and an explicit description of their effects.

MIT licensed.
