// Windows/Electron smoke: real IPC, safeStorage and SQLite; fake Bot API and
// fake agent execution. Never contacts Telegram or launches an agent provider.
const { _electron } = require(process.env.CREWLO_PLAYWRIGHT || 'playwright');
const { createServer } = require('vite');
const react = require('@vitejs/plugin-react').default;
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
async function eventually(check) {
  const end = Date.now() + 15000;
  while (Date.now() < end) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw Error('Timed out waiting for verified Telegram state');
}
(async () => {
  const server = await createServer({ configFile: false, root: resolve('src/renderer'), plugins: [react()], define: { __APP_VERSION__: JSON.stringify('Telegram test') }, resolve: { alias: { '@': resolve('src/renderer/src'), '@shared': resolve('src/shared'), '@brand': resolve('docs') } }, server: { port: 5176, strictPort: true } });
  await server.listen(); let app;
  try {
    app = await _electron.launch({ executablePath: require('electron'), args: [resolve('tools/crewlo-telegram-entry.cjs')], env: { ...process.env, ELECTRON_RENDERER_URL: 'http://localhost:5176/' } });
    const page = await app.firstWindow();
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].hide(); BrowserWindow.getAllWindows()[0].setContentSize(1440, 1000); });
    await page.waitForFunction(() => !!window.cth);
    const config = await page.evaluate(() => window.cth.getConfig());
    await app.evaluate(({ ipcMain, app }, { config, loader }) => {
      const load = globalThis.tgRequire(loader);
      const { TelegramHttpApi } = load('src/main/messaging/telegramApi.ts');
      const { PersistStore } = load('src/main/db.ts');
      const { installTelegram } = load('src/main/messaging/telegramIntegration.ts');
      const { redactSecrets } = load('src/main/hive.ts');
      const handle = (name, fn) => { ipcMain.removeHandler(name); ipcMain.handle(name, fn); };
      handle('config:get', () => ({ ...config, onboardingComplete: true, harnessHome: '', autoUpdate: false }));
      handle('pty:spawn', () => ({ ok: false, error: 'Test: no provider' }));
      handle('pty:submit', () => ({ ok: false, error: 'Test: no provider' }));
      handle('hive:inbox', () => []);
      globalThis.openedCommunityUrl = undefined;
      handle('app:openExternal', (_, url) => { globalThis.openedCommunityUrl = url; return { ok: true }; });
      globalThis.tgSent = []; globalThis.tgRouted = []; globalThis.tgPoll = undefined;
      TelegramHttpApi.prototype.call = async function(method, args, signal) {
        if (method === 'getMe') return { username: 'CrewloSmokeTestBot', is_bot: true };
        if (method === 'getWebhookInfo') return { url: '' };
        if (method === 'getUpdates') return new Promise((resolve, reject) => {
          globalThis.tgPoll = resolve;
          signal.addEventListener('abort', () => { globalThis.tgPoll = undefined; reject(Error('aborted')); }, { once: true });
        });
        if (method === 'sendMessage') { globalThis.tgSent.push(args); return { message_id: globalThis.tgSent.length }; }
        throw Error('Unexpected fake API method');
      };
      for (const name of ['connect', 'disconnect', 'pair', 'confirm', 'defaultAgent', 'status']) ipcMain.removeHandler('telegram:' + name);
      ipcMain.removeHandler('messaging:history');
      const db = new PersistStore(app.getPath('userData') + '/telegram-smoke.db'); db.open();
      globalThis.tgDb = db;
      globalThis.tgIntegration = installTelegram(db, {
        scope: () => 'smoke-studio', clean: redactSecrets,
        agents: () => [{ id: 'remy', name: 'Remy', state: 'ready' }],
        enqueue: row => globalThis.tgRouted.push(JSON.parse(JSON.stringify(row)))
      });
    }, { config, loader: resolve('test/load-ts.cjs') });
    await page.evaluate(() => localStorage.setItem('cth.skipHivePickerOnce', '1'));
    await page.reload(); await page.waitForSelector('.crewlo-mission');
    await page.locator('.crewlo-community summary').click();
    await page.getByRole('button', { name: '☆ Star sur GitHub', exact: true }).click();
    assert.equal(await app.evaluate(() => globalThis.openedCommunityUrl), 'https://github.com/HafidIdrissi/crewlo');
    const coffee = require('../docs/crewlo-links.json').coffeeUrl;
    const support = page.getByRole('button', { name: '☕ Buy Me a Coffee', exact: true });
    if (coffee) { await support.click(); assert.equal(await app.evaluate(() => globalThis.openedCommunityUrl), coffee); }
    else assert.equal(await support.isDisabled(), true, 'No payment destination is invented');
    await page.locator('.crewlo-community summary').click();
    await page.getByRole('button', { name: 'Telegram', exact: true }).click();
    const panel = page.getByRole('region', { name: 'Telegram setup' });
    await panel.waitFor();
    assert.equal(await panel.locator('#telegram-token').getAttribute('type'), 'password');
    const token = '123456:SMOKE_TEST_ONLY_abcdefghijklmnopqrstuvwxyz';
    await panel.locator('#telegram-token').fill(token);
    await panel.getByRole('button', { name: 'Connect', exact: true }).click();
    await panel.getByRole('img', { name: 'Scan to open the single-use Telegram pairing link' }).waitFor();
    const status = await page.evaluate(() => window.cth.telegramStatus());
    assert.ok(status.pairingQr.startsWith('data:image/png;base64,'));
    assert.ok(!JSON.stringify(status).includes(token));
    const encrypted = await app.evaluate(({ app, safeStorage }, { loader, token }) => {
      const fs = globalThis.tgRequire('node:fs');
      const load = globalThis.tgRequire(loader);
      const { getSecret } = load('src/main/integrations.ts');
      const blob = fs.readFileSync(app.getPath('userData') + '/integration-secrets.json', 'utf8');
      return safeStorage.isEncryptionAvailable() && !blob.includes(token) && getSecret('crewlo.messaging.telegram.bot') === token && !JSON.stringify(globalThis.tgDb.getKv('messaging.telegram.v1')).includes(token);
    }, { loader: resolve('test/load-ts.cjs'), token });
    assert.ok(encrypted, 'real Windows vault must round-trip without plaintext storage');
    const nonce = new URL(status.pairingLink).searchParams.get('start');
    await app.evaluate((_, nonce) => globalThis.tgPoll([{ update_id: 1, message: { message_id: 1, date: 1, from: { id: 42, first_name: 'Test owner' }, chat: { id: 42, type: 'private' }, text: '/start ' + nonce } }]), nonce);
    await panel.getByRole('button', { name: 'Confirm pairing' }).waitFor();
    assert.equal(await app.evaluate(() => globalThis.tgRouted.length), 0);
    await panel.getByRole('button', { name: 'Confirm pairing' }).click();
    await panel.getByText('Paired with Test owner · ID 42', { exact: true }).waitFor();
    await panel.locator('#telegram-agent').selectOption('remy');
    await eventually(() => page.evaluate(async () => (await window.cth.telegramStatus()).defaultAgent === 'remy'));
    await page.screenshot({ path: 'docs/crewlo/telegram-setup.png' });
    await app.evaluate(() => globalThis.tgPoll([{ update_id: 2, message: { message_id: 2, date: 1, from: { id: 42, first_name: 'Test owner' }, chat: { id: 42, type: 'private' }, text: 'Please check the responsive layout.' } }]));
    await eventually(() => app.evaluate(() => globalThis.tgRouted.length === 1));
    assert.ok(await page.evaluate(async () => (await window.cth.messagingHistory('remy')).some(r => r.status === 'awaiting_reply')));
    await app.evaluate(() => {
      const row = globalThis.tgRouted[0];
      globalThis.tgIntegration.reply({ id: 'smoke-reply', from: 'remy', to: 'human', act: 'inform', conversation: 'remote:' + row.id, in_reply_to: row.id, public_reply: 'The responsive layout checks passed.' });
    });
    await eventually(() => page.evaluate(async () => (await window.cth.messagingHistory('remy')).some(r => r.status === 'sent')));
    assert.ok(await app.evaluate(() => globalThis.tgSent.some(r => r.text === 'Remy · The responsive layout checks passed.')));
    // Reload closes Settings; normal Conversation rendering uses real ledger IPC.
    await page.evaluate(() => localStorage.setItem('cth.skipHivePickerOnce', '1'));
    await page.reload(); await page.waitForSelector('.crewlo-mission');
    await page.evaluate(async () => {
      const { useStore } = await import('/src/store/store.ts');
      useStore.setState({ agents: [{ id: 'remy', name: 'Remy', character: 'michael', accent: 'mint', description: 'Smoke fixture', project: 'Fixture', tmuxTarget: '', cwd: '', status: 'idle', ptyId: undefined, action: '', progress: 0, isGod: true }], selectedId: 'remy', godStatus: 'ready', ccTabRequest: { tab: 'messages', seq: 1 } });
      window.dispatchEvent(new Event('crewlo:open-agent'));
    });
    await page.getByText('Please check the responsive layout.', { exact: true }).waitFor();
    await page.getByText('The responsive layout checks passed.', { exact: true }).waitFor();
    await page.locator('.crewlo-telegram-badge').first().waitFor();
    assert.ok(!(await page.locator('body').innerText()).includes('CREWLO_REMOTE_REPLY'));
    await page.screenshot({ path: 'docs/crewlo/telegram-conversation.png' });
    await page.getByRole('button', { name: 'Telegram', exact: true }).click();
    await panel.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await panel.locator('#telegram-token').waitFor();
    assert.equal((await page.evaluate(() => window.cth.telegramStatus())).hasToken, false);
    await app.evaluate(() => { globalThis.tgIntegration.stop(); globalThis.tgDb.close(); });
    console.log('PASS: real Windows encryption, SQLite, IPC, connect/QR/confirm/default/disconnect panel, mocked long-poll round trip, Conversation badge, no internal wrapper, Star/support controls');
  } finally { if (app) await app.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
