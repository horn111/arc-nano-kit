# Getting Started

This guide shows the current `arc-nano-kit` developer workflow: paid API middleware, buyer-side access, and the local Arc Receipts demo.

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- A wallet private key if you want to test buyer-side signing against your own endpoints

The local demo does not require a hosted dashboard, database, or production webhook queue.

## Install The SDK

```bash
npm install @arc-nano-kit/sdk
```

## Seller: Protect An Endpoint

### Express

```typescript
import express from 'express';
import { expressPaywall } from '@arc-nano-kit/sdk/middleware';

const app = express();

app.get(
  '/api/premium/data',
  expressPaywall({
    price: '0.001',
    network: 'arc-testnet',
    payTo: '0x1111111111111111111111111111111111111111',
    description: 'Premium data endpoint',
  }),
  (_req, res) => {
    res.json({ data: 'This is premium content.' });
  },
);

app.listen(3000);
```

### Next.js App Router

```typescript
import { nextPaywall } from '@arc-nano-kit/sdk/middleware';

export const GET = nextPaywall(
  {
    price: '0.001',
    network: 'arc-testnet',
    payTo: '0x1111111111111111111111111111111111111111',
    description: 'Premium joke endpoint',
  },
  async () => {
    return Response.json({ joke: 'Paid API response from Arc.' });
  },
);
```

The default verifier checks payment payload structure, amount, recipient, and expiry. Production apps should provide a custom `verifyPayment` implementation for their verification infrastructure.

## Buyer: Access A Paywalled API

```typescript
import { BuyerClient } from '@arc-nano-kit/sdk/client';

const buyer = new BuyerClient({
  privateKey: process.env.BUYER_PRIVATE_KEY as `0x${string}`,
  rpcUrl: 'https://rpc.testnet.arc.network',
});

const response = await buyer.request('https://api.example.com/api/premium/data');

console.log(response.data);
console.log(response.payment);
```

## Run The Local Demo

```bash
git clone https://github.com/horn111/arc-nano-kit.git
cd arc-nano-kit
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The demo currently shows:

- paywalled API endpoint probes;
- invoice and memo payment data;
- Arc Testnet watcher flow;
- generated receipt JSON;
- signed webhook payload;
- local Webhook Inbox verification;
- replayed webhook delivery attempt.

## Verify The Arc Receipts Flow

In the browser:

1. Click `Run Watcher Flow`.
2. Confirm `Generated Receipt` shows a paid receipt payload.
3. Confirm `Webhook Inbox` shows `Received`, `Verified`, and `Signature OK`.
4. Click `Replay Webhook`.
5. Confirm `Delivery attempt #2` appears with a fresh `t=<timestamp>` signature value.

For a detailed reviewer script, see [demo-script.md](demo-script.md).

## Use The CLI Scaffolder

From this repo:

```bash
npm run build --workspace=packages/create-arc-nano-kit
node packages/create-arc-nano-kit/dist/index.js my-paid-api
```

The scaffolder creates an Express or Next.js starter with a paid API route and environment template.

## Next Reading

- [Grant Snapshot](grant.md)
- [Demo Script](demo-script.md)
- [Architecture](architecture.md)
- [Arc Receipts](receipts.md)
- [Why Arc?](why-arc.md)
