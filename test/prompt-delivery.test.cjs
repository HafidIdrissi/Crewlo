const test = require('node:test');
const assert = require('node:assert/strict');
const { PromptDelivery } = require('./load-ts.cjs')('src/main/promptDelivery.ts');
const { acknowledgesMission } = require('./load-ts.cjs')('src/shared/missionExecution.ts');
const { withoutResumedSeed } = require('./load-ts.cjs')('src/shared/promptSubmission.ts');

test('resuming Codex cannot implicitly submit the identity prompt or drop permission flags', () => {
  assert.deepEqual(withoutResumedSeed(['resume', 'session-id', '-a', 'never', '-s', 'workspace-write', 'identity'], 'identity'), ['resume', 'session-id', '-a', 'never', '-s', 'workspace-write']);
  assert.deepEqual(withoutResumedSeed(['resume', 'session-id'], undefined), ['resume', 'session-id']);
});

test('queued or unrelated provider activity cannot mark a mission running', () => {
  const mission = { id: 'mission-123', state: 'queued' };
  assert.equal(acknowledgesMission(mission, 'UserPromptSubmit', 'mission-123', true), false);
  mission.state = 'delivered';
  assert.equal(acknowledgesMission(mission, 'UserPromptSubmit', 'other task', true), false);
  assert.equal(acknowledgesMission(mission, 'PreToolUse', undefined, true), false);
  assert.equal(acknowledgesMission(mission, 'UserPromptSubmit', 'Read mission-123', true), true);
  assert.equal(acknowledgesMission(mission, 'PreToolUse', undefined, false), true);
});

test('Codex prompt is bracketed, settled, and Enter is separate; duplicate callers write once', async () => {
  const events = [];
  const delivery = new PromptDelivery((id, text) => { events.push(text); return { ok: true }; }, () => undefined, async ms => events.push(ms));
  const first = delivery.submit('p', 'mission-1', 'hello', 'codex');
  const second = delivery.submit('p', 'mission-1', 'hello', 'codex');
  assert.equal(first, second);
  assert.equal((await first).state, 'delivered');
  assert.deepEqual(events, ['\x1b[200~hello\x1b[201~', 600, '\r']);
});

test('failed Enter is retained and never automatically types a duplicate draft', async () => {
  const events = [];
  const delivery = new PromptDelivery((id, text) => { events.push(text); return { ok: text !== '\r', error: 'disconnected' }; }, () => undefined, async () => {});
  const result = await delivery.submit('p', 'm', 'hello', 'codex');
  assert.equal(result.state, 'failed');
  assert.match(result.error, /Inspect the terminal/);
  await delivery.submit('p', 'm', 'hello', 'codex');
  assert.equal(events.length, 2);
});

test('pause or disconnect between paste and Enter prevents submission', async () => {
  let paused = false;
  const events = [];
  const delivery = new PromptDelivery((id, text) => { events.push(text); return { ok: true }; }, () => paused ? 'paused' : undefined, async () => { paused = true; });
  assert.equal((await delivery.submit('p', 'm', 'hello', 'claude')).state, 'failed');
  assert.deepEqual(events, ['hello']);
});

test('concurrent submissions cannot interleave paste and Enter', async () => {
  const events = [];
  const delivery = new PromptDelivery((id, text) => { events.push(text); return { ok: true }; }, () => undefined, async () => {});
  await Promise.all([delivery.submit('p', 'a', 'one', 'claude'), delivery.submit('p', 'b', 'two', 'claude')]);
  assert.deepEqual(events, ['one', '\r', 'two', '\r']);
});

test('a replacement process never receives the previous process Enter', async () => {
  let pid = 10;
  const writes = [];
  const delivery = new PromptDelivery((id, text) => { writes.push(text); return { ok: true }; }, () => undefined, async () => { pid = 11; }, () => pid);
  const result = await delivery.submit('p', 'm', 'one', 'codex');
  assert.equal(result.state, 'failed');
  assert.match(result.error, /process changed/);
  assert.equal(writes.length, 1);
});
