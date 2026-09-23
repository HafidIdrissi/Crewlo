import { request } from 'node:https';

export class TelegramError extends Error {
  constructor(public code: number, public retryAfter = 0, public uncertain = false) {
    super(code === 401 ? 'Telegram token rejected. Disconnect and enter a valid token.' : code === 409 ? 'Another poller or webhook is using this bot. Stop it, then reconnect.' : code === 429 ? 'Telegram rate limit; retry scheduled.' : code === 403 ? 'The owner blocked the bot. Unblock it in Telegram.' : 'Telegram connection unavailable.');
  }
}
export interface TelegramApi {
  call<T>(method: string, args?: Record<string, unknown>, signal?: AbortSignal): Promise<T>;
}
/** Official HTTPS Bot API only. Errors never contain the token-bearing URL or response text. */
export class TelegramHttpApi implements TelegramApi {
  constructor(private token: string, private send: typeof request = request) {}
  call<T>(method: string, args: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify(args);
      const req = this.send({ hostname: 'api.telegram.org', path: `/bot${this.token}/${method}`, method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { text += chunk; if (text.length > 2_000_000) req.destroy(); });
        res.on('error', () => reject(new TelegramError(0, 0, method === 'sendMessage')));
        res.on('end', () => {
          try {
            const result = JSON.parse(text);
            if (!result.ok) return reject(new TelegramError(Number(result.error_code) || res.statusCode || 0, Math.min(3600, Math.max(1, Number(result.parameters?.retry_after) || 1)), (res.statusCode ?? 0) >= 500 && method === 'sendMessage'));
            resolve(result.result as T);
          } catch { reject(new TelegramError(0, 0, method === 'sendMessage')); }
        });
      });
      // Absolute deadline also bounds DNS/connect stalls, not just socket inactivity.
      const deadline = setTimeout(() => req.destroy(), method === 'getUpdates' ? 35_000 : 15_000);
      deadline.unref();
      req.on('close', () => clearTimeout(deadline));
      req.on('error', () => reject(new TelegramError(0, 0, method === 'sendMessage')));
      req.end(body);
    });
  }
}
export interface TelegramUpdate {
  update_id: number;
  message?: { message_id: number; date: number; text?: string; from?: { id: number; is_bot?: boolean; first_name?: string; username?: string }; chat: { id: number; type: string } };
}
export function splitTelegramReply(name: string, text: string): string[] {
  const prefix = `${name.slice(0, 80)} · `;
  const budget = 4000 - prefix.length;
  const parts: string[] = [];
  let remaining = text;
  while (remaining) {
    let end = Math.min(budget, remaining.length);
    if (end < remaining.length && /[\uD800-\uDBFF]/.test(remaining[end - 1])) end--;
    parts.push(prefix + remaining.slice(0, end));
    remaining = remaining.slice(end);
  }
  return parts;
}
