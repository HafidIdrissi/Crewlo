'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const load = require('./load-ts.cjs');
const { HiveManager } = load('src/main/hive.ts');
const { TelegramService } = load('src/main/messaging/telegramService.ts');
const { WhatsAppService } = load('src/main/messaging/whatsappService.ts');

function floor(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'crewlo-reply-recovery-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const events = [];
  for (const id of ['god', 'remy', 'ellis']) for (const folder of ['inbox', 'inbox/.done', 'outbox/.sent']) fs.mkdirSync(path.join(home, 'hive/agents', id, folder), { recursive: true });
  fs.writeFileSync(path.join(home, 'hive/registry.json'), JSON.stringify({ godId: 'god', agents: Object.fromEntries(['god', 'remy', 'ellis'].map(id => [id, { id, name: id, provider: 'claude' }])) }));
  const create = () => { const hive = new HiveManager(() => home, (channel, payload) => events.push({ channel, payload })); hive.commit = () => {}; return hive; };
  return { home, events, hive: create(), create, outbox: id => path.join(home, 'hive/agents', id, 'outbox') };
}
function observe(hive, callback) {
  // Keeps the regression runnable against the old implementation: it then
  // reproduces the swallowed observer failure and missing durable handoff.
  if (hive.setRemoteReplyObserver) hive.setRemoteReplyObserver(callback);
  else hive.setRoutedObserver((msg, _targets, origin) => { if (origin === 'outbox') callback(msg); });
}
function reply(f, channel = 'telegram', overrides = {}, file = 'reply.json', sender = 'remy') {
  const prefix = channel === 'telegram' ? 'tg' : 'wa';
  const row = { id: `reply-${prefix}-fixture`, from: 'forged-sender', to: 'human', act: 'inform', conversation: `remote:${prefix}-fixture`, in_reply_to: `${prefix}-fixture`, public_reply: 'Public answer', body: 'PRIVATE_FIXTURE_BODY_DO_NOT_COPY', subject: 'PRIVATE_FIXTURE_SUBJECT', ...overrides };
  const full = path.join(f.outbox(sender), file); fs.writeFileSync(full, JSON.stringify(row)); return { row, full };
}
function pending(f, sender = 'remy') {
  const dir = path.join(f.outbox(sender), '.remote-pending');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(file => file.endsWith('.json')).map(file => path.join(dir, file)) : [];
}

test('failed public-reply handoff survives restart without duplicate inbox or renderer delivery', t => {
  const f = floor(t), { full } = reply(f);
  observe(f.hive, () => { throw Error('Local transport storage failed'); });
  assert.equal(f.hive.routeOnce(), 1);
  assert.equal(fs.existsSync(full), false);
  assert.equal(f.hive.inbox('god').length, 1);
  assert.equal(pending(f).length, 1, 'public reply must remain durable after the outbox is archived');
  const queued = fs.readFileSync(pending(f)[0], 'utf8');
  assert.ok(!queued.includes('PRIVATE_FIXTURE_BODY') && !queued.includes('PRIVATE_FIXTURE_SUBJECT'), 'journal keeps only the public reply envelope');
  const recovered = [], next = f.create(); observe(next, msg => recovered.push(msg));
  assert.equal(next.routeOnce(), 0, 'retry is not another local route');
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].from, 'remy', 'outbox directory owns the sender identity');
  assert.equal(recovered[0].public_reply, 'Public answer');
  assert.equal(next.inbox('god').length, 1);
  assert.equal(f.events.filter(event => event.channel === 'hive:message').length, 1);
  assert.equal(pending(f).length, 0);
  next.routeOnce(); assert.equal(recovered.length, 1);
});

test('journal creation failure retains a valid outbox before any local delivery', t => {
  const f = floor(t), { full } = reply(f), original = f.hive.atomicWriteJson;
  const recovered = []; observe(f.hive, msg => recovered.push(msg));
  f.hive.atomicWriteJson = function(file, data) { if (file.includes('.remote-pending')) throw Error('Disk full'); return original.call(this, file, data); };
  assert.equal(f.hive.routeOnce(), 0);
  assert.equal(fs.existsSync(full), true, 'storage failure is not malformed JSON quarantine');
  assert.equal(f.hive.inbox('god').length, 0);
  assert.equal(f.events.length, 0);
  assert.equal(recovered.length, 0);
  f.hive.atomicWriteJson = original;
  assert.equal(f.hive.routeOnce(), 1);
  assert.equal(recovered.length, 1);
});

test('archive failure retries only archival and the remote handoff across restart', t => {
  const f = floor(t), { full } = reply(f), rename = fs.renameSync;
  let failArchive = true;
  fs.renameSync = (source, dest) => { if (source === full && failArchive) throw Error('Archive temporarily unavailable'); return rename(source, dest); };
  t.after(() => { fs.renameSync = rename; });
  const recovered = []; observe(f.hive, msg => recovered.push(msg));
  f.hive.routeOnce();
  assert.equal(f.hive.inbox('god').length, 1);
  assert.equal(fs.existsSync(full), true);
  assert.equal(pending(f).length, 1);
  assert.equal(recovered.length, 0, 'keep handoff durable until source is archived');
  failArchive = false;
  const next = f.create(); observe(next, msg => recovered.push(msg));
  assert.equal(next.routeOnce(), 0);
  assert.equal(recovered.length, 1);
  assert.equal(f.events.filter(event => event.channel === 'hive:message').length, 1);
  assert.equal(pending(f).length, 0);
});

test('startup without a remote consumer preserves replies, while direct and hop-capped messages never reach it', t => {
  const f = floor(t); reply(f);
  f.hive.routeOnce(); assert.equal(pending(f).length, 1);
  const observed = []; observe(f.hive, msg => observed.push(msg));
  f.hive.routeOnce(); assert.equal(observed.length, 1);
  f.hive.send({ id: 'direct-fixture', to: 'human', conversation: 'remote:tg-fixture', in_reply_to: 'tg-fixture', public_reply: 'Not an outbox reply' }, 'remy');
  reply(f, 'telegram', { id: 'hop-capped', hops: 100 }, 'hop.json');
  f.hive.routeOnce();
  assert.equal(observed.length, 1, 'public reply transport still requires authoritative outbox and hop guard');
  assert.equal(pending(f).length, 0);
});

function transport(t, f, channel) {
  const prefix = channel === 'telegram' ? 'tg' : 'wa';
  const scope = path.join(f.home, 'hive');
  const inbound = { id: `${prefix}-fixture`, channel, pairing: 'binding', scope, agentId: 'remy', agentName: 'Remy', direction: 'in', text: 'Fixture request', createdAt: Date.now(), status: 'awaiting_reply' };
  let stored = { enabled: true, pairing: 'binding', scope, history: [inbound], offset: 1, owner: { id: channel === 'telegram' ? 42 : '33612345678', name: 'Owner' }, port: 8788, receipts: {}, deliveryReceipts: {} }, failSave = false;
  const deps = { load: () => structuredClone(stored), save: next => { if (failSave) throw Error('Database unavailable'); stored = structuredClone(next); },
    gateway: { scope: () => scope, agents: () => [], clean: text => text, enqueue: () => { throw Error('Replies must never enqueue work'); } },
    secret: { get: () => undefined, set: () => true, delete: () => {} }, api: () => { throw Error('No network in recovery tests'); }, listen: () => { throw Error('No listener in recovery tests'); } };
  const Type = channel === 'telegram' ? TelegramService : WhatsAppService;
  const create = () => { const service = new Type(deps); t.after(() => service.stop()); return service; };
  return { service: create(), create, failSave: value => { failSave = value; }, stored: () => structuredClone(stored) };
}

for (const channel of ['telegram', 'whatsapp']) {
  test(`${channel}: failed save and further unhealthy retries keep the journal until fresh service recovery`, t => {
    const f = floor(t), remote = transport(t, f, channel); reply(f, channel);
    observe(f.hive, msg => remote.service.agentReply(msg));
    remote.failSave(true); f.hive.routeOnce();
    assert.equal(pending(f).length, 1);
    assert.equal(remote.stored().history.length, 1, 'failed response transaction did not persist');
    f.hive.routeOnce();
    assert.equal(pending(f).length, 1, 'unhealthy in-memory replied state is not an acknowledgement');
    remote.failSave(false);
    const freshService = remote.create(), next = f.create(); observe(next, msg => freshService.agentReply(msg));
    next.routeOnce();
    assert.equal(pending(f).length, 0);
    assert.equal(remote.stored().history.filter(row => row.direction === 'out').length, 1);
    assert.equal(remote.stored().history.at(-1).text, 'Public answer');
    assert.equal(f.events.filter(event => event.channel === 'hive:message').length, 1);
    reply(f, channel, {}, 'duplicate.json'); next.routeOnce();
    assert.equal(remote.stored().history.filter(row => row.direction === 'out').length, 1, 'duplicate public answers are idempotent by original request');
  });

  test(`${channel}: wrong owner-directory correlation is rejected and pending replies are discarded after Disconnect`, async t => {
    const f = floor(t), remote = transport(t, f, channel);
    observe(f.hive, msg => remote.service.agentReply(msg));
    reply(f, channel, { from: 'remy' }, 'spoof.json', 'ellis'); f.hive.routeOnce();
    assert.equal(remote.stored().history.length, 1);
    assert.equal(pending(f, 'ellis').length, 0);
    observe(f.hive, () => { throw Error('Storage not ready'); });
    reply(f, channel); f.hive.routeOnce(); assert.equal(pending(f).length, 1);
    await remote.service.disconnect();
    observe(f.hive, msg => remote.service.agentReply(msg)); f.hive.routeOnce();
    assert.equal(pending(f).length, 0);
    assert.equal(remote.stored().history.filter(row => row.direction === 'out').length, 0);
  });

  test(`${channel}: failed journal acknowledgement does not duplicate replies or replay an uncertain send`, t => {
    const f = floor(t), remote = transport(t, f, channel), unlink = fs.unlinkSync;
    let failUnlink = true;
    fs.unlinkSync = file => { if (file.includes('.remote-pending') && failUnlink) throw Error('Journal ack unavailable'); return unlink(file); };
    t.after(() => { fs.unlinkSync = unlink; });
    observe(f.hive, msg => remote.service.agentReply(msg)); reply(f, channel); f.hive.routeOnce();
    assert.equal(pending(f).length, 1);
    assert.equal(remote.stored().history.filter(row => row.direction === 'out').length, 1);
    // Simulate a previously submitted send whose network outcome is unknown.
    // The recovery handoff must not reset it to queued or create a second row.
    remote.service.data.history.find(row => row.direction === 'out').status = 'uncertain';
    remote.service.save();
    failUnlink = false;
    const next = f.create(), fresh = remote.create(); observe(next, msg => fresh.agentReply(msg)); next.routeOnce();
    assert.equal(pending(f).length, 0);
    const outbound = remote.stored().history.filter(row => row.direction === 'out');
    assert.equal(outbound.length, 1);
    assert.equal(outbound[0].status, 'uncertain');
    assert.equal(f.events.filter(event => event.channel === 'hive:message').length, 1);
  });
}
