'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { TelegramService } = load('src/main/messaging/telegramService.ts');
const { TelegramError, splitTelegramReply } = load('src/main/messaging/telegramApi.ts');
const { remoteRequest } = load('src/main/messaging/gateway.ts');
const { redactSecrets } = load('src/main/hive.ts');
const TOKEN = '123456:TEST_TOKEN_ONLY_abcdefghijklmnopqrstuvwxyz';
const clone = value => value === undefined ? undefined : structuredClone(value);
function update(id, text, user = 42, type = 'private') {
  return { update_id: id, message: { message_id: id, date: 1, text, from: { id: user, first_name: 'Owner' }, chat: { id: user, type } } };
}
async function fixture(t, options = {}) {
  let stored = clone(options.stored), secret = options.secret, now = options.now ?? 1000, failSave = false;
  const calls = [], routed = [], agents = [{ id: 'remy', name: 'Remy', state: 'ready' }, { id: 'ellis', name: 'Ellis', state: 'unavailable' }];
  let scope = '/studio', sendError;
  const api = { async call(method, args, signal) {
    calls.push({ method, args: clone(args), signal });
    if (method === 'getMe') return { username: 'CrewloTestBot', is_bot: true };
    if (method === 'getWebhookInfo') return { url: options.webhook || '' };
    if (method === 'getUpdates' && options.poll) return options.poll(args, signal);
    if (method === 'getUpdates') return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new TelegramError(0)), { once: true });
    });
    if (sendError) { const error = sendError; sendError = undefined; throw error; }
    return { message_id: 123 };
  } };
  const deps = { gateway: { scope: () => scope, agents: () => agents, clean: redactSecrets, enqueue: row => routed.push(clone(row)) },
    load: () => clone(stored), save: data => { if (failSave) throw Error('disk full'); stored = clone(data); },
    secret: { get: () => secret, set: value => { if (options.noEncryption) return false; secret = value; return true; }, delete: () => { secret = undefined; } },
    api: () => api, now: () => now };
  const service = new TelegramService(deps);
  t.after(() => service.stop());
  if (!options.skipConnect) { await service.connect(TOKEN); if (!options.keepRunning) service.stop(); }
  return { service, deps, calls, routed, agents, stored: () => clone(stored), secret: () => secret,
    clock: value => { now = value; }, scope: value => { scope = value; }, failSave: () => { failSave = true; }, sendError: value => { sendError = value; },
    pair() { const link = service.status().pairingLink; service.acceptUpdate(update(1, '/start ' + new URL(link).searchParams.get('start'))); service.confirm(service.status().candidate.id, true); service.setDefault('remy'); },
    async drain() { for (let i = 0; i < 20; i++) await service.flush(); },
    request(id = 2, text = 'Hello') { service.acceptUpdate(update(id, text)); service.dispatchQueued(); return service.history('remy').find(r => r.direction === 'in' && r.id.endsWith('-' + id)); },
    reply(row, extra = {}) { service.agentReply({ id: 'outbox-1', from: 'remy', to: 'human', act: 'inform', conversation: 'remote:' + row.id, in_reply_to: row.id, public_reply: 'Hello back', ...extra }); }
  };
}

test('pairing is private, expiring, single use, and requires explicit desktop confirmation', async t => {
  const f = await fixture(t), s = f.service;
  const nonce = new URL(s.status().pairingLink).searchParams.get('start');
  s.acceptUpdate(update(1, '/start ' + nonce, 42, 'group'));
  assert.equal(s.status().candidate, undefined);
  s.acceptUpdate(update(2, '/start ' + 'é'.repeat(32)));
  s.acceptUpdate(update(3, '/start ' + nonce));
  const candidate = s.status().candidate;
  assert.equal(candidate.userId, 42); assert.equal(s.status().owner, undefined); assert.equal(s.status().pairingLink, undefined);
  s.acceptUpdate(update(4, '/start ' + nonce, 99));
  s.acceptUpdate(update(5, 'Do work'));
  s.dispatchQueued(); assert.equal(f.routed.length, 0);
  assert.equal(s.status().candidate.id, candidate.id);
  assert.throws(() => s.confirm('wrong', true), /expired/);
  s.confirm(candidate.id, true);
  assert.equal(s.status().owner.id, 42);
  assert.throws(() => s.confirm(candidate.id, true), /expired/);
  assert.throws(() => s.beginPairing(), /unpaired/);
});

test('expired and rejected pairing links cannot bind an owner', async t => {
  const f = await fixture(t), s = f.service;
  const nonce = new URL(s.status().pairingLink).searchParams.get('start');
  f.clock(400000); s.acceptUpdate(update(1, '/start ' + nonce));
  assert.equal(s.status().candidate, undefined);
  s.beginPairing(); const next = new URL(s.status().pairingLink).searchParams.get('start');
  s.acceptUpdate(update(2, '/start ' + next)); s.confirm(s.status().candidate.id, false);
  s.acceptUpdate(update(3, '/start ' + next));
  assert.equal(s.status().owner, undefined); assert.equal(s.status().candidate, undefined);
});

test('only the paired owner private messages reach the existing queue; duplicates do not', async t => {
  const f = await fixture(t); f.pair();
  f.service.acceptUpdate(update(2, 'Intruder', 99));
  f.service.acceptUpdate(update(3, 'Group', 42, 'supergroup'));
  const bot = update(4, 'Bot'); bot.message.from.is_bot = true; f.service.acceptUpdate(bot);
  const mismatch = update(5, 'Mismatch'); mismatch.message.chat.id = 99; f.service.acceptUpdate(mismatch);
  f.service.dispatchQueued(); assert.equal(f.routed.length, 0);
  f.request(6, 'Build a page'); f.request(6, 'Duplicate'); f.request(3, 'Old');
  assert.equal(f.routed.length, 1); assert.equal(f.routed[0].text, 'Build a page');
  assert.equal(f.stored().offset, 7);
  const reboot = new TelegramService(f.deps); t.after(() => reboot.stop());
  reboot.restore(); reboot.stop(); reboot.acceptUpdate(update(6, 'Replay')); reboot.dispatchQueued();
  assert.equal(f.routed.length, 1);
  const poll = f.calls.filter(c => c.method === 'getUpdates').at(-1);
  assert.deepEqual(poll.args, { offset: 7, timeout: 25, allowed_updates: ['message'], limit: 50 });
});

test('/agents selection, unavailable rejection, and paused queue preserve desktop gates', async t => {
  const f = await fixture(t); f.pair();
  f.service.acceptUpdate(update(2, '/agents')); f.service.acceptUpdate(update(3, '/agent ellis'));
  f.service.acceptUpdate(update(4, 'Work')); f.service.dispatchQueued();
  assert.equal(f.routed.length, 0); assert.equal(f.service.history('ellis').length, 0);
  assert.ok(f.stored().history.some(r => r.text.includes('Nothing was submitted')));
  f.service.acceptUpdate(update(5, '/agent remy')); f.agents[0].state = 'paused';
  const row = f.request(6); assert.equal(row.status, 'paused'); assert.equal(f.routed.length, 0);
  f.service.dispatchQueued(); assert.equal(f.routed.length, 0);
  f.agents[0].state = 'ready'; f.service.dispatchQueued(); f.service.dispatchQueued();
  assert.equal(f.routed.length, 1); assert.equal(f.service.history('remy')[0].status, 'awaiting_reply');
  const request = remoteRequest(f.routed[0]);
  assert.equal(request.to, 'remy'); assert.equal(request.id, row.id); assert.match(request.body, /public_reply/);
  assert.ok(!request.body.includes(TOKEN));
});

test('reply needs authentic agent identity, correlation and explicit public field; never generic logs', async t => {
  const f = await fixture(t); f.pair(); const row = f.request();
  for (const wrong of [{ from: 'ellis' }, { to: 'all' }, { conversation: 'other' }, { in_reply_to: 'other' }, { public_reply: undefined, body: 'RAW TERMINAL LOG' }, { public_reply: '[CREWLO_REMOTE_REPLY] secret prompt' }]) f.reply(row, wrong);
  assert.equal(f.service.history('remy').length, 1);
  f.reply(row, { public_reply: 'Done. ' + TOKEN }); f.reply(row);
  assert.equal(f.service.history('remy').length, 2);
  await f.drain();
  const sent = f.calls.filter(c => c.method === 'sendMessage');
  assert.ok(sent.some(c => c.args.text === 'Remy · Done. [redacted]'));
  assert.ok(sent.every(c => c.args.chat_id === 42 && !c.args.parse_mode));
  assert.ok(!JSON.stringify(f.stored()).includes(TOKEN));
  assert.ok(!JSON.stringify(f.service.status()).includes(TOKEN));
  assert.ok(!JSON.stringify(sent).includes('RAW TERMINAL LOG'));
});

test('long Unicode replies split without broken surrogate pairs and prefix every part', () => {
  const text = 'a'.repeat(3915) + '😀'.repeat(5000);
  const parts = splitTelegramReply('Remy', text);
  assert.ok(parts.length > 2); assert.ok(parts.every(p => p.length <= 4000 && p.startsWith('Remy · ')));
  assert.equal(parts.map(p => p.slice('Remy · '.length)).join(''), text);
  for (const p of parts) assert.ok(!/[\uD800-\uDBFF]$/.test(p));
});

test('429 respects retry_after for the whole chat and resumes chunks', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const row = f.request(); await f.drain();
  f.reply(row, { public_reply: 'x'.repeat(10000) });
  const before = f.calls.filter(c => c.method === 'sendMessage').length;
  f.sendError(new TelegramError(429, 5)); await f.service.flush(); await f.service.flush();
  assert.equal(f.calls.filter(c => c.method === 'sendMessage').length, before + 1);
  f.clock(6000); await f.drain();
  assert.equal(f.service.history('remy').at(-1).status, 'sent');
  assert.equal(f.calls.filter(c => c.method === 'sendMessage').length, before + 4);
});

test('Telegram global rate-limit cooldown survives restart and holds later replies until expiry', async t => {
  const f = await fixture(t); f.pair(); await f.drain();
  const first = f.request(2), second = f.request(3); await f.drain();
  f.reply(first, { public_reply: 'First reply' }); f.reply(second, { public_reply: 'Second reply' });
  f.sendError(new TelegramError(429, 60)); await f.service.flush();
  f.service.stop();
  const reboot = new TelegramService(f.deps); t.after(() => reboot.stop()); reboot.restore(); reboot.stop();
  const before = f.calls.filter(c => c.method === 'sendMessage').length;
  reboot.acceptUpdate(update(4, 'Work arriving during cooldown')); reboot.dispatchQueued();
  const third = reboot.history('remy').find(row => row.id.endsWith('-4'));
  reboot.agentReply({ id: 'outbox-3', from: 'remy', to: 'human', act: 'inform', conversation: 'remote:' + third.id, in_reply_to: third.id, public_reply: 'Third reply' });
  await reboot.flush(); f.clock(60999); await reboot.flush();
  assert.equal(f.calls.filter(c => c.method === 'sendMessage').length, before, 'later rows and newly queued replies must not bypass the restored cooldown');
  assert.equal(f.stored().outboundBlockedUntil, 61000);
  f.clock(61000); for (let i = 0; i < 10; i++) await reboot.flush();
  const sent = f.calls.filter(c => c.method === 'sendMessage').slice(before);
  assert.deepEqual(sent.filter(c => c.args.text.startsWith('Remy · ')).map(c => c.args.text), ['Remy · First reply', 'Remy · Second reply', 'Remy · Third reply']);
  assert.ok(reboot.history('remy').filter(row => row.direction === 'out').every(row => row.status === 'sent'));
});

test('Telegram restores legacy retry deadlines but ignores expired or old-pairing rows', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request);
  f.sendError(new TelegramError(429, 60)); await f.service.flush(); f.service.acceptUpdate(update(3, '/agents'));
  const stored = f.stored(); delete stored.outboundBlockedUntil; f.service.stop();
  const reboot = await fixture(t, { stored, secret: TOKEN, skipConnect: true }); reboot.service.restore(); reboot.service.stop();
  await reboot.service.flush(); assert.equal(reboot.calls.filter(c => c.method === 'sendMessage').length, 0);
  assert.equal(reboot.stored().outboundBlockedUntil, 61000);
  const old = clone(stored.history.find(row => row.replyTo === request.id)); old.id = 'old-pairing'; old.pairing = 'another-owner'; old.retryAt = 999999;
  stored.history.unshift(old);
  const expired = await fixture(t, { stored, secret: TOKEN, skipConnect: true, now: 61000 }); expired.service.restore(); expired.service.stop();
  await expired.service.flush(); assert.equal(expired.calls.filter(c => c.method === 'sendMessage').length, 1);
  assert.equal(expired.calls.filter(c => c.method === 'sendMessage')[0].args.text, 'Remy · Hello back');
});

test('Telegram Disconnect cancels rate-limited work and a new owner does not inherit its cooldown', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request);
  f.sendError(new TelegramError(429, 60)); await f.service.flush();
  f.service.disconnect(); assert.equal(f.stored().outboundBlockedUntil, undefined);
  assert.equal(f.service.history('remy').find(row => row.replyTo === request.id).status, 'cancelled');
  await f.service.connect(TOKEN); f.service.stop();
  const nonce = new URL(f.service.status().pairingLink).searchParams.get('start');
  f.service.acceptUpdate(update(10, '/start ' + nonce, 99)); f.service.confirm(f.service.status().candidate.id, true);
  const before = f.calls.filter(c => c.method === 'sendMessage').length; await f.drain();
  const sent = f.calls.filter(c => c.method === 'sendMessage').slice(before);
  assert.equal(sent.length, 1); assert.equal(sent[0].args.chat_id, 99); assert.match(sent[0].args.text, /Paired with Crewlo/);
});

test('Telegram durable sender cooldown is authoritative without per-row retry metadata and expires after downtime', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const request = f.request(); await f.drain(); f.reply(request);
  const stored = f.stored(); stored.outboundBlockedUntil = 61000; f.service.stop();
  assert.ok(stored.history.every(row => row.retryAt === undefined));
  for (const now of [1000, 61000]) {
    const reboot = await fixture(t, { stored, secret: TOKEN, skipConnect: true, now }); reboot.service.restore(); reboot.service.stop();
    await reboot.service.flush();
    assert.equal(reboot.calls.filter(c => c.method === 'sendMessage').length, now === 1000 ? 0 : 1);
    assert.equal(reboot.stored().outboundBlockedUntil, now === 1000 ? 61000 : undefined);
  }
});

test('ambiguous sends are visible and never automatically replayed, including after restart', async t => {
  const f = await fixture(t); f.pair(); await f.drain(); const row = f.request(); await f.drain(); f.reply(row);
  f.sendError(new TelegramError(0, 0, true)); await f.service.flush();
  assert.equal(f.service.history('remy').at(-1).status, 'uncertain'); assert.equal(f.service.status().uncertainReplies, 1);
  const before = f.calls.length; await f.service.flush(); assert.equal(f.calls.length, before);
  const reboot = new TelegramService(f.deps); t.after(() => reboot.stop()); reboot.restore(); reboot.stop();
  const afterRestore = f.calls.length; await reboot.flush(); assert.equal(f.calls.length, afterRestore);
});

test('disconnect removes secret and pairing, cancels pending work, aborts poll and rejects late events', async t => {
  const f = await fixture(t); f.pair(); f.agents[0].state = 'paused'; f.request();
  f.service.disconnect(); f.agents[0].state = 'ready'; f.service.dispatchQueued(); f.service.acceptUpdate(update(3, 'Late')); await f.service.flush();
  assert.equal(f.secret(), undefined); assert.equal(f.service.status().owner, undefined); assert.equal(f.service.status().state, 'disconnected');
  assert.equal(f.routed.length, 0); assert.equal(f.service.history('remy')[0].status, 'cancelled');
  assert.ok(f.calls.find(c => c.method === 'getUpdates').signal.aborted);
});

test('storage failure fails closed before dispatch, and cannot acknowledge later updates', async t => {
  const f = await fixture(t); f.pair(); f.failSave();
  assert.throws(() => f.service.acceptUpdate(update(2, 'Unsaved work')), /storage/);
  f.service.acceptUpdate(update(3, 'More')); f.service.dispatchQueued(); await f.service.flush();
  assert.equal(f.routed.length, 0); assert.equal(f.stored().offset, 2); assert.equal(f.service.status().state, 'error');
});

test('a changed studio cannot receive the previously paired owner work', async t => {
  const f = await fixture(t); f.pair(); f.scope('/different'); f.request();
  assert.equal(f.routed.length, 0); assert.equal(f.service.history('remy').length, 0);
  assert.ok(f.stored().history.some(r => r.text.includes('studio changed')));
});

test('unavailable OS encryption and existing webhooks fail without storing credentials', async t => {
  for (const options of [{ noEncryption: true }, { webhook: 'https://example.invalid/webhook' }]) {
    const f = await fixture(t, { ...options, skipConnect: true });
    await assert.rejects(f.service.connect(TOKEN), /Secure|webhook/);
    assert.equal(f.secret(), undefined); assert.equal(f.calls.filter(c => c.method === 'getUpdates').length, 0);
  }
});

test('network polling failures reconnect with the durable offset; fatal token/conflict errors stop', async t => {
  let attempts = 0;
  const f = await fixture(t, { keepRunning: true, poll: (_, signal) => {
    if (++attempts === 1) throw new TelegramError(0);
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new TelegramError(0)), { once: true }));
  } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.service.status().state, 'reconnecting');
  await new Promise(resolve => setTimeout(resolve, 1100));
  assert.equal(attempts, 2); f.service.disconnect();
  for (const code of [401, 409]) {
    const fatal = await fixture(t, { keepRunning: true, poll: () => { throw new TelegramError(code); } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(fatal.service.status().state, 'error');
    assert.ok(fatal.calls.find(c => c.method === 'getUpdates').signal.aborted);
  }
});

test('interrupted routing and chunk sends restore as uncertain, not duplicate submissions', async t => {
  const f = await fixture(t); f.pair(); const row = f.request(); f.reply(row);
  const stored = f.stored(); stored.history.find(r => r.id === row.id).status = 'routing';
  stored.history.find(r => r.id === 'reply-' + row.id).status = 'sending';
  const reboot = await fixture(t, { stored, secret: TOKEN, skipConnect: true });
  reboot.service.restore(); reboot.service.stop(); reboot.service.dispatchQueued();
  assert.equal(reboot.routed.length, 0);
  assert.ok(reboot.service.history('remy').every(r => r.status === 'uncertain'));
});

test('session loss holds queued work honestly; disconnect detaches already submitted work', async t => {
  const f = await fixture(t); f.pair(); f.agents[0].state = 'paused'; f.request();
  f.agents[0].state = 'unavailable'; f.service.dispatchQueued();
  assert.equal(f.service.history('remy')[0].status, 'waiting_session'); assert.equal(f.routed.length, 0);
  assert.ok(f.stored().history.some(r => r.text.includes('Session unavailable')));
  f.agents[0].state = 'ready'; f.service.dispatchQueued(); assert.equal(f.routed.length, 1);
  f.service.disconnect(); assert.equal(f.service.history('remy')[0].status, 'detached');
});
