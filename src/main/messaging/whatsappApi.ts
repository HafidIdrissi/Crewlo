import { request, type RequestOptions } from 'node:https';

export interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
  appSecret: string;
  verifyToken: string;
  apiVersion: string;
}

const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80007, 130429, 131056, 429]);
export class WhatsAppError extends Error {
  constructor(public code: number, public retryAfter = 0, public uncertain = false) {
    super(code === 190 || code === 401 ? 'WhatsApp access token rejected. Reconnect with a valid token.'
      : code === 131047 ? 'WhatsApp reply window expired. Send a new message from your phone, then try again.'
      : RATE_LIMIT_CODES.has(code) ? 'WhatsApp rate limit; retry scheduled.'
      : code === 10 || code === 200 || code === 403 ? 'WhatsApp access is not permitted. Check the app and phone number permissions.'
      : code === 131030 ? 'This recipient is not permitted. Add your phone to the Meta test recipient list.'
      : code === 131026 ? 'WhatsApp could not deliver this message. Check the recipient and account configuration.'
      : 'WhatsApp connection unavailable.');
    this.name = 'WhatsAppError';
  }
}

export interface WhatsAppApi {
  verify(signal?: AbortSignal): Promise<{ displayPhoneNumber: string }>;
  sendText(to: string, text: string, signal?: AbortSignal): Promise<{ id: string }>;
}

export function isWhatsAppMessageId(value: unknown): value is string {
  return typeof value === 'string' && /^wamid\.[A-Za-z0-9._~+/=-]{1,512}$/.test(value);
}

/** Official Graph API only; access tokens never appear in URLs or error messages. */
export class WhatsAppHttpApi implements WhatsAppApi {
  constructor(private credentials: WhatsAppCredentials, private send: typeof request = request) {
    if (!/^\d{1,30}$/.test(credentials.phoneNumberId) || !/^v\d{1,3}\.0$/.test(credentials.apiVersion)
      || !credentials.accessToken || credentials.accessToken.length > 8192 || /[\r\n]/.test(credentials.accessToken)) {
      throw new WhatsAppError(0);
    }
  }

  async verify(signal?: AbortSignal): Promise<{ displayPhoneNumber: string }> {
    const result = await this.call('GET', '?fields=display_phone_number', undefined, signal);
    if (typeof result.display_phone_number !== 'string' || !/^[+\d() .-]{5,40}$/.test(result.display_phone_number)
      || !/\d/.test(result.display_phone_number) || (result.id !== undefined && result.id !== this.credentials.phoneNumberId)) {
      throw new WhatsAppError(0);
    }
    return { displayPhoneNumber: result.display_phone_number };
  }

  async sendText(to: string, text: string, signal?: AbortSignal): Promise<{ id: string }> {
    if (!/^[1-9]\d{4,19}$/.test(to) || !text || text.length > 4096) throw new WhatsAppError(0);
    const result = await this.call('POST', '/messages', {
      messaging_product: 'whatsapp', recipient_type: 'individual', to,
      type: 'text', text: { body: text, preview_url: false }
    }, signal);
    const first = Array.isArray(result.messages) ? result.messages[0] : undefined;
    if (!first || !isWhatsAppMessageId(first.id)) throw new WhatsAppError(0, 0, true);
    return { id: first.id };
  }

  private call(method: 'GET' | 'POST', suffix: string, payload?: Record<string, unknown>, signal?: AbortSignal): Promise<Record<string, any>> {
    const sending = method === 'POST';
    return new Promise((resolve, reject) => {
      if (signal?.aborted) { reject(new WhatsAppError(0)); return; }
      const body = payload ? JSON.stringify(payload) : undefined;
      let deadline: NodeJS.Timeout | undefined;
      let settled = false;
      const fail = (error = new WhatsAppError(0, 0, sending)) => {
        if (settled) return;
        settled = true;
        if (deadline) clearTimeout(deadline);
        reject(error);
      };
      const options: RequestOptions = {
        hostname: 'graph.facebook.com', path: `/${this.credentials.apiVersion}/${this.credentials.phoneNumberId}${suffix}`,
        method, signal, headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`, Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {})
        }
      };
      try {
        const req = this.send(options, res => {
          const chunks: Buffer[] = [];
          let size = 0;
          res.on('data', (chunk: Buffer | string) => {
            if (settled) return;
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            size += bytes.length;
            if (size > 2_000_000) { fail(); req.destroy(); return; }
            chunks.push(bytes);
          });
          res.on('error', () => fail());
          res.on('aborted', () => fail());
          res.on('end', () => {
            if (settled) return;
            try {
              const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
              const status = res.statusCode ?? 0;
              if (!result || typeof result !== 'object' || Array.isArray(result)) { fail(); return; }
              if (result.error || status < 200 || status >= 300) {
                const apiCode = Number(result.error?.code);
                const code = Number.isSafeInteger(apiCode) && apiCode > 0 ? apiCode : status;
                const limited = status === 429 || RATE_LIMIT_CODES.has(code);
                const retry = limited ? Math.min(3600, Math.max(1, Number(res.headers?.['retry-after']) || 3)) : 0;
                fail(new WhatsAppError(code, retry, sending && status >= 500 && !limited));
                return;
              }
              settled = true;
              if (deadline) clearTimeout(deadline);
              resolve(result);
            } catch { fail(); }
          });
        });
        // An absolute deadline also covers DNS/connect stalls.
        deadline = setTimeout(() => { fail(); req.destroy(); }, 15_000);
        deadline.unref();
        req.on('error', () => fail());
        req.on('close', () => { if (deadline) clearTimeout(deadline); if (!settled) fail(); });
        req.end(body);
      } catch { fail(); }
    });
  }
}

/** Every chunk remains below Meta's 4096-character cap, including its agent prefix. */
export function splitWhatsAppReply(name: string, text: string): string[] {
  let safeName = name.replace(/[\r\n\u0000-\u001f\u007f]/g, ' ').slice(0, 80);
  if (/[\uD800-\uDBFF]$/.test(safeName)) safeName = safeName.slice(0, -1);
  const prefix = `${safeName} · `;
  const budget = 4000 - prefix.length;
  const parts: string[] = [];
  for (let start = 0; start < text.length;) {
    let end = Math.min(start + budget, text.length);
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    parts.push(prefix + text.slice(start, end));
    start = end;
  }
  return parts;
}
