const { _electron } = require(process.env.CREWLO_PLAYWRIGHT || "playwright");
const { mkdirSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const assert = require("node:assert/strict");
(async () => {
  const app = await _electron.launch({
    executablePath: require("electron"),
    args: [resolve("tools/crewlo-capture-entry.cjs")],
    env: { ...process.env, ELECTRON_RENDERER_URL: "http://localhost:5175/" },
  });
  const page = await app.firstWindow();
  try {
    await page.waitForTimeout(2500);
    mkdirSync("docs/crewlo", { recursive: true });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.screenshot({ path: "docs/crewlo/voxel-onboarding.png" });
    const config = await page.evaluate(() => window.cth.getConfig());
    await app.evaluate(({ ipcMain }, config) => {
      ipcMain.removeHandler("config:get");
      ipcMain.handle("config:get", () => ({
        ...config,
        onboardingComplete: true,
        harnessHome: "",
        autoUpdate: false,
      }));
      // Fixture dispatch is intercepted: no provider or real work is invoked.
      ipcMain.removeHandler("hive:send");
      ipcMain.handle("hive:send", (_event, msg) => ({
        ok: true,
        message: msg,
      }));
      ipcMain.removeHandler('hive:inbox');
      ipcMain.handle('hive:inbox', () => []);
      globalThis.__crewloFixture = { tasks: [] };
      ipcMain.removeHandler("hive:tasks");
      ipcMain.handle("hive:tasks", () => globalThis.__crewloFixture);
      ipcMain.removeHandler("hive:patchTask");
      ipcMain.handle("hive:patchTask", (_event, id, patch) => {
        const task = globalThis.__crewloFixture.tasks.find((t) => t.id === id);
        if (!task) return { ok: false };
        Object.assign(task, patch);
        return { ok: true };
      });
    }, config);
    await page.evaluate(() =>
      localStorage.setItem("cth.skipHivePickerOnce", "1"),
    );
    await page.reload();
    await page.waitForTimeout(2000);
    await page.evaluate(async () => {
      const { useStore } = await import("/src/store/store.ts");
      useStore.setState({ agents: [], selectedId: null, godStatus: "ready" });
    });
    await page.screenshot({ path: "docs/crewlo/voxel-empty.png" });
    await page.evaluate(async () => {
      const { useStore } = await import("/src/store/store.ts");
      const agents = ["Rowan", "Sage", "Ellis", "Noor", "Kit", "Jules"].map((name, i) => ({
        id: "fixture-" + i,
        name,
        character: ["michael", "jim", "pam", "dwight", "kevin", "angela"][i],
        accent: ["coral", "mint", "sky"][i%3],
        description: [
          "Studio coordinator",
          "Design partner",
          "Development partner",
        ][i],
        project: "Visual verification",
        tmuxTarget: "",
        cwd: "",
        status: i<2 ? "working" : "idle",
        ptyId:"fixture-no-process-"+i,
        action: "",
        progress: 0,
        isGod: i === 0,
      }));
      useStore.setState({
        agents,
        selectedId: null,
        godStatus: "ready",
      });
      const label = document.createElement("div");
      label.id = "fixture-label";
      label.textContent = "VISUAL TEST FIXTURE · No agents running";
      label.style.cssText =
        "position:fixed;bottom:4px;right:12px;z-index:99999;padding:3px 8px;background:#fffcf5;color:#746e63;font:10px Inter;border:1px solid #ded4c4;border-radius:5px";
      document.body.append(label);
    });
    await page.waitForTimeout(1200);


    for (const size of [[1920,1080],[1440,900]]) {
      await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(...size),size);
      await page.waitForTimeout(800);
      await page.screenshot({path:`docs/crewlo/voxel-workplace-${size[0]}.png`});
    }
    await page.locator('.crewlo-accessible-roster button').first().focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    assert.equal(await page.locator('.crewlo-canvas').getAttribute('data-camera-mode'),'follow');
    assert.ok(parseFloat(await page.locator('.crewlo-canvas').getAttribute('data-camera-scale'))>=1.6);
    const panelBounds=await page.locator('.crewlo-sidebar').boundingBox();
    assert.ok(Math.abs(panelBounds.width-1440*.3)<3);
    await page.screenshot({path:'docs/crewlo/voxel-panel-1440.png'});
    await page.getByRole('button',{name:'Vue d’ensemble',exact:true}).click();
    assert.equal(await page.locator('.crewlo-canvas').getAttribute('data-camera-mode'),'overview');
    await page.locator('.crewlo-agent-chip').nth(2).click();
    assert.equal(await page.locator('.crewlo-canvas').getAttribute('data-camera-mode'),'follow');
    assert.equal(await page.evaluate(async()=>(await import('/src/store/store.ts')).useStore.getState().selectedId),'fixture-2');
    await page.getByText('Détails de l’agent',{exact:true}).click();
    await page.getByText('Dossier de travail',{exact:false}).waitFor({state:'visible',timeout:3000});
    await page.getByText('Détails de l’agent',{exact:true}).click();
    await page.locator('.crewlo-agent-chip').first().click();
    assert.equal(await page.locator('.crewlo-sidebar').isVisible(),true);
    const separator=page.getByRole('separator');
    if(await separator.count()){await separator.focus();await page.keyboard.press('ArrowLeft');}
    await page.getByRole('button',{name:'Conversation',exact:true}).click();
    const composer=page.locator('.crewlo-composer textarea');
    await composer.fill('Voxel fixture queue — no provider');await composer.press('Enter');
    assert.equal(await page.evaluate(async()=>(await import('/src/store/store.ts')).useStore.getState().messageQueues['fixture-0'][0].text),'Voxel fixture queue — no provider');
    await page.evaluate(async()=>{(await import('/src/store/store.ts')).useStore.getState().clearQueue('fixture-0');});
    await page.getByRole('button',{name:'Terminal',exact:true}).click();
    await page.getByRole('button',{name:/Add agent/i}).first().click();
    await page.waitForTimeout(300);assert.equal(await page.locator('.crewlo-character-choice').count(),15);
    await page.screenshot({path:'docs/crewlo/voxel-add-agent.png'});await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Settings',exact:true}).click();
    await page.waitForTimeout(300);await page.screenshot({path:'docs/crewlo/voxel-settings.png'});
    await page.getByRole('button',{name:'close',exact:true}).click();
    await page.getByRole('button',{name:/Back to workplace/}).click();
    assert.equal(await page.locator('.crewlo-sidebar').isVisible(),false);
    await page.evaluate(async()=>{(await import('/src/store/store.ts')).useStore.getState().updateAgent('fixture-0',{status:'idle'});});
    await page.getByLabel('What shall we make?').fill('Voxel fixture mission — no provider');
    await page.getByRole('button',{name:'Start mission'}).click();
    await page.getByRole('status').filter({hasText:'Sent to Rowan'}).waitFor();
    await page.evaluate(async()=>{(await import('/src/store/store.ts')).useStore.getState().updateAgent('fixture-0',{status:'working'});});
    const camera=page.getByRole('region',{name:/Workplace camera/});
    await camera.focus();await page.keyboard.press('+');await page.keyboard.press('ArrowLeft');
    await page.getByRole('button',{name:'Fit studio'}).click();
    await app.evaluate(({BrowserWindow})=>{
      for(let i=2;i<6;i++) BrowserWindow.getAllWindows()[0].webContents.send('hive:hookEvent',{agentId:'fixture-'+i,event:'Stop',blocked:false});
    });
    // Record actual canvas animation; fixtures do not execute providers.
    await page.evaluate(()=>{
      window.__voxelChunks=[];
      const stream=document.querySelector('.crewlo-canvas canvas').captureStream(20);
      const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:2200000});
      recorder.ondataavailable=e=>window.__voxelChunks.push(e.data);
      window.__voxelRecorder=recorder;recorder.start();
    });
    await page.waitForTimeout(35000);
    await page.screenshot({path:'docs/crewlo/voxel-leisure.png'});
    const actors=()=>page.locator('.crewlo-canvas').getAttribute('data-voxel-actors').then(JSON.parse);
    let state=await actors();
    assert.ok(state.some(a=>a.destination),'confirmed idle agents choose leisure');
    assert.ok(state.filter(a=>a.destination).every(a=>a.label==='Idle · cosmetic break'));
    assert.ok(!state.some(a=>a.mode==='smoking'),'smoking defaults off');
    const returning=state.find(a=>a.destination);
    await app.evaluate(({BrowserWindow},id)=>BrowserWindow.getAllWindows()[0].webContents.send('hive:hookEvent',{agentId:id,event:'PreToolUse',tool:'Edit'}),returning.id);
    await page.waitForTimeout(400);
    state=await actors();
    assert.equal(state.find(a=>a.id===returning.id).destination,undefined);
    assert.equal(state.find(a=>a.id===returning.id).label,'Editing files');
    await page.waitForTimeout(7000);
    await page.screenshot({path:'docs/crewlo/voxel-return-to-work.png'});
    await page.evaluate(async()=>{
      const {useStore}=await import('/src/store/store.ts');
      useStore.getState().updateAgent('fixture-0',{status:'blocked',blockReason:{summary:'Fixture approval',detail:'Visual verification only',actions:[{kind:'approve',label:'Review'}]}});
      useStore.getState().updateAgent('fixture-1',{status:'looping',action:'Fixture error'});
      useStore.getState().updateAgent('fixture-4',{status:'waiting',action:'Waiting on dependency'});
      useStore.getState().updateAgent('fixture-5',{status:'success'});
    });
    await page.waitForTimeout(500);
    state=await actors();
    assert.equal(state.find(a=>a.id==='fixture-0').label,'Approval required');
    assert.equal(state.find(a=>a.id==='fixture-1').mode,'attention');
    assert.equal(state.find(a=>a.id==='fixture-4').label,'Dependency wait');
    assert.equal(state.find(a=>a.id==='fixture-5').label,'Finished');
    assert.ok(state.filter(a=>['fixture-0','fixture-1','fixture-4','fixture-5'].includes(a.id)).every(a=>!a.destination));
    await page.screenshot({path:'docs/crewlo/voxel-attention.png'});
    const video=await page.evaluate(()=>new Promise(resolve=>{
      const r=window.__voxelRecorder;r.onstop=async()=>{
        const data=new Uint8Array(await new Blob(window.__voxelChunks,{type:'video/webm'}).arrayBuffer());
        let text='';for(let i=0;i<data.length;i+=8192)text+=String.fromCharCode(...data.subarray(i,i+8192));
        r.stream.getTracks().forEach(t=>t.stop());resolve(btoa(text));
      };r.stop();
    }));
    writeFileSync('docs/crewlo/voxel-animation.webm',Buffer.from(video,'base64'));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForTimeout(500);
    assert.ok(!(await actors()).some(a=>['walking','coffee','gaming','smoking','sit'].includes(a.mode)));
    await page.screenshot({path:'docs/crewlo/voxel-reduced-motion.png'});
    console.log('PASS framing, selection, panel collapse, idle leisure, work interruption, approval/error/dependency/completion and reduced motion');
    console.log('PAGE ERRORS',errors);
    assert.deepEqual(errors,[]);
  } catch(error){console.error(error);throw error;}
  finally {await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1;});
