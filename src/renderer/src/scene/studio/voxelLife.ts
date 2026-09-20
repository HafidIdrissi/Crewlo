import { cell, findPath, type Point, type VoxelWorld, type Destination } from './voxelWorld';
import { resolveActivity } from './activityState';

export interface Execution { id:string; status:string; action?:string; carrying?:string; queued:number; held?:boolean; connected:boolean; approval?:boolean; confirmedIdle?:boolean; busy?:boolean; smoking?:boolean }
export type Motion = 'idle'|'walking'|'typing'|'coffee'|'sit'|'gaming'|'smoking'|'attention';
export interface Actor extends Point { id:string; home:Point; mode:Motion; label:string; facing:number; path:Point[]; destination?:Destination; nextAt:number; until:number; lastGate:string; retryAt:number }
export function executionLabel(a:Execution):string {
  return resolveActivity({status:a.status,action:a.action,carrying:a.carrying,queued:a.queued,onHold:a.held,approval:a.approval,connected:a.connected}).label;
}
export function canLeisure(a:Execution) {
  return a.status==='idle' && a.connected && a.confirmedIdle===true && !a.busy && !a.queued && !a.held && !a.approval;
}
const hash=(id:string)=>Array.from(id).reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);

/** Pure local presentation state. No store writes, IPC sends, timers, or model calls. */
export class VoxelLife {
  actors=new Map<string,Actor>();
  reservations=new Map<string,string>();
  private sequence=0;
  constructor(public world:VoxelWorld) {}
  sync(executions:Execution[], now:number, reduced=false) {
    const ids=new Set(executions.map(a=>a.id));
    for(const [id,a] of this.actors) if(!ids.has(id)) { this.release(a);this.actors.delete(id); }
    executions.forEach((e,index)=>{
      let a=this.actors.get(e.id);
      const home=this.world.desks[index];
      if(!home) return;
      if(!a) {
        a={...home,id:e.id,home,mode:'idle',label:'Idle',facing:2,path:[],nextAt:now+8000+hash(e.id)%20000,until:0,lastGate:'',retryAt:0};
        this.actors.set(e.id,a);
      }
      a.home=home;
      const label=executionLabel(e), allowed=canLeisure(e), gate=allowed?'idle':label;
      // Blocking states stop cosmetic activity at once. Busy/queued work routes home, never gates execution.
      if(!allowed) {
        if(a.destination || a.lastGate!==gate) {
          this.release(a); a.path=[]; a.mode='idle'; a.nextAt=now+15000+hash(e.id)%25000;
          if(label==='Working'||label==='Editing files'||label==='Running tests'||label==='Reviewing'||label==='Work queued') this.route(a,home,now);
        }
        a.label=label;
        const working=['Working','Editing files','Running tests','Reviewing'].includes(label);
        if(!a.path.length) a.mode=working && cell(a)===cell(home)?'typing':e.approval||['blocked','looping'].includes(e.status)?'attention':'idle';
      } else if(reduced) {
        this.release(a); a.path=[]; a.mode='idle'; a.label='Idle';
      } else {
        if(a.lastGate!=='idle') a.nextAt=now+8000+hash(e.id)%20000;
        if(a.destination?.activity==='smoking' && !e.smoking) {this.release(a);a.path=[];this.route(a,home,now);a.nextAt=now+30000;}
        if(a.destination && !a.path.length && now>=a.until) {
          this.release(a); this.route(a,home,now); a.nextAt=now+25000+(hash(e.id)+this.sequence*137)%35000;
        }
        if(!a.destination && !a.path.length && now>=a.nextAt) {
          const choices=this.world.destinations.filter(d=>!this.reservations.has(d.id)&&(d.activity!=='smoking'||e.smoking));
          for(let n=0;n<choices.length;n++) {
            const d=choices[(hash(e.id)+this.sequence+n)%choices.length];
            const path=findPath(this.world,a,d,this.occupied(e.id));
            if(path) { a.destination=d;this.reservations.set(d.id,e.id);a.path=path;a.until=now+18000+(hash(e.id)+this.sequence*911)%27000;this.sequence++;break; }
          }
          a.nextAt=now+20000;
        }
        a.label=a.destination?'Idle · cosmetic break':'Idle';
        if(!a.path.length) a.mode=a.destination?.activity??'idle';
      }
      a.lastGate=gate;
      if(reduced) {
        if(a.path.length) {const end=a.path.at(-1)!; if(!this.occupied(a.id).has(cell(end))) {a.x=end.x;a.y=end.y;} a.path=[];}
      } else if(a.path.length) a.mode='walking';
    });
  }
  private occupied(except:string) {
    const result=new Set<string>();
    for(const a of this.actors.values()) if(a.id!==except) {result.add(cell(a));if(a.path[0]) result.add(cell(a.path[0]));}
    return result;
  }
  private release(a:Actor) {if(a.destination)this.reservations.delete(a.destination.id);a.destination=undefined;}
  private route(a:Actor,to:Point,now:number) {a.path=findPath(this.world,a,to,this.occupied(a.id))??[];a.retryAt=now+1500;}
  step(dt:number, now:number) {
    for(const a of this.actors.values()) {
      if(!a.path.length) {
        if(!a.destination&&['Working','Editing files','Running tests','Reviewing','Work queued'].includes(a.label)&&cell(a)!==cell(a.home)&&now>=a.retryAt) this.route(a,a.home,now);
        continue;
      }
      const next=a.path[0];
      const occupied=this.occupied(a.id);
      if(occupied.has(cell(next))) {
        if(now>=a.retryAt) {a.path=findPath(this.world,a,a.destination??a.home,occupied)??a.path;a.retryAt=now+1500;}
        continue;
      }
      const dx=next.x-a.x,dy=next.y-a.y, distance=Math.hypot(dx,dy), returning=!a.destination&&['Working','Editing files','Running tests','Reviewing','Work queued'].includes(a.label), travel=Math.min(dt,0.1)*(returning?4.2:2.8);
      a.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?0:2);
      if(distance<=travel) {a.x=next.x;a.y=next.y;a.path.shift();if(!a.path.length) {a.facing=a.destination?.facing??2;if(a.destination)a.until=now+18000+hash(a.id)%27000;}}
      else {a.x+=dx/distance*travel;a.y+=dy/distance*travel;}
    }
  }
}
