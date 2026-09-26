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
  const readings = await page.locator('header nav a, .quick-start .eyebrow, .quick-start p, .status-label, .experience-tabs button[aria-selected="true"]').evaluateAll(elements => {
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
    assert.equal(await page.title(), 'Crewlo — Your AI agents. One clear workspace.');
  }
}

async function selectedStep(page, key) {
  const tab = page.locator(`[data-demo-step="${key}"]`);
  const panel = page.locator(`[data-demo-panel="${key}"]`);
  await page.waitForFunction(key => document.querySelector(`[data-demo-step="${key}"]`)?.getAttribute('aria-selected') === 'true', key);
  assert.equal(await tab.getAttribute('role'), 'tab');
  assert.equal(await tab.getAttribute('tabindex'), '0');
  assert.equal(await panel.getAttribute('role'), 'tabpanel');
  assert.equal(await tab.getAttribute('aria-controls'), await panel.getAttribute('id'));
  assert.equal(await panel.getAttribute('aria-labelledby'), await tab.getAttribute('id'));
  assert.equal(await panel.isVisible(), true);
  assert.equal(await page.locator('[data-demo-step][aria-selected="true"]').count(), 1);
  assert.equal(await page.locator('[data-demo-panel]:visible').count(), 1);
  for (const other of await page.locator(`[data-demo-step]:not([data-demo-step="${key}"])`).all()) assert.equal(await other.getAttribute('tabindex'), '-1');
}

async function keyboardDemo(page) {
  const observe = page.locator('[data-demo-step="observe"]');
  await observe.focus(); await observe.press('Enter'); await selectedStep(page, 'observe');
  await observe.press('ArrowRight'); await selectedStep(page, 'direct');
  const direct = page.locator('[data-demo-step="direct"]');
  assert.ok(await direct.evaluate(el => el === document.activeElement), 'Arrow key moves focus with selection');
  const focusVisible = await direct.evaluate(el => { const s = getComputedStyle(el); return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || s.boxShadow !== 'none'; });
  assert.ok(focusVisible, 'Keyboard-selected demo tab has a visible focus indicator');
  await direct.press('End'); await selectedStep(page, 'connect');
  await page.locator('[data-demo-step="connect"]').press('ArrowRight'); await selectedStep(page, 'observe');
  await observe.press('ArrowLeft'); await selectedStep(page, 'connect');
  await page.locator('[data-demo-step="connect"]').press('Home'); await selectedStep(page, 'observe');
  for (const key of ['direct', 'connect', 'observe']) {
    const tab = page.locator(`[data-demo-step="${key}"]`);
    await tab.focus(); await tab.press('Space'); await selectedStep(page, key);
  }
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

async function mediaControls(page) {
  const video = page.locator('#demo video');
  assert.equal(await video.getAttribute('autoplay'), null);
  assert.notEqual(await video.getAttribute('controls'), null);
  assert.equal(await video.locator('track[kind="captions"]').count(), 1);
  const playButton = page.locator('[data-video-play]').first();
  assert.ok(await playButton.count(), 'Demo has a visible, wired play action');
  await playButton.focus(); await playButton.press('Enter');
  await page.waitForFunction(() => document.querySelector('#demo video').currentTime > .2);
  assert.ok(Math.abs(await video.evaluate(el => el.duration) - 18) < .1, 'Existing demo is 18 seconds and decodes');
  await video.evaluate(el => el.pause());
  await page.evaluate(() => {
    window.__crewloOriginalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = () => Promise.reject(new Error('Fixture playback denied'));
  });
  await playButton.focus(); await playButton.press('Enter');
  await page.getByText('Playback did not start. Use the video controls to try again.', { exact: true }).waitFor();
  assert.ok(await page.locator('#video-status').isVisible(), 'Playback failure is visible, not only announced');
  await page.evaluate(() => { HTMLMediaElement.prototype.play = window.__crewloOriginalPlay; delete window.__crewloOriginalPlay; });
  await playButton.focus(); await playButton.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#demo video').paused);
  assert.equal(await page.locator('#video-status').innerText(), '', 'Successful retry clears the old playback error');
  await video.evaluate(el => el.pause());
  for (const card of await page.locator('.feature').all()) {
    const image = card.locator('[data-motion]');
    if (!(await image.count())) continue;
    const step = await card.getAttribute('data-demo-panel');
    if (step) { await page.locator(`[data-demo-step="${step}"]`).click(); await selectedStep(page, step); }
    assert.ok(await card.isVisible());
    const toggle = card.locator('.motion-toggle');
    const poster = await image.getAttribute('src');
    assert.ok(/\.(png|webp)$/.test(poster), 'Animation starts with still poster');
    await toggle.focus(); await toggle.press('Enter');
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
    assert.ok((await image.getAttribute('src')).endsWith('.gif'));
    await page.waitForFunction(el => el.complete && el.naturalWidth > 0, await image.elementHandle());
    await toggle.press('Space');
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
    assert.equal(await image.getAttribute('src'), poster);
  }
  await page.locator('[data-demo-step="observe"]').click();
  const card = page.locator('.feature').filter({ has: page.locator('[data-motion]') }).first();
  if (await card.isVisible()) {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await card.locator('.motion-toggle').click();
    await page.locator('[data-demo-step="direct"]').click();
    assert.equal(await card.locator('.motion-toggle').getAttribute('aria-pressed'), 'false', 'Hidden panel stops its animation');
    await page.locator('[data-demo-step="observe"]').click();
    await card.locator('.motion-toggle').click();
    await video.evaluate(el => el.play());
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => [...document.querySelectorAll('.motion-toggle')].every(el => el.getAttribute('aria-pressed') !== 'true') && [...document.querySelectorAll('video')].every(el => el.paused));
  }
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto', 'Reduced motion disables smooth scrolling');
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
    assert.equal(await page.title(), 'Crewlo — Your AI agents. One clear workspace.');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal((await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim(), 'Your AI agents. One clear workspace.');
    assert.deepEqual(await page.locator('main > section[id]').evaluateAll(sections => sections.map(el => el.id)),
      ['demo', 'experience', 'start', 'connect', 'proof', 'faq', 'support'], 'Discovery precedes setup, integrations, evidence and FAQ');
    assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll(links => links.flatMap(link => {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      return id && !document.getElementById(id) ? [id] : [];
    })), [], 'All in-page anchor targets exist');
    assert.deepEqual(await page.locator('img').evaluateAll(images => images.filter(img => !img.hasAttribute('alt')).map(img => img.src)), [], 'Every image supplies text alternative or explicit decorative alt');
    assert.deepEqual(await page.locator('a[target="_blank"]').evaluateAll(links => links.filter(link => !link.rel.split(/\s+/).includes('noopener')).map(link => link.href)), [], 'New-tab external links isolate opener');
    assert.deepEqual(await page.locator('.quick-steps a').evaluateAll(links => links.map(link => link.getAttribute('href'))), ['install.html#requirements', 'install.html#connect-agent', 'install.html#first-mission']);
    await keyboardDemo(page);
    const enlarge = page.locator('figcaption [data-image-preview]');
    await enlarge.press('Enter');
    assert.equal(await page.locator('#studio-preview').evaluate(el => el.open), true);
    await page.locator('#studio-preview button').press('Escape');
    assert.equal(await page.locator('#studio-preview').evaluate(el => el.open), false);
    assert.ok(await enlarge.evaluate(el => el === document.activeElement), 'Preview restores focus to the opener');
    await copyAndFaq(page);
    await mediaControls(page);
    // Capture the normal initial presentation, not deliberately injected errors.
    await page.reload();
    await waitForLocalFonts(page);
    await selectedStep(page, 'observe');
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await waitForLocalFonts(page);
      await messagingAccess(page, width, height);
      await messagingContrast(page);
      await page.locator('[data-demo-step="observe"]').click(); await selectedStep(page, 'observe');
      for (const image of await page.locator('img:visible').all()) {
        await image.scrollIntoViewIfNeeded();
        await page.waitForFunction(el => el.complete && el.naturalWidth > 0, await image.elementHandle());
      }
      const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      assert.ok(overflow.scrollWidth <= width + 1, `No horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`);
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
      await page.screenshot({ path: `docs/crewlo/demo/site-${width}.png`, fullPage: true });
      if ([1440, 768, 390, 320].includes(width)) await page.screenshot({ path: `docs/crewlo/demo/site-hero-${width}.png` });
      if (width === 768) await page.locator('#experience').screenshot({ path: 'docs/crewlo/demo/site-workflow-768.png' });
      if ([1440, 390].includes(width)) await page.locator('#connect').screenshot({ path: `docs/crewlo/demo/site-messaging-${width}.png`, style: '.site-header, .skip { visibility: hidden !important; }' });
    }
    await localMessagingGuides(page);
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
    console.log('PASS: 1440/1024/768/390/320px; dedicated first-mission guide and compact mobile navigation; integration disclosures, deep links and text contrast; local setup guides HTTP200/anchors/return; local voxel/body fonts; product discovery before setup and optional messaging; tab keyboard/ARIA/focus; clipboard success/rejection/unavailable (no shell); native FAQ keyboard; anchors/local assets; reduced motion posters and opt-in GIFs; 18s captioned video playback; Star target and coffee URL guards; no external requests. Screen-reader and full WCAG audit remain manual.');
  } finally { if (browser) await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
