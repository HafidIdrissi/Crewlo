'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { WhatsAppService } = load('src/main/messaging/whatsappService.ts');
const { WhatsAppError } = load('src/main/messaging/whatsappApi.ts');
const { remoteRequest } = load('src/main/messaging/gateway.ts');
const { redactSecrets } = load('src/main/hive.ts');

const OWNER = '33612345678';
const OTHER = '33698765432';
const DAY = 24 * 60 * 60_000;
const INITIAL_TIME = 1790064000000;
const CREDENTIALS = { accessToken: 'EAATEST_PRIVATE_TOKEN_abcdefghijk', phoneNumberId: '123456789', appSecret: 'a'.repeat(32), verifyToken: 'test_verification_token_abcdef', apiVersion: 'v26.0' };
const INPUT = { ...CREDENTIALS, port: 8788 };
const clone = value => value === undefined ? undefined : structuredClone(value);
function envelope(messages = [], statuses = [], overrides = {}) {
  return { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
    messaging_product: 'whatsapp', metadata: { phone_number_id: CREDENTIALS.phoneNumberId },
    contacts: [{ wa_id: OWNER, profile: { name: 'Owner' } }], messages, statuses, ...overrides
  } }] }] };
}
function deferred() { let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej; }); return { promise, resolve, reject }; }
async function fixture(t, options = {}) {
  let stored = clone(options.stored), secret = clone(options.secret), now = options.now ?? INITIAL_TIME, scope = '/studio';
  let failSave = false, failDelete = false, sendError, sendHook, verifyHook, listenHook, createApiError;
  const routed = [], sent = [], listeners = [];
  const agents = [{ id: 'remy', name: 'Remy', state: 'ready' }, { id: 'ellis', name: 'Ellis', state: 'unavailable' }];
  const api = {
    verify: async signal => verifyHook ? verifyHook(signal) : { displayPhoneNumber: '+33 7 00 00 00 00' },
    sendText: async (to, text, signal) => {
      const send = { to, text, signal }; sent.push(send);
      if (sendHook) return sendHook(send);
      if (sendError) { const error = sendError; sendError = undefined; throw error; }
      return { id: 'wamid.sent_' + sent.length };
    }
  };
  const deps = {
    gateway: { scope: () => scope, agents: () => agents, clean: redactSecrets, enqueue: row => {
      routed.push(clone(row)); if (options.routeError) throw Error('submission interrupted');
    } },
    load: () => clone(stored), save: value => { if (failSave) throw Error('disk full with ' + CREDENTIALS.accessToken); stored = clone(value); },
    secret: { get: () => clone(secret), set: value => { if (options.noEncryption) return false; secret = clone(value); return true; },
      delete: () => { if (failDelete) throw Error('Secure credential removal failed.'); secret = undefined; } },
    api: () => { if (createApiError) throw createApiError; return api; },
    listen: async config => {
      if (listenHook) return listenHook(config);
      const listener = { config, port: config.port, closed: false, close: async () => { listener.closed = true; } };
      listeners.push(listener); return listener;
    },
    now: () => now
  };
  const service = new WhatsAppService(deps); t.after(() => service.stop());
  if (!options.skipConnect) await service.connect(INPUT);
  let index = 0;
  const f = { service, deps, agents, routed, sent, listeners,
    stored: () => clone(stored), secret: () => clone(secret), now: () => now,
    clock: value => { now = value; }, scope: value => { scope = value; }, failSave: () => { failSave = true; },
    failDelete: () => { failDelete = true; }, sendError: error => { sendError = error; }, sendHook: fn => { sendHook = fn; },
    verifyHook: fn => { verifyHook = fn; }, listenHook: fn => { listenHook = fn; }, createApiError: error => { createApiError = error; },
    message(text, overrides = {}) { return { id: 'wamid.in_' + (++index), from: OWNER, timestamp: String(Math.floor(now / 1000)), type: 'text', text: { body: text }, ...overrides }; },
    accept(text, overrides = {}) { const msg = f.message(text, overrides); service.acceptPayload(envelope([msg])); return msg; },
    pair() { const text = new URL(service.status().pairingLink).searchParams.get('text'); f.accept(text); service.confirm(service.status().candidate.id, true); service.setDefault('remy'); },
    request(text = 'Build a page') { f.accept(text); service.dispatchQueued(); return service.history('remy').filter(r => r.direction === 'in').at(-1); },
    reply(row, extra = {}) { service.agentReply({ id: 'outbox-1', from: 'remy', to: 'human', act: 'inform', conversation: 'remote:' + row.id, in_reply_to: row.id, public_reply: 'Hello from the real agent', ...extra }); },
    receipt(id, status, extra = {}) { service.acceptPayload(envelope([], [{ id, status, recipient_id: OWNER, ...extra }])); },
    async drain() { for (let i = 0; i < 30; i++) await service.flush(); },
    async restart() { await service.stop(); const next = new WhatsAppService(deps); t.after(() => next.stop()); await next.restore(); return next; }
  };
  return f;
}

test('WhatsApp pairing is one-use, expiring and requires desktop owner confirmation', async t => {
  const f = await fixture(t), s = f.service;
  assert.equal(s.status().state, 'listening'); assert.match(s.status().detail, /not verified/);
  const text = new URL(s.status().pairingLink).searchParams.get('text');
  f.accept(text, { context: { group_id: 'group' } });
  f.accept('CREWLO ' + 'é'.repeat(32)); assert.equal(s.status().candidate, undefined);
  f.accept(text); const candidate = s.status().candidate;
  assert.equal(candidate.userId, OWNER); assert.equal(s.status().owner, undefined); assert.equal(s.status().pairingLink, undefined);
  f.accept(text, { from: OTHER }); f.accept('Do work'); s.dispatchQueued();
  assert.equal(s.status().candidate.id, candidate.id); assert.equal(f.routed.length, 0);
  assert.throws(() => s.confirm('wrong', true), /expired/);
  s.confirm(candidate.id, true); assert.equal(s.status().owner.id, OWNER);
  assert.throws(() => s.confirm(candidate.id, true), /expired/);
  assert.throws(() => s.beginPairing(), /unpaired/);
});

test('expired and rejected WhatsApp pairing links do not bind anyone', async t => {
  const f = await fixture(t), s = f.service;
  const first = new URL(s.status().pairingLink).searchParams.get('text');
  f.clock(INITIAL_TIME + 6 * 60_000); f.accept(first); assert.equal(s.status().candidate, undefined);
  s.beginPairing(); const second = new URL(s.status().pairingLink).searchParams.get('text');
  f.accept(second); s.confirm(s.status().candidate.id, false);
  f.accept(second); assert.equal(s.status().owner, undefined); assert.equal(s.status().candidate, undefined);
});

test('only owner/selected-phone individual messages are queued; duplicate webhooks survive restart', async t => {
  const f = await fixture(t); f.pair();
  f.accept('Wrong owner', { from: OTHER });
  f.accept('Group', { group_id: 'group' });
  f.service.acceptPayload(envelope([f.message('Wrong target')], [], { metadata: { phone_number_id: 'other' } }));
  f.service.dispatchQueued(); assert.equal(f.routed.length, 0);
  const incoming = f.accept('Create index.html'); f.service.dispatchQueued();
  f.service.acceptPayload(envelope([incoming, incoming])); f.service.dispatchQueued();
  assert.equal(f.routed.length, 1); assert.equal(f.routed[0].text, 'Create index.html');
  const reboot = await f.restart(); reboot.acceptPayload(envelope([incoming])); reboot.dispatchQueued();
  assert.equal(f.routed.length, 1); assert.ok(f.stored().receipts[incoming.id]);
});

test('/agents, paused delivery, unavailable sessions and normal gateway routing preserve permissions', async t => {
  const f = await fixture(t); f.pair();
  f.accept('/agents'); f.accept('/agent ellis'); f.accept('Do unavailable work'); f.service.dispatchQueued();
  assert.equal(f.routed.length, 0); assert.equal(f.service.history('ellis').length, 0);
  assert.ok(f.stored().history.some(r => r.text.includes('Nothing was submitted')));
  f.accept('/agent remy'); f.agents[0].state = 'paused'; const row = f.request();
  assert.equal(row.status, 'paused'); assert.equal(f.routed.length, 0);
  f.agents[0].state = 'unavailable'; f.service.dispatchQueued();
  assert.equal(f.service.history('remy')[0].status, 'waiting_session');
  f.agents[0].state = 'ready'; f.service.dispatchQueued(); f.service.dispatchQueued();
  assert.equal(f.routed.length, 1); assert.equal(f.service.history('remy')[0].status, 'awaiting_reply');
  const request = remoteRequest(f.routed[0]); assert.equal(request.to, 'remy'); assert.equal(request.id, row.id);
  assert.match(request.body, /public_reply/); assert.ok(!request.body.includes(CREDENTIALS.accessToken));
});

test('agent replies require public field, sender, conversation and original request; secrets/logs never leave', async t => {
  const f = await fixture(t); f.pair(); const row = f.request();
  for (const wrong of [{ from: 'ellis' }, { to: 'all' }, { conversation: 'other' }, { in_reply_to: 'other' },
    { act: 'request' }, { public_reply: undefined, body: 'RAW TERMINAL LOG' }, { public_reply: '[CREWLO_REMOTE_REPLY] internal prompt' },
    { public_reply: '<system>private</system>' }, { public_reply: '[pty] output' }]) f.reply(row, wrong);
  assert.equal(f.service.history('remy').length, 1);
  f.reply(row, { public_reply: `Done ${CREDENTIALS.accessToken} ${CREDENTIALS.appSecret} ${CREDENTIALS.verifyToken}` }); f.reply(row);
  assert.equal(f.service.history('remy').length, 2); await f.drain();
  assert.ok(f.sent.some(send => send.text === 'Remy · Done [redacted] [redacted] [redacted]'));
  assert.ok(f.sent.every(send => send.to === OWNER));
  const visible = JSON.stringify([f.stored(), f.service.status(), f.service.history('remy'), f.sent]);
  for (const secret of Object.values(CREDENTIALS).slice(0, 1).concat([CREDENTIALS.appSecret, CREDENTIALS.verifyToken, 'RAW TERMINAL LOG'])) assert.ok(!visible.includes(secret));
});

test('accepted is not delivered; signed owner receipts advance monotonically and survive restart', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request); await f.drain();
  const output = f.stored().history.find(r => r.replyTo === request.id), id = output.providerIds[0];
  assert.equal(output.status, 'accepted');
  f.receipt(id, 'delivered', { recipient_id: OTHER }); assert.equal(f.service.history('remy').at(-1).status, 'accepted');
  f.receipt(id, 'sent'); assert.equal(f.service.history('remy').at(-1).status, 'accepted');
  f.receipt(id, 'delivered'); f.receipt(id, 'sent'); f.receipt(id, 'failed');
  assert.equal(f.service.history('remy').at(-1).status, 'delivered');
  f.receipt(id, 'read'); assert.equal(f.service.history('remy').at(-1).status, 'read');
  const reboot = await f.restart(); reboot.acceptPayload(envelope([], [{ id, status: 'sent', recipient_id: OWNER }]));
  assert.equal(reboot.history('remy').at(-1).status, 'read');
  assert.equal(reboot.history('remy').at(-1).providerIds, undefined);
});

test('delivery callbacks arriving before send response are retained, including sent-to-failed transitions', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request);
  f.sendHook(() => { f.receipt('wamid.race', 'delivered'); return { id: 'wamid.race' }; });
  await f.service.flush(); assert.equal(f.service.history('remy').at(-1).status, 'delivered');
  const second = f.request('Second'); await f.drain(); f.reply(second);
  f.sendHook(() => { f.receipt('wamid.failure_race', 'sent'); f.receipt('wamid.failure_race', 'failed', { errors: [{ code: 131026 }] }); return { id: 'wamid.failure_race' }; });
  await f.service.flush(); assert.equal(f.service.history('remy').at(-1).status, 'failed');
  const sends = f.sent.length; f.receipt('wamid.failure_race', 'sent'); await f.service.flush();
  assert.equal(f.sent.length, sends); assert.equal(f.service.history('remy').at(-1).status, 'failed');
});

test('pruned delivery receipt cache cannot regress persisted confirmed rows after restart', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request); await f.drain();
  const id = f.stored().history.find(row => row.replyTo === request.id).providerIds[0];
  f.receipt(id, 'read'); const stored = f.stored(); delete stored.deliveryReceipts[id];
  await f.service.stop();
  const restored = await fixture(t, { stored, secret: CREDENTIALS, skipConnect: true }); await restored.service.restore();
  restored.receipt(id, 'sent'); assert.equal(restored.service.history('remy').at(-1).status, 'read');
  restored.receipt(id, 'failed'); assert.equal(restored.service.history('remy').at(-1).status, 'read');
});

test('asynchronous failed receipts report safe reasons but never auto-replay accepted chunks', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request); await f.drain();
  const id = f.stored().history.find(row => row.replyTo === request.id).providerIds[0];
  f.receipt(id, 'failed', { errors: [{ code: 131047, message: CREDENTIALS.accessToken }] });
  assert.equal(f.service.history('remy').at(-1).status, 'failed'); assert.match(f.service.status().detail, /reply window expired/);
  const count = f.sent.length; await f.service.flush(); assert.equal(f.sent.length, count);
});

test('multi-part WhatsApp replies are prefixed and only delivered when every accepted chunk is delivered', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain();
  const before = f.sent.length, text = '😀'.repeat(6000); f.reply(request, { public_reply: text }); await f.drain();
  const sent = f.sent.slice(before); assert.ok(sent.length > 2); assert.ok(sent.every(send => send.text.startsWith('Remy · ') && send.text.length <= 4000));
  assert.equal(sent.map(send => send.text.slice('Remy · '.length)).join(''), text);
  const output = f.stored().history.find(r => r.replyTo === request.id);
  f.receipt(output.providerIds[0], 'delivered'); assert.equal(f.service.history('remy').at(-1).status, 'accepted');
  for (const id of output.providerIds.slice(1)) f.receipt(id, 'read');
  assert.equal(f.service.history('remy').at(-1).status, 'delivered');
  f.receipt(output.providerIds[0], 'read'); assert.equal(f.service.history('remy').at(-1).status, 'read');
});

test('24h reply window waits honestly and renews only on a new owner message, not receipts/retries/outsiders', async t => {
  const f = await fixture(t); f.pair(); await f.drain();
  const incoming = f.accept('Long running task'); f.service.dispatchQueued(); await f.drain();
  const request = f.service.history('remy').at(-1); f.reply(request);
  f.clock(INITIAL_TIME + DAY); const before = f.sent.length; await f.service.flush();
  assert.equal(f.service.history('remy').at(-1).status, 'waiting_window'); assert.equal(f.service.status().waitingWindowReplies, 1);
  f.service.acceptPayload(envelope([incoming])); f.accept('/agents', { from: OTHER }); f.receipt('wamid.unrelated', 'read');
  await f.service.flush(); assert.equal(f.sent.length, before);
  f.accept('/agents'); await f.drain(); assert.equal(f.service.history('remy').at(-1).status, 'accepted');
  assert.ok(f.sent.some(send => send.text === 'Remy · Hello from the real agent'));
});

test('small webhook timestamp skew cannot extend the owner24hwindow; stale events cannot reopen it', async t => {
  const f = await fixture(t); f.pair();
  f.accept('/agents', { timestamp: String((INITIAL_TIME + 30_000) / 1000) });
  assert.equal(f.stored().lastOwnerMessageAt, INITIAL_TIME);
  f.clock(INITIAL_TIME + 8 * DAY);
  f.accept('/agents', { timestamp: String(INITIAL_TIME / 1000) });
  assert.equal(f.stored().lastOwnerMessageAt, INITIAL_TIME);
});

test('Meta131047 holds reply until fresh inbound; rate limits suspend the whole owner chat', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request);
  f.sendError(new WhatsAppError(131047)); await f.service.flush();
  assert.equal(f.service.history('remy').at(-1).status, 'waiting_window');
  f.accept('/agents'); f.sendError(new WhatsAppError(130429, 5)); const before = f.sent.length; await f.service.flush(); await f.drain();
  assert.equal(f.sent.length, before + 1); assert.equal(f.service.history('remy').at(-1).status, 'queued');
  f.clock(INITIAL_TIME + 5000); await f.drain(); assert.equal(f.service.history('remy').at(-1).status, 'accepted');
});

test('WhatsApp global rate-limit cooldown survives restart and holds later replies until expiry', async t => {
  const f = await fixture(t); f.pair(); await f.drain();
  const first = f.request('First request'), second = f.request('Second request'); await f.drain();
  f.reply(first, { public_reply: 'First reply' }); f.reply(second, { public_reply: 'Second reply' });
  f.sendError(new WhatsAppError(130429, 60)); await f.service.flush();
  const reboot = await f.restart(), before = f.sent.length;
  reboot.acceptPayload(envelope([f.message('Work arriving during cooldown')])); reboot.dispatchQueued();
  const third = reboot.history('remy').filter(row => row.direction === 'in').at(-1);
  reboot.agentReply({ id: 'outbox-3', from: 'remy', to: 'human', act: 'inform', conversation: 'remote:' + third.id, in_reply_to: third.id, public_reply: 'Third reply' });
  await reboot.flush(); f.clock(INITIAL_TIME + 59999); await reboot.flush();
  assert.equal(f.sent.length, before, 'later rows and newly queued replies must not bypass the restored cooldown');
  assert.equal(f.stored().outboundBlockedUntil, INITIAL_TIME + 60000);
  f.clock(INITIAL_TIME + 60000); for (let i = 0; i < 10; i++) await reboot.flush();
  assert.deepEqual(f.sent.slice(before).filter(send => send.text.startsWith('Remy · ')).map(send => send.text), ['Remy · First reply', 'Remy · Second reply', 'Remy · Third reply']);
  assert.ok(reboot.history('remy').filter(row => row.direction === 'out').every(row => row.status === 'accepted'));
});

test('WhatsApp restores legacy retry deadlines but ignores expired or old-pairing rows', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request);
  f.sendError(new WhatsAppError(130429, 60)); await f.service.flush(); f.accept('/agents');
  const stored = f.stored(); delete stored.outboundBlockedUntil; await f.service.stop();
  const reboot = await fixture(t, { stored, secret: CREDENTIALS, skipConnect: true }); await reboot.service.restore();
  await reboot.service.flush(); assert.equal(reboot.sent.length, 0);
  assert.equal(reboot.stored().outboundBlockedUntil, INITIAL_TIME + 60000);
  const old = clone(stored.history.find(row => row.replyTo === request.id)); old.id = 'old-pairing'; old.pairing = 'another-owner'; old.retryAt = INITIAL_TIME + 999999;
  stored.history.unshift(old);
  const expired = await fixture(t, { stored, secret: CREDENTIALS, skipConnect: true, now: INITIAL_TIME + 60000 }); await expired.service.restore();
  await expired.service.flush(); assert.equal(expired.sent.length, 1); assert.equal(expired.sent[0].text, 'Remy · Hello from the real agent');
});

test('WhatsApp Disconnect cancels rate-limited work and a new owner does not inherit its cooldown', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request);
  f.sendError(new WhatsAppError(130429, 60)); await f.service.flush();
  await f.service.disconnect(); assert.equal(f.stored().outboundBlockedUntil, undefined);
  assert.equal(f.service.history('remy').find(row => row.replyTo === request.id).status, 'cancelled');
  await f.service.connect(INPUT);
  const text = new URL(f.service.status().pairingLink).searchParams.get('text'); f.accept(text, { from: OTHER }); f.service.confirm(f.service.status().candidate.id, true);
  const before = f.sent.length; await f.drain();
  assert.equal(f.sent.length, before + 1); assert.equal(f.sent.at(-1).to, OTHER); assert.match(f.sent.at(-1).text, /Paired with Crewlo/);
});

test('WhatsApp durable sender cooldown is authoritative without per-row retry metadata and expires after downtime', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request);
  const stored = f.stored(); stored.outboundBlockedUntil = INITIAL_TIME + 60000; await f.service.stop();
  assert.ok(stored.history.every(row => row.retryAt === undefined));
  for (const now of [INITIAL_TIME, INITIAL_TIME + 60000]) {
    const reboot = await fixture(t, { stored, secret: CREDENTIALS, skipConnect: true, now }); await reboot.service.restore();
    await reboot.service.flush();
    assert.equal(reboot.sent.length, now === INITIAL_TIME ? 0 : 1);
    assert.equal(reboot.stored().outboundBlockedUntil, now === INITIAL_TIME ? INITIAL_TIME + 60000 : undefined);
  }
});

test('ambiguous sends and interrupted submissions never auto-replay after restart', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request);
  f.sendError(new WhatsAppError(0, 0, true)); await f.service.flush();
  assert.equal(f.service.history('remy').at(-1).status, 'uncertain'); assert.equal(f.service.status().uncertainReplies, 1);
  const reboot = await f.restart(), before = f.sent.length; await reboot.flush(); assert.equal(f.sent.length, before);
  const stored = f.stored(); stored.history.find(r => r.id === request.id).status = 'routing';
  stored.history.find(r => r.replyTo === request.id).status = 'sending';
  const interrupted = await fixture(t, { stored, secret: CREDENTIALS, skipConnect: true }); await interrupted.service.restore();
  interrupted.service.dispatchQueued(); await interrupted.service.flush();
  assert.equal(interrupted.routed.length, 0); assert.equal(interrupted.sent.length, 0);
  assert.ok(interrupted.service.history('remy').every(row => row.status === 'uncertain'));
});

test('Disconnect cancels queued work, detaches submitted work and ignores late in-flight send completion', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const sentRequest = f.request(); await f.drain(); f.reply(sentRequest);
  const pending = deferred(); f.sendHook(() => pending.promise); const flushing = f.service.flush();
  const activeRequest = f.request('Already submitted');
  f.agents[0].state = 'paused'; const queued = f.request('Queued until Resume');
  await f.service.disconnect(); pending.resolve({ id: 'wamid.late' }); await flushing;
  assert.equal(f.secret(), undefined); assert.equal(f.service.status().owner, undefined); assert.equal(f.service.status().state, 'disconnected');
  assert.ok(f.listeners.every(listener => listener.closed));
  const history = f.service.history('remy');
  assert.equal(history.find(row => row.id === queued.id).status, 'cancelled');
  assert.equal(history.find(row => row.id === activeRequest.id).status, 'detached');
  assert.equal(history.find(row => row.replyTo === sentRequest.id).status, 'uncertain');
  assert.ok(!JSON.stringify(f.stored()).includes('wamid.late'));
  assert.throws(() => f.accept('Late inbound'), /not accepting/);
  f.reply(activeRequest); f.service.dispatchQueued(); await f.service.flush();
  assert.equal(f.service.history('remy').length, history.length);
});

test('durable storage failure refuses webhook acknowledgment and fails closed before dispatch or send', async t => {
  const f = await fixture(t); f.pair(); const before = f.stored(); f.failSave();
  const incoming = f.message('Unsaved work');
  assert.throws(() => f.service.acceptPayload(envelope([incoming])), /storage/);
  assert.throws(() => f.accept('More work'), /storage/);
  f.service.dispatchQueued(); await f.service.flush();
  assert.equal(f.routed.length, 0); assert.equal(f.sent.length, 0);
  assert.deepEqual(f.stored(), before); assert.equal(f.service.status().state, 'error');
  assert.ok(!f.service.status().detail.includes(CREDENTIALS.accessToken));
  const restart = await fixture(t, { stored: before, secret: CREDENTIALS, skipConnect: true }); await restart.service.restore();
  restart.service.acceptPayload(envelope([incoming])); restart.service.dispatchQueued(); assert.equal(restart.routed.length, 1);
});

test('failure before sending leaves no API call; Disconnect clears memory even if secret deletion fails', async t => {
  const f = await fixture(t); f.pair(); f.failSave(); await f.service.flush();
  assert.equal(f.sent.length, 0); assert.equal(f.service.status().state, 'error');
  const other = await fixture(t); other.pair(); other.failDelete();
  await assert.rejects(other.service.disconnect(), /removal failed/);
  assert.equal(other.service.status().owner, undefined); assert.equal(other.service.status().state, 'disconnected');
  assert.equal(other.service.credentials, undefined); assert.equal(other.service.api, undefined);
});

test('changing studio cannot route owner work or correlate a previously submitted agent reply', async t => {
  const f = await fixture(t); f.pair(); const row = f.request(); f.scope('/different'); f.reply(row); f.request('Wrong studio');
  assert.equal(f.routed.length, 1); assert.equal(f.service.history('remy').length, 0);
  assert.ok(f.stored().history.some(r => r.text.includes('studio changed')));
});

test('secure storage unavailable fails closed and rejected connect verification cannot leak credentials', async t => {
  const f = await fixture(t, { noEncryption: true, skipConnect: true });
  await assert.rejects(f.service.connect(INPUT), /Secure OS storage/); assert.equal(f.secret(), undefined);
  assert.ok(f.listeners.every(listener => listener.closed)); assert.equal(f.service.status().state, 'error');
  const other = await fixture(t, { skipConnect: true }); other.verifyHook(() => { throw Error('sensitive ' + CREDENTIALS.accessToken); });
  await assert.rejects(other.service.connect(INPUT), error => !error.message.includes(CREDENTIALS.accessToken));
  assert.equal(other.listeners.length, 0);
});

test('Disconnect wins races against pending connect verification and restored listener failure', async t => {
  const pending = deferred(), f = await fixture(t, { skipConnect: true }); f.verifyHook(() => pending.promise);
  const connecting = f.service.connect(INPUT); await f.service.disconnect(); pending.resolve({ displayPhoneNumber: '+33 7 00 00 00 00' }); await connecting;
  assert.equal(f.service.status().state, 'disconnected'); assert.equal(f.secret(), undefined); assert.equal(f.listeners.length, 0);
  const base = await fixture(t); base.pair(); const restored = await fixture(t, { stored: base.stored(), secret: CREDENTIALS, skipConnect: true });
  const failure = deferred(); restored.listenHook(() => failure.promise); const restoring = restored.service.restore();
  await restored.service.disconnect(); failure.reject(Error('late listener failure')); await restoring;
  assert.equal(restored.service.status().state, 'disconnected'); assert.equal(restored.secret(), undefined);
});

test('restoring malformed credentials is reported without an unhandled async rejection', async t => {
  const base = await fixture(t); base.pair();
  const f = await fixture(t, { stored: base.stored(), secret: CREDENTIALS, skipConnect: true });
  f.createApiError(new WhatsAppError(190)); await f.service.restore();
  assert.equal(f.service.status().state, 'error'); assert.match(f.service.status().detail, /token rejected/);
  assert.equal(f.listeners.length, 0);
});
