/** Codex detects rapid raw input as a paste, including a following Enter.
 * Explicit paste boundaries plus a settle prevent Enter becoming draft text. */
export function promptPayload(text: string, provider: string): string {
  return provider === 'codex' || text.includes('\n') ? `\x1b[200~${text}\x1b[201~` : text;
}

export function promptSettleMs(provider: string): number {
  return provider === 'codex' ? 600 : 140;
}

/** Resume restores an existing conversation. Passing its identity again as a
 * positional PROMPT starts a new turn and can execute pending inbox work even
 * while automatic delivery is paused. */
export function withoutResumedSeed(args: string[], seed: string | undefined): string[] {
  if (!seed || args.at(-1) !== seed) return args;
  return args.slice(0, -1);
}
