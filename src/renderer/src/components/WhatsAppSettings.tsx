import { useEffect, useState } from 'react';
import type { MessagingResult, WhatsAppConnect, WhatsAppStatus } from '@shared/messaging';

const STATE_LABELS: Record<WhatsAppStatus['state'], string> = {
  disconnected: 'Disconnected', connecting: 'Checking credentials…',
  listening: 'Local listener ready', receiving: 'Signed webhook received', error: 'Needs attention'
};

export function WhatsAppSettings() {
  const [status, setStatus] = useState<WhatsAppStatus>();
  const [form, setForm] = useState<WhatsAppConnect>({
    accessToken: '', phoneNumberId: '', appSecret: '', verifyToken: '', apiVersion: 'v26.0', port: 8788
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const read = async () => {
      try { const next = await window.cth.whatsappStatus(); if (alive) setStatus(next); }
      catch { if (alive) setError('WhatsApp status unavailable. Restart Crewlo after updating.'); }
    };
    void read();
    const timer = setInterval(read, 2000);
    return () => { alive = false; clearInterval(timer); };
  }, []);
  const run = async (operation: () => Promise<MessagingResult>) => {
    setBusy(true); setError('');
    try {
      const result = await operation();
      if (!result.ok) setError(result.error || 'Operation failed. Please try again.');
      setStatus(await window.cth.whatsappStatus());
    } catch { setError('WhatsApp operation unavailable. Please try again.'); }
    finally { setBusy(false); }
  };
  const copy = (text: string) => void navigator.clipboard.writeText(text).catch(() => setError('Could not copy. Select and copy the text instead.'));
  const openPairing = () => {
    if (status?.pairingLink) void window.cth.openExternal(status.pairingLink).catch(() => setError('Could not open WhatsApp. Copy the pairing link instead.'));
  };
  return <section className="crewlo-telegram crewlo-whatsapp" aria-label="WhatsApp setup">
    <div className="crewlo-telegram-heading"><strong>WhatsApp</strong><span role="status">{status ? STATE_LABELS[status.state] : 'Checking…'}</span></div>
    <p>Official Meta Cloud API. Requires a Meta app and a WhatsApp Business or Meta test number. Only your confirmed owner account can message agents.</p>
    {!status?.hasCredentials && <form onSubmit={event => {
      event.preventDefault();
      const config = { ...form };
      setForm(current => ({ ...current, accessToken: '', appSecret: '', verifyToken: '' }));
      void run(() => window.cth.whatsappConnect(config));
    }}>
      <label htmlFor="whatsapp-phone-id">Meta phone number ID</label>
      <input id="whatsapp-phone-id" autoComplete="off" inputMode="numeric" spellCheck={false} required value={form.phoneNumberId} onChange={event => setForm({ ...form, phoneNumberId: event.target.value })} placeholder="Phone number ID, not your phone number" />
      <label htmlFor="whatsapp-access-token">Access token</label>
      <input id="whatsapp-access-token" type="password" autoComplete="off" spellCheck={false} required value={form.accessToken} onChange={event => setForm({ ...form, accessToken: event.target.value })} />
      <label htmlFor="whatsapp-app-secret">Meta app secret</label>
      <input id="whatsapp-app-secret" type="password" autoComplete="off" spellCheck={false} required value={form.appSecret} onChange={event => setForm({ ...form, appSecret: event.target.value })} />
      <label htmlFor="whatsapp-verify-token">Webhook verify token</label>
      <input id="whatsapp-verify-token" type="password" autoComplete="off" spellCheck={false} required value={form.verifyToken} onChange={event => setForm({ ...form, verifyToken: event.target.value })} />
      <small>Use Meta’s 32-character app secret. Choose a verify token of 24–128 letters, digits, underscores or hyphens and enter the same value in Meta’s webhook setup. Credentials use your operating system’s encrypted storage.</small>
      <div className="crewlo-whatsapp-fields">
        <label htmlFor="whatsapp-api-version">Graph API version<input id="whatsapp-api-version" required spellCheck={false} value={form.apiVersion} onChange={event => setForm({ ...form, apiVersion: event.target.value })} /></label>
        <label htmlFor="whatsapp-port">Local port<input id="whatsapp-port" type="number" min={1024} max={65535} required value={form.port} onChange={event => setForm({ ...form, port: Number(event.target.value) })} /></label>
      </div>
      <button className="crewlo-primary" disabled={busy || !status || !form.phoneNumberId.trim() || !form.accessToken.trim() || !form.appSecret.trim() || !form.verifyToken.trim()}>Connect WhatsApp</button>
    </form>}
    {status?.detail && <p role="status">{status.detail}</p>}
    {status?.displayPhoneNumber && <p>Business number: {status.displayPhoneNumber}</p>}
    {status?.localWebhookUrl && <div className="crewlo-whatsapp-webhook">
      <strong>Finish webhook setup in Meta</strong>
      <p>Manually forward a public HTTPS webhook to this local URL, then subscribe to messages in Meta. Crewlo does not create a tunnel or expose your PC automatically.</p>
      <label htmlFor="whatsapp-webhook-url">Local webhook URL</label>
      <div className="crewlo-telegram-row"><input id="whatsapp-webhook-url" readOnly value={status.localWebhookUrl} /><button onClick={() => copy(status.localWebhookUrl!)}>Copy local URL</button></div>
      <small>{status.lastWebhookAt ? `Last signed webhook: ${new Date(status.lastWebhookAt).toLocaleString()}. A webhook alone does not confirm message delivery.` : 'The local listener is ready. Incoming messages and phone delivery are not yet verified.'}</small>
    </div>}
    {status?.pairingLink && <div className="crewlo-telegram-pairing">
      {status.pairingQr && <img width={144} height={144} src={status.pairingQr} alt="Scan to open a single-use WhatsApp pairing message" />}
      <div><strong>Pair your owner account</strong><p>Scan or open the link, send the prefilled message, then confirm your account here. The link expires in five minutes and works once.</p>
        <small>This opens a WhatsApp chat, not WhatsApp Web’s linked-device screen.</small>
        <div className="crewlo-telegram-row"><button onClick={() => copy(status.pairingLink!)}>Copy pairing link</button><button onClick={openPairing}>Open WhatsApp</button></div>
      </div>
    </div>}
    {status?.candidate && <div className="crewlo-telegram-confirm">
      <strong>Confirm this is your WhatsApp account</strong><p>{status.candidate.name} · WhatsApp ID {status.candidate.userId}</p>
      <div className="crewlo-telegram-row"><button className="crewlo-primary" disabled={busy} onClick={() => void run(() => window.cth.whatsappConfirm(status.candidate!.id, true))}>Confirm pairing</button><button disabled={busy} onClick={() => void run(() => window.cth.whatsappConfirm(status.candidate!.id, false))}>Reject</button></div>
    </div>}
    {status?.owner && <p>Paired with {status.owner.name} · WhatsApp ID {status.owner.id}</p>}
    {status?.hasCredentials && <>
      <label htmlFor="whatsapp-agent">Default agent</label>
      <select id="whatsapp-agent" value={status.defaultAgent ?? ''} disabled={busy} onChange={event => void run(() => window.cth.whatsappDefaultAgent(event.target.value))}>
        <option value="" disabled>Choose an agent…</option>
        {status.agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name} · {agent.state}</option>)}
      </select>
      <div className="crewlo-telegram-row">{!status.owner && <button disabled={busy} onClick={() => void run(() => window.cth.whatsappPair())}>New pairing link</button>}<button disabled={busy} onClick={() => void run(() => window.cth.whatsappDisconnect())}>Disconnect</button></div>
      <small>Send /agents in WhatsApp to switch agents. Keep Crewlo and your HTTPS forwarding open. Disconnect removes credentials and pairing; work already submitted may continue.</small>
    </>}
    {!!status?.waitingWindowReplies && <p role="status">{status.waitingWindowReplies} replies are held until you send a new WhatsApp message to reopen the 24-hour reply window.</p>}
    {!!status?.uncertainReplies && <p role="alert">{status.uncertainReplies} replies failed or have uncertain delivery. Check Conversation before resending.</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
