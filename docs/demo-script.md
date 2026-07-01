# Demo Script

This script is for reviewers who want to verify the current `arc-nano-kit` payment ops flow locally.

The demo is local-first. It does not require a hosted dashboard, database, or production webhook queue.

## Setup

```bash
git clone https://github.com/horn111/arc-nano-kit.git
cd arc-nano-kit
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## UI Walkthrough

1. Open the demo home page.
2. Click `Run Watcher Flow`.
3. Confirm the flow advances through:
   - `Invoice Created`
   - `Memo Payment`
   - `Watcher Poll`
   - `Receipt Generated`
4. Inspect `Memo Payment Data`.
   - Expected fields: invoice id, amount, memo contract, memo id, call data hash.
5. Inspect `Generated Receipt`.
   - Expected proof: paid receipt JSON with tx hash, payer, and invoice memo.
6. Inspect `Webhook Inbox`.
   - Expected status: `Received` is `yes`.
   - Expected status: `Verified` is `yes`.
   - Expected status: `Signature` is `OK`.
   - Expected event: `Delivery attempt #1`.
7. Click `Replay Webhook`.
8. Confirm the inbox now shows:
   - `Attempts` is `2`;
   - `Delivery attempt #2`;
   - `Signature OK`;
   - a fresh `t=<timestamp>` in the signature header.

## What The Demo Proves

The shipped flow is:

```text
create invoice
build memo payment request
watch Arc Testnet payment shape
generate receipt
sign invoice.paid webhook
deliver signed payload
verify signature locally
store delivery attempt
replay webhook with fresh timestamp
```

The important proof is not only that a receipt object exists. The demo proves verified webhook delivery and replay, which is the operational layer apps need after payment.

## API Fallback Check

If the browser UI is unavailable, run the flow through local API routes after `npm run dev`.

```bash
curl http://localhost:3000/api/receipts
```

For the full inbox and replay check, use Node so the raw JSON body and signature header are preserved:

```bash
node - <<'NODE'
const base = 'http://localhost:3000';

const receiptResponse = await fetch(`${base}/api/receipts`);
const receiptData = await receiptResponse.json();

const rawPayload = JSON.stringify(receiptData.webhook.event);

const inboxResponse = await fetch(`${base}/api/webhook-inbox`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-arc-signature': receiptData.webhook.signatureHeader,
  },
  body: rawPayload,
});
const inboxData = await inboxResponse.json();

const replayResponse = await fetch(`${base}/api/webhook-inbox/replay`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    event: receiptData.webhook.event,
    replayOf: inboxData.delivery.id,
  }),
});
const replayData = await replayResponse.json();

console.log({
  receipt: receiptData.receipt.id,
  firstAttempt: inboxData.delivery.attempt,
  firstStatus: inboxData.delivery.status,
  replayAttempt: replayData.delivery.attempt,
  replayStatus: replayData.delivery.status,
  replayOf: replayData.delivery.replayOf,
});
NODE
```

Expected output:

```text
firstAttempt: 1
firstStatus: verified
replayAttempt: 2
replayStatus: verified
replayOf: <first delivery id>
```

## Notes For Grant Reviewers

- The inbox is intentionally in-memory for the current milestone.
- Persistence, watcher cursors, webhook route helpers, and refund states are planned grant milestones.
- The current demo is designed to prove the local developer workflow, not to replace a production payment processor or hosted dashboard.
