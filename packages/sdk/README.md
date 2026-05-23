# @arc-nano-kit/sdk

> Usage-based billing and paid API middleware for Arc — powered by Circle Nanopayments & x402

This is the core SDK package of [arc-nano-kit](https://github.com/horn111/arc-nano-kit). See the root README for full documentation.

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

## Modules

| Module | Import | Description |
|--------|--------|-------------|
| Middleware | `@arc-nano-kit/sdk/middleware` | Express & Next.js paywall middleware |
| Client | `@arc-nano-kit/sdk/client` | Buyer SDK for automated x402 payments |
| Billing | `@arc-nano-kit/sdk/billing` | Usage metering & billing plans |
| Gateway | `@arc-nano-kit/sdk/gateway` | Circle Gateway balance management |

## License

Apache-2.0 — see [LICENSE](../../LICENSE)
