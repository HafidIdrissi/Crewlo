/* Export the actual site phone components and voxel video as GitHub-friendly media.
 * No accounts, API calls or generated agent replies: these are illustrated screens.
 * Requires Playwright, Chromium and FFmpeg; see docs/crewlo/demo/README.md.
 */
const { chromium } = require(process.env.CREWLO_PLAYWRIGHT || 'playwright');
const { createServer } = require('vite');
const { resolve, join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { execFileSync } = require('node:child_process');

const root = resolve(__dirname, '..');
const output = join(root, 'docs/crewlo/demo');
const ffmpeg = process.env.CREWLO_FFMPEG || 'ffmpeg';
const fps = 8;
const duration = 12;
const css = `
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#18392f;background:#f6f5ef}
.canvas{position:relative;width:960px;height:600px;overflow:hidden}
.top{position:absolute;top:22px;left:30px;right:30px;display:flex;align-items:center;justify-content:space-between;z-index:2}
.brand{display:flex;align-items:center;gap:12px;font-size:23px;font-weight:700}.brand img{width:38px;height:38px}
.label{font-size:14px;color:#52665c;border:1px solid #c9d3cb;padding:8px 12px;border-radius:18px}
.studio{position:absolute;top:70px;width:960px;height:450px;object-fit:contain}
.beacon{position:absolute;left:47%;top:28%;font-size:17px;background:#203d30;color:white;padding:7px 12px;border-radius:8px;opacity:0}
.parcel{position:absolute;top:40%;left:15%;background:#ffc58f;border-radius:8px;padding:9px 14px;font-size:17px;box-shadow:0 3px 14px #264c3620}
.story{position:absolute;bottom:20px;left:30px;right:30px;padding:18px 22px;border:1px solid #d3dcd4;border-radius:16px;background:#fffefb}
.story small{font-size:13px;letter-spacing:1px;color:#64776a}.story h2{font-size:24px;margin:6px 0 0}.story p{font-size:18px;margin:8px 0 0;line-height:1.45}
.progress{position:absolute;bottom:0;height:4px;background:#e9ab76;left:0}
.canvas.phone{width:640px;height:900px;background:radial-gradient(ellipse at 50% 50%,#dde7dd,#f6f5ef 70%)}
.phone .top{top:20px;left:24px;right:24px}.phone .brand{font-size:23px}.phone .label{font-size:12px}
.phone-wrap{position:absolute;top:86px;left:100px;width:440px}
.phone .demo-phone{width:440px!important;max-width:none;padding:9px;border-radius:47px;margin:0;box-shadow:0 20px 40px #24433125}
.phone .phone-screen{height:684px;border-radius:38px}.phone .phone-statusbar{height:37px;font-size:14px}
.phone .phone-heading{height:70px}.phone .phone-contact strong{font-size:20px}.phone .phone-contact span{font-size:14px}
.phone .phone-chat{padding:18px 14px;gap:12px}.phone .phone-message{font-size:19px;line-height:1.4;max-width:92%;padding:12px 14px 7px;transition:none!important}
.phone .phone-message p{margin:0}.phone .phone-message-meta{font-size:12px}.phone .phone-date{font-size:13px}
.phone .phone-compose{min-height:59px}.phone .phone-input{font-size:17px}.phone .phone-navigation{height:28px}
.phone .caption{position:absolute;top:812px;left:32px;right:32px;text-align:center;font-size:16px;line-height:1.5;color:#54665a}
.phone .caption strong{color:#213e30}.phone .phone-avatar{background:#d5e6d5;overflow:hidden}
.phone .phone-avatar img{width:100%;height:100%}.phone .typing{position:absolute;bottom:127px;left:128px;font-size:15px;color:#576d63;background:#fff;padding:9px 16px;border-radius:18px}
`;

async function main() {
  const server = await createServer({ root: join(root, 'docs'), configFile: false, server: { host: '127.0.0.1', port: 5191, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ executablePath: process.env.CREWLO_CHROMIUM, headless: true });
    const page = await browser.newPage({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 1 });
    const origin = 'http://127.0.0.1:5191/';
    await page.goto(origin, { waitUntil: 'networkidle' });
    const phones = {};
    for (const channel of ['telegram', 'whatsapp']) {
      phones[channel] = await page.locator(`[data-channel-panel="${channel}"] .demo-phone`).evaluate(el => el.outerHTML);
    }
    for (const kind of ['studio', 'telegram', 'whatsapp']) {
      const isPhone = kind !== 'studio';
      const name = `readme-${kind}`;
      const title = kind === 'studio' ? 'Crewlo / a living studio' : kind === 'telegram' ? 'Telegram' : 'WhatsApp';
      const label = kind === 'studio' ? 'Illustrated demo' : kind === 'telegram' ? 'Documented exchange' : 'Experimental preview';
      const content = isPhone ? `<div class="phone-wrap">${phones[kind]}</div><div class="typing">Remy is working <span></span></div><div class="caption">${kind === 'telegram' ? '<strong>Real transcript. Recreated phone UI.</strong><br>Timing condensed · Basic round trip only.' : '<strong>Illustrated flow. Not yet live-tested.</strong><br>Experimental · No delivery proof.'}</div>` : `<video class="studio" muted preload="auto" src="crewlo/demo/mission-studio.mp4"></video><div class="parcel">New mission → Remy</div><div class="beacon">Remy · Working</div><div class="story"><small></small><h2></h2><p></p></div>`;
      await page.setViewportSize({ width: isPhone ? 640 : 960, height: isPhone ? 900 : 600 });
      await page.setContent(`<html><head><base href="${origin}"><link rel="stylesheet" href="crewlo-site.css"><link rel="stylesheet" href="crewlo-living.css"><style>${css}</style></head><body><div class="canvas ${isPhone ? 'phone' : ''}"><div class="top"><div class="brand"><img src="crewlo/favicon.svg">${title}</div><span class="label">${label}</span></div>${content}<div class="progress"></div></div></body></html>`, { waitUntil: 'networkidle' });
      // Site state CSS must not suppress any exported message; visibility is driven here.
      await page.evaluate(() => { for (const el of document.querySelectorAll('.phone-message')) { el.hidden = false; el.style.display = 'block'; } });
      const temp = mkdtempSync(join(tmpdir(), 'crewlo-readme-'));
      try {
        for (let frame = 0; frame < fps * duration; frame++) {
          await page.evaluate(async ({ t, isPhone }) => {
            document.querySelector('.progress').style.width = `${t / 12 * 100}%`;
            const phase = t < 3 ? 0 : t < 6 ? 1 : t < 8 ? 2 : 3;
            if (isPhone) {
              const messages = [...document.querySelectorAll('.phone-message')];
              const starts = [0.3, 3, 7];
              messages.forEach((el, i) => {
                const alpha = Math.min(1, Math.max(0, (t - starts[i]) / .4));
                el.style.opacity = alpha;
                el.style.transform = `translateY(${(1 - alpha) * 14}px)`;
              });
              const typing = document.querySelector('.typing');
              typing.style.opacity = t >= 4 && t < 7 ? '1' : '0';
              typing.querySelector('span').textContent = '.'.repeat(1 + Math.floor(t * 3) % 3);
            } else {
              const video = document.querySelector('video');
              if (video.readyState < 2) await new Promise(r => video.addEventListener('loadeddata', r, { once: true }));
              const seek = Math.min(t * 1.25, video.duration - .1);
              if (Math.abs(video.currentTime - seek) > .01) {
                await new Promise(r => { video.addEventListener('seeked', r, { once: true }); video.currentTime = seek; });
              }
              const steps = [
                ['01 / MISSION', 'Summarize this project and its entry points.', 'One request. One agent. A visible place to follow the work.'],
                ['02 / AGENT', 'Remy picks up the mission.', 'His desk lights up. The rest of the crew keeps working or takes a break.'],
                ['03 / ACTIVITY', 'Remy · Reading README.md', 'A named activity makes it clear where to look.'],
                ['04 / REPLY', 'The answer stays beside your agent.', 'Desktop: src/main  ·  Interface: src/renderer  ·  Shared types: src/shared']
              ];
              const text = steps[phase];
              document.querySelector('.story small').textContent = text[0];
              document.querySelector('.story h2').textContent = text[1];
              document.querySelector('.story p').textContent = text[2];
              document.querySelector('.beacon').style.opacity = phase === 1 || phase === 2 ? '1' : '0';
              const parcel = document.querySelector('.parcel');
              parcel.style.opacity = t < 3 ? '1' : '0';
              parcel.style.left = `${15 + Math.min(1, t / 3) * 30}%`;
              parcel.style.top = `${40 - Math.min(1, t / 3) * 10}%`;
            }
          }, { t: frame / fps, isPhone });
          await page.screenshot({ path: join(temp, `${String(frame).padStart(4, '0')}.png`) });
          if (frame === fps * 10) await page.screenshot({ path: join(output, `${name}-poster.png`) });
        }
        const input = ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(fps), '-i', join(temp, '%04d.png')];
        execFileSync(ffmpeg, [...input, '-filter_complex', '[0:v]split[a][b];[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=none', '-loop', '0', join(output, `${name}.gif`)], { stdio: 'inherit' });
        execFileSync(ffmpeg, [...input, '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(output, `${name}.mp4`)], { stdio: 'inherit' });
        console.log(`Exported ${name}: ${duration}s, ${fps}fps, GIF / MP4 / PNG`);
      } finally { rmSync(temp, { recursive: true, force: true }); }
    }
  } finally { await browser?.close(); await server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
