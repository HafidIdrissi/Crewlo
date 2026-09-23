const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { supportedNode, runDoctor, inspectWindows, inspectDependencies, inspectNativeRuntime, formatReport } = require('../tools/crewlo-doctor.cjs');

function fixture() {
  const root = path.resolve('doctor-test-fixture');
  const programFiles = path.join(root, 'ProgramFiles');
  const visualStudio = path.join(root, 'VS');
  const version = '14.39.33519', sdkVersion = '10.0.22621.0';
  const msvc = path.join(visualStudio, 'VC', 'Tools', 'MSVC', version);
  const kits = path.join(programFiles, 'Windows Kits', '10');
  const modules = path.join(root, 'node_modules');
  const electron = path.join(modules, 'electron', 'dist', 'electron.exe');
  const files = new Map([
    [path.join(root, 'package.json'), JSON.stringify({ dependencies: { 'node-pty': '*', 'better-sqlite3': '*' }, devDependencies: { electron: '*' } })],
    [path.join(visualStudio, 'VC', 'Auxiliary', 'Build', 'Microsoft.VCToolsVersion.default.txt'), version + '\r\n'],
    [path.join(modules, 'electron', 'path.txt'), 'electron.exe'],
  ]);
  const present = new Set([
    ...files.keys(), modules, electron,
    path.join(programFiles, 'Microsoft Visual Studio', 'Installer', 'vswhere.exe'),
    path.join(msvc, 'bin', 'Hostx64', 'x64', 'cl.exe'), path.join(msvc, 'include', 'vector'),
    path.join(msvc, 'lib', 'spectre', 'x64', 'libcmt.lib'),
    path.join(kits, 'Include', sdkVersion, 'um', 'Windows.h'),
    path.join(kits, 'Include', sdkVersion, 'ucrt', 'stdlib.h'),
    path.join(kits, 'Lib', sdkVersion, 'um', 'x64', 'kernel32.lib'),
    path.join(kits, 'Lib', sdkVersion, 'ucrt', 'x64', 'ucrt.lib'),
    path.join(kits, 'bin', sdkVersion, 'x64', 'rc.exe'),
    ...['node-pty', 'better-sqlite3', 'electron'].map(name => path.join(modules, name, 'package.json'))
  ]);
  const calls = [];
  const probes = {
    root, platform: 'win32', architecture: 'x64', nodeVersion: 'v22.22.0',
    env: { 'ProgramFiles(x86)': programFiles, NODE_OPTIONS: '--require SHOULD_NOT_RUN', NODE_PATH: 'SHOULD_NOT_LOAD' },
    exists: file => present.has(file),
    read: file => { if (!files.has(file)) throw Error('not present'); return files.get(file); },
    directories: directory => directory === path.join(kits, 'Include') ? [sdkVersion] : directory === path.join(visualStudio, 'VC', 'Tools', 'MSVC') ? [version] : [],
    run: (command, args, options) => {
      calls.push({ command, args, options });
      if (command.endsWith('vswhere.exe')) return { status: 0, stdout: visualStudio + '\r\n' };
      if (command === 'reg.exe') return { status: 0, stdout: 'KitsRoot10    REG_SZ    ' + kits };
      if (command === 'cmd.exe' || command === 'npm') return { status: 0, stdout: '10.8.2\n' };
      if (command === 'git') return { status: 0, stdout: 'git version 2.42.0.windows.2\n' };
      if (command === electron) return { status: 0, stdout: 'CREWLO_NATIVE_PROBE:{"electron":true,"pty":true,"sqlite":true}' };
      throw Error('Unexpected command');
    }
  };
  return { probes, calls, files, present, root, modules, electron, kits, msvc, visualStudio, sdkVersion };
}
const check = (report, id) => report.checks.find(item => item.id === id);

test('supported stable Node version is at least 22.22, not a prerelease', () => {
  for (const version of ['20.19.4', 'v22.21.9', 'v22.22.0-rc.1', '', 'unknown']) assert.equal(supportedNode(version), false, version);
  for (const version of ['22.22.0', 'v22.22.1', '22.23.0', '24.0.0']) assert.equal(supportedNode(version), true, version);
});
test('ready Windows fixture checks prerequisites and the actual Electron ABI boundary', () => {
  const f = fixture(), report = runDoctor(f.probes);
  assert.equal(report.status, 'ready'); assert.equal(report.exitCode, 0);
  assert.equal(report.checks.length, 10);
  assert.ok(report.checks.every(item => item.status === 'pass'));
  const native = f.calls.find(call => call.command === f.electron);
  assert.equal(native.options.env.ELECTRON_RUN_AS_NODE, '1');
  assert.equal(native.options.env.NODE_OPTIONS, undefined); assert.equal(native.options.env.NODE_PATH, undefined);
  assert.match(native.args[1], /new Database\(':memory:'\)/);
  assert.doesNotMatch(native.args[1], /\.spawn\s*\(/);
  assert.ok(f.calls.every(call => !call.args.some(arg => /^(?:ci|install|rebuild|postinstall)$/.test(arg))));
});
test('old Node does not prevent read-only checks, but returns an actionable failure', () => {
  const f = fixture(); f.probes.nodeVersion = 'v20.19.4';
  const report = runDoctor(f.probes);
  assert.equal(report.exitCode, 1); assert.equal(check(report, 'node').status, 'fail');
  assert.match(check(report, 'node').action, /22\.22/);
  assert.equal(check(report, 'native_pty').status, 'pass');
});
test('Spectre must match selected MSVC toolset and target architecture', () => {
  const f = fixture(); f.present.delete(path.join(f.msvc, 'lib', 'spectre', 'x64', 'libcmt.lib'));
  f.present.add(path.join(f.msvc, 'lib', 'spectre', 'arm64', 'libcmt.lib'));
  const windows = inspectWindows(f.probes);
  assert.equal(windows.msvc, true); assert.equal(windows.spectre, false);
  const report = runDoctor(f.probes);
  assert.equal(check(report, 'windows_spectre').status, 'fail');
  assert.match(check(report, 'windows_spectre').action, /MSB8040/);
});
test('a partial Windows SDK does not pass solely because its directory exists', () => {
  const f = fixture(); f.present.delete(path.join(f.kits, 'Lib', f.sdkVersion, 'ucrt', 'x64', 'ucrt.lib'));
  assert.equal(inspectWindows(f.probes).sdk, false);
});
test('a custom registered SDK location and selected tool version are read-only probes', () => {
  const f = fixture();
  const original = f.probes.run;
  f.probes.run = (command, args, options) => command === 'reg.exe' ? { status: 0, stdout: 'KitsRoot10 REG_SZ ' + f.kits } : original(command, args, options);
  assert.equal(inspectWindows(f.probes).sdk, true);
  f.files.delete(path.join(f.visualStudio, 'VC', 'Auxiliary', 'Build', 'Microsoft.VCToolsVersion.default.txt'));
  assert.equal(inspectWindows(f.probes).msvc, true, 'falls back to available version directories');
});
test('fresh checkout gives installation guidance without invoking Electron or an installer', () => {
  const f = fixture();
  f.present.clear(); f.present.add(path.join(f.root, 'package.json'));
  f.probes.platform = 'linux';
  const report = runDoctor(f.probes);
  assert.equal(check(report, 'dependencies').status, 'warn');
  assert.equal(check(report, 'electron_runtime').status, 'skip');
  assert.equal(check(report, 'native_toolchain').status, 'warn');
  assert.equal(report.status, 'needs_review'); assert.equal(report.exitCode, 0);
  assert.ok(f.calls.every(call => ['npm', 'git'].includes(call.command)));
});
test('partial dependencies and invalid manifests are reported, not repaired', () => {
  const f = fixture(); f.present.delete(path.join(f.modules, 'node-pty', 'package.json'));
  assert.equal(check(runDoctor(f.probes), 'dependencies').status, 'fail');
  f.files.set(path.join(f.root, 'package.json'), '{broken');
  assert.equal(inspectDependencies(f.probes).validManifest, false);
});
test('Electron executable cannot be redirected outside the installed distribution', () => {
  const f = fixture();
  f.files.set(path.join(f.modules, 'electron', 'path.txt'), '../../../elsewhere.exe');
  f.present.add(path.resolve(f.modules, 'electron', 'dist', '../../../elsewhere.exe'));
  assert.equal(inspectDependencies(f.probes).electron, undefined);
  f.files.set(path.join(f.modules, 'electron', 'path.txt'), f.electron);
  assert.equal(inspectDependencies(f.probes).electron, undefined);
});
test('native load failures and timeouts are sanitized without leaking raw process output', () => {
  const f = fixture(), original = f.probes.run;
  const secret = 'DUMMY_SENSITIVE_OUTPUT_NOT_FOR_REPORTS';
  f.probes.run = (command, args, options) => command === f.electron ? { status: null, failed: true, stdout: secret } : original(command, args, options);
  let report = runDoctor(f.probes);
  assert.equal(check(report, 'electron_runtime').status, 'fail');
  assert.ok(!JSON.stringify(report).includes(secret));
  assert.ok(!formatReport(report).includes(secret));
  f.probes.run = () => ({ status: 0, stdout: 'CREWLO_NATIVE_PROBE:{"electron":true,"pty":false,"sqlite":true}' });
  assert.deepEqual(inspectNativeRuntime(f.probes, f.electron), { started: true, pty: false, sqlite: true });
});
test('a success marker followed by a crash or nonzero exit never passes the runtime probe', () => {
  const f = fixture();
  for (const status of [1, 2, null]) {
    f.probes.run = () => ({ status, stdout: 'CREWLO_NATIVE_PROBE:{"electron":true,"pty":true,"sqlite":true}' });
    assert.deepEqual(inspectNativeRuntime(f.probes, f.electron), { started: false, pty: false, sqlite: false });
  }
});
test('version command errors and extra output never become user-facing terminal logs', () => {
  const f = fixture(), original = f.probes.run;
  f.probes.run = (command, args, options) => {
    if (command === 'git') return { status: 0, stdout: 'git version 2.42.0\nPRIVATE_LOG' };
    if (command === 'cmd.exe') throw Error('PRIVATE_EXCEPTION');
    return original(command, args, options);
  };
  const report = runDoctor(f.probes), text = formatReport(report);
  assert.equal(check(report, 'git').status, 'pass');
  assert.equal(check(report, 'npm').status, 'fail');
  assert.ok(!text.includes('PRIVATE_'));
  assert.match(text, /No changes made/);
});
