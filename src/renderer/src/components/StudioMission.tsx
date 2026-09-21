import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/store";
import type { MissionExecution } from '../../../shared/missionExecution';

export function StudioMission() {
  const agents = useStore((s) => s.agents),
    god = agents.find((a) => a.isGod);
  const [text, setText] = useState(""),
    [sending, setSending] = useState(false),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  const requestId = useRef<string>();
  const [missions, setMissions] = useState<MissionExecution[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = () => window.cth.missionExecutions?.().then(rows => { if (active) setMissions(rows); }).catch(() => {});
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !god?.ptyId || lock.current) return;
    lock.current = true;
    setSending(true);
    setMessage("");
    try {
      if (!window.cth.submitMission) throw new Error('Restart Crewlo to load the updated mission dispatcher. Your existing mission is preserved.');
      requestId.current ??= crypto.randomUUID();
      const res = await window.cth.submitMission({ id: requestId.current, body: text.trim() });
      if (!res.ok) throw new Error(res.error || "Mission could not be sent.");
      setText("");
      requestId.current = undefined;
      setMessage(`Queued for ${god.name}. Waiting for provider delivery.`);
      if (res.mission) setMissions(previous => [...previous.filter(m => m.id !== res.mission!.id), res.mission!]);
      useStore.getState().select(god.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      lock.current = false;
      setSending(false);
    }
  }
  return (
    <form className="crewlo-mission" onSubmit={submit}>
      <label htmlFor="crewlo-mission">What shall we make?</label>
      <div className="crewlo-mission-row">
        <textarea
          id="crewlo-mission"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Describe a task, a question, or your next big idea…"
        />
        <button
          className="crewlo-primary"
          disabled={!text.trim() || !god?.ptyId || sending}
        >
          {sending ? "Sending…" : "Start mission ↗"}
        </button>
      </div>
      <span role="status">
        {message ||
          (god?.ptyId
            ? `Routed through ${god.name} · Your existing permissions apply`
            : "Add or connect your coordinator to start a mission.")}
      </span>
      {missions.slice(-3).map(m => <div key={m.id} role={m.error ? 'alert' : 'status'}>
        {m.state === 'queued' ? 'Queued' : m.state === 'delivered' ? 'Delivered · awaiting provider acknowledgement' : m.state === 'running' ? 'Running · provider acknowledged the mission' : m.state === 'completed' ? 'Completed' : 'Failed'}
        {' · '}{m.body.split('\n')[0].slice(0, 100)}{m.error ? ` — ${m.error}` : ''}
      </div>)}
    </form>
  );
}
