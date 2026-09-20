/** Keep sessions primary and existing tools discoverable. */
export function StudioPanelNav({ current, onChange, tools }: {
  current: string; onChange: (key: string) => void;
  tools: { key: string; label: string }[];
}) {
  return <nav className="crewlo-panel-nav" aria-label="Agent workspace">
    <div className="crewlo-primary-tabs">
      {[['messages', 'Conversation'], ['tasks', 'Tasks'], ['terminal', 'Terminal']].map(([key, label]) =>
        <button key={key} aria-pressed={current === key} onClick={() => onChange(key)}>{label}</button>)}
    </div>
    <label className="crewlo-tools-menu">More tools
      <select aria-label="More agent tools" value={tools.some(t => t.key === current) ? current : ''}
        onChange={e => { if (e.target.value) onChange(e.target.value); }}>
        <option value="">Choose a tool…</option>
        {tools.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
      </select>
    </label>
  </nav>;
}
