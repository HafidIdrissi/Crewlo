// Capture-only fixture. Uses the product renderer, with no preload, agent or network API.
// The exported images must be labelled as scripted studio data wherever embedded.
import { Application, Graphics, BlurFilter } from 'pixi.js';
import 'pixi.js/unsafe-eval';
import { VoxelStage, type SceneAgent } from '../../src/renderer/src/scene/studio/VoxelStage';
import { iso } from '../../src/renderer/src/scene/studio/voxelArt';

await document.fonts.load('14px Inter');
const following = new URLSearchParams(location.search).get('view') === 'follow';
const overview = new URLSearchParams(location.search).get('view') === 'overview';
document.body.dataset.view = overview ? 'overview' : following ? 'follow' : 'team';
document.body.dataset.size = new URLSearchParams(location.search).get('size') || 'desktop';
const host = document.querySelector<HTMLDivElement>('#scene')!;
const app = new Application();
await app.init({ background: '#f7f6f2', antialias: true, resolution: 2, autoDensity: true });
host.append(app.canvas);
const stage = new VoxelStage(app, host, () => {});
const agents: SceneAgent[] = [
  { id: 'capture-remy', name: 'Remy', character: 'michael', status: 'working', queued: 0, connected: true },
  { id: 'capture-ellis', name: 'Ellis', character: 'jim', status: 'idle', queued: 0, connected: true },
];
if (overview) {
  const cast = [
    ['Noor', 'pam'], ['Jules', 'dwight'], ['Mika', 'kevin'], ['Ada', 'angela'],
    ['Leo', 'oscar'], ['Sam', 'stanley'], ['Iris', 'phyllis'], ['Alex', 'andy'],
    ['Nina', 'kelly'], ['Robin', 'ryan'],
  ];
  cast.forEach(([name, character], index) => agents.push({
    id: `capture-${name.toLowerCase()}`, name, character,
    status: index < 5 ? 'working' : 'idle', confirmedIdle: index >= 5,
    queued: 0, connected: true,
  }));
}
stage.cameraMode = overview ? 'overview' : following ? 'follow' : 'team';
stage.zoom = overview ? .82 : document.body.dataset.size === 'mobile' ? .8 : following ? 1.05 : 1.2;
if (document.body.dataset.size === 'mobile') stage.pan.y = 25;
stage.update(following ? agents.slice(0, 1) : agents, following ? agents[0].id : null, !overview);
if (overview) {
  // Seed presentation-only breaks, using the renderer's actual leisure poses.
  // Long holds keep the short exported loop stable; no execution state is changed.
  const spots = ['coffee', 'arcade', 'foosball', 'terrace-bench', 'break-sofa'];
  agents.slice(7).forEach((agent, index) => {
    const actor = stage.life.actors.get(agent.id)!;
    const destination = stage.world.destinations.find(spot => spot.id === spots[index])!;
    Object.assign(actor, { x: destination.x, y: destination.y, destination,
      facing: destination.facing, mode: destination.activity, path: [],
      until: 1e9, nextAt: 1e9, lastGate: 'idle' });
    stage.life.reservations.set(destination.id, agent.id);
  });
}
stage.layout();
if (overview) {
  // Presentation-only contact shadow follows the floor and the camera scale.
  const footprint = [[0, 0], [stage.world.width, 0],
    [stage.world.width, stage.world.height], [0, stage.world.height]]
    .flatMap(([x, y]) => iso(x, y, -.25));
  const softShadow = new Graphics().poly(footprint).fill({ color: 0x24382d, alpha: .16 });
  softShadow.y = 8;
  softShadow.filters = [new BlurFilter({ strength: 8, quality: 3 })];
  const contactShadow = new Graphics().poly(footprint).fill({ color: 0x24382d, alpha: .13 });
  contactShadow.y = 3;
  contactShadow.filters = [new BlurFilter({ strength: 2, quality: 2 })];
  stage.root.addChildAt(softShadow, 0);
  stage.root.addChildAt(contactShadow, 1);
}
stage.tick(0);
// Landing overlays supply readable, interactive names and changing states.
if (overview) stage.captions.visible = false;
app.render();
// Export pixels directly, avoiding a browser screenshot's JPEG compression.
const download = document.createElement('a');
download.textContent = 'Download native PNG (scripted studio data)';
download.download = `crewlo-${overview ? 'overview' : following ? 'follow' : 'team'}.png`;
download.href = app.canvas.toDataURL('image/png');
download.id = 'capture-download';
download.style.cssText = 'position:fixed;bottom:8px;right:8px;background:#fffced;padding:12px;color:#315a2b';
document.body.append(download);
host.dataset.captureReady = 'true';
if (overview) {
  // Deterministic frame export: browser used only as an isolated renderer.
  const capture = window as typeof window & { captureStudioFrame?: (frame: number) => string };
  capture.captureStudioFrame = frame => {
    stage.tick(1 / 30);
    stage.zoom = .82 * (1 + .035 * Math.min(Math.max((frame - 180) / 120, 0), 1));
    stage.layout();
    stage.captions.visible = false;
    app.render();
    return app.canvas.toDataURL('image/png');
  };
  const anchors = agents.slice(0, 2).map(agent => {
    const actor = stage.life.actors.get(agent.id)!;
    const [x, y] = iso(actor.x + .4, actor.y + .35);
    return { name: agent.name, x: (stage.root.x + x * stage.root.scale.x) / host.clientWidth * 100,
      y: (stage.root.y + y * stage.root.scale.y) / host.clientHeight * 100 };
  });
  host.dataset.anchors = JSON.stringify(anchors);
}
