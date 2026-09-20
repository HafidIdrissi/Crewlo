import { useRef, useState } from "react";
import { useStore } from "@/store/store";

export function StudioMission() {
  const agents = useStore((s) => s.agents),
    god = agents.find((a) => a.isGod);
  const [text, setText] = useState(""),
    [sending, setSending] = useState(false),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !god?.ptyId || lock.current) return;
    lock.current = true;
    setSending(true);
    setMessage("");
    try {
      const res = await window.cth.hiveSend(
        {
          to: "god",
          act: "request",
          subject: "Mission from human",
          body: text.trim(),
        },
        "human",
      );
      if (!res.ok) throw new Error(res.error || "Mission could not be sent.");
      setText("");
      setMessage(`Sent to ${god.name}. Follow the response in the terminal.`);
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
    </form>
  );
}
