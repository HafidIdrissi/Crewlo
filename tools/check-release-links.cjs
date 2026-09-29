#!/usr/bin/env node
'use strict';
// Validate Crewlo release links. A development preview may advertise zero downloads.
// --live checks only actual advertised URLs, never invented or upstream assets.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const version = JSON.parse(read('package.json')).version;
const release = read('RELEASE.md');
const problems = [];
const urls = new Set();
const workshopArchive = 'https://hafididrissi.github.io/Crewlo/crewlo/launch-kit/use-cases/playbooks/crewlo-playbooks-en.zip';
const documentationDownloads = new Set();
const preview = /Not a published release/i.test(release);
for (const file of ['RELEASE.md', 'README.md', 'docs/index.html', 'docs/install.html', 'docs/project-status.html']) {
  const source = read(file);
  for (const match of source.matchAll(/https:\/\/[^\s<>"')]+/g)) {
    const url = match[0];
    if (!/\.(?:exe|dmg|zip|AppImage)(?:[?#]|$)/i.test(url)) continue;
    // This owned Pages archive contains workshop documents, not an installer.
    // Keep the exception exact so unrelated/off-site downloads still fail.
    if (url === workshopArchive) {
      if (!fs.existsSync(path.join(root, 'docs/crewlo/launch-kit/use-cases/playbooks/crewlo-playbooks-en.zip'))) {
        problems.push(`${file}: missing local workshop archive`);
      }
      documentationDownloads.add(url);
      continue;
    }
    if (!url.startsWith('https://github.com/HafidIdrissi/crewlo/releases/')) {
      problems.push(`${file}: download outside the Crewlo release repository: ${url}`);
      continue;
    }
    const namedVersion = /Crewlo-(\d+\.\d+\.\d+)-/.exec(url)?.[1];
    if (namedVersion !== version) problems.push(`${file}: download version does not match ${version}: ${url}`);
    urls.add(url);
  }
}
if (!preview && urls.size === 0) problems.push('Published release notes must contain actual Crewlo downloads.');
if (preview && urls.size) problems.push('Preview notes must not advertise a published installer.');
const describedVersion = /Current version:\s*(\d+\.\d+\.\d+)/.exec(read('docs/llms.txt'))?.[1];
if (describedVersion !== version) problems.push('docs/llms.txt version differs from package.json.');
for (const match of release.matchAll(/\]\(([^)]+)\)/g)) {
  const target = match[1];
  if (/^(?:https?:|#)/.test(target)) continue;
  if (!fs.existsSync(path.resolve(root, target.split('#')[0]))) problems.push(`Missing release documentation: ${target}`);
}
(async () => {
  if (process.argv.includes('--live')) {
    for (const url of [...urls, ...documentationDownloads]) {
      try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
        if (!response.ok) problems.push(`${url}: HTTP ${response.status}`);
      } catch (error) { problems.push(`${url}: ${error.message}`); }
    }
  }
  assert.equal(problems.length, 0, problems.join('\n'));
  console.log(`PASS: Crewlo ${version}; ${urls.size} advertised downloads; ${preview ? 'unpublished preview' : 'release'}; documentation links resolve.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
