// Opt-in integration test. Uses its own profile and hive; never reads the user's mission.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2]);
if (fs.existsSync(path.join(root, 'proof.txt'))) throw new Error('Use a fresh dedicated test folder; refusing to execute the verification twice.');
fs.mkdirSync(root, { recursive: true });
for (const level of ['log', 'warn', 'error']) {
  const original = console[level];
  console[level] = (...args) => { fs.appendFileSync(path.join(root, 'runtime.log'), args.map(String).join(' ') + '\n'); original(...args); };
}
app.setPath('userData', path.join(root, 'profile'));
fs.mkdirSync(app.getPath('userData'), { recursive: true });
require('../out/main/index.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const report = {};
(async () => {
  await app.whenReady();
  let win;
  for (let i = 0; i < 100; i++) {
    win = BrowserWindow.getAllWindows()[0];
    if (win && !win.webContents.isLoading() && await win.webContents.executeJavaScript('!!window.cth').catch(() => false)) break;
    await sleep(200);
  }
  const run = expression => win.webContents.executeJavaScript(expression);
  win.webContents.on('console-message', (_event, level, message) => fs.appendFileSync(path.join(root, 'renderer.log'), `${level}: ${message}\n`));
  await run(`window.cth.updateConfig(${JSON.stringify({ onboardingComplete: true, harnessHome: root, godProvider: 'codex', godModel: 'gpt-5.6-luna', autoMode: true, orchestratorMaySpawn: false, semanticMemory: false, missions: [], opsStandupSeeded: true, heartbeatSeeded: true, compactSeeded: true })})`);
  await run(`localStorage.setItem('cth.skipHivePickerOnce','1')`);
  const loaded = new Promise(resolve => win.webContents.once('did-finish-load', resolve));
  win.reload();
  await loaded;
  await run(`window.testProviderOutput='';window.cth.onPtyData('pty-god',d=>{window.testProviderOutput+=d});true`);
  await sleep(3000);
  for (let i = 0; i < 90; i++) {
    report.ptys = await run('window.cth.listPtys()');
    if (report.ptys.some(p => p.id === 'pty-god' && p.hasOutput)) break;
    if (i > 10 && !report.ptys.length) { console.error(await run('window.testProviderOutput')); throw new Error('Test provider exited during startup; see runtime.log'); }
    await sleep(1000);
  }
  await sleep(12000);
  report.before = await run(`document.body.innerText`);
  const body = `Verification task: work only inside ${root}. Create proof.txt with exactly CREWLO_MISSION_OK on one line. For this small verification perform it yourself; do not delegate or spawn agents. Update the existing task card for this mission to done and report the file path. Do not touch any other workspace or publish anything.`;
  report.submit = await run(`(()=>{const t=document.querySelector('#crewlo-mission');if(!t)throw new Error('Mission composer missing');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,${JSON.stringify(body)});t.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
  await sleep(300);
  await run(`document.querySelector('.crewlo-mission').requestSubmit()`);
  for (let i = 0; i < 150; i++) {
    report.missions = await run('window.cth.missionExecutions()');
    if (fs.existsSync(path.join(root, 'proof.txt')) && report.missions.some(m => m.state === 'completed')) break;
    await sleep(1000);
  }
  report.file = fs.existsSync(path.join(root, 'proof.txt')) ? fs.readFileSync(path.join(root, 'proof.txt'), 'utf8') : null;
  report.tasks = await run('window.cth.hiveTasks()');
  report.output = await run(`new Promise(resolve=>{let text='';const off=window.cth.onPtyReplayData('pty-god',data=>{text+=data},error=>{text+=error});setTimeout(()=>{off();resolve(text)},1000)})`);
  report.after = await run('document.body.innerText');
  fs.writeFileSync(path.join(root, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ root, file: report.file, missions: report.missions, outputBytes: report.output.length }));
  // Only test-owned processes; app.exit runs the application's exit cleanup.
  for (const p of await run('window.cth.listPtys()')) await run(`window.cth.killPty(${JSON.stringify(p.id)})`);
  app.exit(report.file?.trim() === 'CREWLO_MISSION_OK' ? 0 : 1);
})().catch(error => { console.error(error); app.exit(1); });
