import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { RemoteExchange, WhatsAppConnect, WhatsAppStatus } from '../../shared/messaging';
import type { MessagingGateway } from './gateway';
import { WhatsAppError, splitWhatsAppReply, type WhatsAppApi, type WhatsAppCredentials } from './whatsappApi';
import { extractWhatsAppEvents, type WhatsAppDelivery, type WhatsAppInbound } from './whatsappWebhook';

const DAY = 24 * 60 * 60_000;
export interface WhatsAppState {
  enabled: boolean; pairing: string; scope: string;
  phoneNumberId?: string; displayPhoneNumber?: string; apiVersion?: string; port: number;
  owner?: { id: string; name: string }; defaultAgent?: string; lastOwnerMessageAt?: number;
  lastWebhookAt?: number; receipts: Record<string, number>; history: RemoteExchange[];
  deliveryReceipts: Record<string, WhatsAppDelivery>;
  /** Sender-wide deadline for the current pairing, persisted with the retry row. */
  outboundBlockedUntil?: number;
}
interface Listener { port: number; close(): Promise<void> }
interface Dependencies {
  gateway: MessagingGateway;
  load(): WhatsAppState | undefined; save(state: WhatsAppState): void;
  secret: { get(): WhatsAppCredentials | undefined; set(value: WhatsAppCredentials): boolean; delete(): void };
  api(credentials: WhatsAppCredentials): WhatsAppApi;
  listen(options: { port: number; phoneNumberId: string; appSecret: string; verifyToken: string; onPayload(payload: unknown): void }): Promise<Listener>;
  now?: () => number;
}
const fresh = (): WhatsAppState => ({ enabled: false, pairing: randomUUID(), scope: '', port: 8788, receipts: {}, history: [], deliveryReceipts: {} });
const privatePayload = /CREWLO_REMOTE_REPLY|<\/?(?:system|developer)>|hive identity|append-system-prompt|\x1b\[|\[pty\]|"type"\s*:\s*"tool_(?:use|result)"/i;
function deliveryState(previous: WhatsAppDelivery['status'] | undefined, next: WhatsAppDelivery['status'] | undefined) {
  if (!next || previous === 'failed') return previous;
  if (!previous) return next;
  const rank = { sent: 1, delivered: 2, read: 3, failed: 0 };
  if (next === 'failed') return previous === 'delivered' || previous === 'read' ? previous : next;
  return rank[previous] > rank[next] ? previous : next;
}

/** Official WhatsApp transport: authenticated webhooks in, structured outbox
 * answers out. No terminal scraping, automatic approvals, or session spawning. */
export class WhatsAppService {
  private data: WhatsAppState;
  private credentials?: WhatsAppCredentials;
  private api?: WhatsAppApi;
  private listener?: Listener;
  private abort?: AbortController;
  private generation = 0;
  private timer?: ReturnType<typeof setInterval>;
  private phase: WhatsAppStatus['state'] = 'disconnected';
  private detail?: string;
  private pair?: { nonce: string; expiresAt: number };
  private candidate?: WhatsAppStatus['candidate'];
  private healthy = true;
  private connecting = false;
  private sending = false;
  private now: () => number;
  constructor(private deps: Dependencies) {
    this.now = deps.now ?? Date.now;
    this.data = deps.load() ?? fresh();
    let blockedUntil = Number.isSafeInteger(this.data.outboundBlockedUntil) ? this.data.outboundBlockedUntil ?? 0 : 0;
    for (const row of this.data.history) {
      // Migrate older state: one deferred row also blocks later replies and notices.
      if (row.pairing === this.data.pairing && row.direction === 'out' && row.status === 'queued' && Number.isSafeInteger(row.retryAt)) blockedUntil = Math.max(blockedUntil, row.retryAt ?? 0);
      if (['routing', 'sending'].includes(row.status)) row.status = 'uncertain';
    }
    this.data.outboundBlockedUntil = this.data.enabled && this.data.owner && blockedUntil > this.now() ? blockedUntil : undefined;
  }
  private save() {
    try { this.deps.save(this.data); }
    catch {
      this.healthy = false; void this.stop(); this.phase = 'error';
      this.detail = 'Local message storage unavailable. Restart Crewlo before retrying.';
      throw new Error('Local message storage unavailable.');
    }
  }
  private clean(text: string) {
    for (const secret of [this.credentials?.accessToken, this.credentials?.appSecret, this.credentials?.verifyToken]) if (secret) text = text.split(secret).join('[redacted]');
    return this.deps.gateway.clean(text).replace(/\bEAA[A-Za-z0-9]{20,}\b/g, '[redacted]').replace(/\b\d{5,16}:[A-Za-z0-9_-]{20,}\b/g, '[redacted]');
  }
  status(): WhatsAppStatus {
    const pair = this.pair && this.pair.expiresAt > this.now() ? this.pair : undefined;
    const number = this.data.displayPhoneNumber?.replace(/\D/g, '');
    return {
      state: this.phase, detail: this.detail, hasCredentials: this.data.enabled || !!this.deps.secret.get(),
      displayPhoneNumber: this.data.displayPhoneNumber, phoneNumberId: this.data.phoneNumberId, apiVersion: this.data.apiVersion,
      localWebhookUrl: this.listener ? `http://127.0.0.1:${this.listener.port}/whatsapp/webhook` : undefined,
      lastWebhookAt: this.data.lastWebhookAt, owner: this.data.owner,
      candidate: this.candidate && this.candidate.expiresAt > this.now() ? this.candidate : undefined,
      pairingLink: pair && number ? `https://wa.me/${number}?text=${encodeURIComponent('CREWLO ' + pair.nonce)}` : undefined,
      pairingExpiresAt: pair?.expiresAt, defaultAgent: this.data.defaultAgent, agents: this.deps.gateway.agents(),
      uncertainReplies: this.data.history.filter(r => r.direction === 'out' && ['failed', 'uncertain'].includes(r.status)).length,
      waitingWindowReplies: this.data.history.filter(r => r.status === 'waiting_window').length
    };
  }
  history(agentId: string) {
    return this.data.history.filter(r => r.scope === this.deps.gateway.scope() && r.agentId === agentId)
      .map(({ parts, providerIds, providerStatuses, ...row }) => ({ ...row, text: this.clean(row.text) }));
  }
  async connect(input: WhatsAppConnect) {
    if (!this.healthy) throw Error('Local message storage unavailable. Restart Crewlo.');
    if (this.connecting || this.data.enabled) throw Error('Disconnect WhatsApp before reconnecting.');
    if (!input || typeof input !== 'object' || !/^\d{5,30}$/.test(input.phoneNumberId ?? '') || !/^v\d{1,3}\.\d{1,2}$/.test(input.apiVersion ?? '') || !/^[a-fA-F0-9]{32}$/.test(input.appSecret ?? '') || !/^[A-Za-z0-9_-]{24,128}$/.test(input.verifyToken ?? '') || typeof input.accessToken !== 'string' || input.accessToken.length < 20 || input.accessToken.length > 8192 || /\s|[\x00-\x1f]/.test(input.accessToken) || !Number.isInteger(input.port) || input.port < 1024 || input.port > 65535) throw Error('Enter a valid Meta token, phone number ID, 32-character app secret, verification token (24–128 letters/digits/_/-), API version and local port.');
    if (!this.deps.gateway.scope()) throw Error('Open a studio before connecting WhatsApp.');
    const credentials: WhatsAppCredentials = { accessToken: input.accessToken, phoneNumberId: input.phoneNumberId, appSecret: input.appSecret, verifyToken: input.verifyToken, apiVersion: input.apiVersion };
    const generation = this.generation;
    this.connecting = true; this.phase = 'connecting'; this.detail = undefined;
    const abort = new AbortController(); this.abort = abort;
    let listener: Listener | undefined;
    try {
      const api = this.deps.api(credentials), verified = await api.verify(abort.signal);
      if (generation !== this.generation) return;
      if (!/^[\d+ ()-]{5,40}$/.test(verified.displayPhoneNumber) || !/^\d{5,15}$/.test(verified.displayPhoneNumber.replace(/\D/g, ''))) throw Error('Meta phone number could not be verified.');
      listener = await this.deps.listen({ ...credentials, port: input.port, onPayload: payload => this.acceptPayload(payload) });
      if (generation !== this.generation) { await listener.close(); return; }
      if (!this.deps.secret.set(credentials)) throw Error('Secure OS storage is unavailable; credentials were not saved.');
      this.credentials = credentials; this.api = api; this.listener = listener;
      this.data = { ...fresh(), history: this.data.history, enabled: true, scope: this.deps.gateway.scope(), phoneNumberId: input.phoneNumberId, displayPhoneNumber: verified.displayPhoneNumber, apiVersion: input.apiVersion, port: listener.port };
      this.save(); this.beginPairing(); this.startTimer();
      this.phase = 'listening'; this.detail = 'Local webhook ready. Configure the public HTTPS callback in Meta; delivery is not verified yet.';
    } catch (error) {
      await listener?.close();
      if (generation !== this.generation && this.healthy) return;
      this.listener = undefined; this.phase = 'error';
      this.detail = error instanceof WhatsAppError ? error.message : error instanceof Error && /^(Secure|Local|Meta phone)/.test(error.message) ? error.message : 'Could not start WhatsApp. Check Meta credentials and whether the local port is free.';
      throw Error(this.detail);
    } finally { this.connecting = false; }
  }
  async restore() {
    if (!this.healthy || !this.data.enabled || this.listener || this.connecting) return;
    const generation = this.generation;
    this.phase = 'connecting'; this.connecting = true;
    try {
      const credentials = this.deps.secret.get();
      if (!credentials) { this.phase = 'error'; this.detail = 'Stored credentials cannot be decrypted. Disconnect and reconnect.'; return; }
      this.credentials = credentials; this.api = this.deps.api(credentials); this.abort = new AbortController();
      const listener = await this.deps.listen({ ...credentials, port: this.data.port, onPayload: payload => this.acceptPayload(payload) });
      if (generation !== this.generation) { await listener.close(); return; }
      this.listener = listener; this.save(); this.startTimer(); this.phase = 'listening';
      this.detail = 'Local webhook ready. Check that your HTTPS forwarding and Meta subscription are still active.';
    } catch (error) {
      if (generation !== this.generation || !this.healthy) return;
      this.phase = 'error'; this.detail = error instanceof WhatsAppError ? error.message : 'WhatsApp listener unavailable. Check the local port and reconnect.';
    }
    finally { this.connecting = false; }
  }
  private startTimer() {
    this.timer = setInterval(() => { try { this.dispatchQueued(); void this.flush().catch(() => { this.phase = 'error'; }); } catch { /* storage failure already fails closed */ } }, 1000);
  }
  async stop() {
    this.generation++; this.abort?.abort(); this.abort = undefined;
    if (this.timer) clearInterval(this.timer); this.timer = undefined;
    const listener = this.listener; this.listener = undefined; this.phase = 'disconnected';
    await listener?.close();
  }
  async disconnect() {
    await this.stop(); this.pair = undefined; this.candidate = undefined;
    this.data.enabled = false; this.data.owner = undefined; this.data.outboundBlockedUntil = undefined;
    for (const row of this.data.history) {
      if (['queued', 'paused', 'waiting_session', 'waiting_window'].includes(row.status)) row.status = 'cancelled';
      if (row.status === 'awaiting_reply') row.status = 'detached';
      if (row.status === 'sending') row.status = 'uncertain';
    }
    try { this.save(); }
    finally { try { this.deps.secret.delete(); } finally { this.credentials = undefined; this.api = undefined; if (this.healthy) this.detail = undefined; } }
  }
  beginPairing() {
    if (!this.data.enabled || this.data.owner) throw Error('Connect an unpaired WhatsApp account first.');
    this.pair = { nonce: randomBytes(24).toString('base64url'), expiresAt: this.now() + 5 * 60_000 }; this.candidate = undefined;
  }
  confirm(id: string, accept: boolean) {
    const candidate = this.candidate;
    if (!candidate || candidate.id !== id || candidate.expiresAt <= this.now() || this.data.owner) throw Error('Pairing request expired. Generate a new link.');
    this.candidate = undefined; this.pair = undefined;
    if (accept) {
      this.data.owner = { id: candidate.userId, name: candidate.name }; this.save();
      this.notice('Paired with Crewlo. Use /agents to select an agent. Permissions and Resume stay on the desktop.');
    }
  }
  setDefault(id: string) {
    if (!this.deps.gateway.agents().some(a => a.id === id)) throw Error('Agent is not in this studio.');
    this.data.defaultAgent = id; this.save();
  }
  /** Called only after raw request signature verification. Failure must return HTTP503. */
  acceptPayload(payload: unknown) {
    if (!this.healthy) throw Error('Local message storage unavailable.');
    if (!this.data.enabled || !this.listener) throw Error('WhatsApp is not accepting messages.');
    const events = extractWhatsAppEvents(payload, this.data.phoneNumberId!);
    for (const message of events.messages) this.acceptMessage(message);
    for (const status of events.statuses) this.acceptDelivery(status);
    if (events.messages.length || events.statuses.length) {
      this.data.lastWebhookAt = this.now(); this.save(); this.phase = 'receiving';
      const failure = events.statuses.find(status => status.recipient === this.data.owner?.id && status.status === 'failed' && status.errorCode);
      this.detail = failure ? new WhatsAppError(failure.errorCode!).message : 'Signed Meta webhooks received. Phone delivery is reported separately in Conversation.';
    }
  }
  private acceptMessage(message: WhatsAppInbound) {
    // Old retries cannot renew a 24-hour window. Retain receipts longer than the accepted age.
    if (message.timestamp > this.now() + 60_000 || message.timestamp < this.now() - 7 * DAY || Object.hasOwn(this.data.receipts, message.id)) return;
    // Tolerate small Meta clock skew without extending the reply window into the future.
    const receivedAt = Math.min(this.now(), message.timestamp);
    const text = message.text?.trim() ?? '';
    if (!this.data.owner) {
      const nonce = text.startsWith('CREWLO ') ? text.slice(7) : '';
      if (!this.pair || this.pair.expiresAt <= this.now() || !/^[A-Za-z0-9_-]{32}$/.test(nonce) || !timingSafeEqual(Buffer.from(nonce), Buffer.from(this.pair.nonce))) return;
      this.candidate = { id: randomUUID(), userId: message.from, name: this.clean(message.name).slice(0, 80), expiresAt: this.pair.expiresAt };
      this.pair = undefined;
      this.data.lastOwnerMessageAt = receivedAt; this.data.receipts[message.id] = this.now(); this.save(); return;
    }
    if (message.from !== this.data.owner.id) return;
    this.data.receipts[message.id] = this.now();
    for (const [id, at] of Object.entries(this.data.receipts)) if (at < this.now() - 8 * DAY) delete this.data.receipts[id];
    this.data.lastOwnerMessageAt = Math.max(this.data.lastOwnerMessageAt ?? 0, receivedAt);
    if (this.now() - this.data.lastOwnerMessageAt < DAY) for (const row of this.data.history) if (row.pairing === this.data.pairing && row.status === 'waiting_window') row.status = 'queued';
    if (this.data.scope !== this.deps.gateway.scope()) { this.notice('The open studio changed. Reconnect WhatsApp from the intended studio.'); this.save(); return; }
    const agents = this.deps.gateway.agents();
    if (text === '/agents') this.notice(agents.length ? agents.map(a => `${a.name} · ${a.state}\n/agent ${a.id}`).join('\n\n') : 'No agents in this studio. Add an agent in Crewlo.');
    else if (text.startsWith('/agent ')) {
      const agent = agents.find(a => a.id === text.slice(7).trim());
      if (agent) { this.setDefault(agent.id); this.notice(`Selected ${agent.name}.`); }
      else this.notice('Agent not found. Use /agents.');
    } else if (text.startsWith('/')) this.notice('Use /agents, then /agent <id>. Send plain text. Approvals and Resume remain on the desktop.');
    else if (!text || text.length > 16000) this.notice('Send text only (up to 16,000 characters). Attachments are not supported.');
    else {
      const agent = agents.find(a => a.id === this.data.defaultAgent);
      if (!agent) this.notice('Choose an agent with /agents before sending work.');
      else if (agent.state === 'unavailable') this.notice(`${agent.name} is unavailable. Reconnect the session in Crewlo, then resend. Nothing was submitted.`);
      else if (this.data.history.filter(r => ['queued', 'paused', 'waiting_session', 'awaiting_reply'].includes(r.status)).length >= 200) this.notice('Message queue is full. Resolve pending messages in Crewlo first.');
      else {
        const id = `wa-${this.data.pairing}-${createHash('sha256').update(message.id).digest('hex').slice(0, 32)}`;
        this.data.history.push({ id, channel: 'whatsapp', pairing: this.data.pairing, scope: this.data.scope, agentId: agent.id, agentName: this.clean(agent.name), direction: 'in', text: this.clean(text), createdAt: this.now(), status: agent.state === 'paused' ? 'paused' : 'queued' });
        this.notice(agent.state === 'paused' ? `${agent.name} · Message delivery paused. Saved in the queue; Resume in Crewlo.` : `${agent.name} · Queued. Waiting for an actual agent reply.`);
      }
    }
    this.save();
  }
  private notice(text: string) {
    if (!this.data.owner) return;
    this.data.history.push({ id: randomUUID(), channel: 'whatsapp', scope: this.data.scope, pairing: this.data.pairing, agentId: '', agentName: 'Crewlo', direction: 'out', text: this.clean(text), createdAt: this.now(), status: 'queued', parts: splitWhatsAppReply('Crewlo', this.clean(text)), nextPart: 0, providerIds: [] });
    this.save();
  }
  dispatchQueued() {
    if (!this.healthy || !this.data.enabled || !this.data.owner || this.data.scope !== this.deps.gateway.scope()) return;
    const agents = this.deps.gateway.agents();
    for (const row of this.data.history) {
      if (row.direction !== 'in' || row.pairing !== this.data.pairing || !['queued', 'paused', 'waiting_session'].includes(row.status)) continue;
      const agent = agents.find(a => a.id === row.agentId);
      if (!agent || agent.state !== 'ready') {
        const state = !agent || agent.state === 'unavailable' ? 'waiting_session' : 'paused';
        if (row.status !== state) { row.status = state; this.notice(`${row.agentName} · ${state === 'paused' ? 'Message delivery paused. Resume in Crewlo.' : 'Session unavailable. Message held until it reconnects in Crewlo.'}`); }
        continue;
      }
      row.status = 'routing'; this.save();
      try { this.deps.gateway.enqueue(row); row.status = 'awaiting_reply'; }
      catch { row.status = 'uncertain'; this.notice(`${row.agentName} · Submission could not be confirmed. Inspect Crewlo before resending.`); }
      this.save();
    }
  }
  agentReply(msg: { id: string; from: string; to: string; conversation: string; in_reply_to: string | null; act: string; public_reply?: string }) {
    if (!this.data.enabled || !this.data.owner || this.data.scope !== this.deps.gateway.scope() || msg.to !== 'human' || !['inform', 'done', 'refuse'].includes(msg.act)) return;
    // Do not acknowledge the durable hive handoff from partially mutated memory.
    if (!this.healthy) throw new Error('Local message storage unavailable.');
    const original = this.data.history.find(r => r.direction === 'in' && r.id === msg.in_reply_to && r.agentId === msg.from && r.pairing === this.data.pairing && ['awaiting_reply', 'routing'].includes(r.status));
    if (!original || msg.conversation !== `remote:${original.id}` || typeof msg.public_reply !== 'string' || !msg.public_reply.trim() || privatePayload.test(msg.public_reply)) return;
    const text = this.clean(msg.public_reply.trim());
    if (text.length > 100_000) { this.notice(`${original.agentName} · Reply exceeds the remote limit. Ask for a shorter reply in Crewlo.`); return; }
    original.status = 'replied';
    this.data.history.push({ id: `reply-${original.id}`, channel: 'whatsapp', scope: original.scope, pairing: this.data.pairing, agentId: original.agentId, agentName: original.agentName, direction: 'out', text, createdAt: this.now(), status: 'queued', replyTo: original.id, parts: splitWhatsAppReply(original.agentName, text), nextPart: 0, providerIds: [] });
    this.save();
  }
  private acceptDelivery(status: WhatsAppDelivery) {
    if (status.recipient !== this.data.owner?.id) return;
    const previous = this.data.deliveryReceipts[status.id];
    const rank = { sent: 1, delivered: 2, read: 3, failed: 0 };
    if (previous && (previous.status === 'failed' || (status.status === 'failed' ? ['delivered', 'read'].includes(previous.status) : rank[previous.status] > rank[status.status]))) return;
    this.data.deliveryReceipts[status.id] = status;
    for (const row of this.data.history) if (row.pairing === this.data.pairing && row.providerIds?.includes(status.id)) this.updateDelivery(row);
    const ids = Object.keys(this.data.deliveryReceipts);
    for (const id of ids.slice(0, Math.max(0, ids.length - 5000))) delete this.data.deliveryReceipts[id];
    this.save();
  }
  private updateDelivery(row: RemoteExchange) {
    const previous = row.providerStatuses ?? {};
    // Receipt cache is bounded, but already confirmed row delivery must never regress after eviction.
    row.providerStatuses = Object.fromEntries((row.providerIds ?? []).flatMap(id => {
      const status = deliveryState(previous[id], this.data.deliveryReceipts[id]?.status);
      return status ? [[id, status]] : [];
    }));
    const statuses = (row.providerIds ?? []).map(id => row.providerStatuses![id]);
    if (statuses.includes('failed')) row.status = 'failed';
    else if (row.nextPart === row.parts?.length) row.status = statuses.every(s => s === 'read') ? 'read' : statuses.every(s => s === 'delivered' || s === 'read') ? 'delivered' : 'accepted';
  }
  async flush() {
    if (!this.healthy || this.sending || !this.data.enabled || !this.data.owner || !this.api || this.abort?.signal.aborted || (this.data.outboundBlockedUntil ?? 0) > this.now()) return;
    const row = this.data.history.find(r => r.pairing === this.data.pairing && r.direction === 'out' && r.status === 'queued' && (r.retryAt ?? 0) <= this.now());
    if (!row) return;
    if (!this.data.lastOwnerMessageAt || this.now() - this.data.lastOwnerMessageAt >= DAY) { row.status = 'waiting_window'; this.save(); return; }
    const generation = this.generation; this.sending = true;
    try {
      row.status = 'sending'; this.save();
      const result = await this.api.sendText(this.data.owner.id, row.parts![row.nextPart ?? 0], this.abort?.signal);
      if (generation !== this.generation) return;
      row.providerIds ??= []; row.providerIds.push(result.id); row.nextPart = (row.nextPart ?? 0) + 1;
      row.status = row.nextPart === row.parts!.length ? 'accepted' : 'queued'; this.updateDelivery(row);
    } catch (error) {
      if (generation !== this.generation) return;
      if (error instanceof WhatsAppError && error.code === 131047) row.status = 'waiting_window';
      else if (error instanceof WhatsAppError && error.retryAfter > 0) { row.status = 'queued'; row.retryAt = this.now() + error.retryAfter * 1000; this.data.outboundBlockedUntil = row.retryAt; }
      else row.status = !(error instanceof WhatsAppError) || error.uncertain ? 'uncertain' : 'failed';
      if (error instanceof WhatsAppError) { this.detail = error.message; if ([190, 401, 403].includes(error.code)) this.phase = 'error'; }
    } finally { this.sending = false; if (generation === this.generation) this.save(); }
  }
}
