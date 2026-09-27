// Export the product's original voxel figurines as lightweight, static SVGs.
const { buildSync } = require('esbuild');
const { runInNewContext } = require('node:vm');
const { mkdirSync, writeFileSync } = require('node:fs');

const bundled = buildSync({ entryPoints: ['src/renderer/src/scene/studio/voxelArt.ts'], bundle: true, platform: 'node', format: 'cjs', write: false });
const context = { module: { exports: {} } };
runInNewContext(bundled.outputFiles[0].text, context);
const { drawVoxelPerson, block } = context.module.exports;
const characters = ['michael', 'jim', 'pam', 'dwight', 'kevin', 'angela', 'oscar', 'stanley', 'phyllis', 'andy', 'kelly', 'ryan'];
const target = 'docs/crewlo/figurines';
mkdirSync(target, { recursive: true });
for (const character of characters) {
  const polygons = [];
  const paint = (points, color) => polygons.push(`<polygon points="${points.map(n => Number(n.toFixed(3))).join(' ')}" fill="${color}"/>`);
  block(paint, -.65, -.55, -.12, 1.3, 1.1, .12, '#b5c98b');
  drawVoxelPerson(paint, character, 'idle', 0, 0);
  writeFileSync(`${target}/${character}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="176" viewBox="-48 -79 96 107">${polygons.join('')}</svg>\n`);
}
console.log(`Exported ${characters.length} original Crewlo voxel figurines.`);
