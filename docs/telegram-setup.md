# Telegram messaging in Crewlo

## Setup

1. Create a dedicated bot with the official [@BotFather](https://t.me/BotFather), using `/newbot`. Do not share the token in a conversation, terminal command, screenshot, or repository.
2. Open your studio and connect an existing inbox-capable agent session in Crewlo.
3. Click **Telegram** in the top bar (or open **Settings → Connections → Telegram**). Paste the token into the password field and select **Connect**. Crewlo validates the bot and refuses a bot with an existing webhook. It does not remove another application's webhook.
4. Scan the QR or open/copy the pairing link. Press **Start** in your bot's private chat. Return to Crewlo and check the displayed account name and numeric Telegram ID before selecting **Confirm pairing**. Reject an unexpected account. Links expire after five minutes and are consumed by the first valid pairing request; generating a new link invalidates the old one. Restarting Crewlo also invalidates an unconfirmed link.
5. Choose a default agent. In Telegram, `/agents` lists the current studio's agents and their availability; `/agent <id>` selects one. Send plain text to submit work. Replies have the form `Remy · Your answer`.
6. Open that agent's **Conversation** view to see incoming text, public replies, delivery status, and Telegram badges. The voxel studio remains available.

Keep Crewlo open on your Windows PC with network access. No public server, port forwarding, or webhook is required. Crewlo uses the official HTTPS [Bot API long-polling interface](https://core.telegram.org/bots/api#getupdates), and the QR uses Telegram's [bot deep-linking format](https://core.telegram.org/bots/features#deep-linking).

## Behavior and safety

- Only the confirmed owner's private messages are accepted. Other accounts, groups, channels, bot senders, edited messages, and callbacks do not dispatch work. Attachments are not supported.
- Tokens use Crewlo's existing Electron OS-encrypted vault, never config, agent environment, prompts, history, or logs. There is no plaintext fallback. On Windows this is bound to the Windows account. The password input is cleared after submission. Pairing and conversation metadata live in the existing local SQLite store; message history itself is **not encrypted by this feature**.
- Telegram is a transport, not an execution engine. It calls the existing hive inbox/outbox pipeline and uses existing live sessions. It never creates a session, writes directly to a terminal, changes permissions, approves a tool, or remotely resumes paused delivery.
- A paused agent queues messages; Resume remains on the desktop. An unavailable agent rejects new work with an explanation and no submission. If availability changes after queuing, work stays held until the session is ready. Submitted work remains awaiting an actual agent reply, not a fabricated success message.
- Only a correlated `public_reply` field from the selected agent's normal outbox is sent back. Generic message bodies, terminal streams, and tool events are not response sources. Known secret formats and the bot token are redacted; obvious internal prompt/log payloads are rejected. As with any model-generated answer, review sensitive content before asking an agent to send it externally.
- Receipts and offsets are saved before dispatch. Duplicate updates do not re-run work. Connection failures back off and resume polling. A competing poller/webhook (409) or invalid token (401) stops the connection with a visible explanation. Stop the competing consumer, then Disconnect and reconnect.
- Replies are plain text, split into at most 4,000 UTF-16 code units per chunk with the agent name on every chunk. Only one chunk is sent per timer tick. Rate-limit responses honor `retry_after` across process restarts, including later queued replies.
- A public-only handoff journal keeps agent replies recoverable if saving to the transport fails. Recovery retries that handoff, not agent execution or local inbox delivery. After a storage error, restore storage access and restart Crewlo; do not repeatedly resend the request. A crash between the journal checkpoint and local routing can omit the local hive notification, while retaining the remote answer. This is not a power-loss/fsync guarantee.
- Telegram has no send idempotency key. A lost response or a crash during dispatch/send is marked **Delivery uncertain**, not automatically replayed. Check Conversation and the phone before resending. Successful chunks are persisted; an ambiguous partial reply may therefore be incomplete. This deliberately does not promise exactly-once network delivery.
- **Disconnect** stops polling, removes the stored token and owner pairing, and cancels work still held in the transport queue. Work already submitted to an agent may continue. Local conversation history is retained. Changing studios requires reconnecting and pairing again; one desktop profile supports one bot/owner binding at a time.

## Reply contract and extension boundary

`src/main/messaging/gateway.ts` is the channel-independent boundary: studio identity, existing agent roster/gates, normal inbox submission, and sanitization. Telegram and the [WhatsApp Cloud API transport](messageries-tests.fr.md) share it while keeping authentication and network adapters separate.

Each remote request includes its exact conversation and request IDs plus a short instruction to publish through the normal agent outbox:

```json
{
  "to": "human",
  "act": "inform",
  "conversation": "remote:<request-id>",
  "in_reply_to": "<request-id>",
  "body": "Remote reply ready",
  "public_reply": "Only the answer intended for the owner."
}
```

The owning outbox directory determines the sender, not a self-declared `from` field. Direct desktop/API messages cannot masquerade as an authenticated outbox reply. An agent that only writes to its terminal, or fails to use this reply contract, will leave the request **Awaiting agent reply**; Crewlo does not scrape a substitute response.

## Verification

Focused checks (from the repository root):

```powershell
npm run typecheck
node --test test/telegram-hive.test.cjs test/telegram-http.test.cjs test/telegram-messaging.test.cjs
node --test test/tool-activity.test.cjs test/crewlo-voxel.test.cjs test/hook-event-contract.test.cjs test/codex-sandbox.test.cjs
node --test test/control.test.cjs test/queue-delivery.test.cjs test/prompt-delivery.test.cjs test/hive-nudge.test.cjs
npm run build
node tools/crewlo-telegram-smoke.cjs
node tools/crewlo-activity-capture.cjs
```

The desktop scripts require Playwright (`playwright` on the module path, or set `CREWLO_PLAYWRIGHT` to its installed module directory). They launch hidden isolated Electron profiles, not your normal Crewlo profile. The Telegram smoke uses real IPC, SQLite, QR generation, and Windows safeStorage, but a fake Bot API and a fake agent response. The hive integration test exercises real on-disk inbox/outbox routing in a temporary studio. No test token is a real credential, and these tests do not contact Telegram or launch a model provider.

Test coverage focuses on authentication boundaries, single-use/expired/rejected pairing, private-owner filtering, replay suppression and restored offsets, desktop pause gates, unavailable agents, reply correlation and sender spoofing, sanitization, Unicode chunking, rate limits, reconnects, interrupted operations, storage failure, encryption failure, Disconnect, and studio isolation. UI smoke covers setup actions and Conversation rendering; activity capture covers the preserved studio and responsive mission composer.

Initial verification on Windows, 22 September 2026, before the recovery hardening: node/web typechecks passed; production build passed; all 63 tests in the commands above passed (18 Telegram-focused tests, 17 studio/hook/sandbox tests, 28 existing control/queue/prompt/nudge regressions). Both Electron smoke scripts passed. Windows encryption was exercised with a dummy credential; Telegram network traffic and model replies were mocked. Build output retains the existing Vite mixed-import warning. See the [subsequent recovery checks](messageries-tests.fr.md#reprise-après-panne--renforcement-du-22-septembre-2026) for the additional regression tests.

### Live acceptance still required

Use your own token **only in the setup panel** on your Windows PC. The following cannot be claimed verified by the mocked tests:

1. Pair your real Telegram account and confirm another account/group cannot submit work.
2. Use `/agents`, select an actually connected agent, send a harmless request, and verify its real model-generated `Name · reply` arrives on the phone and in Conversation.
3. Pause delivery, send another request, verify no execution, then Resume on the desktop and verify one execution/reply.
4. Temporarily disconnect the network, restore it, and restart Crewlo. Verify queued work and the owner binding survive without duplicate execution.
5. Ask for a long answer, then Disconnect and verify polling stops and the token is removed. Check the actual provider follows the structured reply contract.

No push, publication, remote bot creation, or live Telegram message sending is part of the automated verification.
