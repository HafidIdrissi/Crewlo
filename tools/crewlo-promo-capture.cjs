// Reproducible real-UI recording. All agents, hook events, and Telegram states
// are controlled fixtures. No provider, public bot, or user profile is touched.
const { _electron } = require(process.env.CREWLO_PLAYWRIGHT || 'playwright');
const { createServer } = require('vite');
const react = require('@vitejs/plugin-react').default;
const QRCode = require('qrcode');
const { resolve, join } = require('node:path');
const { mkdirSync, mkdtempSync, copyFileSync, statSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { toolActivity } = require('../test/load-ts.cjs')('src/shared/toolActivity.ts');
const out = resolve('docs/crewlo/demo');
const frames = mkdtempSync(join(tmpdir(), 'crewlo-promo-frames-'));
const ffmpeg = process.env.CREWLO_FFMPEG || 'ffmpeg';
const fps = 8;
function encode(args) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || 'ffmpeg failed');
}
(async () => {
  if (spawnSync(ffmpeg, ['-version'], { windowsHide: true }).status !== 0) throw Error('Install ffmpeg or set CREWLO_FFMPEG to its executable.');
  mkdirSync(out, { recursive: true });
  const server = await createServer({ configFile: false, root: resolve('src/renderer'), plugins: [react()], define: { __APP_VERSION__: JSON.stringify('Scripted demo') }, resolve: { alias: { '@': resolve('src/renderer/src'), '@shared': resolve('src/shared'), '@brand': resolve('docs') } }, server: { port: 5178, strictPort: true } });
  let app;
  try {
    await server.listen();
    app = await _electron.launch({ executablePath: require('electron'), args: [resolve('tools/crewlo-capture-entry.cjs')], env: { ...process.env, ELECTRON_RENDERER_URL: 'http://localhost:5178/' } });
    const page = await app.firstWindow();
    await app.evaluate(({ BrowserWindow }) => { const window = BrowserWindow.getAllWindows()[0]; window.hide(); window.setContentSize(1280, 800); });
    await page.waitForFunction(() => !!window.cth);
    const config = await page.evaluate(() => window.cth.getConfig());
    const qr = await QRCode.toDataURL('https://example.com/crewlo-scripted-demo', { width: 144, margin: 1 });
    await app.evaluate(({ ipcMain }, { config, qr }) => {
      const handle = (name, fn) => { ipcMain.removeHandler(name); ipcMain.handle(name, fn); };
      handle('config:get', () => ({ ...config, onboardingComplete: true, harnessHome: '', autoUpdate: false }));
      handle('pty:spawn', () => ({ ok: false, error: 'Scripted demo: no provider' }));
      handle('pty:submit', () => ({ ok: false, error: 'Scripted demo: no provider' }));
      handle('pty:list', () => Array.from({ length: 5 }, (_, i) => ({ id: 'demo-pty-' + i })));
      handle('hive:inbox', () => []); handle('messaging:history', () => []);
      handle('app:openExternal', () => ({ ok: false }));
      handle('whatsapp:status', () => ({ state: 'disconnected', hasCredentials: false, agents: [], uncertainReplies: 0, waitingWindowReplies: 0 }));
      globalThis.promoPaused = true;
      handle('mission:list', () => [{ id: 'demo-mission', agentId: 'demo-0', body: 'Build a responsive landing page', state: 'running', updatedAt: Date.now() }]);
      handle('control:snapshot', () => ({ autoDeliveryPaused: globalThis.promoPaused, paused: false, halted: false }));
      handle('control:autoDelivery', (_, id, paused) => { globalThis.promoPaused = paused; return { autoDeliveryPaused: paused, paused: false, halted: false }; });
      globalThis.promoTelegram = { state: 'connected', hasToken: true, botUsername: 'ScriptedDemoBot', detail: 'SCRIPTED DEMO · no live connection. QR opens example.com, not Telegram.', pairingLink: 'https://example.com/crewlo-scripted-demo', pairingQr: qr, pairingExpiresAt: Date.now() + 300000, agents: [{ id: 'demo-0', name: 'Remy', state: 'ready' }, { id: 'demo-1', name: 'Ellis', state: 'ready' }], uncertainReplies: 0 };
      handle('telegram:status', () => globalThis.promoTelegram);
      handle('telegram:confirm', () => { delete globalThis.promoTelegram.candidate; globalThis.promoTelegram.owner = { id: 42, name: 'Demo owner' }; return { ok: true }; });
      handle('telegram:defaultAgent', (_, id) => { globalThis.promoTelegram.defaultAgent = id; return { ok: true }; });
    }, { config, qr });
    await page.evaluate(() => localStorage.setItem('cth.skipHivePickerOnce', '1'));
    await page.reload(); await page.waitForSelector('.crewlo-mission');
    await page.evaluate(async () => {
      const { useStore } = await import('/src/store/store.ts');
      useStore.setState({ agents: ['Remy', 'Ellis', 'Robin', 'Sam', 'Noor'].map((name, i) => ({ id: 'demo-' + i, name, character: ['michael', 'jim', 'pam', 'dwight', 'angela'][i], accent: 'mint', description: 'Scripted demo fixture', project: 'Demo', tmuxTarget: '', cwd: '', status: i < 2 ? 'working' : 'idle', ptyId: 'demo-pty-' + i, action: '', progress: 0, isGod: i === 0 })), selectedId: null, godStatus: 'ready' });
      const label = document.createElement('div'); label.id = 'recording-disclosure';
      label.textContent = 'SCRIPTED DEMO · no live providers or messaging';
      label.style.cssText = 'position:fixed;z-index:2147483647;top:5px;left:50%;transform:translateX(-50%);padding:5px 10px;background:#293c34;color:#fffaf0;border-radius:6px;font:600 10px system-ui;letter-spacing:.5px;pointer-events:none;white-space:nowrap';
      document.body.appendChild(label);
    });
    await page.waitForFunction(() => document.querySelector('.crewlo-canvas')?.dataset.voxelActors?.includes('demo-0'));
    const emit = events => app.evaluate(({ BrowserWindow }, events) => { for (const event of events) BrowserWindow.getAllWindows()[0].webContents.send('hive:hookEvent', event); }, events);
    await emit([{ agentId: 'demo-0', event: 'PreToolUse', tool: 'apply_patch', activity: toolActivity('apply_patch', '*** Add File: index.html\n+<html>') }, { agentId: 'demo-1', event: 'PreToolUse', tool: 'mcp__playwright__browser_resize', activity: toolActivity('mcp__playwright__browser_resize', { width: 375 }) }]);
    await page.waitForFunction(() => document.querySelector('.crewlo-canvas')?.dataset.voxelActors.includes('Creating index.html'));
    await page.getByRole('status').filter({ hasText: 'Message delivery paused' }).waitFor();
    const screenshot = async index => {
      const started = Date.now();
      await page.screenshot({ path: join(frames, String(index).padStart(4, '0') + '.png') });
      await page.waitForTimeout(Math.max(0, 1000 / fps - (Date.now() - started)));
    };
    for (let index = 0; index < 80; index++) {
      if (index === 12) await page.locator('#crewlo-mission').fill('Build a responsive landing page for our next idea.');
      if (index === 32) await page.locator('.crewlo-mission').getByRole('button', { name: 'Resume', exact: true }).click();
      if (index === 44) await page.getByRole('status').filter({ hasText: 'Mission in progress' }).waitFor();
      if (index === 56) await emit([{ agentId: 'demo-0', event: 'PostToolUse', tool: 'apply_patch' }, { agentId: 'demo-0', event: 'PreToolUse', tool: 'Bash', activity: toolActivity('Bash', { command: 'npm run build' }) }]);
      await screenshot(index);
    }
    copyFileSync(join(frames, '0020.png'), join(out, 'studio-poster.png'));
    await page.getByRole('button', { name: 'Telegram', exact: true }).click();
    const panel = page.getByRole('region', { name: 'Telegram setup' });
    await panel.waitFor(); await panel.scrollIntoViewIfNeeded();
    await panel.getByRole('img').waitFor();
    for (let index = 80; index < 144; index++) {
      if (index === 103) {
        await app.evaluate(() => { delete globalThis.promoTelegram.pairingLink; delete globalThis.promoTelegram.pairingQr; globalThis.promoTelegram.candidate = { id: 'demo-pairing', userId: 42, name: 'Demo owner', expiresAt: Date.now() + 300000 }; });
        await panel.getByRole('button', { name: 'Confirm pairing', exact: true }).waitFor();
      }
      if (index === 122) await panel.getByRole('button', { name: 'Confirm pairing', exact: true }).click();
      if (index === 128) await panel.locator('#telegram-agent').selectOption('demo-0');
      await screenshot(index);
    }
    copyFileSync(join(frames, '0088.png'), join(out, 'telegram-poster.png'));
    assert.ok((await page.locator('body').innerText()).includes('SCRIPTED DEMO'));
    assert.ok((await panel.innerText()).includes('Paired with Demo owner'));
    console.log('Captured 144 real UI frames with visible demo disclosure.');
  } finally { if (app) await app.close(); await server.close(); }
  const input = join(frames, '%04d.png');
  encode(['-framerate', String(fps), '-i', input, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', join(out, 'crewlo-demo.mp4')]);
  for (const [start, count, name] of [[0, 80, 'studio-activity'], [80, 64, 'telegram-pairing']]) {
    encode(['-framerate', String(fps), '-start_number', String(start), '-i', input, '-frames:v', String(count), '-filter_complex', '[0:v]scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3', '-loop', '0', join(out, name + '.gif')]);
    assert.ok(statSync(join(out, name + '.gif')).size < 5 * 1024 * 1024, 'Keep each GIF below 5 MiB');
  }
  for (const file of ['crewlo-demo.mp4', 'studio-activity.gif', 'telegram-pairing.gif']) console.log(file + ': ' + (statSync(join(out, file)).size / 1024 / 1024).toFixed(2) + ' MiB');
  console.log('Source frames (temporary, not committed): ' + frames);
})().catch(error => { console.error(error); process.exitCode = 1; });
