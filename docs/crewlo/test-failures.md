# Baseline failures

The initial Windows baseline failed these 18 tests. The final run still fails the same list except the release-notes configuration assertion; two new Crewlo status tests pass.

- consecutive agent caps survive an interleaved config update
- turning it off is a real undo, not a terminal rebuild
- the native rung actually runs, and says why it differs
- with npm present nothing mentions a missing Node
- Codex remote uses a short stable per-agent home alias
- Command Center sets and clears one cap through the atomic IPC
- electron-builder points the release notes at a file that exists
- the composer counts its own submit, not the shared enqueue action
- steer is counted at the IPC seam, not inside control.steer
- the current directory wins even when a legacy twin exists
- the dotted legacy twin loses to the dotted current spelling
- a legacy-only install still resolves, so old transcripts stay readable
- a legacy-only install with dots resolves to its undashed twin
- links the base node_modules into an isolated worktree
- does not follow the dependency symlink when removing a worktree
- leaves a dangling worktree dependency symlink untouched
- reports a failed link without throwing
- removes only the linked dependencies before checking worktree status
