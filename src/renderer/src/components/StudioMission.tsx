import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/store";
import type { MissionExecution } from '../../../shared/missionExecution';
import { useMessageDelivery } from '@/hooks/useMessageDelivery';

export function StudioMission() {
  const agents = useStore((s) => s.agents),
    god = agents.find((a) => a.isGod);
  const [text, setText] = useState(""),
    [sending, setSending] = useState(false),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  const requestId = useRef<string>();
  const delivery = useMessageDelivery();
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
      if (res.mission) setMissions(previous => [...previous.filter(m => m.id !== res.mission!.id), res.mission!]);
      useStore.getState().select(god.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      lock.current = false;
      setSending(false);
    }
  }
  const latest = missions.at(-1);
  const missionStatus = latest ? ({ queued: 'Mission queued', delivered: 'Mission delivered · awaiting acknowledgement', running: 'Mission in progress', completed: 'Mission completed', failed: 'Mission delivery failed · check Terminal' }[latest.state]) : '';
  const status = delivery.error || (delivery.paused ? 'Message delivery paused' : message || missionStatus || (god?.ptyId ? `Ready for a mission · ${god.name}` : 'Connect your coordinator to start a mission.'));
  return (
    <form className="crewlo-mission" onSubmit={submit}>
      <label htmlFor="crewlo-mission">What shall we make?</label>
      <div className="crewlo-mission-row">
        <textarea
          id="crewlo-mission"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          aria-describedby="crewlo-mission-status"
          placeholder="Describe a task, a question, or your next big idea…"
        />
        <button
          className="crewlo-primary"
          disabled={!text.trim() || !god?.ptyId || sending}
        >
          {sending ? "Sending…" : "Start mission ↗"}
        </button>
      </div>
      <div className="crewlo-mission-status" data-paused={delivery.paused}>
        <span id="crewlo-mission-status" role="status" title={delivery.paused ? 'New messages are held. Work already in progress can continue.' : latest?.error || status}>{status}</span>
        {delivery.paused && <button type="button" className="crewlo-resume" disabled={delivery.busy} onClick={() => void delivery.setDeliveryPaused(false)}>{delivery.busy ? 'Resuming…' : 'Resume'}</button>}
      </div>
    </form>
  );
}
