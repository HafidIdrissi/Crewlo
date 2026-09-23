'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createHmac } = require('node:crypto');
const http = require('node:http');
const loadTs = require('./load-ts.cjs');
const { WhatsAppHttpApi, WhatsAppError, splitWhatsAppReply } = loadTs('src/main/messaging/whatsappApi.ts');
const { createWhatsAppWebhook, extractWhatsAppEvents } = loadTs('src/main/messaging/whatsappWebhook.ts');

const credentials = { accessToken: 'EA_FAKE_SECRET_never_log', phoneNumberId: '123456789', appSecret: 'FAKE_app_secret', verifyToken: 'FAKE_verify_token', apiVersion: 'v26.0' };
const OWNER = '33612345678';
function mockTransport(result, statusCode = 200, options = {}) {
  const seen = {};
  return { seen, request(requestOptions, callback) {
    seen.options = requestOptions;
    if (options.throw) throw Error(credentials.accessToken);
    const req = new EventEmitter();
    req.destroy = () => { req.emit('error', Error(credentials.accessToken)); req.emit('close'); };
    req.end = body => {
      seen.body = body ? JSON.parse(body) : undefined;
      queueMicrotask(() => {
        if (options.network) { req.destroy(); return; }
        const res = new EventEmitter();
        res.statusCode = statusCode; res.headers = options.headers || {};
        callback(res);
        if (options.aborted) res.emit('aborted');
        else { res.emit('data', Buffer.from(options.raw ?? JSON.stringify(result))); res.emit('end'); }
        req.emit('close');
      });
    };
    return req;
  } };
}
function payload(messages = [], statuses = [], overrides = {}) {
  return { object: 'whatsapp_business_account', entry: [{ id: '999', changes: [{ field: 'messages', value: {
    messaging_product: 'whatsapp', metadata: { phone_number_id: credentials.phoneNumberId },
    contacts: [{ wa_id: OWNER, profile: { name: 'Owner' } }], messages, statuses, ...overrides
  } }] }] };
}
const incoming = (overrides = {}) => ({ id: 'wamid.inbound_01==', from: OWNER, timestamp: '1790064000', type: 'text', text: { body: 'Bonjour' }, ...overrides });
const sign = body => 'sha256=' + createHmac('sha256', credentials.appSecret).update(body).digest('hex');
async function receiver(t, onPayload = () => {}) {
  const server = await createWhatsAppWebhook({ ...credentials, port: 0, onPayload });
  t.after(() => server.close());
  return server;
}
function call(server, method = 'POST', body = JSON.stringify(payload([incoming()])), extra = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: server.port, path: extra.path ?? '/whatsapp/webhook', method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sign(body), ...extra.headers } : extra.headers }, res => {
      let result = ''; res.setEncoding('utf8'); res.on('data', chunk => result += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: result, headers: res.headers }));
    });
    req.on('error', reject); req.end(method === 'POST' ? body : undefined);
  });
}

test('Cloud API verification uses only official HTTPS host and bearer header', async () => {
  const mock = mockTransport({ id: credentials.phoneNumberId, display_phone_number: '+33 6 12 34 56 78' });
  const controller = new AbortController();
  assert.deepEqual(await new WhatsAppHttpApi(credentials, mock.request).verify(controller.signal), { displayPhoneNumber: '+33 6 12 34 56 78' });
  assert.equal(mock.seen.options.hostname, 'graph.facebook.com');
  assert.equal(mock.seen.options.path, '/v26.0/123456789?fields=display_phone_number');
  assert.equal(mock.seen.options.method, 'GET');
  assert.equal(mock.seen.options.headers.Authorization, 'Bearer ' + credentials.accessToken);
  assert.equal(mock.seen.options.signal, controller.signal);
  assert.equal(mock.seen.body, undefined);
  assert.ok(!mock.seen.options.path.includes(credentials.accessToken));
});

test('Cloud API sends individual plain text and validates the accepted message ID', async () => {
  const mock = mockTransport({ messaging_product: 'whatsapp', messages: [{ id: 'wamid.accepted_01==' }] });
  assert.deepEqual(await new WhatsAppHttpApi(credentials, mock.request).sendText(OWNER, 'Remy · Bonjour'), { id: 'wamid.accepted_01==' });
  assert.equal(mock.seen.options.path, '/v26.0/123456789/messages');
  assert.equal(mock.seen.options.method, 'POST');
  assert.deepEqual(mock.seen.body, { messaging_product: 'whatsapp', recipient_type: 'individual', to: OWNER,
    type: 'text', text: { body: 'Remy · Bonjour', preview_url: false } });
  for (const result of [{ messages: [] }, { messages: [{ id: 'attacker\n' + credentials.accessToken }] }, { messages: 'bad' }]) {
    await assert.rejects(new WhatsAppHttpApi(credentials, mockTransport(result).request).sendText(OWNER, 'hi'), error => error.uncertain && !error.message.includes(credentials.accessToken));
  }
});

test('Cloud API validation prevents host/path/header injection and invalid recipients', async () => {
  for (const patch of [{ phoneNumberId: '../secret' }, { apiVersion: 'https://other.test' }, { accessToken: 'x\r\nOther: value' }, { accessToken: '' }]) {
    assert.throws(() => new WhatsAppHttpApi({ ...credentials, ...patch }), WhatsAppError);
  }
  const never = () => { throw Error('must not be called'); };
  const api = new WhatsAppHttpApi(credentials, never);
  for (const [to, text] of [['bad@group', 'hi'], [OWNER, ''], [OWNER, 'x'.repeat(4097)]]) {
    await assert.rejects(api.sendText(to, text), error => error instanceof WhatsAppError && !error.uncertain);
  }
  const abort = new AbortController(); abort.abort();
  await assert.rejects(api.verify(abort.signal), WhatsAppError);
  const wrongPhone = mockTransport({ id: 'other', display_phone_number: '+33123456789' });
  await assert.rejects(new WhatsAppHttpApi(credentials, wrongPhone.request).verify(), WhatsAppError);
});

test('Cloud API errors are sanitized and retain rate-limit, permissions and reply-window meaning', async () => {
  for (const code of [190, 10, 200, 131030, 131026, 131047, 130429, 131056]) {
    const mock = mockTransport({ error: { code, message: credentials.accessToken, error_data: { details: credentials.appSecret } } }, 400,
      { headers: { 'retry-after': '17' } });
    await assert.rejects(new WhatsAppHttpApi(credentials, mock.request).sendText(OWNER, 'hi'), error => {
      assert.ok(error instanceof WhatsAppError); assert.equal(error.code, code); assert.equal(error.uncertain, false);
      assert.ok(!error.message.includes(credentials.accessToken)); assert.ok(!error.message.includes(credentials.appSecret));
      if (code === 131047) assert.match(error.message, /reply window expired/);
      if ([130429, 131056].includes(code)) assert.equal(error.retryAfter, 17);
      return true;
    });
  }
  const capped = mockTransport({ error: { code: 130429 } }, 429, { headers: { 'retry-after': '999999' } });
  await assert.rejects(new WhatsAppHttpApi(credentials, capped.request).sendText(OWNER, 'hi'), error => error.retryAfter === 3600);
});

test('network, server, truncated and malformed send outcomes are explicitly uncertain', async () => {
  for (const mock of [mockTransport(null, 0, { network: true }), mockTransport(null, 0, { aborted: true }),
    mockTransport({ error: { code: 2, message: credentials.accessToken } }, 503), mockTransport(null, 200, { raw: '<secret>' }),
    mockTransport(null, 200, { raw: 'x'.repeat(2_000_001) }), mockTransport(null, 0, { throw: true })]) {
    await assert.rejects(new WhatsAppHttpApi(credentials, mock.request).sendText(OWNER, 'hi'), error => {
      assert.ok(error.uncertain); assert.ok(!error.message.includes(credentials.accessToken)); return true;
    });
  }
  await assert.rejects(new WhatsAppHttpApi(credentials, mockTransport(null, 0, { network: true }).request).verify(), error => !error.uncertain);
});

test('long replies keep agent names on every chunk without splitting surrogate pairs', () => {
  const text = '😀'.repeat(6000) + '\nBonjour';
  const parts = splitWhatsAppReply('Rémy', text);
  assert.ok(parts.length > 1);
  assert.equal(parts.map(part => part.slice('Rémy · '.length)).join(''), text);
  for (const part of parts) { assert.ok(part.startsWith('Rémy · ')); assert.ok(part.length <= 4000); assert.ok(!/[\uD800-\uDBFF]$/.test(part)); }
  assert.deepEqual(splitWhatsAppReply('Rémy', ''), []);
  assert.ok(splitWhatsAppReply('A'.repeat(79) + '😀', 'text')[0].startsWith('A'.repeat(79) + ' · '));
});

test('webhook event extraction validates account, target number and individual sender and keeps attachments unsupported', () => {
  const events = extractWhatsAppEvents(payload([incoming(), incoming({ id: 'wamid.media', type: 'image', image: { id: 'media' } })], [
    { id: 'wamid.sent', status: 'delivered', recipient_id: OWNER },
    { id: 'wamid.failed', status: 'failed', recipient_id: OWNER, errors: [{ code: 131047, message: credentials.accessToken }] }
  ]), credentials.phoneNumberId);
  assert.deepEqual(events.messages[0], { id: 'wamid.inbound_01==', from: OWNER, name: 'Owner', text: 'Bonjour', timestamp: 1790064000000, phoneNumberId: credentials.phoneNumberId });
  assert.equal(events.messages[1].text, undefined);
  assert.deepEqual(events.statuses, [{ id: 'wamid.sent', status: 'delivered', recipient: OWNER }, { id: 'wamid.failed', status: 'failed', recipient: OWNER, errorCode: 131047 }]);
  assert.ok(!JSON.stringify(events).includes(credentials.accessToken));
  for (const invalid of [null, [], {}, { ...payload([incoming()]), object: 'page' }, payload([incoming()], [], { metadata: { phone_number_id: 'other' } }),
    payload([incoming()], [], { group_id: 'abc' }), payload([incoming()], [], { messaging_product: 'instagram' })]) {
    assert.deepEqual(extractWhatsAppEvents(invalid, credentials.phoneNumberId), { messages: [], statuses: [] });
  }
});

test('webhook parser rejects malformed IDs, usernames, groups and timestamps', () => {
  const invalid = [incoming({ id: '../path' }), incoming({ from: 'owner_name' }), incoming({ from: OWNER + '@g.us' }), incoming({ group_id: 'group' }),
    incoming({ context: { group_id: 'group' } }), incoming({ recipient_type: 'group' }), incoming({ timestamp: 'NaN' }), incoming({ timestamp: 0 }), null];
  const events = extractWhatsAppEvents(payload(invalid, [{ id: 'bad', status: 'sent', recipient_id: OWNER }, { id: 'wamid.ok', status: 'pending', recipient_id: OWNER }]), credentials.phoneNumberId);
  assert.deepEqual(events, { messages: [], statuses: [] });
});

test('loopback webhook handshake checks exact mode/token and bounded challenge', async t => {
  const server = await receiver(t);
  const query = new URLSearchParams({ 'hub.mode': 'subscribe', 'hub.verify_token': credentials.verifyToken, 'hub.challenge': '12345' });
  const response = await call(server, 'GET', '', { path: '/whatsapp/webhook?' + query });
  assert.equal(response.status, 200); assert.equal(response.body, '12345');
  assert.equal(response.headers['access-control-allow-origin'], undefined);
  for (const change of [{ 'hub.mode': 'unsubscribe' }, { 'hub.verify_token': 'wrong' }, { 'hub.challenge': 'x'.repeat(257) }, { 'hub.challenge': '<script>' }]) {
    const invalid = new URLSearchParams(query); for (const [key, value] of Object.entries(change)) invalid.set(key, value);
    assert.equal((await call(server, 'GET', '', { path: '/whatsapp/webhook?' + invalid })).status, 403);
  }
  assert.equal((await call(server, 'GET', '', { path: '/whatsapp/webhook?' + query + '&hub.verify_token=extra' })).status, 403);
});

test('valid raw-body HMAC is accepted only after synchronous durable acceptance', async t => {
  const saved = [];
  const server = await receiver(t, value => saved.push(value));
  const body = JSON.stringify(payload([incoming({ text: { body: '😀 with accented é' } })]), null, 2);
  const response = await call(server, 'POST', body);
  assert.equal(response.status, 200); assert.deepEqual(saved, [JSON.parse(body)]);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['access-control-allow-origin'], undefined);
});

test('webhook rejects missing, malformed, duplicated and forged signatures before callbacks', async t => {
  let calls = 0;
  const server = await receiver(t, () => calls++);
  for (const signature of ['', 'sha256=bad', 'sha256=' + '0'.repeat(64), ['sha256=' + '0'.repeat(64), 'sha256=' + '0'.repeat(64)]]) {
    assert.equal((await call(server, 'POST', '{}', { headers: { 'X-Hub-Signature-256': signature } })).status, 401);
  }
  const original = '{ "a": 1 }';
  assert.equal((await call(server, 'POST', '{"a":1}', { headers: { 'X-Hub-Signature-256': sign(original) } })).status, 401);
  assert.equal(calls, 0);
});

test('webhook rejects invalid JSON, media types, compression and oversized payloads', async t => {
  let calls = 0;
  const server = await receiver(t, () => calls++);
  assert.equal((await call(server, 'POST', '{invalid')).status, 400);
  assert.equal((await call(server, 'POST', '{}', { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await call(server, 'POST', '{}', { headers: { 'Content-Encoding': 'gzip' } })).status, 415);
  const large = 'x'.repeat(256 * 1024 + 1);
  assert.equal((await call(server, 'POST', large)).status, 413);
  assert.equal((await call(server, 'POST', large, { headers: { 'Transfer-Encoding': 'chunked' } })).status, 413);
  assert.equal((await call(server, 'OPTIONS')).status, 405);
  assert.equal((await call(server, 'GET', '', { path: '/anything-else' })).status, 404);
  assert.equal(calls, 0);
});

test('webhook persistence failure returns retryable503 without leaking secrets', async t => {
  const server = await receiver(t, () => { throw Error(credentials.accessToken); });
  const response = await call(server);
  assert.equal(response.status, 503); assert.ok(!response.body.includes(credentials.accessToken));
});

test('webhook refuses accidental asynchronous acceptance and closes idempotently', async t => {
  const server = await receiver(t, async () => { throw Error(credentials.appSecret); });
  assert.equal((await call(server)).status, 503);
  await Promise.all([server.close(), server.close()]);
});

test('webhook listener failures are sanitized', async t => {
  const occupied = await receiver(t);
  await assert.rejects(createWhatsAppWebhook({ ...credentials, port: occupied.port, onPayload: () => {} }), error => /local port/.test(error.message) && !error.message.includes(credentials.appSecret));
  await assert.rejects(createWhatsAppWebhook({ ...credentials, port: -1, onPayload: () => {} }), /configuration is invalid/);
});
