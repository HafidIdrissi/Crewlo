// Exercise the packaged Electron runtime without opening personal data or agents.
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { resolve, join } = require('node:path');
const assert = require('node:assert/strict');
const { listPackage } = require('@electron/asar');

assert.equal(process.platform, 'darwin', 'Run this check on macOS');
const app = resolve(process.argv[2]);
const architecture = process.argv[3];
assert.ok(['arm64', 'x64'].includes(architecture));
const resources = join(app, 'Contents', 'Resources');
const archive = join(resources, 'app.asar');
const entries = listPackage(archive);
for (const file of ['/out/main/index.js', '/out/preload/index.js', '/out/renderer/index.html']) {
  assert.ok(entries.includes(file), `Missing packaged file ${file}`);
}
for (const file of ['kg.cjs', 'kg-core.cjs', 'md-slack-reply.cjs']) assert.ok(existsSync(join(resources, file)));
const probe = `
  const assert = require('node:assert/strict');
  assert.equal(process.arch, ${JSON.stringify(architecture)});
  const req = require('node:module').createRequire(${JSON.stringify(join(archive, 'package.json'))});
  const Database = req('better-sqlite3');
  const db = new Database(':memory:');
  assert.equal(db.prepare('SELECT 1 AS ok').get().ok, 1);
  db.close();
  const terminal = req('node-pty').spawn('/bin/sh', ['-c', 'printf CREWLO_MAC_PTY_OK'], {
    name: 'xterm', cols: 80, rows: 24, cwd: '/tmp', env: process.env
  });
  let output = '';
  const timeout = setTimeout(() => { terminal.kill(); process.exit(3); }, 8000);
  terminal.onData(data => { output += data; });
  terminal.onExit(event => {
    clearTimeout(timeout);
    assert.equal(event.exitCode, 0);
    assert.ok(output.includes('CREWLO_MAC_PTY_OK'));
    console.log('PACKAGED_MAC_OK: ' + process.arch + '; SQLite and PTY under Electron ' + process.versions.electron);
    process.exit(0);
  });
`;
const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
delete env.NODE_OPTIONS;
delete env.NODE_PATH;
const result = spawnSync(join(app, 'Contents', 'MacOS', 'Crewlo'), ['-e', probe], {
  env, encoding: 'utf8', timeout: 15000,
});
assert.equal(result.status, 0, result.error?.message || result.stderr);
assert.match(result.stdout, /PACKAGED_MAC_OK/);
console.log(result.stdout.trim());
