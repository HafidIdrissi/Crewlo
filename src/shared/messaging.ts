export interface RemoteAgent { id: string; name: string; state: 'ready' | 'paused' | 'unavailable' }
export interface RemoteExchange {
  id: string;
  channel: 'telegram' | 'whatsapp';
  scope: string;
  pairing: string;
  agentId: string;
  agentName: string;
  direction: 'in' | 'out';
  text: string;
  createdAt: number;
  status: 'queued' | 'paused' | 'waiting_session' | 'routing' | 'awaiting_reply' | 'replied' | 'sending' | 'sent' | 'failed' | 'uncertain' | 'cancelled' | 'detached' | 'waiting_window' | 'accepted' | 'delivered' | 'read';
  replyTo?: string;
  parts?: string[];
  nextPart?: number;
  retryAt?: number;
  providerIds?: string[];
  providerStatuses?: Record<string, 'sent' | 'delivered' | 'read' | 'failed'>;
}
export interface TelegramStatus {
  state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  detail?: string;
  botUsername?: string;
  owner?: { id: number; name: string };
  candidate?: { id: string; userId: number; name: string; expiresAt: number };
  pairingLink?: string;
  pairingQr?: string;
  pairingExpiresAt?: number;
  defaultAgent?: string;
  agents: RemoteAgent[];
  hasToken: boolean;
  uncertainReplies: number;
}
export type MessagingResult = { ok: boolean; error?: string };

export interface WhatsAppConnect {
  accessToken: string;
  phoneNumberId: string;
  appSecret: string;
  verifyToken: string;
  apiVersion: string;
  port: number;
}
export interface WhatsAppStatus {
  state: 'disconnected' | 'connecting' | 'listening' | 'receiving' | 'error';
  detail?: string;
  hasCredentials: boolean;
  displayPhoneNumber?: string;
  phoneNumberId?: string;
  apiVersion?: string;
  localWebhookUrl?: string;
  lastWebhookAt?: number;
  owner?: { id: string; name: string };
  candidate?: { id: string; userId: string; name: string; expiresAt: number };
  pairingLink?: string;
  pairingQr?: string;
  pairingExpiresAt?: number;
  defaultAgent?: string;
  agents: RemoteAgent[];
  uncertainReplies: number;
  waitingWindowReplies: number;
}
