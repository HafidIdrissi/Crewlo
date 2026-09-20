import type { Agent } from "@/store/store";
import { resolveActivity, type ActivityKind } from './activityState';

/** Shared display state for the panel and any non-voxel UI. */
export function studioStatus(
  agent: Pick<Agent, "status" | "onHold" | "blockReason" | "action" | "carrying"> & { queued?: number; connected?: boolean; approval?: boolean },
): {
  label: string;
  kind: ActivityKind;
  color: number;
  pose: "neutral" | "working" | "attention";
  attention: boolean;
} {
  const activity=resolveActivity(agent);
  const color:Record<ActivityKind,number>={
    idle:0x776d61,thinking:0x4d7085,working:0x526e5a,waiting:0x5d6b83,blocked:0xa44834,
    success:0x486c51,ghost:0x776d61,compacting:0x75637e,looping:0xa44834,typing:0x776d61
  };
  return {
    label:activity.label,kind:activity.kind,color:color[activity.kind],
    pose:activity.attention?'attention':activity.working?'working':'neutral',
    attention:activity.attention
  };
}
