import { useEffect, useState } from "react";
import { parseTasks, type HiveTask } from "./TasksKanban";
import { useStore } from "@/store/store";

/** The task ledger is the authority for deliverables, not avatar animations. */
export function StudioResults() {
  const [tasks, setTasks] = useState<HiveTask[]>([]);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const data = await window.cth.hiveTasks();
        if (alive) setTasks(parseTasks(data));
      } catch {
        /* No reliable task data: no invented result. */
      }
    };
    void refresh();
    const timer = setInterval(refresh, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  const selected = useStore((s) => s.selectedId);
  const agent = useStore((s) => s.agents.find((a) => a.id === s.selectedId));
  const result = tasks
    .filter((t) => t.status === "done" && t.assignee === selected)
    .at(-1);
  const attention = tasks.filter((t) =>
    t.humanQA?.some((q) => !q.a && !q.dismissedAt),
  );
  if (!result && !attention.length && !agent?.action) return null;
  return (
    <div className="crewlo-ledger" aria-label="Live activity and results">
      {attention.length > 0 && (
        <button
          onClick={() => useStore.getState().openTaskDetail(attention[0].id)}
        >
          {attention.length}{" "}
          {attention.length === 1 ? "request needs" : "requests need"} your
          input ↗
        </button>
      )}
      {result ? (
        <button onClick={() => useStore.getState().openTaskDetail(result.id)}>
          ✓ Result: {result.title} ↗
        </button>
      ) : (
        agent?.action && (
          <span title={agent.action}>
            {agent.name}: {agent.action}
          </span>
        )
      )}
    </div>
  );
}
