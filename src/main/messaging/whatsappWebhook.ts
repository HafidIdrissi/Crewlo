import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { createServer, type ServerResponse } from 'node:http';
import { isWhatsAppMessageId } from './whatsappApi';

export interface WhatsAppInbound {
  id: string;
  from: string;
  name: string;
  text?: string;
  timestamp: number;
  phoneNumberId: string;
}
export interface WhatsAppDelivery {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  recipient: string;
  errorCode?: number;
}

const record = (value: unknown): Record<string, any> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : undefined;
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const phone = (value: unknown): value is string => typeof value === 'string' && /^[1-9]\d{4,19}$/.test(value);
const groupContext = (value: Record<string, any>) => value.group_id !== undefined || value.group !== undefined
  || value.recipient_type === 'group' || value.type === 'group'
  || record(value.context)?.group_id !== undefined || record(value.context)?.group !== undefined;

/** Parse only the selected Cloud API number's individual message/status events. */
export function extractWhatsAppEvents(payload: unknown, phoneNumberId: string): { messages: WhatsAppInbound[]; statuses: WhatsAppDelivery[] } {
  const messages: WhatsAppInbound[] = [];
  const statuses: WhatsAppDelivery[] = [];
  const root = record(payload);
  if (root?.object !== 'whatsapp_business_account') return { messages, statuses };
  for (const rawEntry of list(root.entry)) {
    for (const rawChange of list(record(rawEntry)?.changes)) {
      const change = record(rawChange);
      const value = record(change?.value);
      if (change?.field !== 'messages' || !value || value.messaging_product !== 'whatsapp'
        || record(value.metadata)?.phone_number_id !== phoneNumberId || groupContext(value)) continue;
      const names = new Map<string, string>();
      for (const rawContact of list(value.contacts)) {
        const contact = record(rawContact);
        const name = record(contact?.profile)?.name;
        if (phone(contact?.wa_id) && typeof name === 'string') names.set(contact.wa_id, name.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 100));
      }
      for (const rawMessage of list(value.messages)) {
        const message = record(rawMessage);
        if (!message || groupContext(message) || !phone(message.from) || !isWhatsAppMessageId(message.id)) continue;
        const seconds = typeof message.timestamp === 'string' && /^\d{1,12}$/.test(message.timestamp) ? Number(message.timestamp) : NaN;
        if (!Number.isSafeInteger(seconds) || seconds <= 0 || !Number.isSafeInteger(seconds * 1000)) continue;
        const body = record(message.text)?.body;
        messages.push({ id: message.id, from: message.from, name: names.get(message.from) || message.from,
          ...(message.type === 'text' && typeof body === 'string' && body.length <= 16384 ? { text: body } : {}),
          timestamp: seconds * 1000, phoneNumberId });
      }
      for (const rawStatus of list(value.statuses)) {
        const status = record(rawStatus);
        if (!status || groupContext(status) || !isWhatsAppMessageId(status.id) || !phone(status.recipient_id)
          || !['sent', 'delivered', 'read', 'failed'].includes(status.status)) continue;
        const errorCode = record(list(status.errors)[0])?.code;
        statuses.push({ id: status.id, status: status.status, recipient: status.recipient_id,
          ...(Number.isSafeInteger(errorCode) && errorCode > 0 ? { errorCode } : {}) });
      }
    }
  }
  return { messages, statuses };
}

export interface WhatsAppWebhookOptions {
  port: number;
  phoneNumberId: string;
  appSecret: string;
  verifyToken: string;
  /** Must synchronously persist accepted events before returning; thrown errors request a retry. */
  onPayload(payload: unknown): void;
}

const MAX_BODY = 256 * 1024;
function tokenEquals(given: string, expected: string): boolean {
  return given.length <= 1024 && timingSafeEqual(createHash('sha256').update(given).digest(), createHash('sha256').update(expected).digest());
}

/** Loopback only. The user supplies their own HTTPS ingress; Crewlo does not publish a tunnel. */
export async function createWhatsAppWebhook(options: WhatsAppWebhookOptions): Promise<{ port: number; close(): Promise<void> }> {
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535
    || !/^\d{1,30}$/.test(options.phoneNumberId) || !options.appSecret || options.appSecret.length > 1024
    || !options.verifyToken || options.verifyToken.length > 1024) throw new Error('WhatsApp webhook configuration is invalid.');
  const respond = (res: ServerResponse, status: number, text = '') => {
    if (res.writableEnded || res.destroyed) return;
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Connection: 'close' });
    res.end(text);
  };
  const server = createServer({ maxHeaderSize: 16 * 1024 }, (req, res) => {
    req.setTimeout(10_000, () => { respond(res, 408); req.destroy(); });
    req.on('error', () => respond(res, 400));
    let url: URL;
    try { url = new URL(req.url || '/', 'http://127.0.0.1'); } catch { respond(res, 400); return; }
    if (url.pathname !== '/whatsapp/webhook') { respond(res, 404); return; }
    if (req.method === 'GET') {
      const token = url.searchParams.get('hub.verify_token') || '';
      const challenge = url.searchParams.get('hub.challenge') || '';
      if (url.searchParams.getAll('hub.mode').length !== 1 || url.searchParams.getAll('hub.verify_token').length !== 1
        || url.searchParams.getAll('hub.challenge').length !== 1 || url.searchParams.get('hub.mode') !== 'subscribe'
        || !tokenEquals(token, options.verifyToken) || !/^[A-Za-z0-9_-]{1,256}$/.test(challenge)) { respond(res, 403); return; }
      respond(res, 200, challenge);
      return;
    }
    if (req.method !== 'POST') { respond(res, 405); return; }
    if (req.headers['content-encoding'] && req.headers['content-encoding'] !== 'identity') { respond(res, 415); return; }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) { respond(res, 415); return; }
    const signature = req.headers['x-hub-signature-256'];
    if (typeof signature !== 'string' || !/^sha256=[a-fA-F0-9]{64}$/.test(signature)) { respond(res, 401); return; }
    if (Number(req.headers['content-length']) > MAX_BODY) { respond(res, 413); return; }
    let length = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      if (res.writableEnded) return;
      length += chunk.length;
      if (length > MAX_BODY) { respond(res, 413); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (res.writableEnded) return;
      const raw = Buffer.concat(chunks);
      const expected = createHmac('sha256', options.appSecret).update(raw).digest();
      if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'))) { respond(res, 401); return; }
      let payload: unknown;
      try { payload = JSON.parse(raw.toString('utf8')); } catch { respond(res, 400); return; }
      try {
        const result: unknown = options.onPayload(payload);
        // Reject accidentally asynchronous handlers: a 200 must mean durable acceptance.
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          void Promise.resolve(result).catch(() => undefined);
          respond(res, 503);
          return;
        }
        respond(res, 200);
      } catch { respond(res, 503); }
    });
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 1000;
  await new Promise<void>((resolve, reject) => {
    const fail = () => reject(new Error('WhatsApp webhook could not start. Check that the local port is available.'));
    server.once('error', fail);
    server.listen(options.port, '127.0.0.1', () => { server.off('error', fail); resolve(); });
  });
  // Network errors must not expose request bodies, credentials, or crash the desktop.
  server.on('error', () => undefined);
  const address = server.address();
  if (!address || typeof address === 'string') { server.close(); throw new Error('WhatsApp webhook could not start.'); }
  let closing: Promise<void> | undefined;
  return { port: address.port, close: () => closing ??= new Promise<void>(resolve => {
    server.close(() => resolve());
    server.closeAllConnections();
  }) };
}
