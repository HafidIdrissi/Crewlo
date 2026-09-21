import { promptPayload, promptSettleMs } from '../shared/promptSubmission';

export interface DeliveryResult { ok: boolean; error?: string; state: 'delivered' | 'failed' }
/** Main-process serialization and deduplication cover multiple renderer windows.
 * Never retry an ambiguous text/Enter failure: inspect the draft first. */
export class PromptDelivery {
  private receipts = new Map<string, Promise<DeliveryResult>>();
  private chains = new Map<string, Promise<unknown>>();
  constructor(
    private write: (id: string, text: string) => { ok: boolean; error?: string },
    private check: (id: string) => string | undefined,
    private sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms)),
    private identity: (id: string) => unknown = () => undefined
  ) {}
  submit(id: string, key: string, text: string, provider: string): Promise<DeliveryResult> {
    const receiptKey = `${id}:${key}`;
    const prior = this.receipts.get(receiptKey);
    if (prior) return prior;
    const next = (this.chains.get(id) ?? Promise.resolve()).catch(() => {}).then(async (): Promise<DeliveryResult> => {
      try {
        const identity = this.identity(id);
        const error = this.check(id);
        if (error) throw new Error(error);
        const wrote = this.write(id, promptPayload(text, provider));
        if (!wrote.ok) throw new Error(wrote.error || 'Provider input failed');
        await this.sleep(promptSettleMs(provider));
        if (identity !== this.identity(id)) throw new Error('Provider process changed before Enter');
        const changed = this.check(id);
        if (changed) throw new Error(changed);
        const entered = this.write(id, '\r');
        if (!entered.ok) throw new Error(entered.error || 'Provider submission failed');
        return { ok: true, state: 'delivered' };
      } catch (error) {
        return { ok: false, state: 'failed', error: `${error instanceof Error ? error.message : error}. Inspect the terminal before retrying; input may still be pending.` };
      }
    });
    this.receipts.set(receiptKey, next);
    this.chains.set(id, next);
    return next;
  }
}
