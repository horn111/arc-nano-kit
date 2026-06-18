# Roadmap

> **Last Updated:** May 2025

arc-nano-kit is under active development. This roadmap outlines our planned milestones and features.

## Phase 1: Foundation (Weeks 1–2) ✅ In Progress

### Core SDK
- [x] Project scaffolding with TypeScript monorepo
- [x] Express.js middleware for x402 paywalled endpoints
- [x] Next.js middleware adapter
- [x] Buyer SDK with automated 402 → sign → retry flow
- [x] Arc chain configuration and constants
- [ ] Unit tests for middleware and buyer client

### Billing Engine
- [x] Per-request pricing model
- [x] Per-second (streaming) pricing model
- [x] Per-job (batch) pricing model
- [x] Usage metering with in-memory store
- [x] Arc Receipts MVP (invoice memos, receipts, signed webhooks)
- [ ] Persistent usage store (Supabase/Postgres adapter)

### Demo
- [x] Next.js demo app with paywalled API endpoints
- [ ] Interactive demo page with live payment flow
- [ ] Hosted demo on Vercel

---

## Phase 2: Production Features (Weeks 3–4)

### Arc Receipts
- [x] Invoice and transaction memo helpers
- [x] Receipt matching and in-memory ledger
- [x] HMAC-signed webhook events
- [ ] Arc testnet payment watcher
- [ ] SQLite/Postgres receipt store
- [ ] Next.js webhook route helpers
- [ ] Refund/counter-payment tracking

### Gateway Integration
- [ ] Unified balance deposit helper
- [ ] Balance monitoring and alerts
- [ ] Withdrawal automation
- [ ] Multi-chain balance aggregation

### Usage Dashboard
- [ ] Real-time usage analytics API
- [ ] Revenue tracking and reporting
- [ ] Per-endpoint cost breakdown
- [ ] React dashboard component library

### Developer Experience
- [ ] CLI tool for quick project scaffolding
- [ ] Comprehensive API documentation (TypeDoc)
- [ ] Video tutorials and walkthroughs
- [ ] Postman/Insomnia collection

---

## Phase 3: Ecosystem Growth (Months 2–3)

### Multi-Framework Support
- [ ] Fastify middleware adapter
- [ ] Hono middleware adapter
- [ ] Python SDK (FastAPI/Flask)
- [ ] Go SDK

### Advanced Billing
- [ ] Volume-based tiered pricing
- [ ] Subscription plans with prepaid credits
- [ ] Rate limiting integration
- [ ] Invoice generation (PDF/JSON)

### Agent Commerce
- [ ] AI agent discovery protocol
- [ ] Agent-to-agent payment orchestration
- [ ] Service marketplace integration
- [ ] Autonomous budget management

### Infrastructure
- [ ] Arc Mainnet deployment (Summer 2026)
- [ ] Multi-region edge deployment
- [ ] Observability and monitoring (OpenTelemetry)
- [ ] SOC 2 compliance preparation

---

## Future Vision

- **Managed Platform**: Hosted dashboard with SLA, analytics, and team management
- **Marketplace**: Directory of arc-nano-kit powered APIs and services
- **Circle App Kit Plugin**: Deep integration with App Kit monetization features
- **Cross-Chain Billing**: Accept payments from any CCTP-supported chain

---

## Contributing

Want to help shape the roadmap? We welcome input from the community:

- 💬 [Open a Discussion](https://github.com/horn111/arc-nano-kit/discussions)
- 🐛 [Report an Issue](https://github.com/horn111/arc-nano-kit/issues)
- 🔀 [Submit a Pull Request](https://github.com/horn111/arc-nano-kit/pulls)

Prioritization is based on community feedback and alignment with [Circle's ecosystem goals](https://developers.circle.com).
