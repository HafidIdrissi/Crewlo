// Local-only landing checks. External requests are blocked, never clicked.
// Clipboard is a test double: no user clipboard, shell command or payment runs.
const { chromium } = require(process.env.CREWLO_PLAYWRIGHT || 'playwright');
const { createServer } = require('vite');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
const port = Number(process.env.CREWLO_SITE_TEST_PORT ?? 5184);
assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535, 'CREWLO_SITE_TEST_PORT must be a valid unprivileged port');
const origin = `http://127.0.0.1:${port}`;
const repo = 'https://github.com/HafidIdrissi/crewlo';
const sizes = [[1440, 1000], [1024, 900], [768, 1024], [390, 844], [320, 800]];

async function waitForLocalFonts(page) {
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].map(font => ({ family: font.family, status: font.status, available: document.fonts.check(`16px "${font.family.replace(/^['"]|['"]$/g, '')}"`) }));
  });
  assert.ok(fonts.filter(font => font.status === 'loaded' && font.available).length >= 2, `Local pixel and body fonts must finish loading before layout checks: ${JSON.stringify(fonts)}`);
}

async function messagingAccess(page, width, height) {
  await page.goto(origin + '/');
  assert.equal(await page.locator('[data-channel-panel]:visible').count(), 1, 'Only one messaging demonstration occupies the page');
  assert.equal(await page.locator('#telegram-tab').getAttribute('aria-selected'), 'true');
  assert.equal(await page.locator('[data-channel-panel] details[open]').count(), 0, 'Detailed channel limits start collapsed');
  await page.locator('#telegram-tab').press('ArrowRight');
  assert.equal(await page.locator('#whatsapp-tab').getAttribute('aria-selected'), 'true');
  assert.ok(await page.locator('#whatsapp-panel .experimental').first().isVisible());
  assert.equal(await page.locator('[data-sequence="telegram"]').getAttribute('data-playing'), 'false', 'A hidden channel stops its loop');
  await page.locator('#whatsapp-tab').press('Home');
  assert.equal(await page.locator('#telegram-tab').getAttribute('aria-selected'), 'true');
  const menu = page.locator('.nav-toggle');
  const nav = page.locator('header nav a[href="#connect"]');
  if (width <= 760) {
    await menu.press('Enter');
    assert.equal(await menu.getAttribute('aria-expanded'), 'true');
    await menu.press('Escape');
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    assert.ok(await menu.evaluate(el => el === document.activeElement));
    await menu.press('Enter');
  }
  await nav.press('Enter');
  assert.equal(new URL(page.url()).hash, '#connect');
  if (width <= 760) assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  for (const channel of ['telegram', 'whatsapp']) {
    await page.goto(`${origin}/#${channel}`);
    const card = page.locator(`#connect details#${channel}`);
    assert.ok(await page.locator(`#${channel}-panel`).isVisible(), 'Deep link selects its messaging tab');
    assert.equal(await card.evaluate(el => el.open), true, 'Deep link opens its integration');
    const target = await card.boundingBox();
    const header = await page.locator('header').first().boundingBox();
    assert.ok(target && header && target.y >= header.height - 1 && target.y < height, `${channel} anchor clears the fixed header`);
    const summary = card.locator('summary');
    await summary.press('Enter');
    assert.equal(await card.evaluate(el => el.open), false);
    await summary.press('Space');
    assert.equal(await card.evaluate(el => el.open), true);
    if (width <= 760) assert.equal(await page.locator('[data-integration][open]').count(), 1);
  }
}

async function messagingContrast(page) {
  const readings = await page.locator('header nav a, .quick-start .eyebrow, .quick-start p, .status-label, .experience-tabs button[aria-selected="true"], .button:visible, h1:visible, h2:visible, h3:visible, .hero .lede').evaluateAll(elements => {
    const rgba = text => { const values = text.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0]; return [values[0], values[1], values[2], values[3] ?? 1]; };
    const over = (front, back) => front.slice(0, 3).map((value, i) => value * front[3] + back[i] * (1 - front[3]));
    const luminance = color => color.map(value => { const n = value / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
    return elements.map(el => {
      const chain = []; for (let node = el; node; node = node.parentElement) chain.unshift(node);
      let background = [255, 255, 255];
      for (const node of chain) background = over(rgba(getComputedStyle(node).backgroundColor), background);
      const style = getComputedStyle(el), foreground = over(rgba(style.color), background);
      const a = luminance(foreground), b = luminance(background);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
      return { label: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90), ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05), required: large ? 3 : 4.5 };
    });
  });
  assert.ok(readings.length >= 2);
  for (const reading of readings) assert.ok(reading.ratio >= reading.required, `Messaging text contrast: ${reading.label}: ${reading.ratio.toFixed(2)}:1, expected ${reading.required}:1`);
}

async function localMessagingGuides(page) {
  for (const channel of ['telegram', 'whatsapp']) {
    await page.goto(`${origin}/#${channel}`);
    const link = page.locator(`#${channel} a[href="messaging-setup.html#${channel}"]`).first();
    assert.equal(await link.count(), 1, `A shipped local ${channel} guide is linked from its setup card`);
    const [response] = await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), link.click()]);
    assert.equal(response?.status(), 200, `${channel} setup link serves real HTML, not a 404`);
    assert.equal(new URL(page.url()).pathname, '/messaging-setup.html');
    assert.equal(new URL(page.url()).hash, `#${channel}`);
    assert.match(await page.title(), /Crewlo/);
    assert.match(await page.title(), /Telegram.*WhatsApp|WhatsApp.*Telegram/i);
    const section = page.locator(`#${channel}`);
    assert.equal(await section.count(), 1);
    const heading = section.locator('h1, h2, h3').first();
    assert.ok(await heading.isVisible());
    assert.ok((await heading.innerText()).toLowerCase().includes(channel), `Guide anchor opens the correct ${channel} heading`);
    const back = page.locator('a[href="index.html"], a[href="./index.html"], a[href="index.html#top"]').first();
    assert.ok(await back.isVisible(), 'Guide provides a visible return to the studio page');
    const [home] = await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), back.click()]);
    assert.equal(home?.status(), 200);
    assert.equal(await page.title(), 'Crewlo — Your agents. A studio of their own.');
  }
}

async function keyboardDemo(page) {
  await page.locator('[data-hero-agent]').press('Enter');
  assert.equal(await page.locator('[data-sequence="mission"]').getAttribute('data-phase'), '3', 'Remy opens his illustrated reply from the hero');
  for (const kind of ['mission', 'telegram', 'whatsapp']) {
    if (kind !== 'mission') await page.locator(`[data-channel-tab="${kind}"]`).click();
    const root = page.locator(`[data-sequence="${kind}"]`);
    for (const step of await root.locator('[data-phase-select]').all()) {
      await step.press('Enter');
      assert.equal(await step.getAttribute('aria-pressed'), 'true');
      assert.equal(await root.locator('[data-frame]:visible').count(), 1);
      assert.equal(await root.getAttribute('data-phase'), await step.getAttribute('data-phase-select'));
      assert.ok(await step.evaluate(el => {
        const style = getComputedStyle(el);
        return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
      }), 'Keyboard controls have a visible focus ring');
    }
  }
  const crew = page.locator('[data-crew]');
  await crew.locator('.agent-cards [data-agent="ellis"]').press('Space');
  assert.equal(await crew.locator('[data-agent-name]').innerText(), 'Ellis');
  assert.match(await crew.locator('[data-agent-activity]').innerText(), /Idle/);
  assert.equal(await crew.locator('.agent-hotspot.ellis').getAttribute('aria-pressed'), 'true');
  await crew.locator('[data-next-agent]').press('Enter');
  assert.equal(await crew.locator('[data-agent-name]').innerText(), 'Sam');
  assert.match(await crew.locator('[data-agent-activity]').innerText(), /Coffee break/);
  await crew.locator('[data-next-agent]').press('Enter');
  assert.equal(await crew.locator('[data-agent-name]').innerText(), 'Nina');
  await crew.locator('[data-next-agent]').press('Enter');
  assert.equal(await crew.locator('[data-agent-name]').innerText(), 'Remy');
  await crew.locator('.agent-hotspot.ellis').click();
  assert.equal(await crew.locator('[data-agent-name]').innerText(), 'Ellis');
  const scene = await crew.locator('.crew-visual').boundingBox();
  const details = await crew.locator('[data-agent-details]').boundingBox();
  const roster = await crew.locator('.agent-cards').boundingBox();
  assert.ok(details.y + details.height <= roster.y, 'Name, state and reply precede agent selection');
  if (page.viewportSize().width > 900) {
    assert.ok(details.x >= scene.x + scene.width, 'Desktop profile is beside the studio');
    assert.ok(details.y >= scene.y && details.y < scene.y + 100, 'Desktop profile starts near the top of the studio');
    assert.ok(details.y + details.height <= page.viewportSize().height, 'Selecting Ellis keeps his complete reply in view');
  } else {
    assert.ok(details.y >= scene.y + scene.height && details.y < scene.y + scene.height + 100, 'Mobile profile immediately follows the scene');
  }
  const studioLink = page.locator('header nav a').filter({ hasText: /^Studio$/ });
  assert.equal(await studioLink.getAttribute('href'), '#crew', 'Studio menu targets the interactive crew');
  if (page.viewportSize().width <= 760) await page.locator('.nav-toggle').click();
  await studioLink.click();
  assert.equal(new URL(page.url()).hash, '#crew');
  await page.waitForFunction(() => document.activeElement?.id === 'crew');
}

async function presetChoices(page) {
  const root = page.locator('[data-presets]');
  assert.equal(await root.locator('[data-preset]:visible').count(), 4, 'Only four presets initially occupy the shared shelf');
  const positions = await root.locator('.preset-shelf .preset-choice').evaluateAll(items => items.map(item => item.getBoundingClientRect().top));
  assert.ok(positions.every(top => Math.abs(top - positions[0]) < 1), 'Four figurines share one shelf on mobile and desktop');
  await root.locator('[data-preset="codex"]').press('Space');
  assert.equal(await root.locator('[data-preset-cli]').innerText(), 'codex');
  assert.equal(await root.locator('[data-preset-guide]').innerText(), 'Configure Codex \u2197');
  await root.locator('summary').press('Enter');
  assert.equal(await root.locator('[data-preset]:visible').count(), 12);
  for (const choice of await root.locator('[data-preset]').all()) {
    await choice.press('Enter');
    assert.equal(await root.locator('[data-preset-cli]').innerText(), await choice.getAttribute('data-preset-command'));
    assert.equal(await root.locator('[data-preset-title]').innerText(), await choice.getAttribute('data-preset-name'));
    assert.equal(await root.locator('[aria-pressed="true"]').count(), 1);
  }
  await root.locator('[data-preset-guide]').press('Enter');
  assert.equal(new URL(page.url()).pathname, '/install.html');
  assert.equal(new URL(page.url()).hash, '#connect-agent');
  await page.goBack();
  await root.locator('[data-preset="claude"]').waitFor();
  if (await root.locator('details').evaluate(el => el.open)) await root.locator('summary').press('Enter');
}

async function copyAndFaq(page) {
  await page.goto(origin + '/install.html');
  const copy = page.locator('[data-copy-command]').first();
  assert.equal(await page.locator('#copy-status').getAttribute('role'), 'status');
  assert.equal(await page.locator('#copy-status').getAttribute('aria-live'), 'polite');
  const command = (await page.locator('#install-command').innerText()).trim();
  assert.ok(command.includes('git clone') && command.includes('HafidIdrissi/crewlo'), 'Copyable source setup points to this repository');
  await copy.focus(); await copy.press('Enter');
  await page.getByText('Copied. Review the command before running it.', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.__crewloCopyTest.writes.at(-1)), command, 'Clipboard receives displayed command only');
  const runCopy = page.locator('[data-copy-command="run-command"]');
  await runCopy.press('Enter');
  await page.waitForFunction(() => window.__crewloCopyTest.writes.at(-1) === document.querySelector('#run-command').textContent.trim());
  await page.evaluate(() => { window.__crewloCopyTest.mode = 'reject'; });
  await copy.press('Enter');
  await page.getByText('Could not copy. Select the command and copy it manually.', { exact: true }).waitFor();
  assert.equal((await page.locator('#copy-status').innerText()).includes('Copied.'), false, 'Clipboard rejection must not report success');
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }); });
  await copy.press('Enter');
  await page.getByText('Copy is not available here. Select the command and copy it manually.', { exact: true }).waitFor();
  await page.goto(origin + '/');
  const faqs = await page.locator('.faq-list details').all();
  assert.ok(faqs.length >= 3, 'Useful FAQ uses native details');
  for (const faq of faqs) {
    const summary = faq.locator('summary');
    assert.ok((await summary.innerText()).trim());
    if (await faq.evaluate(el => el.open)) await summary.click();
    await summary.focus(); await summary.press('Enter');
    assert.equal(await faq.evaluate(el => el.open), true, 'FAQ opens using keyboard');
    assert.ok((await faq.innerText()).length > (await summary.innerText()).length, 'FAQ contains an answer');
    await summary.press('Space');
    assert.equal(await faq.evaluate(el => el.open), false, 'FAQ closes using keyboard');
  }
}

async function autoplayDemo(page) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(origin + '/');
    const root = page.locator('[data-sequence="mission"]');
    await root.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('[data-sequence="mission"]').dataset.playing === 'true');
    await page.waitForFunction(() => Number(document.querySelector('[data-sequence="mission"]').style.getPropertyValue('--sequence-progress')) > .05);
    await page.waitForFunction(() => document.querySelector('[data-sequence="mission"]').dataset.phase === '1');
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('[data-sequence="mission"]').dataset.playing === 'false');
    await root.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('[data-sequence="mission"]').dataset.playing === 'true');
    await root.locator('[data-sequence-play]').click();
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await root.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    assert.equal(await root.getAttribute('data-playing'), 'false', 'An explicit pause survives viewport re-entry');
    const workspace = page.locator('[data-workspace-video]');
    await workspace.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const video = document.querySelector('[data-workspace-video]');
      return !video.paused && video.currentTime > .2;
    });
    await page.locator('[data-workspace-play]').click();
    assert.equal(await workspace.evaluate(el => el.paused), true);
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await workspace.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    assert.equal(await workspace.evaluate(el => el.paused), true, 'Workspace preserves explicit pause');
    const telegram = page.locator('[data-sequence="telegram"]');
    await telegram.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('[data-sequence="telegram"]').dataset.playing === 'true');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.locator('[data-sequence="mission"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('[data-sequence="mission"]').getAttribute('data-playing'), 'false');
  assert.equal(await page.locator('#demo video').evaluate(el => el.paused), true);
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function mediaControls(page) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Start timed playback in a fresh document with the intended media preference.
  // Mid-playback preference changes are exercised separately below.
  await page.reload();
  const mission = page.locator('[data-sequence="mission"]');
  const video = mission.locator('video');
  assert.equal(await video.getAttribute('autoplay'), null);
  assert.ok(await video.getAttribute('poster'));
  await mission.locator('[data-phase-select="0"]').click();
  await mission.locator('[data-sequence-play]').click();
  await page.waitForFunction(() => document.querySelector('#demo video').currentTime > .15);
  assert.ok(Math.abs(await video.evaluate(el => el.duration) - 15) < .1, '15-second camera video decodes');
  await mission.locator('[data-sequence-play]').click();
  // A virtual clock verifies the full pacing and the final readable hold.
  await page.clock.install();
  for (const kind of ['mission', 'telegram', 'whatsapp']) {
    if (kind !== 'mission') await page.locator(`[data-channel-tab="${kind}"]`).click();
    const root = page.locator(`[data-sequence="${kind}"]`);
    const play = root.locator('[data-sequence-play]');
    await root.locator('[data-phase-select="0"]').click();
    await play.click();
    assert.equal(await play.getAttribute('aria-pressed'), 'true');
    await page.clock.runFor(3100);
    assert.equal(await root.getAttribute('data-phase'), '1');
    await play.click();
    await page.clock.runFor(4000);
    assert.equal(await root.getAttribute('data-phase'), '1', 'Pause holds the current step');
    await play.click();
    await page.clock.runFor(kind === 'mission' ? 7300 : 3200);
    assert.equal(await root.getAttribute('data-phase'), kind === 'mission' ? '3' : '2');
    await page.clock.runFor(kind === 'mission' ? 3500 : 2000);
    assert.equal(await root.getAttribute('data-phase'), kind === 'mission' ? '3' : '2', 'Result stays readable');
    await page.clock.runFor(1200);
    assert.equal(await root.getAttribute('data-phase'), '0', 'Loop restarts after the readable hold');
    await play.click();
    assert.equal(await play.getAttribute('aria-pressed'), 'false');
    await play.click();
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await page.waitForFunction(kind => document.querySelector(`[data-sequence="${kind}"]`).dataset.playing === 'false', kind);
  }
  const root = page.locator('[data-sequence="mission"]');
  await root.locator('[data-sequence-play]').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('[data-sequence="mission"] [data-sequence-play]').disabled);
  assert.equal(await root.locator('[data-sequence-play]').isDisabled(), true);
  assert.equal(await root.locator('video').evaluate(el => el.paused), true);
  await root.locator('[data-phase-select="3"]').click();
  assert.equal(await root.getAttribute('data-phase'), '3', 'Static steps remain available');
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await root.locator('[data-sample-mission]').selectOption('tests');
  await root.locator('[data-sample-agent]').selectOption('jules');
  assert.match(await root.locator('.mission-request').innerText(), /Find the tests/);
  await root.locator('[data-send-mission]').click();
  const launchPosition = await root.locator('.mission-parcel').evaluate(el => getComputedStyle(el).left);
  await page.clock.runFor(1500);
  const firstPosition = await root.locator('.mission-parcel').evaluate(el => getComputedStyle(el).left);
  assert.notEqual(firstPosition, launchPosition, 'The mission card travels towards the selected desk');
  await root.locator('[data-sequence-play]').click();
  const pausedPosition = await root.locator('.mission-parcel').evaluate(el => getComputedStyle(el).left);
  await page.clock.runFor(1000);
  assert.equal(await root.locator('.mission-parcel').evaluate(el => getComputedStyle(el).left), pausedPosition, 'The flying card freezes when paused');
  await root.locator('[data-sequence-play]').click();
  await page.clock.runFor(1800);
  assert.equal(await root.getAttribute('data-phase'), '1');
  assert.match(await root.locator('[data-frame="1"]').innerText(), /JULES/);
  await page.clock.runFor(12500);
  assert.equal(await root.getAttribute('data-phase'), '3');
  assert.match(await root.locator('[data-frame="3"]').innerText(), /npm run test:crewlo/);
  assert.equal(await root.locator('[data-sequence-play]').innerText(), 'Replay');
  await page.clock.runFor(3000);
  assert.equal(await root.getAttribute('data-phase'), '3', 'An interactive mission holds its reply');
  await root.locator('[data-send-mission]').click();
  assert.equal(await root.getAttribute('data-phase'), '0', 'Replay starts a fresh delivery');
  await root.locator('[data-sample-mission]').selectOption('messaging');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('[data-sequence="mission"] [data-sequence-play]').disabled);
  await root.locator('[data-send-mission]').click();
  assert.equal(await root.getAttribute('data-phase'), '3');
  assert.match(await root.locator('[data-frame="3"]').innerText(), /Your paired Telegram bot/);
  await page.clock.resume();
}

(async () => {
  const server = await createServer({ configFile: false, root: resolve('docs'), server: { host: '127.0.0.1', port, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true, ...(process.env.CREWLO_CHROMIUM ? { executablePath: process.env.CREWLO_CHROMIUM } : {}) });
    const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
    const external = [], errors = [], broken = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) broken.push(`${response.status()} ${new URL(response.url()).pathname}`); });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) { external.push(url.origin); return route.abort(); }
      return route.continue();
    });
    await page.addInitScript(() => {
      const state = window.__crewloCopyTest = { mode: 'success', writes: [] };
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { state.writes.push(value); if (state.mode === 'reject') throw new Error('Fixture permission denied'); } } });
    });
    await page.goto(origin + '/');
    await waitForLocalFonts(page);
    assert.equal(await page.title(), 'Crewlo — Your agents. A studio of their own.');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal((await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim(), 'Your agents. A studio of their own.');
    const heroLayout = await page.evaluate(() => {
      const copy = document.querySelector('.hero-copy').getBoundingClientRect();
      const studio = document.querySelector('.hero-stage').getBoundingClientRect();
      return { sideBySide: studio.left >= copy.right, studioLarger: studio.width > copy.width,
        inFirstScreen: studio.bottom <= innerHeight && copy.bottom <= innerHeight };
    });
    assert.deepEqual(heroLayout, { sideBySide: true, studioLarger: true, inFirstScreen: true });
    assert.deepEqual(await page.locator('main > section[id]').evaluateAll(sections => sections.map(el => el.id)),
      ['crew', 'proof', 'agents', 'connect', 'start', 'faq', 'support'], 'Real evidence follows the illustrated studio and precedes presets and messaging');
    assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll(links => links.flatMap(link => {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      return id && !document.getElementById(id) ? [id] : [];
    })), [], 'All in-page anchor targets exist');
    assert.deepEqual(await page.locator('img').evaluateAll(images => images.filter(img => !img.hasAttribute('alt')).map(img => img.src)), [], 'Every image supplies text alternative or explicit decorative alt');
    assert.deepEqual(await page.locator('a[target="_blank"]').evaluateAll(links => links.filter(link => !link.rel.split(/\s+/).includes('noopener')).map(link => link.href)), [], 'New-tab external links isolate opener');
    assert.deepEqual(await page.locator('.quick-steps a').evaluateAll(links => links.map(link => link.getAttribute('href'))), ['install.html#requirements', 'install.html#connect-agent', 'install.html#first-mission']);
    await keyboardDemo(page);
    await copyAndFaq(page);
    await autoplayDemo(page);
    await mediaControls(page);
    // Capture the normal initial presentation, not deliberately injected errors.
    await page.reload();
    await waitForLocalFonts(page);

    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await waitForLocalFonts(page);
      await messagingAccess(page, width, height);
      await messagingContrast(page);
      await keyboardDemo(page);
      await presetChoices(page);
      for (const image of await page.locator('img:visible').all()) {
        await image.scrollIntoViewIfNeeded();
        await page.waitForFunction(el => el.complete && el.naturalWidth > 0, await image.elementHandle());
      }
      const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      assert.ok(overflow.scrollWidth <= width + 1, `No horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`);
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
      await page.screenshot({ path: `out/site-check/site-${width}.png`, fullPage: true });
      if ([1440, 768, 390, 320].includes(width)) await page.screenshot({ path: `out/site-check/site-hero-${width}.png` });
      if (width === 768) await page.locator('#proof').screenshot({ path: 'out/site-check/site-proof-768.png' });
      if ([1440, 390].includes(width)) await page.locator('#connect').screenshot({ path: `out/site-check/site-messaging-${width}.png`, style: '.site-header, .skip { visibility: hidden !important; }' });
    }
    await localMessagingGuides(page);
    const noScript = await browser.newPage({ javaScriptEnabled: false });
    await noScript.goto(origin + '/');
    assert.equal(await noScript.locator('[data-frame]:visible').count(), 10, 'All story steps are readable without JavaScript');
    assert.equal(await noScript.locator('.sequence-controls:visible').count(), 0);
    assert.equal(await noScript.locator('[data-preset]:visible').count(), 4);
    await noScript.locator('.preset-disclosure summary').click();
    assert.equal(await noScript.locator('[data-preset]:visible').count(), 12, 'All presets remain accessible without scripting');
    assert.equal(await noScript.locator('[data-preset="cursor"]').getAttribute('href'), 'install.html#connect-agent');
    await noScript.close();
    assert.equal(await page.locator('[data-coffee]').count(), 0, 'No donation action without a configured destination');
    for (const link of await page.locator('[data-repository]').all()) assert.equal(await link.getAttribute('href'), repo);
    // URL activation is tested locally, never by navigating to any destination.
    const configs = [
      ['https://buymeacoffee.com/crewlo_test_only', true], ['https://www.buymeacoffee.com/crewlo_test_only', true],
      ['javascript:alert(1)', false], ['https://buymeacoffee.com.evil.example/owner', false],
      ['https://attacker@buymeacoffee.com/owner', false], ['http://buymeacoffee.com/owner', false],
      ['https://buymeacoffee.com:444/owner', false], ['https://buymeacoffee.com/owner?redirect=evil', false]
    ];
    for (const [coffeeUrl, expected] of configs) {
      await page.route('**/crewlo-links.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ repositoryUrl: repo, coffeeUrl }) }));
      await Promise.all([page.waitForResponse(response => response.url().endsWith('crewlo-links.json')), page.reload()]);
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('[data-coffee]').count(), expected ? 1 : 0, `Coffee URL guard: ${coffeeUrl}`);
      if (expected) assert.equal(await page.locator('[data-coffee]').getAttribute('href'), coffeeUrl);
      await page.unroute('**/crewlo-links.json');
    }
    assert.deepEqual(external, [], 'Landing performs no external requests or analytics');
    assert.deepEqual(broken, [], 'No failed local assets');
    assert.deepEqual(errors, [], 'No browser exceptions');
    console.log('PASS: 1440/1024/768/390/320px; dedicated first-mission guide and compact mobile navigation; integration disclosures, deep links and text contrast; local setup guides HTTP200/anchors/return; local voxel/body fonts; product discovery before setup and optional messaging; sequence and agent keyboard/ARIA/focus; clipboard success/rejection/unavailable (no shell); native FAQ keyboard; anchors/local assets; manual reduced-motion steps; timed sequences, pause, offscreen stop and result hold; no-JS fallback; Star target and coffee URL guards; no external requests. Screen-reader and full WCAG audit remain manual.');
  } finally { if (browser) await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
