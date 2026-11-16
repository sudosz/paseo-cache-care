# Cache Care Implementation Plan

**Goal:** Publish a native Paseo cleanup dashboard with automatically detected adapters.

**Architecture:** A shared adapter catalog supplies display metadata. Server discovery checks commands and canonical cache paths, producing ephemeral scan IDs. Cleanup accepts only a scanned adapter ID, revalidates paths, checks busy processes, and executes fixed commands without a shell. UI groups available adapters by layer, previews scope and shows results.

**Tech stack:** Paseo 0.15.4 plugin SDK, React Native, TypeScript, Node child_process and filesystem APIs.

1. Add shared contracts and catalog: package downloads, build caches, Docker, system managers, environments, Android.
2. Implement automatic discovery and sequential cleanup with bounded subprocesses, scan freshness, explicit optional actions, path checks and no automatic privilege escalation.
3. Build responsive dashboard with category navigation, available/unavailable filtering, selected-action preview and execution results.
4. Test real filesystem boundaries using temporary directories; test detection and command execution with injected process runner. Run `npm test` and `npm run typecheck`.
5. Publish README, overview, MIT license, manifest and public GitHub repository. Deploy exact source to existing daemon and verify plugin status. Do not execute cleanup on user data as a smoke test.

Unsupported or unsafe-to-infer environment deletion is inspection-only in v0.1. No automatic background cleanup. Installed tools and dependencies are excluded from ordinary cache actions.
