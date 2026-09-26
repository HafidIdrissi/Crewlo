const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const docs = path.join(root, 'docs');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function localTarget(value, from = docs) {
  if (!value || /^(?:https?:|data:|mailto:|tel:|#)/i.test(value)) return;
  const pathname = decodeURIComponent(value.split(/[?#]/)[0]);
  if (!pathname) return;
  const target = path.resolve(from, pathname.replace(/^\//, ''));
  assert.ok(target === docs || target.startsWith(docs + path.sep), `Asset escapes public docs directory: ${value}`);
  assert.ok(fs.existsSync(target), `Missing local asset: ${value}`);
  const hash = value.includes('#') ? decodeURIComponent(value.slice(value.indexOf('#') + 1)) : '';
  if (hash && /\.html?$/i.test(target)) {
    const ids = [...fs.readFileSync(target, 'utf8').matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.ok(ids.includes(hash), `Missing local HTML anchor: ${value}`);
  }
}
test('Crewlo landing uses local media, real repository links and explicit demo disclosure', () => {
  const html = read('docs/index.html');
  assert.match(html, /<title>Crewlo — Your agents\. One living workspace\.<\/title>/);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, 'One clear page heading');
  assert.match(html, /<main\b[^>]*id="main"/);
  assert.match(html, /Scripted (?:interface )?demo/i);
  assert.match(html, /No live AI execution or real Telegram delivery/i);
  assert.match(html, /https:\/\/github.com\/HafidIdrissi\/crewlo/);
  assert.doesNotMatch(html, /googletagmanager|posthog|starct|razorpay|harnessmd\.com/);
  assert.doesNotMatch(html, /<video[^>]*autoplay/);
  assert.match(html, /<track\b[^>]*kind="captions"/);
  assert.doesNotMatch(html, /href="[^"]+\.(?:exe|dmg|appimage)(?:[?#][^"]*)?"/i, 'No unverified installer download');
  assert.doesNotMatch(html, /Download (?:Crewlo )?for (?:Windows|macOS|Linux)/i, 'Source-only install must not imply a published installer');
  for (const match of html.matchAll(/(?:src|href|poster|data-motion|data-still)="([^"]+)"/g)) localTarget(match[1]);
  for (const match of read('docs/crewlo-site.css').matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) localTarget(match[1]);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate ids break tab, label and anchor relationships');
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(decodeURIComponent(match[1])), `Missing anchor: #${match[1]}`);
});

test('Landing contains keyboard demo, copy feedback, FAQ and reduced-motion contracts', () => {
  const html = read('docs/index.html');
  const steps = [...html.matchAll(/data-demo-step="([^"]+)"/g)].map(match => match[1]);
  const panels = [...html.matchAll(/data-demo-panel="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(steps, ['observe', 'direct', 'connect']);
  assert.deepEqual(panels, ['observe', 'direct', 'connect']);
  assert.match(html, /role="tablist"/);
  assert.match(html, /id="install-command"/);
  assert.match(html, /data-copy-command/);
  assert.match(html, /id="copy-status"/);
  assert.ok((html.match(/<details(?:\s|>)/g) || []).length >= 3, 'FAQ answers use native keyboard-operable disclosure controls');
  assert.match(read('docs/crewlo-site.css'), /prefers-reduced-motion\s*:\s*reduce/);
});

test('Voxel landing guides a first mission before optional messaging', () => {
  const html = read('docs/index.html');
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  assert.equal(heading, 'Build your crew. Block by block.');
  const hero = html.match(/<section\b[^>]*class="[^"]*\bhero\b[^"]*"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(hero, 'Prominent hero section is present');
  const header = html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/)?.[1];
  for (const channel of ['telegram', 'whatsapp']) {
    assert.match(header, new RegExp(`href="#${channel}"`), `Navigation exposes ${channel}`);
    assert.match(html, new RegExp(`<article\\b[^>]*id="${channel}"`), `Messaging card #${channel} exists`);
  }
  assert.deepEqual([...hero.matchAll(/<li><a href="([^"]+)"/g)].map(match => match[1]), ['#start', '#connect-agent', '#first-mission', '#connect']);
  assert.match(hero, /Optional/);
  const start = html.indexOf('id="start"');
  const foundation = html.indexOf('class="foundation');
  const connect = html.indexOf('id="connect"');
  const experience = html.indexOf('id="experience"');
  assert.ok(foundation >= 0 && foundation < start && start < connect && connect < experience, 'Desktop setup comes before optional messaging');
});

test('Voxel typography is locally hosted with retained font licensing', () => {
  const css = read('docs/crewlo-site.css');
  for (const file of ['press-start-2p-latin-400.woff2', 'inter-latin-var.woff2']) {
    const bytes = fs.readFileSync(path.join(docs, 'crewlo/fonts', file));
    assert.equal(bytes.subarray(0, 4).toString(), 'wOF2', `${file} is a real WOFF2 font`);
    assert.ok(bytes.length > 1000 && bytes.length < 1024 * 1024, `${file} stays locally shareable`);
    assert.ok(css.includes(`crewlo/fonts/${file}`), `Styles use the local ${file}`);
  }
  const licenses = fs.readdirSync(path.join(docs, 'crewlo/fonts')).filter(file => /license|ofl/i.test(file));
  assert.ok(licenses.length > 0, 'Font license text ships beside the local fonts');
  const licenseText = licenses.map(file => fs.readFileSync(path.join(docs, 'crewlo/fonts', file), 'utf8')).join('\n');
  assert.match(licenseText, /Open Font License|SIL OPEN FONT LICENSE|Apache License/i);
  assert.doesNotMatch(css, /fonts\.googleapis\.com|fonts\.gstatic\.com/, 'Fonts do not make a third-party request');
});

test('Messaging setup links resolve to shipped HTML instead of unpublished GitHub documents', () => {
  const html = read('docs/index.html');
  for (const channel of ['telegram', 'whatsapp']) {
    assert.match(html, new RegExp(`href="messaging-setup\\.html#${channel}"`));
    localTarget(`messaging-setup.html#${channel}`);
  }
  assert.doesNotMatch(html, /href="https:\/\/github\.com\/HafidIdrissi\/crewlo\/blob\/main\/docs\/(?:telegram-setup|messageries-tests\.fr)\.md/);
  const guide = read('docs/messaging-setup.html');
  assert.match(guide, /<html\b[^>]*lang="fr"/);
  assert.match(guide, /href="(?:\.\/)?index\.html(?:#[^"]*)?"/);
  for (const match of guide.matchAll(/(?:src|href|poster)="([^"]+)"/g)) localTarget(match[1]);
  const ids = [...guide.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of guide.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(decodeURIComponent(match[1])), `Missing guide anchor: #${match[1]}`);
});
test('Promo media have expected formats and remain small enough to share', () => {
  for (const name of ['studio-activity.gif', 'telegram-pairing.gif']) {
    const bytes = fs.readFileSync(path.join(docs, 'crewlo/demo', name));
    assert.match(bytes.subarray(0, 6).toString(), /^GIF8[79]a$/);
    assert.ok(bytes.length < 5 * 1024 * 1024);
    assert.equal(bytes.readUInt16LE(6), 960);
    assert.equal(bytes.readUInt16LE(8), 600);
  }
  const video = fs.readFileSync(path.join(docs, 'crewlo/demo/crewlo-demo.mp4'));
  assert.equal(video.subarray(4, 8).toString(), 'ftyp');
  assert.ok(video.length < 10 * 1024 * 1024);
  assert.match(read('docs/crewlo/demo/crewlo-demo.vtt'), /^WEBVTT/);
});
test('WhatsApp phone preview stays shareable and explicitly illustrative', () => {
  const dir = path.join(docs, 'crewlo/demo');
  const gif = fs.readFileSync(path.join(dir, 'whatsapp-phone-preview.gif'));
  assert.match(gif.subarray(0, 6).toString(), /^GIF8[79]a$/);
  assert.equal(gif.readUInt16LE(6), 960);
  assert.equal(gif.readUInt16LE(8), 1440);
  assert.ok(gif.length < 5 * 1024 * 1024);
  const video = fs.readFileSync(path.join(dir, 'whatsapp-phone-preview.mp4'));
  assert.equal(video.subarray(4, 8).toString(), 'ftyp');
  assert.ok(video.length < 10 * 1024 * 1024);
  assert.ok(fs.existsSync(path.join(dir, 'whatsapp-phone-poster.png')));
  assert.match(read('tools/render-whatsapp-phone-preview.py'), /Not yet live-tested/);
  assert.match(read('docs/crewlo/demo/whatsapp-phone-preview.md'), /illustrative preview/i);
  assert.match(read('README.md'), /not a WhatsApp conversation or proof of delivery/i);
  const html = read('docs/index.html');
  assert.match(html, /<img class="channel-demo" src="crewlo\/demo\/whatsapp-phone-preview\.gif"/);
  assert.match(html, /scripted chat, not a live WhatsApp exchange/);
});
test('Unconfigured beneficiary is not silently replaced by an upstream payment link', () => {
  const config = JSON.parse(read('docs/crewlo-links.json'));
  assert.equal(config.repositoryUrl, 'https://github.com/HafidIdrissi/crewlo');
  if (config.coffeeUrl !== null) assert.match(config.coffeeUrl, /^https:\/\/(?:www\.)?buymeacoffee\.com\/[A-Za-z0-9_-]+\/?$/);
  assert.match(read('docs/index.html'), /<a\b(?=[^>]*data-coffee)(?=[^>]*aria-disabled="true")[^>]*>/);
  assert.match(read('README.md'), /disabled until the maintainer supplies/);
  assert.doesNotMatch(read('.github/FUNDING.yml'), /razorpay\.me|munderdifflinfund/);
  if (fs.existsSync(path.join(docs, 'CNAME'))) assert.notEqual(read('docs/CNAME').trim(), 'munderdiffl.in', 'Do not publish the fork under the upstream domain');
});
