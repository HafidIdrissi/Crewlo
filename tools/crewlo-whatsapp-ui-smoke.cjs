// Isolated Electron smoke: real IPC, SQLite, OS vault and signed loopback HTTP.
// Only Meta verify/sendText and agent execution are mocked. No live Meta account
// or public tunnel is used; passing does not establish real phone delivery.
const { _electron } = require(process.env.CREWLO_PLAYWRIGHT || 'playwright');
const { createServer } = require('vite');
const react = require('@vitejs/plugin-react').default;
const { resolve } = require('node:path');
const { createHmac } = require('node:crypto');
const assert = require('node:assert/strict');
const secrets = { accessToken: 'FIXTURE_ACCESS_TOKEN_NOT_REAL_123456789', appSecret: '0123456789abcdef0123456789abcdef', verifyToken: 'FIXTURE_VERIFY_TOKEN_NOT_REAL_123456789' };
const phoneNumberId = '123456', ownerId = '15555550199';
const envelope = value => ({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: phoneNumberId }, ...value } }] }] });
const inbound = (id, text, from = ownerId) => envelope({ contacts: [{ wa_id: from, profile: { name: 'Fixture owner' } }], messages: [{ id: 'wamid.' + id, from, timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: text } }] });
async function post(url, payload, valid = true) {
  const body = JSON.stringify(payload);
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': 'sha256=' + createHmac('sha256', valid ? secrets.appSecret : 'wrong-secret').update(body).digest('hex') }, body });
}
async function eventually(check) {
  const until = Date.now() + 15000;
  while (Date.now() < until) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw Error('Timed out waiting for WhatsApp integration state');
}

(async () => {
  const server = await createServer({ configFile: false, root: resolve('src/renderer'), plugins: [react()], define: { __APP_VERSION__: JSON.stringify('WhatsApp integration test') }, resolve: { alias: { '@': resolve('src/renderer/src'), '@shared': resolve('src/shared'), '@brand': resolve('docs') } }, server: { port: 5180, strictPort: true } });
  await server.listen();
  let app;
  try {
    app = await _electron.launch({ executablePath: require('electron'), args: [resolve('tools/crewlo-telegram-entry.cjs')], env: { ...process.env, ELECTRON_RENDERER_URL: 'http://localhost:5180/' } });
    const page = await app.firstWindow();
    await app.evaluate(({ BrowserWindow }) => { const window = BrowserWindow.getAllWindows()[0]; window.hide(); window.setContentSize(1440, 1000); });
    await page.waitForFunction(() => !!window.cth);
    const config = await page.evaluate(() => window.cth.getConfig());
    await app.evaluate(({ ipcMain, app }, { config, loader }) => {
      const load = globalThis.tgRequire(loader);
      const { WhatsAppHttpApi, WhatsAppError } = load('src/main/messaging/whatsappApi.ts');
      const { PersistStore } = load('src/main/db.ts');
      const { installWhatsApp } = load('src/main/messaging/whatsappIntegration.ts');
      const { redactSecrets } = load('src/main/hive.ts');
      const handle = (name, fn) => { ipcMain.removeHandler(name); ipcMain.handle(name, fn); };
      handle('config:get', () => ({ ...config, onboardingComplete: true, harnessHome: '', autoUpdate: false }));
      handle('pty:spawn', () => ({ ok: false, error: 'Fixture: no provider' }));
      handle('pty:submit', () => ({ ok: false, error: 'Fixture: no provider' }));
      handle('hive:inbox', () => [{ id: 'private-wrapper', conversation: 'remote:wa-fixture-1', from: 'human', to: 'remy', body: 'CREWLO_REMOTE_REPLY must never render', subject: 'Private envelope', act: 'request', in_reply_to: null, hops: 0, requires_reply: true, needs_human: false, created_at: new Date().toISOString() }]);
      globalThis.waSent = []; globalThis.waRouted = []; globalThis.waVerifyCount = 0;
      WhatsAppHttpApi.prototype.verify = async function() {
        if (++globalThis.waVerifyCount === 1) throw new WhatsAppError(401);
        return { displayPhoneNumber: '+1 555 555 0123' };
      };
      WhatsAppHttpApi.prototype.sendText = async function(to, text) {
        const id = 'wamid.test' + (globalThis.waSent.length + 1);
        globalThis.waSent.push({ to, text, id });
        return { id };
      };
      for (const action of ['connect', 'disconnect', 'pair', 'confirm', 'defaultAgent', 'status']) ipcMain.removeHandler('whatsapp:' + action);
      const db = new PersistStore(app.getPath('userData') + '/whatsapp-smoke.db'); db.open();
      globalThis.waDb = db;
      globalThis.waIntegration = installWhatsApp(db, { scope: () => 'smoke-studio', clean: redactSecrets, agents: () => [{ id: 'remy', name: 'Remy', state: 'ready' }], enqueue: row => globalThis.waRouted.push(JSON.parse(JSON.stringify(row))) });
      handle('messaging:history', (_, id) => globalThis.waIntegration.history(id));
    }, { config, loader: resolve('test/load-ts.cjs') });
    await page.evaluate(() => localStorage.setItem('cth.skipHivePickerOnce', '1'));
    await page.reload();
    await page.waitForSelector('.crewlo-mission');
    await page.getByRole('button', { name: 'WhatsApp', exact: true }).click();
    const panel = page.getByRole('region', { name: 'WhatsApp setup' });
    await panel.waitFor();
    await page.waitForFunction(() => document.activeElement?.id === 'crewlo-whatsapp-settings');
    for (const field of ['access-token', 'app-secret', 'verify-token']) assert.equal(await panel.locator('#whatsapp-' + field).getAttribute('type'), 'password');
    const fillCredentials = async () => {
      await panel.locator('#whatsapp-phone-id').fill(phoneNumberId);
      await panel.locator('#whatsapp-access-token').fill(secrets.accessToken);
      await panel.locator('#whatsapp-app-secret').fill(secrets.appSecret);
      await panel.locator('#whatsapp-verify-token').fill(secrets.verifyToken);
      await panel.locator('#whatsapp-port').fill('8789');
    };
    await fillCredentials();
    await panel.getByRole('button', { name: 'Connect WhatsApp', exact: true }).click();
    await panel.getByText('WhatsApp access token rejected. Reconnect with a valid token.', { exact: true }).first().waitFor();
    for (const field of ['access-token', 'app-secret', 'verify-token']) assert.equal(await panel.locator('#whatsapp-' + field).inputValue(), '', 'failed connect must also clear secrets');
    await fillCredentials();
    await panel.getByRole('button', { name: 'Connect WhatsApp', exact: true }).click();
    await panel.getByText('Local listener ready', { exact: true }).waitFor();
    await panel.getByRole('img', { name: 'Scan to open a single-use WhatsApp pairing message' }).waitFor();
    const status = await page.evaluate(() => window.cth.whatsappStatus());
    assert.ok(status.localWebhookUrl.startsWith('http://127.0.0.1:8789/'));
    assert.ok(status.pairingQr.startsWith('data:image/png;base64,'));
    assert.ok(!Object.values(secrets).some(secret => JSON.stringify(status).includes(secret)));
    assert.ok((await panel.innerText()).includes('phone delivery are not yet verified'));
    assert.ok((await panel.innerText()).includes('not WhatsApp Web'));
    const encrypted = await app.evaluate(({ app, safeStorage }, { loader, secrets }) => {
      const { getSecret } = globalThis.tgRequire(loader)('src/main/integrations.ts');
      const blob = globalThis.tgRequire('node:fs').readFileSync(app.getPath('userData') + '/integration-secrets.json', 'utf8');
      const stored = JSON.parse(getSecret('crewlo.messaging.whatsapp.credentials'));
      const state = JSON.stringify(globalThis.waDb.getKv('messaging.whatsapp.v1'));
      return safeStorage.isEncryptionAvailable() && Object.entries(secrets).every(([key, value]) => stored[key] === value && !blob.includes(value) && !state.includes(value));
    }, { loader: resolve('test/load-ts.cjs'), secrets });
    assert.ok(encrypted, 'real OS vault must round-trip without plaintext secrets in JSON/SQLite');
    const challenge = new URL(status.localWebhookUrl);
    challenge.searchParams.set('hub.mode', 'subscribe'); challenge.searchParams.set('hub.verify_token', secrets.verifyToken); challenge.searchParams.set('hub.challenge', 'fixture-challenge');
    assert.equal(await (await fetch(challenge)).text(), 'fixture-challenge');
    const pairingText = new URL(status.pairingLink).searchParams.get('text');
    assert.equal((await post(status.localWebhookUrl, inbound('pairing', pairingText), false)).status, 401);
    assert.equal((await page.evaluate(() => window.cth.whatsappStatus())).candidate, undefined);
    assert.equal((await post(status.localWebhookUrl, inbound('pairing', pairingText))).status, 200);
    await panel.getByText('Fixture owner · WhatsApp ID 15555550199', { exact: true }).waitFor();
    assert.equal(await app.evaluate(() => globalThis.waRouted.length), 0, 'must await desktop confirmation');
    await panel.getByRole('button', { name: 'Confirm pairing', exact: true }).click();
    await panel.getByText('Paired with Fixture owner · WhatsApp ID 15555550199', { exact: true }).waitFor();
    await panel.locator('#whatsapp-agent').selectOption('remy');
    await page.waitForFunction(async () => (await window.cth.whatsappStatus()).defaultAgent === 'remy');
    await page.screenshot({ path: 'docs/crewlo/whatsapp-setup-ui.png' });
    const request = inbound('request-1', 'Check the layout from my phone.');
    assert.equal((await post(status.localWebhookUrl, request)).status, 200);
    assert.equal((await post(status.localWebhookUrl, request)).status, 200);
    await eventually(() => app.evaluate(() => globalThis.waRouted.length === 1));
    assert.equal((await post(status.localWebhookUrl, inbound('other-owner', 'Ignore the owner!', '15555550198'))).status, 200);
    await app.evaluate(() => {
      const row = globalThis.waRouted[0];
      globalThis.waIntegration.reply({ id: 'fixture-reply', from: 'remy', to: 'human', act: 'inform', conversation: 'remote:' + row.id, in_reply_to: row.id, public_reply: 'The layout checks passed.' });
    });
    await eventually(() => page.evaluate(async () => (await window.cth.messagingHistory('remy')).some(row => row.status === 'accepted')));
    const sent = await app.evaluate(() => globalThis.waSent.find(row => row.text === 'Remy · The layout checks passed.'));
    assert.ok(sent);
    assert.equal(sent.to, ownerId);
    assert.equal(await app.evaluate(() => globalThis.waRouted.length), 1, 'duplicate and unpaired owner must not dispatch work');
    await page.getByRole('button', { name: /^close$/i }).click();
    await page.evaluate(async () => {
      const { useStore } = await import('/src/store/store.ts');
      useStore.setState({ agents: [{ id: 'remy', name: 'Remy', character: 'michael', accent: 'mint', description: 'UI fixture', project: 'Fixture', tmuxTarget: '', cwd: '', status: 'idle', ptyId: undefined, action: '', progress: 0, isGod: true }], selectedId: 'remy', godStatus: 'ready', ccTabRequest: { tab: 'messages', seq: 1 } });
      window.dispatchEvent(new Event('crewlo:open-agent'));
    });
    await page.locator('.crewlo-whatsapp-badge').first().waitFor();
    await page.getByText('Accepted by Meta · delivery not confirmed', { exact: true }).waitFor();
    assert.ok(!(await page.locator('body').innerText()).includes('CREWLO_REMOTE_REPLY'));
    assert.equal((await post(status.localWebhookUrl, envelope({ statuses: [{ id: sent.id, recipient_id: ownerId, status: 'delivered' }] }))).status, 200);
    await page.getByText('Delivered to WhatsApp', { exact: true }).waitFor();
    assert.equal((await post(status.localWebhookUrl, envelope({ statuses: [{ id: sent.id, recipient_id: ownerId, status: 'read' }] }))).status, 200);
    await page.getByText('Read on WhatsApp', { exact: true }).waitFor();
    await page.screenshot({ path: 'docs/crewlo/whatsapp-conversation-ui.png' });
    await page.getByRole('button', { name: 'WhatsApp', exact: true }).click();
    await panel.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await panel.locator('#whatsapp-access-token').waitFor();
    assert.equal((await page.evaluate(() => window.cth.whatsappStatus())).hasCredentials, false);
    assert.equal(await app.evaluate((_, loader) => globalThis.tgRequire(loader)('src/main/integrations.ts').getSecret('crewlo.messaging.whatsapp.credentials'), resolve('test/load-ts.cjs')), undefined);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(720, 900));
    await page.waitForTimeout(200);
    assert.ok(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'narrow panel must not overflow horizontally');
    await app.evaluate(() => { globalThis.waIntegration.stop(); globalThis.waDb.close(); });
    console.log('PASS WhatsApp Electron integration: real OS encryption/SQLite/IPC, loopback challenge/HMAC verification, secret clearing, QR/desktop confirmation, owner-only dedup dispatch, mocked Meta reply with real receipt callbacks, Conversation badges, Disconnect and narrow panel. Live Meta/phone/provider untested.');
  } finally { if (app) await app.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
