// Read-only packaged-runtime check: no Crewlo startup, accounts or user database.
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { resolve, join } = require('node:path');
const assert = require('node:assert/strict');
const { listPackage } = require('@electron/asar');

const directory = resolve(process.argv[2] || 'dist/windows-preview/win-unpacked');
const archive = join(directory, 'resources', 'app.asar');
const entries = listPackage(archive).map(entry => entry.replaceAll('\\', '/'));
for (const required of ['/out/main/index.js', '/out/preload/index.js', '/out/renderer/index.html']) {
  assert.ok(entries.includes(required), `Missing packaged application file: ${required}`);
}
assert.ok(!entries.some(entry => /^\/out\/(?!main(?:\/|$)|preload(?:\/|$)|renderer(?:\/|$))/.test(entry)), 'Development captures must not be packaged');
for (const helper of ['kg.cjs', 'kg-core.cjs', 'md-slack-reply.cjs']) assert.ok(existsSync(join(directory, 'resources', helper)));
const source = `
  const req = require('node:module').createRequire(${JSON.stringify(join(archive, 'package.json'))});
  const Database = req('better-sqlite3');
  const db = new Database(':memory:');
  if (db.prepare('SELECT 1 AS ok').get().ok !== 1) process.exit(2);
  db.close();
  const pty = req('node-pty');
  const terminal = pty.spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'echo CREWLO_PTY_OK'], {
    name: 'xterm', cols: 80, rows: 24, cwd: ${JSON.stringify(directory)}, env: process.env
  });
  let output = '';
  const timer = setTimeout(() => { terminal.kill(); process.exit(3); }, 8000);
  terminal.onData(data => { output += data; });
  terminal.onExit(event => {
    clearTimeout(timer);
    if (event.exitCode !== 0 || !output.includes('CREWLO_PTY_OK')) process.exit(4);
    console.log('PACKAGED_RUNTIME_OK: SQLite and Windows terminal passed under Electron ' + process.versions.electron);
    process.exit(0);
  });
`;
const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
delete env.NODE_OPTIONS;
delete env.NODE_PATH;
const result = spawnSync(join(directory, 'Crewlo.exe'), ['-e', source], {
  cwd: directory, env, windowsHide: true, encoding: 'utf8', timeout: 15000,
});
assert.equal(result.status, 0, `Packaged runtime probe failed: ${result.error?.message || result.stderr}`);
assert.match(result.stdout, /PACKAGED_RUNTIME_OK/);
console.log(result.stdout.trim());
console.log('Packaged app files and resource helpers verified; no studio or agent was launched.');
