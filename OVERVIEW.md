# Cache Care

Inspect developer caches and run selected cleanup actions from Paseo. A grouped dashboard shows measured disk usage, available tools, optional actions, and results. Search by tool or path and review each selection before cleanup.

Detects npm, pip, Cargo, Go, uv, pnpm, Yarn, Conda, system package managers, and Docker. pyenv, ADB, and Gradle are inspection-only in this release. Workspace Rust and Python caches are discovered under `/workspace`.

Requires Paseo 0.15.4 or later. Linux is the initial target. System package cleanup needs an already privileged daemon; no automatic sudo is used. Docker requires CLI and daemon access.

Scans run on demand, with no background polling or model requests. Data stays on the daemon and connected Paseo clients. Installed environments, Docker volumes, conversations and databases are excluded. Keep build processes idle during cleanup. Custom cache paths and persistent history are not yet supported.
