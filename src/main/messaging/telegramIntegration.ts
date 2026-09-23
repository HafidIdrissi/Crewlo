import { ipcMain, safeStorage } from 'electron';
import QRCode from 'qrcode';
import { getSecret, setSecret, deleteSecret, hasSecret } from '../integrations';
import type { PersistStore } from '../db';
import type { MessagingGateway } from './gateway';
import type { RemoteExchange } from '../../shared/messaging';
import { TelegramService, type TelegramState } from './telegramService';
import { TelegramHttpApi, TelegramError } from './telegramApi';

const SECRET = 'crewlo.messaging.telegram.bot';
const STATE = 'messaging.telegram.v1';
/** Dedicated IPC and the existing OS vault keep the token out of config and agent prompts. */
export function installTelegram(persist: PersistStore, gateway: MessagingGateway, otherHistory: (id: string) => RemoteExchange[] = () => []) {
  let service: TelegramService | undefined;
  let qrLink = '', qr: Promise<string> = Promise.resolve('');
  const get = () => {
    if (!persist.isOpen) throw new Error('Local message storage unavailable.');
    return service ??= new TelegramService({ gateway,
      load: () => persist.getKv<TelegramState>(STATE),
      save: state => { if (!persist.isOpen) throw new Error('Local message storage unavailable.'); persist.setKv(STATE, state); },
      secret: {
        get: () => getSecret(SECRET),
        set: token => safeStorage.isEncryptionAvailable() && (process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text') && setSecret(SECRET, token).ok,
        delete: () => { deleteSecret(SECRET); if (hasSecret(SECRET)) throw new Error('Secure token removal failed. Try Disconnect again.'); }
      }, api: token => new TelegramHttpApi(token)
    });
  };
  const action = (handler: (...args: unknown[]) => unknown) => async (_event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => {
    try { await handler(...args); return { ok: true }; }
    catch (error) {
      const known = error instanceof Error && /^(Disconnect|Enter|Open|This |Secure |Connect|Pairing|Agent|Local )/.test(error.message);
      return { ok: false, error: error instanceof TelegramError || known ? (error as Error).message : 'Telegram operation failed. Check the connection and try again.' };
    }
  };
  ipcMain.handle('telegram:connect', action(token => { if (typeof token !== 'string') throw Error('Enter a bot token.'); return get().connect(token.trim()); }));
  ipcMain.handle('telegram:disconnect', action(() => get().disconnect()));
  ipcMain.handle('telegram:pair', action(() => get().beginPairing()));
  ipcMain.handle('telegram:confirm', action((id, accept) => { if (typeof id !== 'string' || typeof accept !== 'boolean') throw Error('Pairing request invalid.'); get().confirm(id, accept); }));
  ipcMain.handle('telegram:defaultAgent', action(id => { if (typeof id !== 'string') throw Error('Agent id required.'); get().setDefault(id); }));
  ipcMain.handle('telegram:status', async () => {
    const status = get().status();
    if ((status.pairingLink ?? '') !== qrLink) { qrLink = status.pairingLink ?? ''; qr = qrLink ? QRCode.toDataURL(qrLink, { width: 180, margin: 2 }) : Promise.resolve(''); }
    return { ...status, pairingQr: await qr || undefined };
  });
  ipcMain.handle('messaging:history', (_event, id: unknown) => typeof id === 'string' ? [...get().history(id), ...otherHistory(id)] : []);
  return {
    start: () => { try { if (persist.isOpen) get().restore(); } catch { /* service reports storage failure; do not block app startup */ } },
    stop: () => service?.stop(),
    reply: (msg: Parameters<TelegramService['agentReply']>[0]) => {
      if (/^remote:tg-/.test(msg.conversation)) get().agentReply(msg);
    }
  };
}
