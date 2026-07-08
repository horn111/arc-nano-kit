import { describe, expect, it } from 'vitest';
import { createWebhookEvent, serializeWebhookPayload, signWebhookEvent } from './webhooks.js';
import { PersistentWebhookInbox } from './persistent-webhook-inbox.js';
import { InMemoryReceiptStore } from './store.js';

describe('PersistentWebhookInbox', () => {
  it('persists delivery attempts and increments replay after reload', async () => {
    const store = new InMemoryReceiptStore();
    const event = createWebhookEvent('invoice.paid', { invoiceId: 'inv_123' }, 1_700_000_000_000);
    const signature = signWebhookEvent(event, 'secret', 1_700_000_000);
    const firstInbox = new PersistentWebhookInbox({ store });

    const first = await firstInbox.receive({
      payload: serializeWebhookPayload(event),
      header: signature.header,
      secret: 'secret',
      now: 1_700_000_000,
    });

    const reloadedInbox = new PersistentWebhookInbox({ store });
    const replay = await reloadedInbox.replay({
      event,
      secret: 'secret',
      replayOf: first.id,
      timestamp: 1_700_000_100,
    });

    expect(first.attempt).toBe(1);
    expect(replay.attempt).toBe(2);
    expect(replay.replayOf).toBe(first.id);
    expect(await reloadedInbox.listDeliveries({ eventId: event.id })).toHaveLength(2);
  });
});
