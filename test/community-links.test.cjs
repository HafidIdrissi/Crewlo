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
