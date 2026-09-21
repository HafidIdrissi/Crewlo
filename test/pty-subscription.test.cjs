const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
let data, exit;
const nativeRequire = Module._load;
Module._load = function(name, ...args) {
  if (name === 'node-pty') return { spawn: () => ({ pid: 123, cols: 100, rows: 30, onData: fn => { data = fn; }, onExit: fn => { exit = fn; }, write() {}, resize() {}, kill() {} }) };
  return nativeRequire.call(this, name, ...args);
};
const { PtyManager } = require('./load-ts.cjs')('src/main/pty.ts');
Module._load = nativeRequire;
const viewer = session => ({ session, events: [], isDestroyed: () => false, send(channel, payload) { this.events.push({ channel, payload }); } });

test('late visible window receives replay and subsequent output; another floor cannot subscribe', () => {
  const pty = new PtyManager();
  const session = {};
  const hidden = viewer(session), visible = viewer(session), other = viewer({});
  assert.equal(pty.spawn({ id: 'p', command: process.execPath, cwd: process.cwd() }, hidden).ok, true);
  data('provider ready');
  const snapshot = pty.subscribe('p', visible);
  assert.equal(snapshot.data, 'provider ready');
  assert.equal(pty.subscribe('p', other).ok, false);
  data('result');
  assert.equal(visible.events.at(-1).payload.data, 'result');
  assert.ok(visible.events.at(-1).payload.sequence > snapshot.sequence);
  assert.equal(other.events.length, 0);
  exit({ exitCode: 1 });
  assert.equal(visible.events.at(-1).channel, 'pty:exit:p');
  assert.equal(pty.subscribe('p', visible).ok, false);
});

test('same-id respawn keeps observers and advances sequence; explicit unsubscribe stops output', () => {
  const pty = new PtyManager(), owner = viewer({});
  const options = { id: 'p', command: process.execPath, cwd: process.cwd() };
  pty.spawn(options, owner);
  pty.subscribe('p', owner);
  data('first');
  const sequence = owner.events.find(e => e.channel === 'pty:stream:p').payload.sequence;
  exit({ exitCode: 0 });
  pty.spawn(options, owner);
  data('second');
  const last = owner.events.filter(e => e.channel === 'pty:stream:p').at(-1);
  assert.equal(last.payload.data, 'second');
  assert.ok(last.payload.sequence > sequence);
  pty.unsubscribe('p', owner);
  data('third');
  assert.equal(owner.events.filter(e => e.channel === 'pty:stream:p').at(-1), last);
});
