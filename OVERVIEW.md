# Cache Care

Inspect developer caches and run selected cleanup actions from Paseo. A grouped dashboard shows measured disk usage, available tools, optional actions, and results. A read-only disk overview shows free space, warns below 10 GiB, and maps the largest entries under `/workspace`; after cleanup it reports the measured free-space change. Search by tool or path and review each selection before cleanup.

Rows are labelled **Safe** or **Your call**. Optional actions stay unticked, and protected roots such as `/`, `/home/paseo`, `/opt/paseo`, `/workspace`, and `/var` are refused even if a catalog entry is wrong. Known cache roots must resolve without symlinks.

Detects npm, pip, Cargo, Go, uv, pnpm, Yarn, Conda, system package managers, and Docker. pyenv, ADB, and Gradle are inspection-only in this release. Workspace Rust and Python caches are discovered under `/workspace`.

Requires Paseo 0.15.4 or later. Linux is the initial target. System package cleanup needs an already privileged daemon; no automatic sudo is used. Docker requires CLI and daemon access.

Scans run on demand, with no background polling or model requests. Data stays on the daemon and connected Paseo clients. Installed environments, Docker volumes, conversations and databases are excluded. Keep build processes idle during cleanup. Custom cache paths and persistent history are not yet supported.
