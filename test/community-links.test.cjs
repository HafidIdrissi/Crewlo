const test = require('node:test');
const assert = require('node:assert/strict');
const { communityLinks, validatedCommunityLinks } = require('./load-ts.cjs')('src/shared/communityLinks.ts');
test('support targets this Crewlo repo and never invents a donation beneficiary', () => {
  assert.equal(communityLinks.repositoryUrl, 'https://github.com/HafidIdrissi/crewlo');
  const config = require('../docs/crewlo-links.json');
  assert.equal(communityLinks.coffeeUrl, config.coffeeUrl || undefined);
});
test('community URLs accept only HTTPS GitHub repositories and Buy Me a Coffee profiles', () => {
  assert.equal(validatedCommunityLinks({ coffeeUrl: 'https://buymeacoffee.com/example' }).coffeeUrl, 'https://buymeacoffee.com/example');
  for (const coffeeUrl of ['javascript:alert(1)', 'https://buymeacoffee.com.attacker.test/name', 'https://evil@buymeacoffee.com/name', 'https://buymeacoffee.com/name?redirect=bad', 'http://buymeacoffee.com/name']) assert.equal(validatedCommunityLinks({ coffeeUrl }).coffeeUrl, undefined);
});

test('Windows support uses the same guarded beneficiary and cannot inject installer commands', () => {
  const { supportInclude } = require('../build/prepare-support.cjs');
  const config = require('../docs/crewlo-links.json');
  const fs = require('node:fs');
  const path = require('node:path');
  assert.equal(fs.readFileSync(path.join(__dirname, '../build/crewlo-support.nsh'), 'utf8').replace(/\r\n/g, '\n'), supportInclude(config.coffeeUrl));
  for (const value of [null, '', 'http://buymeacoffee.com/name', 'https://buymeacoffee.com.attacker.test/name',
    'https://user@buymeacoffee.com/name', 'https://buymeacoffee.com/name?redirect=bad',
    'https://buymeacoffee.com:444/name', 'https://buymeacoffee.com/name#other',
    'https://buymeacoffee.com/name\"\nExecShell open \"https://attacker.test',
    'https://buymeacoffee.com/$INSTDIR']) {
    assert.doesNotMatch(supportInclude(value), /!define/);
  }
  for (const value of ['https://buymeacoffee.com/crewlo_test_only', 'https://www.buymeacoffee.com/crewlo_test_only']) {
    assert.ok(supportInclude(value).includes(`!define CREWLO_COFFEE_URL "${validatedCommunityLinks({ coffeeUrl: value }).coffeeUrl}"`));
  }
});
