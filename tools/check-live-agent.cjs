// Explicit live check: uses an existing provider login and may consume usage.
// Real packaged IPC + PTY + provider, with only Read enabled in a temporary cwd.
const { _electron } = require(process.env.CREWLO_PLAYWRIGHT || 'playwright');
const fs = require('node:fs');
const { resolve, join } = require('node:path');
const { randomBytes } = require('node:crypto');
const assert = require('node:assert/strict');
const { stripVTControlCharacters } = require('node:util');

(async () => {
  const provider = process.argv[3] || 'claude';
  assert.ok(['claude', 'codex'].includes(provider));
  const root = fs.mkdtempSync(resolve('out/windows-validation/live-agent-'));
  const profile = join(root, 'profile');
  const project = join(root, 'project');
  fs.mkdirSync(profile); fs.mkdirSync(project);
  const marker = 'CREWLO_VERIFIED_' + randomBytes(8).toString('hex');
  fs.writeFileSync(join(project, 'fixture.txt'), `Validation marker: ${marker}\n`, 'utf8');
  fs.writeFileSync(join(profile, 'config.json'), JSON.stringify({
    onboardingComplete: false, autoMode: false, autoUpdate: false,
    telemetryEnabled: false, registeredRepos: [], harnessHome: join(root, 'studio'),
  }));
  const env = { ...process.env, DO_NOT_TRACK: '1' };
  delete env.ELECTRON_RUN_AS_NODE; delete env.NODE_OPTIONS;
  let app, page;
  try {
    app = await _electron.launch({ executablePath: resolve(process.argv[2] || 'dist/windows-preview/win-unpacked/Crewlo.exe'), args: [`--user-data-dir=${profile}`], env });
    assert.equal(await app.evaluate(({ app }) => app.getPath('userData')), profile);
    page = await app.firstWindow();
    await page.waitForFunction(() => !!window.cth);
    const result = await page.evaluate(async ({ project, provider }) => {
      window.liveAgentCheck = { output: '', exit: null };
      window.cth.onPtyData('live-validation', data => { window.liveAgentCheck.output += data; });
      window.cth.onPtyExit('live-validation', exit => { window.liveAgentCheck.exit = exit; });
      return window.cth.spawnPty({
        id: 'live-validation', cwd: project, command: provider, provider,
        noAutoInstall: true, cols: 180, rows: 40,
        args: provider === 'codex' ? ['exec', '--ignore-user-config', '--ephemeral',
          '--sandbox', 'read-only', '--skip-git-repo-check', '--json',
          'Read only fixture.txt in the current directory. Reply with only its validation marker. Do not access other files, use the network, or delegate.'] : ['-p', '--safe-mode', '--restricted', '--strict-mcp-config',
          '--tools', 'Read', '--allowedTools', 'Read', '--permission-mode', 'dontAsk',
          '--no-session-persistence', '--output-format', 'json', '--max-budget-usd', '0.50',
          'Read fixture.txt in the current directory. Reply with only its validation marker. Do not access any other file.'],
      });
    }, { project, provider });
    assert.equal(result.ok, true, result.error);
    await page.waitForFunction(() => window.liveAgentCheck.exit !== null, null, { timeout: 120000 });
    const state = await page.evaluate(() => window.liveAgentCheck);
    fs.writeFileSync(join(root, 'terminal.txt'), state.output);
    const events = stripVTControlCharacters(state.output).split(/\r?\n/).flatMap(line => {
      try { return [JSON.parse(line)]; } catch { return []; }
    });
    const response = provider === 'codex'
      ? events.findLast(event => event.type === 'item.completed' && event.item?.type === 'agent_message')?.item.text
      : events.findLast(event => event.type === 'result' && !event.is_error)?.result;
    fs.writeFileSync(join(root, 'result.json'), JSON.stringify({ provider, exit: state.exit, response, matched: response?.trim() === marker }, null, 2));
    assert.equal(state.exit.exitCode, 0, 'Provider must finish successfully; see terminal.txt');
    assert.equal(response?.trim(), marker, 'Actual final agent response must match the fixture marker');
    assert.deepEqual(fs.readdirSync(project), ['fixture.txt']);
    assert.equal(fs.readFileSync(join(project, 'fixture.txt'), 'utf8'), `Validation marker: ${marker}\n`);
    console.log(`PASS: real ${provider} response through packaged Crewlo IPC and Windows PTY; fixture unchanged. This does not validate hive routing or messaging delivery.`);
    console.log('Evidence:', root);
  } finally {
    if (page && !page.isClosed()) await page.evaluate(() => window.cth.killPty('live-validation')).catch(() => {});
    await app?.close();
    console.log('Evidence directory:', root);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
