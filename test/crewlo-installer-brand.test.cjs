const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel));

test('Windows installer uses Crewlo icon and branded NSIS artwork', () => {
  const config = read('electron-builder.yml').toString('utf8');
  assert.match(config, /^productName: Crewlo$/m);
  assert.match(config, /^win:\s*\n  icon: build\/crewlo\.ico$/m);
  assert.match(config, /^nsis:\s*\n  oneClick: false$/m);
  for (const [setting, name] of [
    ['installerIcon', 'crewlo.ico'],
    ['uninstallerIcon', 'crewlo.ico'],
    ['installerHeader', 'installerHeader.bmp'],
    ['installerSidebar', 'installerSidebar.bmp'],
    ['uninstallerSidebar', 'installerSidebar.bmp'],
  ]) {
    assert.match(config, new RegExp(`^  ${setting}: build/${name.replace('.', '\\.')}$$`, 'm'));
    assert.ok(fs.existsSync(path.join(root, 'build', name)), `${name} must ship`);
  }
  const ico = read('build/crewlo.ico');
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 6);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(index => ico[6 + index * 16]),
    [16, 32, 48, 64, 128, 0]);
});

test('the voxel logo is shared by the app, website and packaged platforms', () => {
  const source = read('src/renderer/src/assets/crewlo-mark.svg').toString('utf8');
  const website = read('docs/crewlo/favicon.svg').toString('utf8');
  assert.equal(website, source, 'site favicon must match app logo source');
  assert.match(source, /Crewlo voxel mark/);
  assert.doesNotMatch(source, /Munder Difflin|Minecraft/);
  const png = read('build/crewlo.png');
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1024);
  assert.equal(png.readUInt32BE(20), 1024);
  assert.equal(read('build/crewlo.icns').subarray(0, 4).toString(), 'icns');
  assert.match(read('README.md').toString('utf8'), /docs\/crewlo\/favicon\.svg/);
});

test('NSIS artwork has exact wizard dimensions and a reproducible generator', () => {
  for (const [name, width, height] of [
    ['installerSidebar.bmp', 164, 314],
    ['installerHeader.bmp', 150, 57],
  ]) {
    const bmp = read(`build/${name}`);
    assert.equal(bmp.subarray(0, 2).toString(), 'BM');
    assert.equal(bmp.readInt32LE(18), width);
    assert.equal(bmp.readInt32LE(22), height);
    assert.ok(bmp.length > 1000);
  }
  const generator = read('tools/generate-installer-art.py').toString('utf8');
  assert.match(generator, /build\/crewlo\.png|"crewlo\.png"/);
  assert.match(generator, /installerSidebar\.bmp/);
  assert.match(generator, /installerHeader\.bmp/);
});
