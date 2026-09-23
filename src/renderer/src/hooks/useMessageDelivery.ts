import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@/store/store';

/** Read authoritative delivery gates; never report a successful resume optimistically. */
export function useMessageDelivery(agentId?: string) {
  const ids = useStore(s => s.agents.map(a => a.id).filter(id => !agentId || id === agentId).join('\n'));
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const states = await Promise.all(ids.split('\n').filter(Boolean).map(id => window.cth.controlSnapshot(id)));
        if (alive) setPaused(states.some(s => s?.autoDeliveryPaused));
      } catch { /* Retain the last confirmed state while IPC is unavailable. */ }
    };
    void refresh();
    const timer = setInterval(refresh, 2000);
    window.addEventListener('crewlo:delivery-changed', refresh);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('crewlo:delivery-changed', refresh); };
  }, [ids]);
  const setDeliveryPaused = useCallback(async (next: boolean) => {
    setBusy(true); setError('');
    try {
      const results = await Promise.allSettled(ids.split('\n').filter(Boolean).map(id => window.cth.controlAutoDelivery(id, next)));
      if (results.some(r => r.status === 'rejected' || !r.value || r.value.autoDeliveryPaused !== next)) {
        setError(next ? 'Could not pause all messages. Try again.' : 'Could not resume all messages. Try again.');
      } else setPaused(next);
    } finally {
      setBusy(false);
      window.dispatchEvent(new Event('crewlo:delivery-changed'));
    }
  }, [ids]);
  return { paused, busy, error, setDeliveryPaused };
}
