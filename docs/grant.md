# Grant Application Snapshot

## Project

`arc-nano-kit` is an open-source payment operations toolkit for Arc builders.

It helps developers move beyond "a payment happened" and into application-level payment operations: invoices, transaction memos, receipts, signed webhooks, verified delivery attempts, and local replay.

## One-Liner

Open-source payment operations toolkit for Arc builders: paid APIs, invoices, memo-based receipts, watcher flows, optional Arc Testnet proof polling, signed webhooks, and local delivery replay.

## Problem

Arc gives builders a stablecoin-native execution environment, but application teams still need the operational layer around payments.

For a real app, a USDC transfer is only the start. The app also needs to know:

- which invoice or API usage event was paid;
- which transaction memo connected the payment to app state;
- whether the amount and recipient matched expectations;
- which receipt should be stored;
- which webhook was sent;
- whether the receiving app verified the signature;
- whether a webhook delivery can be replayed during development or debugging.

Without this layer, builders can accept payments but still have to hand-roll the payment operations code that makes those payments useful inside products.

## What Is Built

The current repo includes:

- `@arc-nano-kit/sdk` for middleware, buyer flows, billing, receipts, watcher logic, and webhook delivery helpers.
- Express and Next.js paywall adapters for x402-style `402 Payment Required` flows.
- `BuyerClient` for the `402 -> sign -> retry` client flow.
- Billing helpers for per-request, per-second, and per-job pricing.
- `ReceiptLedger` for in-memory invoices, receipts, and webhook events.
- `PersistentReceiptLedger` and `ReceiptStore` interfaces for restart-safe receipt workflows.
- Optional `@arc-nano-kit/sqlite` local store for invoices, receipts, webhook deliveries, and watcher cursors.
- `ArcReceiptWatcher` for memo-wrapped Arc Testnet USDC payments.
- `findMemoPaymentProof` and `verifyMemoPaymentProof` for read-only Arc Testnet Memo-log polling or tx/log proof against a memo payment request.
- `WebhookInbox` for local signed webhook verification and replay.
- `create-arc-nano-kit` scaffolder for Express or Next.js paid API starters.
- A local Next.js demo that shows the payment ops flow end to end.

## Shipped Proof Flow

The newest shipped path is:

```text
create invoice
build Arc transaction memo payment request
watch Arc Testnet memo-wrapped USDC payment
generate receipt
optionally auto-watch or verify the receipt against a real Arc Testnet tx
create signed invoice.paid webhook
deliver webhook into local inbox
verify SDK signature
replay webhook with a fresh timestamp
```

The demo proves the chain does not stop at "webhook ready". It shows verified delivery attempts:

- `receipt.generated`
- optional `onchainProof` with tx hash, block, memo index, log index, and Arcscan link
- raw webhook payload
- `x-arc-signature`
- `Signature OK`
- `Delivery attempt #1`
- `Replay Webhook`
- `Delivery attempt #2`
- fresh `t=<timestamp>,v1=<hmac>` signature header

## Why This Matters For Arc/Circle

Arc is a natural environment for paid APIs, autonomous agents, usage-based billing, and stablecoin-native apps. Those apps need more than raw payment primitives: they need payment operations that developers can run, test, inspect, and eventually persist.

`arc-nano-kit` focuses on the developer infrastructure around Arc payments:

- making Arc payment flows easier to integrate into API products;
- turning transaction memos into app-level reconciliation;
- giving builders local receipt and webhook workflows before they build production storage;
- creating reusable open-source patterns for Arc Testnet payment operations;
- making stablecoin payments feel operable, not only payable.

## Current Limits

This is an early open-source SDK and local demo, not a hosted payment platform.

Current limits are explicit:

- the default hosted/demo path is in-memory unless local SQLite persistence is enabled;
- Postgres storage is planned, not shipped;
- hosted persistent storage is planned, not shipped;
- onchain proof mode is read-only and does not broadcast transactions;
- auto proof polling is local and does not replace a hosted indexer or persistent watcher cursor;
- default middleware verification is not a production Gateway verification path unless the app provides a custom verifier;
- hosted dashboard and analytics are planned, not shipped;
- Fastify, Hono, Python, and Go adapters are planned, not shipped;
- refund and partial refund accounting are planned, not shipped.

## Grant Milestones

The most useful funded milestones are:

1. Persistent receipt store
   - SQLite local persistence is shipped; Postgres is the next persistent backend.

2. Persistent watcher cursor
   - Persist scan state so local watcher processes can restart safely without reprocessing already matched payments.

3. Next.js webhook route helpers
   - Provide a small route-handler helper that reads raw body, verifies `x-arc-signature`, records a delivery attempt, and returns typed results.

4. Refund and partial refund state
   - Add refund/counter-payment tracking so receipts can model full and partial refund lifecycle states.

5. Hosted demo flow
   - Publish a reviewer-friendly demo that explains the Arc Receipts flow without requiring local repo setup.

## Reviewer Demo

Use [demo-script.md](demo-script.md) to reproduce the local demo flow.

Expected proof points:

- `Run Watcher Flow` produces invoice, memo, watcher, receipt, and webhook data.
- Optional `Onchain Proof` watches Arc Testnet Memo logs or verifies a real transaction hash against the generated memo payment request.
- `Webhook Inbox` shows `Received`, `Verified`, and `Signature OK`.
- `Replay Webhook` creates `Delivery attempt #2`.
- The replayed attempt has a fresh signature timestamp.
