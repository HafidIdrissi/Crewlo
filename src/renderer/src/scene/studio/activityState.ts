/** One display-state resolver. The engine owns `status`; every surface reads this wording. */
export type ActivityKind = 'idle'|'thinking'|'working'|'waiting'|'blocked'|'success'|'ghost'|'compacting'|'looping'|'typing';
export interface ActivityInput { status:string; action?:string; carrying?:string; onHold?:boolean; queued?:number; approval?:boolean; connected?:boolean; blockReason?:{actions?:Array<{kind?:string}>} }
export interface ActivityState { kind:ActivityKind; label:string; working:boolean; attention:boolean }
export function resolveActivity(input:ActivityInput):ActivityState {
  const connected=input.connected??true,approval=input.approval||input.blockReason?.actions?.some(a=>a.kind==='approve');
  if(!connected||input.status==='ghost')return{kind:'ghost',label:'Disconnected',working:false,attention:false};
  if(approval)return{kind:'blocked',label:'Approval required',working:false,attention:true};
  if(input.status==='looping')return{kind:'looping',label:'Needs attention',working:false,attention:true};
  if(input.status==='blocked')return{kind:'blocked',label:'Blocked',working:false,attention:true};
  if(input.onHold)return{kind:'idle',label:'On hold',working:false,attention:false};
  if(input.status==='waiting')return{kind:'waiting',label:'Dependency wait',working:false,attention:false};
  if(input.status==='success')return{kind:'success',label:'Finished',working:false,attention:false};
  if(input.status==='compacting')return{kind:'compacting',label:'Compacting context',working:false,attention:false};
  if(input.status==='thinking')return{kind:'thinking',label:'Thinking',working:true,attention:false};
  if(input.status==='working'){
    if(['Edit','Write'].includes(input.carrying??'')||/using (Edit|Write|MultiEdit)/i.test(input.action??''))return{kind:'working',label:'Editing files',working:true,attention:false};
    if(/^(?:Bash\s+|using Bash[: ]+).*(?:npm test|pytest|vitest|cargo test|go test)/i.test(input.action??''))return{kind:'working',label:'Running tests',working:true,attention:false};
    if(input.carrying==='Read'||/^using (Read|Grep|Glob)/i.test(input.action??''))return{kind:'working',label:'Reviewing',working:true,attention:false};
    return{kind:'working',label:'Working',working:true,attention:false};
  }
  if((input.queued??0)>0)return{kind:'waiting',label:'Work queued',working:false,attention:false};
  return{kind:'idle',label:'Idle',working:false,attention:false};
}
