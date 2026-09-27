// Isolated renderer fixture: never starts a real agent or sends a message.
const { chromium } = require(process.env.CREWLO_PLAYWRIGHT || 'playwright');
const { createServer } = require('vite');
const { resolve } = require('node:path');
const { writeFileSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { execFileSync } = require('node:child_process');

(async () => {
  const server = await createServer({ configFile: resolve('tools/studio-framing/vite.config.ts') });
  let browser;
  let frames;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true, ...(process.env.CREWLO_CHROMIUM ? { executablePath: process.env.CREWLO_CHROMIUM } : {}) });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    await page.goto('http://127.0.0.1:5184/tools/studio-framing/?view=overview');
    await page.waitForSelector('[data-capture-ready]');
    if (errors.length) throw errors[0];
    const source = await page.locator('#capture-download').getAttribute('href');
    const base = 'docs/crewlo/demo/';
    writeFileSync(base + 'studio-overview.png', Buffer.from(source.split(',')[1], 'base64'));
    console.log('Agent anchors:', await page.locator('#scene').getAttribute('data-anchors'));
    const ffmpeg = process.env.CREWLO_FFMPEG || 'ffmpeg';
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', base + 'studio-overview.png', '-c:v', 'libwebp', '-lossless', '1', base + 'studio-overview.webp'], { windowsHide: true });
    frames = mkdtempSync(resolve(tmpdir(), 'crewlo-studio-frames-'));
    for (let frame = 0; frame < 450; frame++) {
      const png = await page.evaluate(frame => window.captureStudioFrame(frame), frame);
      writeFileSync(resolve(frames, `${String(frame).padStart(4, '0')}.png`), Buffer.from(png.split(',')[1], 'base64'));
      if (frame % 90 === 0) console.log(`Rendered ${frame}/450 frames`);
    }
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', '30', '-i', resolve(frames, '%04d.png'), '-vf', 'scale=1440:676', '-c:v', 'libx264', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', base + 'mission-studio.mp4'], { windowsHide: true });
    console.log('Built 12-agent overview and animated 15-second MP4. Scripted agents, not a mission recording.');
  } finally {
    await browser?.close();
    await server.close();
    // Only remove the exact temporary directory created by this invocation.
    if (frames && frames.startsWith(resolve(tmpdir(), 'crewlo-studio-frames-'))) rmSync(frames, { recursive: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
