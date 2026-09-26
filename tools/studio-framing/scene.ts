// Capture-only fixture. Uses the product renderer, with no preload, agent or network API.
// The exported images must be labelled as scripted studio data wherever embedded.
import { Application } from 'pixi.js';
import 'pixi.js/unsafe-eval';
import { VoxelStage } from '../../src/renderer/src/scene/studio/VoxelStage';

await document.fonts.load('14px Inter');
const following = new URLSearchParams(location.search).get('view') === 'follow';
document.body.dataset.view = following ? 'follow' : 'team';
document.body.dataset.size = new URLSearchParams(location.search).get('size') || 'desktop';
const host = document.querySelector<HTMLDivElement>('#scene')!;
const app = new Application();
await app.init({ background: '#eaf0df', antialias: true, resolution: 2, autoDensity: true });
host.append(app.canvas);
const stage = new VoxelStage(app, host, () => {});
const agents = [
  { id: 'capture-remy', name: 'Remy', character: 'michael', status: 'working', queued: 0, connected: true },
  { id: 'capture-ellis', name: 'Ellis', character: 'jim', status: 'idle', queued: 0, connected: true },
];
stage.cameraMode = following ? 'follow' : 'team';
stage.zoom = document.body.dataset.size === 'mobile' ? .8 : following ? 1.05 : 1.2;
if (document.body.dataset.size === 'mobile') stage.pan.y = 25;
stage.update(following ? agents.slice(0, 1) : agents, following ? agents[0].id : null, true);
stage.tick(0);
app.render();
// Export pixels directly, avoiding a browser screenshot's JPEG compression.
const download = document.createElement('a');
download.textContent = 'Download native PNG (scripted studio data)';
download.download = `crewlo-${following ? 'follow' : 'team'}.png`;
download.href = app.canvas.toDataURL('image/png');
download.id = 'capture-download';
download.style.cssText = 'position:fixed;bottom:8px;right:8px;background:#fffced;padding:12px;color:#315a2b';
document.body.append(download);
host.dataset.captureReady = 'true';
