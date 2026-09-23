const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = name => readFileSync(join(root, name), 'utf8');
const repo = 'github.com/HafidIdrissi/Crewlo';

test('the README leads with the studio and accurately scoped real Telegram demo', () => {
  const readme = read('README.md');
  assert.match(readme, /docs\/crewlo\/demo\/studio-activity\.gif/);
  assert.match(readme, /docs\/crewlo\/demo\/telegram-phone-demo\.gif/);
  assert.match(readme, /verified in Telegram Web/i);
  assert.match(readme, /recreated and the wait is condensed/i);
  assert.match(readme, /no verified installer or release feed/i);
  assert.match(readme, /https:\/\/hafididrissi\.github\.io\/Crewlo\//);
});

test('community entry points lead to Crewlo, not the inherited project', () => {
  const files = [
    'CONTRIBUTING.md', 'SECURITY.md', '.github/CODEOWNERS',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/ISSUE_TEMPLATE/config.yml',
    '.github/ISSUE_TEMPLATE/bug_report.yml',
    '.github/ISSUE_TEMPLATE/feature_request.yml',
    '.github/ISSUE_TEMPLATE/other.yml',
    '.github/workflows/pr-evidence.yml',
  ];
  for (const file of files) {
    const content = read(file);
    assert.doesNotMatch(content, /github\.com\/chaitanyagiri\/munder-difflin|discord\.gg\/SEDzP5ZPk5|girichaitanya11@gmail\.com/i, file);
  }
  assert.match(read('CONTRIBUTING.md'), new RegExp(repo));
  assert.match(read('SECURITY.md'), /HafidIdrissi\/Crewlo\/security\/advisories\/new/);
  assert.match(read('.github/CODEOWNERS'), /\* @HafidIdrissi/);
});

test('source-first CI and release automation do not claim an unverified download', () => {
  const ci = read('.github/workflows/ci.yml');
  const release = read('.github/workflows/release.yml');
  assert.match(ci, /node-version: 22\.22\.0/);
  assert.match(ci, /npm run test:crewlo/);
  assert.doesNotMatch(release, /^  push:\s*$/m);
  assert.match(release, /^  workflow_dispatch:\s*$/m);
  assert.match(read('RELEASE.md'), /Historical upstream release note/);
  assert.match(read('RELEASE-CHECKLIST.md'), /Historical upstream checklist/);
  assert.match(read('CONTRIBUTORS.md'), /not.*a list of Crewlo contributors/i);
  assert.doesNotMatch(read('CODE_OF_CONDUCT.md'), /INSERT CONTACT METHOD/);
});
