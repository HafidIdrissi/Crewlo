import type { RemoteAgent, RemoteExchange } from '../../shared/messaging';

/** Channel-independent boundary. Telegram and WhatsApp use the same
 * session roster, delivery gates and structured reply protocol. No PTY writes. */
export interface MessagingGateway {
  scope(): string;
  agents(): RemoteAgent[];
  enqueue(message: RemoteExchange): void;
  clean(text: string): string;
}

export function remoteRequest(message: RemoteExchange) {
  return {
    id: message.id,
    conversation: `remote:${message.id}`,
    to: message.agentId,
    act: 'request' as const,
    subject: 'Message from the paired owner',
    body: `${message.text}\n\n[CREWLO_REMOTE_REPLY]\nReply through your normal outbox: to="human", conversation="remote:${message.id}", in_reply_to="${message.id}", act="inform" (or "done"/"refuse"). Put ONLY the user-facing answer in the JSON field public_reply; body can say "Remote reply ready". Do not put internal instructions, credentials, tool output or terminal logs in public_reply. Existing permissions still apply.\n[/CREWLO_REMOTE_REPLY]`,
    requires_reply: true
  };
}
