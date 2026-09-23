import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import 'pixi.js/unsafe-eval';
import { useStore } from '@/store/store';
import { VoxelStage, type SceneAgent } from './VoxelStage';
import { observeHook, type Evidence } from './voxelEvidence';
import { resolveActivity } from './activityState';

const preferenceKey=()=> 'crewlo.voxel.smoking.'+(window.cth.harnessHomeSync?.()??'local');
function readSmoking():Record<string,boolean> {try{return JSON.parse(localStorage.getItem(preferenceKey())||'{}');}catch{return {};}}
/** Presentation-only subscriptions. Never sends prompts or writes execution state. */
export function StudioFloor() {
  const host=useRef<HTMLDivElement>(null),stage=useRef<VoxelStage>();
  const agents=useStore(s=>s.agents),selected=useStore(s=>s.selectedId),queues=useStore(s=>s.messageQueues);
  const evidence=useRef(new Map<string,Evidence>()),sessions=useRef(new Map<string,string>());
  const [revision,setRevision]=useState(0),[ready,setReady]=useState(0),[error,setError]=useState('');
  const [smoking,setSmoking]=useState(readSmoking),[breaks,setBreaks]=useState(true);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [zoom,setZoom]=useState(1);
  const [cameraMode,setCameraMode]=useState<'team'|'overview'|'follow'>('team');
  const chooseView=(mode:'team'|'overview'|'follow')=>{setCameraMode(mode);setZoom(1);pan.current={x:0,y:0};if(stage.current){stage.current.pan={x:0,y:0};stage.current.zoom=1;stage.current.cameraMode=mode;stage.current.layout();}};
  useEffect(()=>{chooseView(selected?'follow':'team');},[selected]);
  useEffect(()=>{const follow=()=>{if(useStore.getState().selectedId)chooseView('follow');};window.addEventListener('crewlo:open-agent',follow);return()=>window.removeEventListener('crewlo:open-agent',follow);},[]);
  const pan=useRef({x:0,y:0}),drag=useRef<{x:number;y:number}|null>(null),suppressSelect=useRef(false);
  const selectedAgent=agents.find(a=>a.id===selected);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>window.cth.onHiveHookEvent(e=>{
    if(!e.agentId||!useStore.getState().agents.some(a=>a.id===e.agentId))return;
    evidence.current.set(e.agentId,observeHook(evidence.current.get(e.agentId),e));setRevision(r=>r+1);
  }),[]);
  const sessionKey=JSON.stringify(agents.map(a=>[a.id,a.ptyId,a.terminalGeneration]));
  useEffect(()=>{
    const ids=new Set(agents.map(a=>a.id));
    for(const id of evidence.current.keys())if(!ids.has(id)){evidence.current.delete(id);sessions.current.delete(id);}
    const cleanups=agents.flatMap(a=>{
      const key=(a.ptyId??'')+':'+(a.terminalGeneration??0);
      if(sessions.current.has(a.id)&&sessions.current.get(a.id)!==key)evidence.current.delete(a.id);
      sessions.current.set(a.id,key);
      return a.ptyId?[window.cth.onPtyExit(a.ptyId,()=>{evidence.current.set(a.id,{phase:'unknown'});setRevision(r=>r+1);})]:[];
    });
    return()=>cleanups.forEach(fn=>fn());
  },[sessionKey]);
  const visibleKey=JSON.stringify(agents.map(a=>[a.id,a.name,a.character,a.status,a.action,a.carrying,a.onHold,a.blockReason,a.ptyId,queues[a.id]?.length]));
  useEffect(()=>{
    const el=host.current!,app=new Application();let cancelled=false;let observer:ResizeObserver|undefined;
    void app.init({backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio,2),autoDensity:true}).then(()=>{
      if(cancelled){app.destroy(true);return;}
      el.appendChild(app.canvas);app.canvas.setAttribute('aria-hidden','true');
      const scene=new VoxelStage(app,el,id=>{if(!suppressSelect.current){useStore.getState().select(id);window.dispatchEvent(new Event('crewlo:open-agent'));}});
      stage.current=scene;observer=new ResizeObserver(()=>scene.layout());observer.observe(el);
      app.ticker.add(t=>scene.tick(t.deltaMS/1000));setReady(r=>r+1);
    }).catch(e=>{if(!cancelled)setError(String(e));});
    return()=>{cancelled=true;observer?.disconnect();stage.current=undefined;if(app.renderer)app.destroy(true,{children:true});};
  },[]);
  useEffect(()=>{
    const list:SceneAgent[]=agents.map(a=>{
      const ev=evidence.current.get(a.id);
      // Engine state + the persisted message queue are the single visual source.
      // Hook evidence only permits cosmetic leisure; it never changes visible status.
      const activity=resolveActivity({status:a.status,action:a.action,carrying:a.carrying,onHold:a.onHold,
        queued:queues[a.id]?.length??0,connected:!!a.ptyId&&a.status!=='ghost',
        approval:a.blockReason?.actions?.some(x=>x.kind==='approve')});
      return {id:a.id,name:a.name,character:a.character,status:a.status,action:a.action,
        activity:activity.working&&ev?.phase==='busy'?ev.activity:undefined,
        carrying:a.carrying,queued:queues[a.id]?.length??0,held:a.onHold,
        connected:!!a.ptyId&&a.status!=='ghost',
        confirmedIdle:breaks&&ev?.phase==='idle',smoking:smoking[a.id]===true,
        approval:activity.attention&&activity.label==='Approval required'};
    });
    stage.current?.update(list,selected,reduced);
  },[visibleKey,revision,ready,selected,reduced,smoking,breaks]);
  useEffect(()=>{if(stage.current){stage.current.zoom=zoom;stage.current.cameraMode=cameraMode;stage.current.layout();}},[zoom,ready,cameraMode]);
  function move(x:number,y:number){pan.current.x+=x;pan.current.y+=y;if(stage.current){stage.current.pan={...pan.current};stage.current.layout();}}
  function fit(){chooseView('team');}
  return <section className="crewlo-scene crewlo-voxel" aria-label="Crewlo voxel workplace">
    <div className="crewlo-scene-heading"><div><h1>Your team, at work.</h1><span className="voxel-subtitle">LIVE ACTIVITY</span></div><div className="voxel-camera-modes" role="group" aria-label="Camera view"><button aria-pressed={cameraMode==='team'} onClick={()=>chooseView('team')}>Team</button><button aria-pressed={cameraMode==='overview'} onClick={()=>chooseView('overview')}>Studio</button><button disabled={!selectedAgent} aria-pressed={cameraMode==='follow'} onClick={()=>chooseView('follow')}>Follow</button></div><span className="crewlo-live">{agents.length} {agents.length===1?'agent':'agents'}</span></div>
    <div ref={host} className="crewlo-canvas" tabIndex={0} role="region" aria-label="Workplace camera. Arrow keys pan, plus and minus zoom, zero fits."
      onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','0'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')move(40,0);if(e.key==='ArrowRight')move(-40,0);if(e.key==='ArrowUp')move(0,40);if(e.key==='ArrowDown')move(0,-40);if(e.key==='+')setZoom(z=>Math.min(2.5,z+.15));if(e.key==='-')setZoom(z=>Math.max(.6,z-.15));if(e.key==='0')fit();}}
      onPointerDown={e=>{suppressSelect.current=e.button===1||e.shiftKey;if(suppressSelect.current){e.preventDefault();drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}}
      onPointerMove={e=>{if(drag.current){move(e.clientX-drag.current.x,e.clientY-drag.current.y);drag.current={x:e.clientX,y:e.clientY};}}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} />
    {error&&<p className="crewlo-render-error" role="alert">The scene could not render. Agent cards still open working sessions. {error}</p>}
    <div className="crewlo-scene-footer">
      <details className="voxel-preferences"><summary>Scene preferences</summary><div>
        <label><input type="checkbox" checked={breaks} onChange={e=>setBreaks(e.target.checked)} /> Cosmetic idle breaks</label>
        {selectedAgent?<label><input type="checkbox" checked={smoking[selectedAgent.id]===true} onChange={e=>{
          const next={...smoking,[selectedAgent.id]:e.target.checked};setSmoking(next);try{localStorage.setItem(preferenceKey(),JSON.stringify(next));}catch{/* Session-only if storage unavailable. */}
        }}/> Allow smoking for {selectedAgent.name}</label>:<span>Select an agent to set its smoking preference.</span>}
        <small>Local animation only. No prompts or tokens. Smoking is off by default.{reduced?' Reduced motion is active.':''}</small>
      </div></details>
      <span className="voxel-pan-hint">Shift-drag or arrow keys to pan</span>
      <div className="crewlo-zoom"><button aria-label="Zoom out" disabled={zoom<=.6} onClick={()=>setZoom(z=>Math.max(.6,z-.15))}>−</button><button aria-label="Fit studio" onClick={fit}>Fit</button><button aria-label="Zoom in" disabled={zoom>=2.5} onClick={()=>setZoom(z=>Math.min(2.5,z+.15))}>+</button></div>
    </div>
    <div className="crewlo-accessible-roster" aria-label="Select an agent">{agents.map(a=>{const activity=resolveActivity({status:a.status,action:a.action,carrying:a.carrying,onHold:a.onHold,queued:queues[a.id]?.length??0,connected:!!a.ptyId&&a.status!=='ghost',approval:a.blockReason?.actions?.some(x=>x.kind==='approve')});return <button key={a.id} aria-pressed={selected===a.id} onClick={()=>{useStore.getState().select(a.id);window.dispatchEvent(new Event('crewlo:open-agent'));}}>{a.name} · {activity.label}</button>})}</div>
  </section>;
}
