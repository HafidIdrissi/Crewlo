const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { shareCodexWindowsSandbox } = require('./load-ts.cjs')('src/main/codexSandbox.ts');

test('Windows agents reuse provisioning and credential changes across homes', { skip: process.platform !== 'win32' }, t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'crewlo-sandbox-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const user = path.join(base, 'user');
  const first = path.join(base, 'first');
  const second = path.join(base, 'second');
  fs.mkdirSync(path.join(first, '.sandbox'), { recursive: true });
  fs.writeFileSync(path.join(first, '.sandbox', 'old-marker'), 'preserve');
  fs.writeFileSync(path.join(first, 'config.toml'), 'agent config');
  shareCodexWindowsSandbox(first, user);
  shareCodexWindowsSandbox(second, user);
  shareCodexWindowsSandbox(first, user);
  for (const name of ['.sandbox', '.sandbox-secrets', '.sandbox-bin']) {
    assert.equal(fs.realpathSync(path.join(first, name)), fs.realpathSync(path.join(user, name)));
    fs.writeFileSync(path.join(first, name, 'test-state'), 'new');
    assert.equal(fs.readFileSync(path.join(second, name, 'test-state'), 'utf8'), 'new');
  }
  const backups = fs.readdirSync(first).filter(n => n.startsWith('.sandbox.crewlo-backup-'));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(first, backups[0], 'old-marker'), 'utf8'), 'preserve');
  assert.equal(fs.readFileSync(path.join(first, 'config.toml'), 'utf8'), 'agent config');
});
