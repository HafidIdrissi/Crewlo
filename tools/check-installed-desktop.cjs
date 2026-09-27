// Installed UI smoke test. Uses an isolated profile and blocks provider spawning.
// This checks local UI/persistence, not live AI responses or authentication.
const { _electron } = require(process.env.CREWLO_PLAYWRIGHT || 'playwright');
const fs = require('node:fs');
const { resolve, join } = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const base = resolve('out/windows-validation');
  const root = fs.mkdtempSync(join(base, 'desktop-check-'));
  const userData = join(root, 'user-data');
  const home = join(root, 'studio');
  for (const dir of [userData, home, join(root, 'roaming'), join(root, 'local')]) fs.mkdirSync(dir, { recursive: true });
  const env = { ...process.env, APPDATA: join(root, 'roaming'), LOCALAPPDATA: join(root, 'local'), USERPROFILE: root, DO_NOT_TRACK: '1' };
  delete env.ELECTRON_RUN_AS_NODE; delete env.NODE_OPTIONS;
  let app;
  const errors = [];
  async function launch() {
    app = await _electron.launch({ executablePath: resolve(process.argv[2] || 'out/windows-validation/installed/Crewlo/Crewlo.exe'), args: [`--user-data-dir=${userData}`], env });
    assert.equal(await app.evaluate(({ app }) => app.getPath('userData')), userData);
    const page = await app.firstWindow();
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForLoadState('domcontentloaded');
    return page;
  }
  try {
    let page = await launch();
    await page.getByRole('button', { name: /I'M TECHNICAL/ }).click();
    await page.getByRole('button', { name: 'next', exact: true }).click();
    await page.getByRole('button', { name: 'set it up', exact: true }).click();
    await page.locator('input').first().fill(home);
    await page.getByRole('button', { name: 'next', exact: true }).click();
    await page.screenshot({ path: join(root, 'onboarding-provider.png') });
    const onboarding = await page.locator('body').innerText();
    assert.match(onboarding, /Claude|Codex/);
    const config = await page.evaluate(() => window.cth.getConfig());
    await app.close(); app = null;
    // Fixture: open a configured empty studio; never connect the user's accounts.
    fs.writeFileSync(join(userData, 'config.json'), JSON.stringify({ ...config,
      onboardingComplete: true, harnessHome: home, registeredRepos: [], autoMode: false,
      telemetryEnabled: false, godProvider: 'claude', godName: 'Test Crew' }));
    page = await launch();
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('pty:spawn');
      ipcMain.handle('pty:spawn', () => ({ ok: false, error: 'TEST_ONLY: provider execution intentionally blocked' }));
    });
    await page.getByRole('button', { name: 'open', exact: true }).click();
    await page.waitForTimeout(2500);
    assert.equal((await page.evaluate(() => window.cth.listPtys())).length, 0);
    await page.screenshot({ path: join(root, 'studio.png') });
    const text = await page.locator('body').innerText();
    console.log('STUDIO_UI', text.slice(0, 3800));
    console.log('BUTTONS', await page.getByRole('button').evaluateAll(items => items.map(item => item.getAttribute('aria-label') || item.getAttribute('title') || item.textContent).filter(Boolean)));
    for (const name of ['Tasks & results', 'Approvals & input', 'Memory', 'Agent panel']) {
      if (await page.getByRole('button', { name, exact: true }).isDisabled()) {
        console.log('UNAVAILABLE_WITHOUT_AGENT', name);
        continue;
      }
      await page.getByRole('button', { name, exact: true }).click();
      await page.waitForTimeout(150);
      assert.ok((await page.locator('body').innerText()).length > 50);
      await page.getByRole('button', { name: name === 'Agent panel' ? 'Hide agent panel' : name, exact: true }).click();
    }
    for (const name of ['Zoom in', 'Zoom out', 'Fit studio', 'Studio', 'Team']) {
      await page.getByRole('button', { name, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.screenshot({ path: join(root, 'settings.png') });
    console.log('SETTINGS_UI', (await page.locator('body').innerText()).slice(-2500));
    await page.evaluate(() => window.cth.updateConfig({ godName: 'Persistence Check' }));
    await app.close(); app = null;
    page = await launch();
    assert.equal((await page.evaluate(() => window.cth.getConfig())).godName, 'Persistence Check');
    assert.deepEqual(errors, []);
    console.log('PASS: onboarding navigation, isolated configured studio, available sidebar controls, camera controls, settings opening, settings IPC persistence after restart, no renderer exception, no agent spawned. Disabled agent-dependent panels are not validated.');
    console.log('Evidence:', root);
  } finally { await app?.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
