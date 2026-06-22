# @arc-nano-kit/sdk

> Usage-based billing and paid API middleware for Arc — powered by Circle Nanopayments & x402

This is the core SDK package of [arc-nano-kit](https://github.com/horn111/arc-nano-kit). See the root README for full documentation.

It includes paid API middleware, buyer SDK helpers, usage billing, invoices, receipt watchers, receipts, and signed webhooks for Arc payment workflows.

## Installation

```bash
npm install @arc-nano-kit/sdk
```

## Quick Start

### Seller (Paywall an API)

```typescript
import express from 'express';
import { expressPaywall } from '@arc-nano-kit/sdk/middleware';

const app = express();

app.get('/api/data', expressPaywall({ price: '0.001' }), (req, res) => {
  res.json({ data: 'premium content' });
});
```

### Buyer (Pay for API access)

```typescript
import { BuyerClient } from '@arc-nano-kit/sdk/client';

const buyer = new BuyerClient({ privateKey: '0x...' });
const response = await buyer.request('https://api.example.com/data');
```

### Payment Ops (Create an invoice and receipt)

```typescript
import { ReceiptLedger } from '@arc-nano-kit/sdk/receipts';

const ledger = new ReceiptLedger();
const invoice = ledger.createInvoice({
  id: 'inv_123',
  amount: '19.00',
  payTo: '0x1111111111111111111111111111111111111111',
});

const receipt = ledger.recordPayment(invoice.id, {
  to: invoice.payTo,
  amount: '19.00',
  memo: invoice.memo,
});
```

## Modules

| Module | Import | Description |
|--------|--------|-------------|
| Middleware | `@arc-nano-kit/sdk/middleware` | Express & Next.js paywall middleware |
| Client | `@arc-nano-kit/sdk/client` | Buyer SDK for automated x402 payments |
| Billing | `@arc-nano-kit/sdk/billing` | Usage metering & billing plans |
| Gateway | `@arc-nano-kit/sdk/gateway` | Circle Gateway balance management |
| Receipts | `@arc-nano-kit/sdk/receipts` | Invoices, memos, Arc Testnet watcher, receipts, signed webhooks |

## License

Apache-2.0 — see [LICENSE](../../LICENSE)
