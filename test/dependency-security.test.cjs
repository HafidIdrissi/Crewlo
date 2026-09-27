const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');

test('the tunnel parser still accepts configuration but rejects prototype pollution and excessive nesting', () => {
  const tunnelRequire = createRequire(require.resolve('tunnelmole'));
  const toml = tunnelRequire('toml');
  assert.equal(toml.parse('port = 3000\n[server]\nhost = "localhost"').server.host, 'localhost');
  assert.throws(() => toml.parse('a=' + '['.repeat(10000) + '0' + ']'.repeat(10000)), /Maximum nesting depth/);
  try { toml.parse('[__proto__]\ncrewloPolluted=true'); } catch { /* Safe rejection is also allowed. */ }
  assert.equal({}.crewloPolluted, undefined);
});
