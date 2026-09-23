#!/usr/bin/env node
'use strict';

// Read-only source-install diagnostics. Never installs, rebuilds, writes a
// configuration, opens a studio, launches an agent, or prints command output.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const MIN_NODE = [22, 22, 0];
const NATIVE_MARKER = 'CREWLO_NATIVE_PROBE:';

function versionParts(value) {
  const match = typeof value === 'string' && /^v?(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?$/.exec(value.trim());
  return match ? match.slice(1, 4).map(Number) : null;
}
function supportedNode(value) {
  const version = versionParts(value);
  if (!version || /-/.test(value)) return false;
  for (let i = 0; i < 3; i++) { if (version[i] !== MIN_NODE[i]) return version[i] > MIN_NODE[i]; }
  return true;
}
function createProbes(overrides = {}) {
  const root = path.resolve(overrides.root || path.join(__dirname, '..'));
  return {
    root, platform: process.platform, architecture: process.arch, nodeVersion: process.version,
    env: process.env, exists: fs.existsSync,
    directories: directory => { try { return fs.readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name); } catch { return []; } },
    read: file => fs.readFileSync(file, 'utf8'),
    run: (command, args, options = {}) => {
      // npm.cmd needs cmd.exe on Windows. Only constant, internal commands are
      // sent through that shell; no user-provided strings enter a command line.
      const result = spawnSync(command, args, {
        cwd: root, encoding: 'utf8', timeout: 8000, maxBuffer: 1024 * 1024,
        windowsHide: true, ...options
      });
      return { status: result.status, stdout: result.stdout || '', failed: !!result.error };
    },
    ...overrides
  };
}
function safeRead(probes, file) { try { return probes.read(file); } catch { return ''; } }
function safeRun(probes, command, args, options) { try { return probes.run(command, args, options); } catch { return { status: null, stdout: '', failed: true }; } }
function orderedVersions(probes, directory) {
  return probes.directories(directory).filter(value => /^\d+(?:\.\d+)+$/.test(value)).sort((a, b) => b.localeCompare(a, 'en', { numeric: true }));
}
function inspectWindows(probes) {
  const env = probes.env || {};
  const programFiles = env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const vswhere = path.join(programFiles, 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');
  let installation = '';
  if (probes.exists(vswhere)) {
    const result = safeRun(probes, vswhere, ['-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-property', 'installationPath']);
    if (result.status === 0) installation = String(result.stdout).trim().split(/\r?\n/)[0];
  }
  // VSINSTALLDIR is only a path fallback, never a command and never reported.
  if (!installation && typeof env.VSINSTALLDIR === 'string' && probes.exists(env.VSINSTALLDIR)) installation = env.VSINSTALLDIR;
  const target = probes.architecture === 'ia32' ? 'x86' : probes.architecture;
  const archSupported = ['x64', 'x86', 'arm64'].includes(target);
  let msvc = false, spectre = false;
  if (installation && archSupported) {
    const tools = path.join(installation, 'VC', 'Tools', 'MSVC');
    const preferred = safeRead(probes, path.join(installation, 'VC', 'Auxiliary', 'Build', 'Microsoft.VCToolsVersion.default.txt')).trim();
    const version = /^\d+(?:\.\d+)+$/.test(preferred) ? preferred : orderedVersions(probes, tools)[0];
    if (version) {
      const selected = path.join(tools, version);
      msvc = ['Hostx64', 'Hostarm64', 'Hostx86'].some(host => probes.exists(path.join(selected, 'bin', host, target, 'cl.exe'))) && probes.exists(path.join(selected, 'include', 'vector'));
      // This matches the standard MSVC Spectre library used by node-gyp builds.
      spectre = probes.exists(path.join(selected, 'lib', 'spectre', target, 'libcmt.lib'));
    }
  }
  let kitRoot = path.join(programFiles, 'Windows Kits', '10');
  const registry = safeRun(probes, 'reg.exe', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Windows Kits\\Installed Roots', '/v', 'KitsRoot10']);
  const registered = registry.status === 0 && /KitsRoot10\s+REG_SZ\s+([^\r\n]+)/.exec(String(registry.stdout));
  if (registered) kitRoot = registered[1].trim();
  const sdk = archSupported && orderedVersions(probes, path.join(kitRoot, 'Include')).some(version =>
    probes.exists(path.join(kitRoot, 'Include', version, 'um', 'Windows.h')) &&
    probes.exists(path.join(kitRoot, 'Include', version, 'ucrt', 'stdlib.h')) &&
    probes.exists(path.join(kitRoot, 'Lib', version, 'um', target, 'kernel32.lib')) &&
    probes.exists(path.join(kitRoot, 'Lib', version, 'ucrt', target, 'ucrt.lib')) &&
    ['x64', 'arm64', 'x86'].some(host => probes.exists(path.join(kitRoot, 'bin', version, host, 'rc.exe')))
  );
  return { visualStudio: !!installation, msvc, spectre, sdk, archSupported };
}
function inspectDependencies(probes) {
  let manifest;
  try { manifest = JSON.parse(probes.read(path.join(probes.root, 'package.json'))); } catch { return { validManifest: false }; }
  if (!manifest?.dependencies?.['node-pty'] || !manifest?.dependencies?.['better-sqlite3'] || !manifest?.devDependencies?.electron) return { validManifest: false };
  const modules = path.join(probes.root, 'node_modules');
  const missing = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).filter(name => !probes.exists(path.join(modules, name, 'package.json')));
  const dist = path.join(modules, 'electron', 'dist');
  const electronRelative = safeRead(probes, path.join(modules, 'electron', 'path.txt')).trim();
  let electron;
  if (electronRelative && !path.isAbsolute(electronRelative)) {
    const candidate = path.resolve(dist, electronRelative);
    const relative = path.relative(path.resolve(dist), candidate);
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative) && probes.exists(candidate)) electron = candidate;
  }
  return { validManifest: true, modulesExist: probes.exists(modules), missing, electron };
}
function inspectNativeRuntime(probes, electron) {
  const source = `
    const result = { electron: !!process.versions.electron, pty: false, sqlite: false };
    const resolve = name => require.resolve(name, { paths: [${JSON.stringify(probes.root)}] });
    try { result.pty = typeof require(resolve('node-pty')).spawn === 'function'; } catch {}
    try { const Database = require(resolve('better-sqlite3')); const db = new Database(':memory:'); result.sqlite = db.prepare('SELECT 1 AS ok').get().ok === 1; db.close(); } catch {}
    process.stdout.write(${JSON.stringify(NATIVE_MARKER)} + JSON.stringify(result));
    // A completed diagnostic exits zero even when a module check is false.
    // Nonzero exit means the probe itself failed and must never be a PASS.
    process.exitCode = 0;
  `;
  // Remove Node preload hooks; diagnose the installed runtime, not injected JS.
  const env = { ...probes.env, ELECTRON_RUN_AS_NODE: '1' };
  delete env.NODE_OPTIONS; delete env.NODE_PATH;
  const result = safeRun(probes, electron, ['-e', source], { env, timeout: 15000 });
  const match = String(result.stdout).match(/CREWLO_NATIVE_PROBE:(\{[^\r\n]*\})/);
  if (!match) return { started: false, pty: false, sqlite: false };
  try {
    const parsed = JSON.parse(match[1]);
    const completed = parsed.electron === true && !result.failed && result.status === 0;
    return { started: completed, pty: completed && parsed.pty === true, sqlite: completed && parsed.sqlite === true };
  } catch { return { started: false, pty: false, sqlite: false }; }
}
function runDoctor(probes = createProbes()) {
  const checks = [];
  const add = (id, label, status, summary, action) => checks.push({ id, label, status, summary, ...(action ? { action } : {}) });
  const node = versionParts(probes.nodeVersion);
  add('node', 'Node.js', supportedNode(probes.nodeVersion) ? 'pass' : 'fail', node ? `Version ${node.join('.')}; minimum 22.22.0.` : 'Could not read a stable Node.js version.', supportedNode(probes.nodeVersion) ? undefined : 'Install Node.js 22.22 or newer, then reopen your terminal. This doctor does not install it.');
  for (const [id, label] of [['npm', 'npm'], ['git', 'Git']]) {
    const result = probes.platform === 'win32' && id === 'npm'
      ? safeRun(probes, 'cmd.exe', ['/d', '/s', '/c', 'npm --version'])
      : safeRun(probes, id, ['--version']);
    const version = result.status === 0 && new RegExp(id === 'git' ? '^git version (\\d+\\.\\d+\\.\\d+)' : '^(\\d+\\.\\d+\\.\\d+)').exec(String(result.stdout).trim());
    add(id, label, version ? 'pass' : 'fail', version ? `Version ${version[1]} found on PATH.` : `${label} was not available within the diagnostic timeout.`, version ? undefined : id === 'npm' ? 'Use the npm supplied with a supported Node.js installation; reopen the terminal.' : 'Install Git and make it available on PATH; reopen the terminal.');
  }
  if (probes.platform === 'win32') {
    const win = inspectWindows(probes);
    add('windows_msvc', 'Windows C++ compiler', win.msvc ? 'pass' : 'fail', win.msvc ? 'MSVC compiler and C++ headers found for the current architecture.' : 'MSVC compiler/headers were not detected for the current architecture.', win.msvc ? undefined : 'In Visual Studio Installer, add Desktop development with C++ and the matching MSVC toolset. Custom install locations may need manual verification.');
    add('windows_spectre', 'MSVC Spectre libraries', win.spectre ? 'pass' : 'fail', win.spectre ? 'Spectre-mitigated libcmt.lib found for the selected MSVC toolset and architecture.' : 'Matching Spectre-mitigated libraries were not detected.', win.spectre ? undefined : 'In Visual Studio Installer > Individual components, add the Spectre-mitigated libraries matching your MSVC toolset and architecture (MSB8040).');
    add('windows_sdk', 'Windows SDK', win.sdk ? 'pass' : 'fail', win.sdk ? 'Windows SDK headers, target libraries and resource compiler found.' : 'A complete Windows SDK was not detected in registered/standard locations.', win.sdk ? undefined : 'Add a Windows 10/11 SDK in Visual Studio Installer, including headers, libraries and tools.');
  } else {
    add('native_toolchain', 'C/C++ build prerequisites', 'warn', 'Automatic compiler/SDK detection currently covers Windows only.', 'macOS: check Xcode Command Line Tools. Linux: check your C/C++ compiler, make and Python/node-gyp prerequisites before npm ci.');
  }
  const deps = inspectDependencies(probes);
  if (!deps.validManifest) {
    add('dependencies', 'Project dependencies', 'fail', 'Crewlo package manifest is missing or not recognized.', 'Run this script from a complete Crewlo source checkout.');
  } else if (deps.missing.length) {
    add('dependencies', 'Project dependencies', deps.modulesExist ? 'fail' : 'warn', `${deps.missing.length} declared package(s) are not present locally.`, 'After fixing prerequisite failures, run npm ci from the project root. That command installs/rebuilds dependencies; the doctor does not.');
  } else {
    add('dependencies', 'Project dependencies', 'pass', 'All declared dependency package manifests are present. Versions/install integrity are not audited.');
  }
  if (!deps.electron) {
    add('electron_runtime', 'Installed Electron runtime', 'skip', 'No installed Electron executable was found inside node_modules/electron/dist.', 'Complete npm ci, then rerun the doctor to check the actual Electron native-module ABI.');
  } else {
    const native = inspectNativeRuntime(probes, deps.electron);
    add('electron_runtime', 'Installed Electron runtime', native.started ? 'pass' : 'fail', native.started ? 'Installed Electron started in Node-only mode; no Crewlo window was opened.' : 'The installed Electron Node-only probe did not complete.', native.started ? undefined : 'Check the local Electron installation, then rerun npm ci if needed. No raw process output is shown.');
    add('native_pty', 'node-pty / Electron ABI', native.started && native.pty ? 'pass' : 'fail', native.started && native.pty ? 'Native module loaded in Electron. No terminal process was spawned.' : 'node-pty did not load successfully in the installed Electron runtime.', native.started && native.pty ? undefined : 'Fix C++/SDK/Spectre prerequisites, then run npm run postinstall to rebuild existing native modules for Electron.');
    add('native_sqlite', 'SQLite / Electron ABI', native.started && native.sqlite ? 'pass' : 'fail', native.started && native.sqlite ? 'Native module loaded and an in-memory SELECT succeeded. No database file was created.' : 'better-sqlite3 did not pass its in-memory Electron check.', native.started && native.sqlite ? undefined : 'Fix native build prerequisites, then run npm run postinstall. This check does not repair files.');
  }
  const failed = checks.filter(check => check.status === 'fail').length;
  const warnings = checks.filter(check => check.status === 'warn').length;
  return {
    schemaVersion: 1, platform: probes.platform, architecture: probes.architecture,
    status: failed ? 'needs_fixes' : warnings ? 'needs_review' : 'ready', failed, warnings, checks,
    limitations: ['This is not a compiler build, launch, model-authentication, or end-to-end messaging test.', 'Python 3 availability and node-gyp/Python compatibility are not probed; verify them before a native rebuild.', 'No dependency installation, rebuild, credential access, agent execution, or external network request is performed.'],
    exitCode: failed ? 1 : 0
  };
}
function formatReport(report) {
  const lines = [`Crewlo doctor — read-only (${report.platform}/${report.architecture})`, ''];
  for (const check of report.checks) {
    lines.push(`[${check.status.toUpperCase()}] ${check.label}: ${check.summary}`);
    if (check.action) lines.push(`       Next: ${check.action}`);
  }
  lines.push('', `${report.failed} failed check(s), ${report.warnings} warning(s). No changes made.`, 'Guide: docs/crewlo/QUICKSTART.fr.md');
  for (const limit of report.limitations) lines.push(limit);
  return lines.join('\n');
}
module.exports = { createProbes, runDoctor, supportedNode, inspectWindows, inspectDependencies, inspectNativeRuntime, formatReport };
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--json', '--help'].includes(arg))) {
    process.stderr.write('Usage: node tools/crewlo-doctor.cjs [--json] [--help]\n'); process.exitCode = 2;
  } else if (args.includes('--help')) {
    process.stdout.write('Usage: node tools/crewlo-doctor.cjs [--json]\nRead-only source-install checks. Exit 1: detected failures; exit 0: no failures (review warnings). No repairs or installs.\n');
  } else {
    try {
      const report = runDoctor();
      process.stdout.write((args.includes('--json') ? JSON.stringify(report, null, 2) : formatReport(report)) + '\n');
      process.exitCode = report.exitCode;
    } catch {
      const failure = { status: 'diagnostic_failed', error: 'Could not complete a local check. Verify access to this source checkout and rerun. No changes made.', exitCode: 1 };
      process.stdout.write((args.includes('--json') ? JSON.stringify(failure) : failure.error) + '\n'); process.exitCode = 1;
    }
  }
}
