# @arc-nano-kit/sdk

Core SDK package for `arc-nano-kit`.

It includes paid API middleware, buyer SDK helpers, billing helpers, Arc Receipts, watcher logic, read-only Arc Testnet proof polling and verification, signed webhooks, and local webhook inbox replay for Arc payment workflows.

## Installation

```bash
npm install @arc-nano-kit/sdk
```

## Seller: Paywall An API

```typescript
import express from 'express';
import { expressPaywall } from '@arc-nano-kit/sdk/middleware';

const app = express();

app.get(
  '/api/data',
  expressPaywall({
    price: '0.001',
    network: 'arc-testnet',
    payTo: '0x1111111111111111111111111111111111111111',
  }),
  (_req, res) => {
    res.json({ data: 'premium content' });
  },
);
```

The default verifier checks payment payload structure, amount, recipient, and expiry. Production apps can provide a custom `verifyPayment` function.

## Buyer: Pay For API Access

```typescript
import { BuyerClient } from '@arc-nano-kit/sdk/client';

const buyer = new BuyerClient({
  privateKey: '0x...',
  rpcUrl: 'https://rpc.testnet.arc.network',
});

const response = await buyer.request('https://api.example.com/data');
console.log(response.data);
```

## Payment Ops: Receipt And Webhook Replay

```typescript
import {
  ReceiptLedger,
  WebhookInbox,
  createMemoPaymentRequest,
  findMemoPaymentProof,
  serializeWebhookPayload,
  signWebhookEvent,
  verifyMemoPaymentProof,
} from '@arc-nano-kit/sdk/receipts';

const ledger = new ReceiptLedger();

const invoice = ledger.createInvoice({
  id: 'inv_123',
  amount: '19.00',
  payTo: '0x1111111111111111111111111111111111111111',
});

const receipt = ledger.recordPayment(invoice.id, {
  from: '0x2222222222222222222222222222222222222222',
  to: invoice.payTo,
  amount: '19.00',
  memo: invoice.memo,
  txHash: '0xabc' as `0x${string}`,
});

const paymentRequest = createMemoPaymentRequest(invoice);
const watchResult = await findMemoPaymentProof({ paymentRequest });
const proof = await verifyMemoPaymentProof({
  txHash: '0x...' as `0x${string}`,
  paymentRequest,
});

const event = ledger.listWebhookEvents().at(-1)!;
const signed = signWebhookEvent(event, 'secret');

const inbox = new WebhookInbox();
const delivery = inbox.receive({
  payload: serializeWebhookPayload(event),
  header: signed.header,
  secret: 'secret',
});

const replay = inbox.replay({
  event,
  secret: 'secret',
  replayOf: delivery.id,
});

console.log(receipt.status);   // paid
console.log(watchResult.status);
console.log(proof.explorerUrl);
console.log(delivery.status);  // verified
console.log(replay.attempt);   // 2
```

## Modules

| Module | Import | Description |
|--------|--------|-------------|
| Middleware | `@arc-nano-kit/sdk/middleware` | Express and Next.js paywall middleware |
| Client | `@arc-nano-kit/sdk/client` | Buyer SDK for `402 -> sign -> retry` flows |
| Billing | `@arc-nano-kit/sdk/billing` | Usage metering and billing plans |
| Gateway | `@arc-nano-kit/sdk/gateway` | Small Arc Testnet balance helper |
| Receipts | `@arc-nano-kit/sdk/receipts` | Invoices, memos, watcher, onchain proof polling, receipts, signed webhooks, inbox replay |

## Current Limits

- Receipt storage is in-memory.
- Onchain proof mode is read-only and does not send transactions.
- Auto proof polling is local and does not replace a hosted indexer or persistent cursor.
- Webhook delivery attempts are in-memory.
- Watcher cursors are not persisted yet.
- Gateway helpers do not yet include deposit tracking or pending settlement state.

## Docs

- [Root README](../../README.md)
- [Grant Snapshot](../../docs/grant.md)
- [Demo Script](../../docs/demo-script.md)
- [Onchain Proof](../../docs/onchain-proof.md)
- [Arc Receipts](../../docs/receipts.md)

## License

Apache-2.0. See [LICENSE](../../LICENSE).
