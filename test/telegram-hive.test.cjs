'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const load = require('./load-ts.cjs');
const { HiveManager } = load('src/main/hive.ts');
const { remoteRequest } = load('src/main/messaging/gateway.ts');

test('remote requests use normal hive inbox, and only authoritative outbox messages qualify as replies', async t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'crewlo-telegram-hive-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const hive = new HiveManager(() => home);
  await hive.ensureAgent({ id: 'remy', name: 'Remy', provider: 'claude', cwd: home, isGod: true });
  await hive.ensureAgent({ id: 'ellis', name: 'Ellis', provider: 'claude', cwd: home });
  const observed = [];
  hive.setRoutedObserver((msg, targets, origin) => observed.push({ msg, targets, origin }));
  const row = { id: 'tg-test-1', agentId: 'remy', text: 'Say hello' };
  hive.send(remoteRequest(row), 'human');
  const inbox = hive.inbox('remy');
  assert.equal(inbox.length, 1); assert.equal(inbox[0].from, 'human');
  assert.equal(inbox[0].conversation, 'remote:tg-test-1');
  assert.match(inbox[0].body, /Say hello/); assert.match(inbox[0].body, /public_reply/);
  assert.equal(observed[0].origin, 'direct');
  fs.writeFileSync(path.join(home, 'hive/agents/ellis/outbox/reply.json'), JSON.stringify({
    from: 'remy', to: 'human', act: 'inform', conversation: 'remote:tg-test-1', in_reply_to: row.id,
    body: 'Internal logs must not be used', public_reply: 'Hello from Ellis'
  }));
  assert.equal(hive.routeOnce(), 1);
  const reply = observed.at(-1);
  assert.equal(reply.origin, 'outbox'); assert.equal(reply.msg.from, 'ellis', 'directory identity overrides a spoofed from');
  assert.equal(reply.msg.public_reply, 'Hello from Ellis');
  assert.equal(reply.msg.in_reply_to, row.id);
  assert.equal(hive.routeOnce(), 0, 'archived outbox file does not route twice');
});
