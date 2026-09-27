// Local preview only: reuse installed Electron-native binaries after validation.
// The normal dist:win command still rebuilds natives for distributable releases.
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { createProbes, inspectDependencies, inspectNativeRuntime, supportedNode } = require('./crewlo-doctor.cjs');

if (process.platform !== 'win32' || process.arch !== 'x64' || !supportedNode(process.version)) {
  throw new Error('Windows x64 and Node.js >=22.22 are required for this local preview.');
}
const root = resolve(__dirname, '..');
const probes = createProbes({ root });
const deps = inspectDependencies(probes);
if (!deps.electron || deps.missing?.length) throw new Error('Install the project dependencies before packaging.');
const native = inspectNativeRuntime(probes, deps.electron);
if (!native.started || !native.pty || !native.sqlite) throw new Error('Electron-native checks failed. Rebuild the native dependencies first.');
console.log('Building an unsigned local preview with validated installed native modules; no publish or clean native rebuild.');
const env = { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' };
for (const key of ['CSC_LINK', 'CSC_KEY_PASSWORD', 'WIN_CSC_LINK', 'WIN_CSC_KEY_PASSWORD']) delete env[key];
const result = spawnSync(process.execPath, [
  require.resolve('electron-builder/cli.js'), '--win', 'nsis', '--x64', '--publish', 'never',
  '-c.npmRebuild=false', '-c.directories.output=dist/windows-preview',
  '-c.nsis.artifactName=Crewlo-${version}-win-x64-preview-setup.exe',
], { cwd: root, stdio: 'inherit', windowsHide: true,
  env });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
