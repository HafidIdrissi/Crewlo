// Generate packaging icons from Crewlo's original SVG. Run with Electron.
const { app, BrowserWindow, nativeImage } = require('electron');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false });
  await win.loadURL('data:text/html,<html></html>');
  const svg = readFileSync(join(__dirname, '../src/renderer/src/assets/crewlo-mark.svg'), 'utf8');
  writeFileSync(join(__dirname, '../docs/crewlo/favicon.svg'), svg);
  const url = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  const data = await win.webContents.executeJavaScript(`(async () => {
    const img = new Image(); img.src = ${JSON.stringify(url)}; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
    canvas.getContext('2d').drawImage(img, 0, 0, 1024, 1024); return canvas.toDataURL();
  })()`);
  const image = nativeImage.createFromDataURL(data);
  const png = image.toPNG();
  writeFileSync(join(__dirname, '../build/crewlo.png'), png);
  // Include native small sizes: Explorer and the installer should not depend on
  // shrinking a single 256px image for a 16px/32px icon.
  const sizes = [16, 32, 48, 64, 128, 256];
  const iconPngs = sizes.map(size => image.resize({ width: size, height: size }).toPNG());
  const directory = Buffer.alloc(6 + sizes.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  sizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    directory[entry] = size === 256 ? 0 : size;
    directory[entry + 1] = size === 256 ? 0 : size;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(iconPngs[index].length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += iconPngs[index].length;
  });
  writeFileSync(join(__dirname, '../build/crewlo.ico'), Buffer.concat([directory, ...iconPngs]));
  const icns = Buffer.alloc(16); icns.write('icns'); icns.writeUInt32BE(png.length + 16, 4); icns.write('ic10', 8); icns.writeUInt32BE(png.length + 8, 12);
  writeFileSync(join(__dirname, '../build/crewlo.icns'), Buffer.concat([icns, png]));
  win.destroy(); app.quit();
}).catch(error => { console.error(error); app.exit(1); });
