import { useStore, type Agent } from '@/store/store';
import { AgentNameEditor } from './AgentNameEditor';
import { RealtimeMichaelToggle } from './RealtimeMichaelToggle';
import { CostHud } from '@/realtime/CostHud';

/** Secondary information from the old dock stays available in the agent panel. */
export function AgentWorkspaceDetails({agent}:{agent:Agent}) {
  const rename=useStore(s=>s.renameAgent),setNote=useStore(s=>s.setAgentNote);
  return <details className="crewlo-agent-details">
    <summary>Détails de l’agent</summary>
    <div>
      <AgentNameEditor name={agent.name} onCommit={name=>rename(agent.id,name)} fontSize={14}/>
      <label>Dossier de travail<code>{agent.worktreePath||agent.cwd||agent.project||'—'}</code></label>
      <label>Note personnelle<textarea value={agent.note??''} onChange={e=>setNote(agent.id,e.target.value)}/></label>
      {agent.contextTokens!==undefined&&<span>Contexte : {agent.contextTokens.toLocaleString()}{agent.contextLimit?' / '+agent.contextLimit.toLocaleString():''} tokens</span>}
      {agent.isGod&&<div><RealtimeMichaelToggle/><CostHud compact/></div>}
    </div>
  </details>;
}
