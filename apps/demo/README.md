# @arc-nano-kit/demo

> Interactive demo app for arc-nano-kit — paywalled API endpoints on Arc

This is the demo application for [arc-nano-kit](https://github.com/horn111/arc-nano-kit). It showcases paywalled API endpoints with usage-based billing powered by Circle Nanopayments.

## Quick Start

```bash
# From the repo root
npm install
cp apps/demo/.env.example apps/demo/.env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Paywalled Endpoints

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /api/joke` | $0.001 USDC | Random developer joke |
| `GET /api/weather?city=NYC` | $0.005 USDC | Weather data for a city |

## Testing with cURL

```bash
# Without payment — returns 402
curl http://localhost:3000/api/joke

# With BuyerClient — handles payment automatically
npx ts-node -e "import { BuyerClient } from '@arc-nano-kit/sdk/client'; ..."
```

## License

Apache-2.0
