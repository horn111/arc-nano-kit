# Architecture

arc-nano-kit is designed as a modular, layered system that sits between your application and Circle's payment infrastructure.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Your Application                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  API Routes   │  │   Business   │  │   Frontend    │  │
│  │  (Express/    │  │    Logic     │  │  (Dashboard)  │  │
│  │   Next.js)    │  │              │  │               │  │
│  └──────┬───────┘  └──────────────┘  └───────────────┘  │
└─────────┼───────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│                   @arc-nano-kit/sdk                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Paywall      │  │   Billing    │  │   Gateway     │  │
│  │  Middleware   │  │   Engine     │  │   Client      │  │
│  │              │  │              │  │               │  │
│  │  • Express   │  │  • Metering  │  │  • Deposits   │  │
│  │  • Next.js   │  │  • Plans     │  │  • Balances   │  │
│  │  • Fastify   │  │  • Invoices  │  │  • Withdraws  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘  │
└─────────┼────────────────┼──────────────────┼───────────┘
          │                │                  │
┌─────────▼────────────────▼──────────────────▼───────────┐
│               Circle Infrastructure                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ x402 Protocol │  │   Gateway    │  │  Arc Network  │  │
│  │  (HTTP 402)   │  │  (Batched    │  │  (L1, USDC    │  │
│  │              │  │  Settlement) │  │   Gas)        │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Payment Flow

### Seller Side (Your API)

1. **Protect endpoints** with `createPaywallMiddleware()` — define price per request
2. **Middleware intercepts** incoming requests and checks for valid `X-PAYMENT` header
3. **If no payment**: Returns `402 Payment Required` with payment requirements
4. **If valid payment**: Verifies signature via Gateway, passes request to your handler
5. **Usage metering**: Tracks consumption per buyer, per endpoint
6. **Batch settlement**: Gateway periodically settles accumulated payments on Arc

### Buyer Side (API Consumer)

1. **Initialize `BuyerClient`** with wallet credentials
2. **Call `client.request(url)`** — handles full x402 flow automatically:
   - Sends initial request
   - Parses 402 response and payment requirements
   - Signs EIP-3009 `transferWithAuthorization`
   - Retries with `X-PAYMENT` header
3. **Receive response** with requested data

## Module Architecture

### Middleware Layer

The middleware layer adapts the x402 payment verification to your web framework:

- **`createPaywallMiddleware(options)`** — Framework-agnostic configuration
- **`expressPaywall()`** — Express.js compatible middleware
- **`nextPaywall()`** — Next.js Route Handler wrapper

### Billing Engine

The billing engine provides flexible pricing models:

- **Per-Request** — Fixed cost per API call (e.g., $0.001/request)
- **Per-Second** — Time-based billing for streaming/compute (e.g., $0.01/second)
- **Per-Job** — Batch pricing for heavy operations (e.g., $0.50/job)

### Gateway Client

The Gateway client wraps Circle Gateway operations:

- **Deposit monitoring** — Track incoming USDC deposits
- **Balance queries** — Check unified balance across chains
- **Settlement tracking** — Monitor batch settlement status

## Data Flow

```
Buyer                    Seller (arc-nano-kit)           Circle Gateway
  │                            │                              │
  │──── GET /api/data ────────>│                              │
  │                            │                              │
  │<─── 402 + requirements ────│                              │
  │                            │                              │
  │ (sign EIP-3009 off-chain)  │                              │
  │                            │                              │
  │──── GET /api/data ────────>│                              │
  │     + X-PAYMENT header     │                              │
  │                            │──── verify payment ─────────>│
  │                            │<─── payment valid ───────────│
  │                            │                              │
  │                            │ (meter usage, log billing)   │
  │                            │                              │
  │<─── 200 + data ────────────│                              │
  │                            │                              │
  │                            │     ... more requests ...    │
  │                            │                              │
  │                            │<─── batch settle on Arc ─────│
  │                            │                              │
```
