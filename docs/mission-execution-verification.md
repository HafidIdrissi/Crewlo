# Mission execution diagnosis — 21 September 2026

## Observed cause

The original mission is `2026-09-21T19-44-07-913Z-6e64c0` (Café Atlas).
It remains in `C:/Users/idris/HarnessAgents/hive/agents/god/inbox/` unchanged.
The original task ledger remains empty; this investigation did not execute that mission.

Michael was not disconnected: Electron PID 21968 owned the Codex launcher PID
2688 and actual Codex process PID 13192. `pty:list` reported initial output.
There were two renderer windows: window 1 was hidden and retained the terminal
output; window 2 displayed the studio and a blank terminal. The hidden terminal
buffer contained the inbox wake instruction in Codex's input field. The visible
window's buffer was empty. Thus both output routing and prompt submission were
involved; a green PTY badge was not evidence of working execution.

The composer called `hive:send`, which acknowledged filesystem inbox delivery
only. It created no task card and incorrectly called this “Sent”. The renderer
then polled the inbox, queued a wake instruction, and sent raw single-line text
followed by Enter after 140ms. Successful PTY writes were treated as execution,
and repeated write failures could discard the queue item.

## Changes

- Explicit per-window terminal subscriptions, bounded output replay and sequence
  numbers; subscriptions survive detached tabs and same-ID process replacement.
  Separate Electron session partitions cannot subscribe to each other's output.
- Main-process serialized, idempotent prompt submission. Codex uses bracketed
  paste even for one line, a 600ms settle, then a separate Enter. A process change
  between paste and Enter fails closed. An uncertain failure is not replayed.
- Durable mission identities and queued/delivered/running/failed receipts. New
  missions create an assigned task card. Provider acknowledgement or pickup
  evidence is required for running; task-ledger completion supplies completed.
  Missing processes, absent acknowledgements and delivery errors are visible.
- Failed queue entries are preserved for terminal inspection. Inbox wake-ups
  from the worker watchdog use the same submission service as the renderer.
- Resuming a Codex session no longer passes the identity as a new positional
  prompt, which otherwise starts work outside the paused delivery queue.
- Studio layout and provider permission flags are unchanged. No synthetic
  Working status was added.

## Evidence

An isolated Electron profile/hive submitted the harmless file task through the
actual studio textarea and form, preload IPC, inbox, renderer queue, main prompt
dispatcher and Codex (`gpt-5.6-luna`). It used the existing studio's auto-mode
policy, including the workspace-write sandbox. Trials outside a trusted
workspace stopped at provider startup; no trust or approval gate was removed.

Successful test mission: `3a17f657-30c0-463b-b760-c921e15074a4`.

- Result: `node_modules/.cache/mission-verification/proof.txt`
- Exact file contents: `CREWLO_MISSION_OK` followed by a newline.
- Captured provider output: 9,692 bytes at the verification boundary.
- Provider transcript and tool calls are retained under that test hive's
  `agents/god/.codex/sessions/` directory.
- `node_modules/.cache/mission-verification/verification.json` records the
  mission, nonempty task ledger, provider output and resulting file. The test
  stopped after verifying the file; it does not establish final task-card
  completion. Running-state evidence matching is also regression-tested.

A separate real Electron/IPC/PTY test passed hidden-owner replay, continued
output during tab detachment, reattachment and independent subscribers. Evidence:
`node_modules/.cache/terminal-verification/verification.json`.

Focused tests cover serialized input, duplicate requests, uncertain Enter
failure, process replacement, correlated acknowledgement, resume flags, terminal
replay, partition isolation, terminal automation gates, routing and worker wake
gates. Type checking and the production build pass.

Delegation was checked separately at the routing and worker-wake layers, including
correct recipients and unknown-recipient failures. Two live model agents
completing delegated work were **not** verified; no such claim is made.

## Existing session handoff

Michael's automatic delivery was paused through the existing control gate during
the investigation to prevent re-submitting the preserved Café Atlas mission.
The existing provider and its pending input were not restarted or resubmitted.
The built fix needs an application restart to load its main/preload changes.
After loading it, inspect Michael's Terminal and the preserved mission before
resuming delivery; do not create a second Café Atlas mission.

No push, deployment or publication was performed.
