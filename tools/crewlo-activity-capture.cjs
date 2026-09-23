// Isolated UI fixture: intercept all provider dispatch and use a temporary profile.
const { _electron } = require(process.env.CREWLO_PLAYWRIGHT || 'playwright');
const { createServer } = require('vite');
const react = require('@vitejs/plugin-react').default;
const { resolve } = require('node:path');
const { mkdirSync } = require('node:fs');
const assert = require('node:assert/strict');
const { toolActivity } = require('../test/load-ts.cjs')('src/shared/toolActivity.ts');
(async () => {
  const server = await createServer({ configFile: false, root: resolve('src/renderer'), plugins: [react()], define: { __APP_VERSION__: JSON.stringify('UI test') }, resolve: { alias: { '@': resolve('src/renderer/src'), '@shared': resolve('src/shared'), '@brand': resolve('docs') } }, server: { port: 5175, strictPort: true } });
  await server.listen();
  let app;
  try {
    app = await _electron.launch({ executablePath: require('electron'), args: [resolve('tools/crewlo-capture-entry.cjs')], env: { ...process.env, ELECTRON_RENDERER_URL: 'http://localhost:5175/' } });
    const page = await app.firstWindow();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].hide());
    await page.waitForFunction(() => !!window.cth);
    const config = await page.evaluate(() => window.cth.getConfig());
    await app.evaluate(({ ipcMain }, config) => {
      const handle = (name, fn) => { ipcMain.removeHandler(name); ipcMain.handle(name, fn); };
      handle('config:get', () => ({ ...config, onboardingComplete: true, harnessHome: '', autoUpdate: false }));
      handle('pty:spawn', () => ({ ok: false, error: 'UI fixture: no provider' }));
      handle('pty:submit', () => ({ ok: false, error: 'UI fixture: no provider' }));
      handle('hive:inbox', () => []);
      handle('mission:list', () => [{ id: 'fixture-mission', agentId: 'fixture-0', body: 'Build a landing page', state: 'running', updatedAt: Date.now() }]);
      globalThis.fixturePaused = true;
      globalThis.fixtureResumeFails = false;
      globalThis.fixtureResumeCalls = [];
      handle('control:snapshot', () => ({ autoDeliveryPaused: globalThis.fixturePaused, paused: false, halted: false }));
      handle('control:autoDelivery', (_, id, paused) => {
        if (globalThis.fixtureResumeFails) throw Error('Fixture resume failure');
        globalThis.fixtureResumeCalls.push(id);
        globalThis.fixturePaused = paused;
        return { autoDeliveryPaused: paused, paused: false, halted: false };
      });
    }, config);
    await page.evaluate(() => localStorage.setItem('cth.skipHivePickerOnce', '1'));
    await page.reload();
    await page.waitForSelector('.crewlo-mission');
    await page.evaluate(async () => {
      const { useStore } = await import('/src/store/store.ts');
      useStore.setState({ agents: ['Remy', 'Ellis', 'Robin', 'Sam', 'Noor'].map((name, i) => ({ id: 'fixture-' + i, name, character: ['michael', 'jim', 'pam', 'dwight', 'angela'][i], accent: 'mint', description: 'UI test fixture', project: 'Fixture', tmuxTarget: '', cwd: '', status: i < 2 ? 'working' : 'idle', ptyId: 'fixture-pty-' + i, action: '', progress: 0, isGod: i === 0 })), selectedId: null, godStatus: 'ready' });
    });
    await page.waitForFunction(() => document.querySelector('.crewlo-canvas')?.dataset.cameraMode === 'team');
    await app.evaluate(({ BrowserWindow }, events) => {
      for (const event of events) BrowserWindow.getAllWindows()[0].webContents.send('hive:hookEvent', event);
    }, [{ agentId: 'fixture-0', event: 'PreToolUse', tool: 'apply_patch', activity: toolActivity('apply_patch', '*** Add File: index.html\n+<html>') }, { agentId: 'fixture-1', event: 'PreToolUse', tool: 'mcp__playwright__browser_resize', activity: toolActivity('mcp__playwright__browser_resize', { width: 375 }) }]);
    await page.waitForFunction(() => document.querySelector('.crewlo-canvas')?.dataset.voxelActors.includes('Creating index.html'));
    await page.getByRole('status').filter({ hasText: 'Message delivery paused' }).waitFor();
    assert.equal(await page.locator('.crewlo-mission [role="status"]').count(), 1);
    assert.ok(!(await page.locator('body').innerText()).includes('auto mode on'));
    mkdirSync('docs/crewlo', { recursive: true });
    for (const size of [[1440, 900], [1024, 768], [720, 900]]) {
      await app.evaluate(({ BrowserWindow }, size) => BrowserWindow.getAllWindows()[0].setContentSize(...size), size);
      await page.waitForTimeout(500);
      const bounds = await page.locator('.crewlo-mission').boundingBox();
      const input = await page.locator('#crewlo-mission').boundingBox();
      assert.ok(input.width > bounds.width * .55, `Input too narrow at ${size[0]}`);
      assert.ok(input.x - bounds.x < 30, 'Input must start at the left');
      await page.screenshot({ path: `docs/crewlo/activity-${size[0]}.png` });
    }
    await app.evaluate(() => { globalThis.fixtureResumeFails = true; });
    await page.locator('.crewlo-mission').getByRole('button', { name: 'Resume', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Could not resume all messages' }).waitFor();
    assert.equal(await page.locator('.crewlo-mission-status').getAttribute('data-paused'), 'true');
    await app.evaluate(() => { globalThis.fixtureResumeFails = false; });
    await page.locator('.crewlo-mission').getByRole('button', { name: 'Resume', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Mission in progress' }).waitFor();
    assert.equal(await app.evaluate(() => new Set(globalThis.fixtureResumeCalls).size), 5);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send('hive:hookEvent', { agentId: 'fixture-0', event: 'PostToolUse', tool: 'apply_patch' }));
    await page.waitForFunction(() => !document.querySelector('.crewlo-canvas')?.dataset.voxelActors.includes('Creating index.html'));
    console.log('PASS: team camera, event labels, responsive composer, failed/successful Resume, activity cleanup');
  } finally {
    if (app) await app.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
