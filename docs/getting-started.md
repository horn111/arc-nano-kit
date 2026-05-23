# Getting Started

This guide walks you through setting up arc-nano-kit for both seller (API provider) and buyer (API consumer) use cases.

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Arc Testnet USDC** — Get testnet tokens from [Circle Faucet](https://faucet.circle.com)

## Quick Start (Seller)

### 1. Install the SDK

```bash
npm install @arc-nano-kit/sdk
```

### 2. Create a Paywalled Endpoint

**Express.js:**

```typescript
import express from 'express';
import { expressPaywall } from '@arc-nano-kit/sdk/middleware';

const app = express();

// Protect an endpoint — $0.001 per request
app.get(
  '/api/premium/data',
  expressPaywall({
    price: '0.001',       // USDC per request
    network: 'arc-testnet',
    description: 'Premium data endpoint',
  }),
  (req, res) => {
    res.json({ data: 'This is premium content!' });
  }
);

app.listen(3000);
```

**Next.js (App Router):**

```typescript
import { nextPaywall } from '@arc-nano-kit/sdk/middleware';

export const GET = nextPaywall(
  {
    price: '0.001',
    network: 'arc-testnet',
    description: 'Premium joke endpoint',
  },
  async (request) => {
    return Response.json({ joke: 'Why did the USDC cross the chain? To get to the Arc side!' });
  }
);
```

### 3. Set Up Environment Variables

```bash
# Seller wallet (receives payments)
SELLER_PRIVATE_KEY=0x...
SELLER_ADDRESS=0x...

# Arc Testnet
ARC_RPC_URL=https://rpc.testnet.arc.network
CHAIN_ID=5042002
```

## Quick Start (Buyer)

### 1. Install the SDK

```bash
npm install @arc-nano-kit/sdk
```

### 2. Pay for API Access

```typescript
import { BuyerClient } from '@arc-nano-kit/sdk/client';

const buyer = new BuyerClient({
  privateKey: process.env.BUYER_PRIVATE_KEY!,
  rpcUrl: 'https://rpc.testnet.arc.network',
});

// Automatically handles 402 → sign → retry
const response = await buyer.request('https://api.example.com/api/premium/data');
console.log(response.data); // { data: 'This is premium content!' }
```

## Running the Demo

```bash
# Clone the repo
git clone https://github.com/horn111/arc-nano-kit.git
cd arc-nano-kit

# Install dependencies
npm install

# Configure environment
cp apps/demo/.env.example apps/demo/.env.local
# Edit .env.local with your wallet keys

# Start the demo
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo dashboard.

## What's Next?

- [Architecture Overview](architecture.md) — Understand the system design
- [Why Arc?](why-arc.md) — Learn why Arc is ideal for usage-based billing
- [API Reference](https://github.com/horn111/arc-nano-kit/tree/main/packages/sdk) — Full SDK documentation
