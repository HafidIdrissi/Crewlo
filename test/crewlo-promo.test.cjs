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
  assert.match(html, /<title>Crewlo — Your AI agents\. One clear workspace\.<\/title>/);
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
  assert.deepEqual(steps, ['direct', 'observe', 'connect']);
  assert.deepEqual(panels, ['direct', 'observe', 'connect']);
  assert.match(html, /role="tablist"/);
  const guide = read('docs/install.html');
  assert.match(guide, /id="install-command"/);
  assert.match(guide, /data-copy-command/);
  assert.match(guide, /id="copy-status"/);
  assert.doesNotMatch(html, /id="install-command"/, 'Long setup commands live in the dedicated guide');
  assert.ok((html.match(/<details(?:\s|>)/g) || []).length >= 3, 'FAQ answers use native keyboard-operable disclosure controls');
  assert.match(read('docs/crewlo-site.css'), /prefers-reduced-motion\s*:\s*reduce/);
});

test('Voxel landing explains the product before setup and optional integrations', () => {
  const html = read('docs/index.html');
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  assert.equal(heading, 'Your AI agents. One clear workspace.');
  const hero = html.match(/<section\b[^>]*class="[^"]*\bhero\b[^"]*"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(hero, 'Prominent hero section is present');
  const header = html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/)?.[1];
  for (const target of ['experience', 'demo', 'connect']) assert.match(header, new RegExp(`href="#${target}"`));
  for (const channel of ['telegram', 'whatsapp']) {
    assert.doesNotMatch(header, new RegExp(`href="#${channel}"`), 'Messaging is grouped under Integrations');
    assert.match(html, new RegExp(`<details\\b[^>]*id="${channel}"`), `Integration #${channel} remains a native disclosure`);
  }
  assert.doesNotMatch(hero, /first-steps/);
  assert.match(hero, /one visual workspace on your computer/);
  assert.match(hero, /Build your crew\.<br>\s*Block by block\./);
  assert.match(hero, /data-image-preview/);
  assert.match(hero, /Explore the demo/);
  assert.match(hero, /href="install\.html"/);
  assert.match(hero, /Early-stage · Windows source preview/);
  assert.match(header, /aria-controls="main-nav"/);
  const setup = html.match(/<section\b[^>]*id="start"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.match(setup, /install\.html#requirements/);
  assert.match(setup, /install\.html#connect-agent/);
  assert.match(setup, /install\.html#first-mission/);
  const sections = ['demo', 'experience', 'start', 'connect', 'proof', 'faq', 'support'];
  const positions = sections.map(id => html.indexOf(`id="${id}"`));
  assert.ok(positions.every((position, i) => position >= 0 && (!i || position > positions[i - 1])), 'Product tour leads into setup, integrations, evidence, FAQ and final installation');
  const support = html.match(/<section\b[^>]*id="support"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.match(support, /href="install\.html"/);
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
  assert.match(guide, /<html\b[^>]*lang="en"/);
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
  const html = read('docs/messaging-setup.html');
  assert.match(html, /data-motion="crewlo\/demo\/whatsapp-phone-preview\.gif"/);
  assert.match(html, /src="crewlo\/demo\/whatsapp-phone-poster\.png"/, 'Phone animation loads only on request');
  assert.match(html, /scripted chat, not a live WhatsApp exchange/);
});
test('Unconfigured beneficiary is not silently replaced by an upstream payment link', () => {
  const config = JSON.parse(read('docs/crewlo-links.json'));
  assert.equal(config.repositoryUrl, 'https://github.com/HafidIdrissi/crewlo');
  if (config.coffeeUrl !== null) assert.match(config.coffeeUrl, /^https:\/\/(?:www\.)?buymeacoffee\.com\/[A-Za-z0-9_-]+\/?$/);
  assert.doesNotMatch(read('docs/index.html'), /data-coffee|coffee-status|Buy me a coffee/);
  assert.match(read('README.md'), /shown only after the maintainer supplies/);
  assert.doesNotMatch(read('.github/FUNDING.yml'), /razorpay\.me|munderdifflinfund/);
  if (fs.existsSync(path.join(docs, 'CNAME'))) assert.notEqual(read('docs/CNAME').trim(), 'munderdiffl.in', 'Do not publish the fork under the upstream domain');
});


test('Source guide and status pages keep a complete local navigation and honest evidence', () => {
  for (const file of ['docs/install.html', 'docs/project-status.html', 'docs/messaging-setup.html']) {
    const html = read(file);
    assert.match(html, /<html lang="en"/);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `Unique anchors in ${file}`);
    for (const match of html.matchAll(/(?:src|href|poster|data-motion|data-still)="([^"]+)"/g)) {
      localTarget(match[1]);
      if (match[1].startsWith('#')) assert.ok(ids.includes(match[1].slice(1)), `${file}: ${match[1]}`);
    }
    for (const match of html.matchAll(/data-copy-command="([^"]+)"/g)) assert.ok(ids.includes(match[1]), 'Copy control targets a displayed command');
    assert.doesNotMatch(html, /href="[^"]+\.(?:exe|dmg|appimage)"/i);
  }
  const html = read('docs/index.html');
  const transcript = JSON.parse(read('docs/crewlo/demo/telegram-phone-transcript.json'));
  assert.ok(html.includes(transcript.request));
  assert.ok(html.includes(transcript.reply.replace('Remy · ', '')));
  assert.match(html, /Still to capture:/);
  assert.match(html, /EXPERIMENTAL · LIVE TEST PENDING/);
  assert.match(html, /Agent CLIs can send prompts and code/);
  assert.match(read('docs/install.html'), /Python 3/);
  assert.match(read('docs/install.html'), /Spectre/);
});
