import { useEffect, useState } from 'react';
import type { MessagingResult, TelegramStatus } from '@shared/messaging';

export function TelegramSettings() {
  const [status, setStatus] = useState<TelegramStatus>();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = async () => setStatus(await window.cth.telegramStatus());
  useEffect(() => {
    let alive = true;
    const read = async () => {
      try { const next = await window.cth.telegramStatus(); if (alive) setStatus(next); }
      catch { if (alive) setError('Telegram status unavailable. Restart Crewlo after updating.'); }
    };
    void read(); const timer = setInterval(read, 2000);
    return () => { alive = false; clearInterval(timer); };
  }, []);
  const run = async (operation: () => Promise<MessagingResult>) => {
    setBusy(true); setError('');
    try { const result = await operation(); if (!result.ok) setError(result.error || 'Operation failed.'); await refresh(); }
    catch { setError('Telegram operation unavailable. Please try again.'); }
    finally { setBusy(false); }
  };
  return <section className="crewlo-telegram" aria-label="Telegram setup">
    <div className="crewlo-telegram-heading"><strong>Telegram</strong><span role="status">{status?.state ?? 'Checking…'}{status?.botUsername ? ` · @${status.botUsername}` : ''}</span></div>
    <p>Message your existing agents from your phone. Only your paired private chat is accepted.</p>
    {!status?.hasToken && <form onSubmit={e => { e.preventDefault(); const value = token; setToken(''); void run(() => window.cth.telegramConnect(value)); }}>
      <label htmlFor="telegram-token">Bot token from @BotFather</label>
      <div className="crewlo-telegram-row"><input id="telegram-token" type="password" autoComplete="off" spellCheck={false} value={token} onChange={e => setToken(e.target.value)} placeholder="Paste token" /><button className="crewlo-primary" disabled={busy || !token.trim()}>Connect</button></div>
      <small>Encrypted with your operating system’s secure storage.</small>
    </form>}
    {status?.detail && <p role="status">{status.detail}</p>}
    {status?.pairingLink && <div className="crewlo-telegram-pairing">
      {status.pairingQr && <img width={144} height={144} src={status.pairingQr} alt="Scan to open the single-use Telegram pairing link" />}
      <div><strong>Pair your phone</strong><p>Scan, press Start in Telegram, then confirm the account here. Link expires in five minutes and works once.</p>
        <button onClick={() => void navigator.clipboard.writeText(status.pairingLink!).catch(() => setError('Could not copy link.'))}>Copy pairing link</button>
        <button onClick={() => void window.cth.openExternal(status.pairingLink!)}>Open Telegram</button>
      </div>
    </div>}
    {status?.candidate && <div className="crewlo-telegram-confirm">
      <strong>Confirm this is your account</strong><p>{status.candidate.name} · Telegram ID {status.candidate.userId}</p>
      <button className="crewlo-primary" disabled={busy} onClick={() => void run(() => window.cth.telegramConfirm(status.candidate!.id, true))}>Confirm pairing</button>{' '}
      <button disabled={busy} onClick={() => void run(() => window.cth.telegramConfirm(status.candidate!.id, false))}>Reject</button>
    </div>}
    {status?.owner && <p>Paired with {status.owner.name} · ID {status.owner.id}</p>}
    {status?.hasToken && <>
      <label htmlFor="telegram-agent">Default agent</label>
      <select id="telegram-agent" value={status.defaultAgent ?? ''} disabled={busy} onChange={e => void run(() => window.cth.telegramDefaultAgent(e.target.value))}>
        <option value="" disabled>Choose an agent…</option>
        {status.agents.map(a => <option key={a.id} value={a.id}>{a.name} · {a.state}</option>)}
      </select>
      <div className="crewlo-telegram-row">{!status.owner && <button disabled={busy} onClick={() => void run(() => window.cth.telegramPair())}>New pairing link</button>}<button disabled={busy} onClick={() => void run(() => window.cth.telegramDisconnect())}>Disconnect</button></div>
      <small>Use /agents in Telegram to switch agents. Keep Crewlo open. Disconnect removes the token and pairing; work already submitted may continue.</small>
    </>}
    {!!status?.uncertainReplies && <p role="alert">{status.uncertainReplies} replies failed or have uncertain delivery. Check Conversation before resending.</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
