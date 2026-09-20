// Generate packaging icons from Crewlo's original SVG. Run with Electron.
const { app, BrowserWindow, nativeImage } = require('electron');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false });
  await win.loadURL('data:text/html,<html></html>');
  const svg = readFileSync(join(__dirname, '../src/renderer/src/assets/crewlo-mark.svg'), 'utf8');
  const url = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  const data = await win.webContents.executeJavaScript(`(async () => {
    const img = new Image(); img.src = ${JSON.stringify(url)}; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
    canvas.getContext('2d').drawImage(img, 0, 0, 1024, 1024); return canvas.toDataURL();
  })()`);
  const image = nativeImage.createFromDataURL(data);
  const png = image.toPNG();
  writeFileSync(join(__dirname, '../build/crewlo.png'), png);
  const iconPng = image.resize({ width: 256, height: 256 }).toPNG();
  const ico = Buffer.alloc(22); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
  ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(iconPng.length, 14); ico.writeUInt32LE(22, 18);
  writeFileSync(join(__dirname, '../build/crewlo.ico'), Buffer.concat([ico, iconPng]));
  const icns = Buffer.alloc(16); icns.write('icns'); icns.writeUInt32BE(png.length + 16, 4); icns.write('ic10', 8); icns.writeUInt32BE(png.length + 8, 12);
  writeFileSync(join(__dirname, '../build/crewlo.icns'), Buffer.concat([icns, png]));
  win.destroy(); app.quit();
}).catch(error => { console.error(error); app.exit(1); });
