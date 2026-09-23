import { ipcMain, safeStorage } from 'electron';
import QRCode from 'qrcode';
import { getSecret, setSecret, deleteSecret, hasSecret } from '../integrations';
import type { PersistStore } from '../db';
import type { MessagingGateway } from './gateway';
import type { WhatsAppConnect } from '../../shared/messaging';
import { WhatsAppService, type WhatsAppState } from './whatsappService';
import { WhatsAppHttpApi, type WhatsAppCredentials } from './whatsappApi';
import { createWhatsAppWebhook } from './whatsappWebhook';

const SECRET = 'crewlo.messaging.whatsapp.credentials';
const STATE = 'messaging.whatsapp.v1';
export function installWhatsApp(persist: PersistStore, gateway: MessagingGateway) {
  let service: WhatsAppService | undefined;
  let qrLink = '', qr = Promise.resolve('');
  const get = () => {
    if (!persist.isOpen) throw Error('Local message storage unavailable.');
    return service ??= new WhatsAppService({ gateway,
      load: () => persist.getKv<WhatsAppState>(STATE),
      save: state => { if (!persist.isOpen) throw Error('Local message storage unavailable.'); persist.setKv(STATE, state); },
      secret: {
        get: () => { try { const raw = getSecret(SECRET); if (!raw) return undefined; const value = JSON.parse(raw) as WhatsAppCredentials; return ['accessToken', 'appSecret', 'verifyToken', 'phoneNumberId', 'apiVersion'].every(k => typeof value[k as keyof WhatsAppCredentials] === 'string') ? value : undefined; } catch { return undefined; } },
        set: value => safeStorage.isEncryptionAvailable() && (process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text') && setSecret(SECRET, JSON.stringify(value)).ok,
        delete: () => { deleteSecret(SECRET); if (hasSecret(SECRET)) throw Error('Secure credential removal failed. Try Disconnect again.'); }
      }, api: value => new WhatsAppHttpApi(value), listen: createWhatsAppWebhook
    });
  };
  const action = (fn: (...args: unknown[]) => unknown) => async (_event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => {
    try { await fn(...args); return { ok: true }; }
    catch (error) {
      const known = error instanceof Error && /^(Disconnect|Enter|Open|Secure |Connect|Pairing|Agent|Local |Meta |Could not start WhatsApp|WhatsApp )/.test(error.message);
      return { ok: false, error: known ? (error as Error).message : 'WhatsApp operation failed. Check the setup and try again.' };
    }
  };
  ipcMain.handle('whatsapp:connect', action(input => get().connect(input as WhatsAppConnect)));
  ipcMain.handle('whatsapp:disconnect', action(() => get().disconnect()));
  ipcMain.handle('whatsapp:pair', action(() => get().beginPairing()));
  ipcMain.handle('whatsapp:confirm', action((id, accept) => { if (typeof id !== 'string' || typeof accept !== 'boolean') throw Error('Pairing request invalid.'); get().confirm(id, accept); }));
  ipcMain.handle('whatsapp:defaultAgent', action(id => { if (typeof id !== 'string') throw Error('Agent id required.'); get().setDefault(id); }));
  ipcMain.handle('whatsapp:status', async () => {
    const status = get().status();
    if ((status.pairingLink ?? '') !== qrLink) { qrLink = status.pairingLink ?? ''; qr = qrLink ? QRCode.toDataURL(qrLink, { width: 180, margin: 2 }) : Promise.resolve(''); }
    return { ...status, pairingQr: await qr || undefined };
  });
  return {
    start: () => { try { if (persist.isOpen) void get().restore().catch(() => {}); } catch { /* storage error remains visible */ } },
    stop: () => { void service?.stop().catch(() => {}); },
    reply: (msg: Parameters<WhatsAppService['agentReply']>[0]) => {
      if (/^remote:wa-/.test(msg.conversation)) get().agentReply(msg);
    },
    history: (id: string) => get().history(id)
  };
}
