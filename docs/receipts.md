# Arc Receipts

Arc Receipts is the payment operations layer for arc-nano-kit. It gives Arc builders a small, typed workflow for invoices, transaction memos, signed webhooks, receipts, refunds, and reconciliation.

The goal is not to replace x402 or Circle App Kits. The goal is to make the application layer around Arc payments easier to ship.

## Why this module exists

Accepting a stablecoin transfer is only the first step. Production apps also need to answer:

- Who paid?
- Which invoice or API usage event did the payment belong to?
- Was the payment enough?
- Did it arrive before expiry?
- Which webhook was sent?
- What receipt can the app store, export, or show to a customer?

Arc transaction memos and Unified Balance state patterns make this a natural fit for Arc apps.

## Quick Start

```typescript
import {
  ReceiptLedger,
  signWebhookEvent,
} from '@arc-nano-kit/sdk/receipts';

const ledger = new ReceiptLedger();

const invoice = ledger.createInvoice({
  id: 'inv_pro_plan_123',
  amount: '19.00',
  currency: 'USDC',
  payTo: '0x1111111111111111111111111111111111111111',
  customerId: 'team_123',
  description: 'Pro plan subscription',
});

console.log(invoice.memo);
// arc-nano-kit:invoice:v1:inv_pro_plan_123

console.log(invoice.paymentUri);
// arc://pay?to=0x...&amount=19.00&currency=USDC&network=arc-testnet&memo=...

const receipt = ledger.recordPayment(invoice.id, {
  from: '0x2222222222222222222222222222222222222222',
  to: invoice.payTo,
  amount: '19.00',
  memo: invoice.memo,
  txHash: '0xabc' as `0x${string}`,
});

const paidEvent = ledger.listWebhookEvents().at(-1)!;
const signature = signWebhookEvent(paidEvent, process.env.ARC_WEBHOOK_SECRET!);

console.log(receipt.status);
// paid

console.log(signature.header);
// t=...,v1=...
```

## What ships in the MVP

- `createInvoice()` for invoice ids, stablecoin minor units, Arc payment URIs, and invoice memos.
- `createInvoiceMemo()` and `parseInvoiceMemo()` for memo correlation.
- `matchPaymentToInvoice()` to validate amount, recipient, currency, network, memo, and expiry.
- `createReceipt()` to turn an observed payment into a durable receipt object.
- `ReceiptLedger` for an in-memory invoice/receipt/event store.
- `signWebhookEvent()` and `verifyWebhookSignature()` for HMAC-signed webhooks.

## Current Limits

This module does not yet watch Arc blocks or Circle Gateway events by itself. Today, callers pass observed payments into `recordPayment()`. A chain watcher and persistent stores are planned next.

## Planned Next Steps

- Arc testnet transfer watcher.
- SQLite/Postgres receipt store.
- Next.js webhook route helpers.
- Refund receipts and counter-payment tracking.
- Unified Balance readiness states.
- Demo dashboard for invoice state transitions.
