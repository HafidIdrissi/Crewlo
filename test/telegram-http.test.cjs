'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { TelegramHttpApi, TelegramError } = require('./load-ts.cjs')('src/main/messaging/telegramApi.ts');
const TOKEN = '123456:FAKE_TOKEN_abcdefghijklmnopqrstuvwxyz';
function transport(result, statusCode = 200, network = false) {
  const seen = {};
  return { seen, request(options, response) {
    seen.options = options;
    const req = new EventEmitter(); req.destroy = () => req.emit('error', Error('secret-bearing network error: ' + TOKEN));
    req.end = body => { seen.body = JSON.parse(body); queueMicrotask(() => {
      if (network) { req.emit('error', Error('secret: ' + TOKEN)); req.emit('close'); return; }
      const res = new EventEmitter(); res.statusCode = statusCode; res.setEncoding = () => {};
      response(res); res.emit('data', JSON.stringify(result)); res.emit('end'); req.emit('close');
    }); };
    return req;
  } };
}
test('HTTPS Bot API adapter sends official long-poll shape and never surfaces raw API errors', async () => {
  const mock = transport({ ok: true, result: [{ update_id: 7 }] });
  const api = new TelegramHttpApi(TOKEN, mock.request);
  const abort = new AbortController();
  assert.deepEqual(await api.call('getUpdates', { offset: 7, timeout: 25, allowed_updates: ['message'] }, abort.signal), [{ update_id: 7 }]);
  assert.equal(mock.seen.options.hostname, 'api.telegram.org'); assert.equal(mock.seen.options.method, 'POST');
  assert.equal(mock.seen.options.path, '/bot' + TOKEN + '/getUpdates'); assert.equal(mock.seen.options.signal, abort.signal);
  assert.deepEqual(mock.seen.body, { offset: 7, timeout: 25, allowed_updates: ['message'] });
  for (const code of [401, 409, 429, 500]) {
    const failed = transport({ ok: false, error_code: code, description: TOKEN, parameters: { retry_after: 3 } }, code);
    await assert.rejects(new TelegramHttpApi(TOKEN, failed.request).call('sendMessage'), error => {
      assert.ok(error instanceof TelegramError); assert.equal(error.code, code); assert.ok(!error.message.includes(TOKEN));
      if (code === 429) assert.equal(error.retryAfter, 3);
      if (code === 500) assert.equal(error.uncertain, true);
      return true;
    });
  }
});
test('send network failures are ambiguous and sanitized', async () => {
  const mock = transport(null, 0, true);
  await assert.rejects(new TelegramHttpApi(TOKEN, mock.request).call('sendMessage'), error => error.uncertain && !error.message.includes(TOKEN));
});
