import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { RemoteExchange, TelegramStatus } from '../../shared/messaging';
import type { MessagingGateway } from './gateway';
import { TelegramError, splitTelegramReply, type TelegramApi, type TelegramUpdate } from './telegramApi';

export interface TelegramState {
  enabled: boolean;
  offset: number;
  botUsername?: string;
  owner?: { id: number; name: string };
  pairing: string;
  scope: string;
  defaultAgent?: string;
  /** Sender-wide deadline for the current pairing, persisted with the retry row. */
  outboundBlockedUntil?: number;
  history: RemoteExchange[];
}
interface Dependencies {
  gateway: MessagingGateway;
  load(): TelegramState | undefined;
  save(state: TelegramState): void;
  secret: { get(): string | undefined; set(token: string): boolean; delete(): void };
  api(token: string): TelegramApi;
  now?: () => number;
}
const fresh = (): TelegramState => ({ enabled: false, offset: 0, pairing: randomUUID(), scope: '', history: [] });
const validId = (id: unknown): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0;

/** Owns pairing and durable receipts. Transport and agent execution stay separate.
 * Unknown send outcomes are deliberately not replayed: Bot API has no idempotency key. */
export class TelegramService {
  private data: TelegramState;
  private api?: TelegramApi;
  private token = '';
  private phase: TelegramStatus['state'] = 'disconnected';
  private detail?: string;
  private pair?: { nonce: string; expiresAt: number };
  private candidate?: TelegramStatus['candidate'];
  private abort?: AbortController;
  private generation = 0;
  private timer?: ReturnType<typeof setInterval>;
  private sending = false;
  private connecting = false;
  private storageHealthy = true;
  private now: () => number;
  constructor(private deps: Dependencies) {
    this.now = deps.now ?? Date.now;
    this.data = deps.load() ?? fresh();
    let blockedUntil = Number.isSafeInteger(this.data.outboundBlockedUntil) ? this.data.outboundBlockedUntil ?? 0 : 0;
    for (const row of this.data.history) {
      // Migrate older state: one deferred row also blocks later replies and notices.
      if (row.pairing === this.data.pairing && row.direction === 'out' && row.status === 'queued' && Number.isSafeInteger(row.retryAt)) blockedUntil = Math.max(blockedUntil, row.retryAt ?? 0);
      if (row.status === 'sending' || row.status === 'routing') row.status = 'uncertain';
    }
    this.data.outboundBlockedUntil = this.data.enabled && this.data.owner && blockedUntil > this.now() ? blockedUntil : undefined;
  }
  private save() {
    try { this.deps.save(this.data); }
    catch {
      // Never acknowledge another update or dispatch after a failed durable receipt.
      this.storageHealthy = false; this.stop(); this.phase = 'error';
      this.detail = 'Local message storage unavailable. Restart Crewlo before retrying.';
      throw new Error('Local message storage unavailable.');
    }
  }
  private clean(text: string) {
    return this.deps.gateway.clean(text.split(this.token || '\0').join(this.token ? '[redacted]' : '\0'))
      .replace(/\b\d{5,16}:[A-Za-z0-9_-]{20,}\b/g, '[redacted]');
  }
  status(): TelegramStatus {
    const validPair = this.pair && this.pair.expiresAt > this.now();
    return { state: this.phase, detail: this.detail, botUsername: this.data.botUsername,
      hasToken: this.data.enabled || !!this.deps.secret.get(), owner: this.data.owner,
      candidate: this.candidate && this.candidate.expiresAt > this.now() ? this.candidate : undefined,
      pairingLink: validPair ? `https://t.me/${this.data.botUsername}?start=${this.pair!.nonce}` : undefined,
      pairingExpiresAt: validPair ? this.pair!.expiresAt : undefined,
      defaultAgent: this.data.defaultAgent, agents: this.deps.gateway.agents(),
      uncertainReplies: this.data.history.filter(r => r.direction === 'out' && ['uncertain', 'failed'].includes(r.status)).length };
  }
  history(agentId: string) {
    return this.data.history.filter(r => r.scope === this.deps.gateway.scope() && r.agentId === agentId)
      .map(({ parts, ...row }) => ({ ...row, text: this.clean(row.text) }));
  }
  async connect(token: string) {
    if (!this.storageHealthy) throw new Error('Local message storage unavailable. Restart Crewlo.');
    if (this.connecting || this.data.enabled) throw new Error('Disconnect the current bot before connecting.');
    if (!/^\d{5,16}:[A-Za-z0-9_-]{20,}$/.test(token)) throw new Error('Enter a valid BotFather token.');
    if (!this.deps.gateway.scope()) throw new Error('Open a studio before connecting Telegram.');
    this.connecting = true; this.phase = 'connecting';
    const generation = this.generation;
    try {
      const api = this.deps.api(token);
      const bot = await api.call<{ username: string; is_bot: boolean }>('getMe');
      const webhook = await api.call<{ url: string }>('getWebhookInfo');
      if (generation !== this.generation) return;
      if (!bot.is_bot || !/^[A-Za-z0-9_]+$/.test(bot.username)) throw new Error('This token does not identify a Telegram bot.');
      if (webhook.url) throw new Error('This bot has a webhook. Use a dedicated bot or remove its webhook first.');
      if (!this.deps.secret.set(token)) throw new Error('Secure OS storage is unavailable; token was not saved.');
      this.data = { ...fresh(), history: this.data.history, enabled: true, botUsername: bot.username, scope: this.deps.gateway.scope() };
      this.token = token; this.api = api; this.save();
      this.phase = 'connected'; this.detail = undefined;
      this.beginPairing(); this.start();
    } catch (error) {
      if (generation !== this.generation && this.storageHealthy) return;
      this.phase = 'error';
      throw error instanceof TelegramError ? error : new Error(error instanceof Error && /^(Disconnect|Enter|Open|This |Secure )/.test(error.message) ? error.message : 'Could not connect Telegram. Token was not exposed.');
    } finally { this.connecting = false; }
  }
  restore() {
    if (!this.data.enabled || this.abort) return;
    const token = this.deps.secret.get();
    if (!token) { this.phase = 'error'; this.detail = 'Stored token cannot be decrypted. Disconnect and reconnect.'; return; }
    this.token = token; this.api = this.deps.api(token); this.phase = 'connecting';
    this.save(); this.start();
  }
  beginPairing() {
    if (!this.data.enabled || this.data.owner) throw new Error('Connect an unpaired bot first.');
    this.pair = { nonce: randomBytes(24).toString('base64url'), expiresAt: this.now() + 5 * 60_000 };
    this.candidate = undefined;
  }
  confirm(candidateId: string, accept: boolean) {
    const candidate = this.candidate;
    if (!candidate || candidate.id !== candidateId || candidate.expiresAt <= this.now() || this.data.owner) throw new Error('Pairing request expired. Generate a new link.');
    this.candidate = undefined; this.pair = undefined;
    if (accept) {
      this.data.owner = { id: candidate.userId, name: candidate.name };
      this.save();
      this.notice('Paired with Crewlo. Use /agents to select an agent, then send text. Permissions and pauses still apply.');
    }
  }
  setDefault(agentId: string) {
    if (!this.deps.gateway.agents().some(a => a.id === agentId)) throw new Error('Agent is not in this studio.');
    this.data.defaultAgent = agentId; this.save();
  }
  stop() {
    this.generation++; this.abort?.abort(); this.abort = undefined;
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined; this.phase = 'disconnected';
  }
  disconnect() {
    this.stop(); this.pair = undefined; this.candidate = undefined;
    this.data.enabled = false; this.data.owner = undefined; this.data.outboundBlockedUntil = undefined;
    for (const row of this.data.history) {
      if (['queued', 'paused', 'waiting_session'].includes(row.status)) row.status = 'cancelled';
      if (row.status === 'awaiting_reply') row.status = 'detached';
      if (row.status === 'sending') row.status = 'uncertain';
    }
    try { this.save(); }
    finally {
      try { this.deps.secret.delete(); }
      finally { this.token = ''; this.api = undefined; this.detail = undefined; }
    }
  }
  private start() {
    this.abort = new AbortController();
    const generation = ++this.generation;
    this.timer = setInterval(() => { try { this.dispatchQueued(); void this.flush().catch(() => { this.phase = 'error'; this.detail = 'Local message storage unavailable.'; }); } catch { this.phase = 'error'; this.detail = 'Local message storage unavailable.'; } }, 1000);
    void this.poll(generation, this.abort.signal);
  }
  private async poll(generation: number, signal: AbortSignal) {
    let failures = 0;
    while (generation === this.generation && !signal.aborted) {
      try {
        const updates = await this.api!.call<TelegramUpdate[]>('getUpdates', { offset: this.data.offset, timeout: 25, allowed_updates: ['message'], limit: 50 }, signal);
        if (generation !== this.generation) return;
        if (!Array.isArray(updates)) throw new TelegramError(0);
        for (const update of updates.sort((a, b) => a.update_id - b.update_id)) this.acceptUpdate(update);
        failures = 0; this.phase = 'connected'; this.detail = undefined;
      } catch (error) {
        if (generation !== this.generation || signal.aborted) return;
        const apiError = error instanceof TelegramError ? error : new TelegramError(0);
        this.detail = apiError.message;
        if ([401, 409].includes(apiError.code)) { this.phase = 'error'; this.abort?.abort(); if (this.timer) clearInterval(this.timer); return; }
        this.phase = 'reconnecting';
        const delay = apiError.code === 429 ? apiError.retryAfter * 1000 : Math.min(30_000, 1000 * 2 ** Math.min(failures++, 5));
        await new Promise<void>(resolve => {
          const done = () => { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); };
          const timer = setTimeout(done, delay); signal.addEventListener('abort', done, { once: true });
        });
      }
    }
  }
  /** Persist the receipt before any dispatch. Duplicated getUpdates cannot execute twice. */
  acceptUpdate(update: TelegramUpdate) {
    if (!this.storageHealthy || !this.data.enabled || !Number.isSafeInteger(update.update_id) || update.update_id < this.data.offset) return;
    const message = update.message;
    this.data.offset = update.update_id + 1;
    if (!message || message.chat?.type !== 'private' || !validId(message.from?.id) || message.from?.is_bot || message.chat.id !== message.from.id) { this.save(); return; }
    const text = typeof message.text === 'string' ? message.text.trim() : '';
    if (!this.data.owner) {
      const nonce = text.startsWith('/start ') ? text.slice(7) : '';
      if (this.pair && this.pair.expiresAt > this.now() && /^[A-Za-z0-9_-]{32}$/.test(nonce) && timingSafeEqual(Buffer.from(nonce), Buffer.from(this.pair.nonce))) {
        this.candidate = { id: randomUUID(), userId: message.from.id, name: this.clean(message.from.first_name || message.from.username || 'Telegram owner').slice(0, 80), expiresAt: this.pair.expiresAt };
        this.pair = undefined; // Single use, even before desktop confirmation.
      }
      this.save(); return;
    }
    if (message.from.id !== this.data.owner.id) { this.save(); return; }
    if (this.data.scope !== this.deps.gateway.scope()) { this.notice('The open studio changed. Reconnect Telegram from the intended studio.'); this.save(); return; }
    const agents = this.deps.gateway.agents();
    if (text === '/agents') {
      this.notice(agents.length ? agents.map(a => `${a.name} · ${a.state}\n/agent ${a.id}`).join('\n\n') : 'No agents in this studio. Add an agent in Crewlo.');
    } else if (text.startsWith('/agent ')) {
      const selected = text.slice(7).trim();
      if (agents.some(a => a.id === selected)) { this.setDefault(selected); this.notice(`Selected ${agents.find(a => a.id === selected)!.name}.`); }
      else this.notice('Agent not found. Use /agents.');
    } else if (text.startsWith('/')) {
      this.notice('Use /agents, then /agent <id> to select an agent. Send plain text to that agent. Approvals and Resume stay on the desktop.');
    } else if (!text || text.length > 16000) {
      this.notice('Send text only (up to 16,000 characters). Attachments are not supported.');
    } else {
      const agent = agents.find(a => a.id === this.data.defaultAgent);
      if (!agent) this.notice('Choose an agent with /agents before sending work.');
      else if (agent.state === 'unavailable') this.notice(`${agent.name} is unavailable. Reconnect that session in Crewlo, then resend. Nothing was submitted.`);
      else if (this.data.history.filter(r => ['queued', 'paused', 'waiting_session', 'awaiting_reply'].includes(r.status)).length >= 200) this.notice('Message queue is full. Resolve pending messages in Crewlo first.');
      else {
        const row: RemoteExchange = { id: `tg-${this.data.pairing}-${update.update_id}`, channel: 'telegram', pairing: this.data.pairing, scope: this.data.scope, agentId: agent.id, agentName: this.clean(agent.name), direction: 'in', text: this.clean(text), createdAt: this.now(), status: agent.state === 'paused' ? 'paused' : 'queued' };
        this.data.history.push(row);
        this.notice(agent.state === 'paused' ? `${agent.name} · Message delivery paused. Saved in the queue; Resume in Crewlo.` : `${agent.name} · Queued. Waiting for an agent reply.`);
      }
    }
    this.save();
  }
  private notice(text: string) {
    if (!this.data.owner) return;
    this.data.history.push({ id: randomUUID(), channel: 'telegram', pairing: this.data.pairing, scope: this.data.scope, agentId: '', agentName: 'Crewlo', direction: 'out', text: this.clean(text), createdAt: this.now(), status: 'queued', parts: splitTelegramReply('Crewlo', this.clean(text)), nextPart: 0 });
    this.save();
  }
  dispatchQueued() {
    if (!this.storageHealthy || !this.data.enabled || !this.data.owner || this.data.scope !== this.deps.gateway.scope()) return;
    const agents = this.deps.gateway.agents();
    for (const row of this.data.history) {
      if (row.direction !== 'in' || row.pairing !== this.data.pairing || !['queued', 'paused', 'waiting_session'].includes(row.status)) continue;
      const agent = agents.find(a => a.id === row.agentId);
      if (!agent || agent.state !== 'ready') {
        const status = !agent || agent.state === 'unavailable' ? 'waiting_session' : 'paused';
        if (row.status !== status) {
          row.status = status;
          this.notice(status === 'waiting_session' ? `${row.agentName} · Session unavailable. Your message is held until the session reconnects in Crewlo.` : `${row.agentName} · Message delivery paused. Resume in Crewlo.`);
          this.save();
        }
        continue;
      }
      row.status = 'routing'; this.save();
      try { this.deps.gateway.enqueue(row); row.status = 'awaiting_reply'; }
      catch { row.status = 'uncertain'; this.notice(`${row.agentName} · Submission could not be confirmed. Inspect Crewlo before resending.`); }
      this.save();
    }
  }
  /** Called only for authenticated on-disk agent outbox messages, never PTY output. */
  agentReply(msg: { id: string; from: string; to: string; conversation: string; in_reply_to: string | null; act: string; public_reply?: string }) {
    if (!this.data.enabled || !this.data.owner || this.data.scope !== this.deps.gateway.scope() || msg.to !== 'human' || !['inform', 'done', 'refuse'].includes(msg.act)) return;
    // A failed save may have changed the in-memory row to replied. It is not a
    // durable acknowledgement: preserve the hive retry until a fresh load.
    if (!this.storageHealthy) throw new Error('Local message storage unavailable.');
    const original = this.data.history.find(r => r.direction === 'in' && r.id === msg.in_reply_to && r.agentId === msg.from && r.pairing === this.data.pairing && ['awaiting_reply', 'routing'].includes(r.status));
    if (!original || msg.conversation !== `remote:${original.id}` || typeof msg.public_reply !== 'string' || !msg.public_reply.trim()) return;
    // Explicit public field only; never forward the generic body, tool output or prompt wrapper.
    if (/CREWLO_REMOTE_REPLY|<\/?(?:system|developer)>|hive identity|append-system-prompt|\x1b\[|\[pty\]|"type"\s*:\s*"tool_(?:use|result)"/i.test(msg.public_reply)) return;
    const text = this.clean(msg.public_reply.trim());
    if (text.length > 100_000) { this.notice(`${original.agentName} · Reply exceeds the remote limit. Ask the agent for a shorter reply in Crewlo.`); return; }
    original.status = 'replied';
    this.data.history.push({ id: `reply-${original.id}`, channel: 'telegram', pairing: this.data.pairing, scope: original.scope, agentId: original.agentId, agentName: original.agentName, direction: 'out', text, createdAt: this.now(), status: 'queued', replyTo: original.id, parts: splitTelegramReply(original.agentName, text), nextPart: 0 });
    this.save();
  }
  async flush() {
    if (!this.storageHealthy || this.sending || !this.api || !this.data.enabled || !this.data.owner || this.abort?.signal.aborted || (this.data.outboundBlockedUntil ?? 0) > this.now()) return;
    const row = this.data.history.find(r => r.direction === 'out' && r.pairing === this.data.pairing && r.status === 'queued' && (r.retryAt ?? 0) <= this.now());
    if (!row) return;
    const generation = this.generation;
    this.sending = true;
    try {
      row.status = 'sending'; this.save();
      await this.api.call('sendMessage', { chat_id: this.data.owner.id, text: row.parts![row.nextPart ?? 0], link_preview_options: { is_disabled: true } }, this.abort?.signal);
      if (generation !== this.generation) return;
      row.nextPart = (row.nextPart ?? 0) + 1;
      row.status = row.nextPart === row.parts!.length ? 'sent' : 'queued';
    } catch (error) {
      if (generation !== this.generation) return;
      if (error instanceof TelegramError && error.code === 429) { row.status = 'queued'; row.retryAt = this.now() + Math.max(1, error.retryAfter) * 1000; this.data.outboundBlockedUntil = row.retryAt; }
      else row.status = !(error instanceof TelegramError) || error.uncertain ? 'uncertain' : 'failed';
    } finally {
      this.sending = false;
      if (generation === this.generation) this.save();
    }
  }
}
