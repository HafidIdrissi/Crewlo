const test=require('node:test'),assert=require('node:assert/strict'),load=require('./load-ts.cjs');
const {createWorld,findPath,cell}=load('src/renderer/src/scene/studio/voxelWorld.ts');
const {VoxelLife,canLeisure,executionLabel}=load('src/renderer/src/scene/studio/voxelLife.ts');
const {observeHook}=load('src/renderer/src/scene/studio/voxelEvidence.ts');
const idle=(id,extra={})=>({id,status:'idle',queued:0,connected:true,confirmedIdle:true,...extra});

test('all four areas and every workstation are reachable without crossing furniture or railings',()=>{
  for(const count of [0,6,14,30]) {
    const w=createWorld(count);
    assert.ok(w.desks.length>=count);
    for(const start of w.desks)for(const goal of w.destinations) {
      const path=findPath(w,start,goal);assert.ok(path,`${count}: ${cell(start)} -> ${goal.id}`);
      let previous=start;
      for(const p of path){assert.ok(!w.blocked.has(cell(p)));assert.equal(Math.abs(p.x-previous.x)+Math.abs(p.y-previous.y),1);previous=p;}
    }
    assert.equal(findPath(w,w.desks[0],{x:27,y:2}),null);
  }
});
test('leisure requires confirmed idle and never overrides gates, queues or unknown/disconnected sessions',()=>{
  for(const patch of [{status:'working'},{status:'thinking'},{status:'blocked'},{status:'waiting'},{status:'looping'},{status:'success'},{status:'compacting'},{status:'ghost'},{queued:1},{held:true},{approval:true},{busy:true},{confirmedIdle:false},{connected:false}])assert.equal(canLeisure(idle('a',patch)),false);
  assert.equal(canLeisure(idle('a')),true);
  let ev=observeHook(undefined,{event:'PreToolUse',tool:'Edit'});
  assert.equal(ev.phase,'busy');
  ev=observeHook(ev,{event:'Unknown'});assert.equal(ev.phase,'busy');
  assert.equal(observeHook(ev,{event:'Stop',blocked:true}).phase,'busy');
  assert.equal(observeHook(ev,{event:'Stop',blocked:false}).phase,'idle');
  assert.equal(observeHook(ev,{event:'Notification',message:'Please approve this command'}).phase,'approval');
});
test('idle schedules are staggered; destinations are reserved and smoking is opt-in',()=>{
  const life=new VoxelLife(createWorld(8)),agents=Array.from({length:8},(_,i)=>idle('agent-'+i));
  life.sync(agents,0);assert.ok(new Set([...life.actors.values()].map(a=>a.nextAt)).size>1);
  life.sync(agents,50000);
  const destinations=[...life.actors.values()].map(a=>a.destination).filter(Boolean);
  assert.ok(destinations.length>0);assert.equal(new Set(destinations.map(d=>d.id)).size,destinations.length);
  assert.ok(destinations.every(d=>d.activity!=='smoking'));
  life.sync([],51000);assert.equal(life.reservations.size,0);assert.equal(life.actors.size,0);
});
test('new work cancels leisure immediately, returns to the workstation, then types',()=>{
  const w=createWorld(1),life=new VoxelLife(w),agent=idle('a');
  life.sync([agent],0);life.sync([agent],50000);
  assert.ok(life.actors.get('a').destination);
  for(let t=0;t<1500;t++) {life.step(.05,50000+t*50);life.sync([agent],50000+t*50);if(life.actors.get('a').mode!=='walking')break;}
  const working=idle('a',{status:'working',busy:true,carrying:'Edit'});
  life.sync([working],125001);const a=life.actors.get('a');
  assert.equal(a.destination,undefined);assert.equal(life.reservations.size,0);assert.equal(a.label,'Editing files');
  assert.ok(['walking','typing'].includes(a.mode));
  for(let t=0;t<1500;t++){life.step(.05,125001+t*50);life.sync([working],125001+t*50);if(a.mode==='typing')break;}
  assert.equal(cell(a),cell(a.home));assert.equal(a.mode,'typing');assert.ok(a.x===a.home.x&&a.y===a.home.y);
});
test('approval, failure, cancellation, reduced motion and restart cannot retain a leisure pose',()=>{
  for(const patch of [{status:'blocked',approval:true},{status:'looping'},{connected:false},{confirmedIdle:false},{queued:1}]){
    const life=new VoxelLife(createWorld(1));life.sync([idle('a')],0);life.sync([idle('a')],50000);
    life.sync([idle('a',patch)],50001);const a=life.actors.get('a');
    assert.equal(a.destination,undefined);assert.ok(!['smoking','gaming','coffee','sit'].includes(a.mode));
  }
  const life=new VoxelLife(createWorld(1));life.sync([idle('a',{smoking:true})],0);life.sync([idle('a',{smoking:true})],50000,true);
  assert.equal(life.actors.get('a').mode,'idle');assert.equal(life.reservations.size,0);
  const restarted=new VoxelLife(createWorld(1));restarted.sync([idle('a',{confirmedIdle:false})],100000);
  assert.equal(restarted.actors.get('a').mode,'idle');
});
test('blocked paths do not teleport; concurrent movement never claims the same floor cell',()=>{
  const w=createWorld(6),life=new VoxelLife(w),agents=Array.from({length:6},(_,i)=>idle('p'+i,{smoking:true}));
  life.sync(agents,0);
  for(let t=0;t<1800;t++) {
    life.sync(agents,t*100);life.step(.1,t*100);
    const keys=[...life.actors.values()].map(cell);
    assert.equal(new Set(keys).size,keys.length,'occupied cells are exclusive');
    assert.ok(keys.every(k=>!w.blocked.has(k)));
  }
  const goal=w.destinations[0];const occupied=new Set([[goal.x+1,goal.y],[goal.x-1,goal.y],[goal.x,goal.y+1],[goal.x,goal.y-1]].map(([x,y])=>cell({x,y})));
  assert.equal(findPath(w,w.desks[0],goal,occupied),null);
});
test('work labels derive from event details, not imagined progress',()=>{
  assert.equal(executionLabel(idle('a',{status:'working',carrying:'Edit'})),'Editing files');
  assert.equal(executionLabel(idle('a',{status:'working',action:'Bash npm test'})),'Running tests');
  assert.equal(executionLabel(idle('a',{status:'working',action:'maybe testing something'})),'Working');
  assert.equal(executionLabel(idle('a',{status:'waiting'})),'Dependency wait');
  assert.equal(executionLabel(idle('a',{status:'success'})),'Finished');
});

test('smoking requires opt-in and revocation cancels it immediately',()=>{
  const w=createWorld(1);w.destinations=w.destinations.filter(d=>d.activity==='smoking');
  const life=new VoxelLife(w);life.sync([idle('smoker')],0);life.sync([idle('smoker')],50000);
  assert.equal(life.reservations.size,0);
  life.sync([idle('smoker',{smoking:true})],80000);
  assert.equal(life.actors.get('smoker').destination.activity,'smoking');
  for(let t=0;t<1000;t++){life.step(.1,80000+t*100);life.sync([idle('smoker',{smoking:true})],80000+t*100);if(life.actors.get('smoker').mode==='smoking')break;}
  assert.equal(life.actors.get('smoker').mode,'smoking');
  life.sync([idle('smoker')],180001);
  assert.equal(life.reservations.size,0);assert.notEqual(life.actors.get('smoker').mode,'smoking');
});
test('rerouting aligns fractional positions exactly and 30 actors remain collision-free',()=>{
  const w=createWorld(30),home=w.desks[0];
  assert.deepEqual(findPath(w,{x:home.x+.2,y:home.y},home),[home]);
  const life=new VoxelLife(w),agents=Array.from({length:30},(_,i)=>idle('crowd-'+i));
  life.sync(agents,0);
  for(let t=0;t<1200;t++){
    life.sync(agents,t*100);life.step(.1,t*100);
    const cells=[...life.actors.values()].map(cell);
    assert.equal(new Set(cells).size,30);assert.ok(life.reservations.size<=8);
  }
});
