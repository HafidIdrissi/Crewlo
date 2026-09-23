/** Conservative evidence for cosmetics only. Silence is never proof that a turn ended. */
export interface Evidence { phase:'unknown'|'busy'|'idle'|'approval'; tool?:string; activity?:string }
export function observeHook(previous:Evidence|undefined, e:{event:string;blocked?:boolean;tool?:string;message?:string;activity?:string}):Evidence {
  if(e.event==='PreToolUse') return {phase:'busy',tool:e.tool,activity:e.activity};
  if(['UserPromptSubmit','PostToolUse','PostToolUseFailure','PreInvocation','PreCompact','PostCompact'].includes(e.event)) return {phase:'busy'};
  if(e.event==='SessionStart'||e.event==='SessionEnd')return {phase:'unknown'};
  if(['Stop','PostInvocation'].includes(e.event)) return {phase:e.blocked?'busy':'idle'};
  if(e.event==='Notification' && /permission|approve|confirm|needs your/i.test(e.message??'')) return {phase:'approval'};
  return previous??{phase:'unknown'};
}
