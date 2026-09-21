export interface MissionExecution {
  id: string;
  body: string;
  agentId: string;
  state: 'queued' | 'delivered' | 'running' | 'failed' | 'completed';
  error?: string;
  updatedAt: number;
}

export function acknowledgesMission(mission: MissionExecution, event: string, prompt: string | undefined, stillPending: boolean): boolean {
  return mission.state === 'delivered' && (
    (event === 'UserPromptSubmit' && !!prompt?.includes(mission.id)) ||
    (event === 'PreToolUse' && !stillPending)
  );
}
