/**
 * @arc-nano-kit/sdk
 *
 * Open-source kit for usage-based billing and paid APIs on Arc.
 * Powered by Circle Nanopayments, Gateway batched settlement, and the x402 protocol.
 *
 * @packageDocumentation
 */

export {
  createPaywallMiddleware,
  type PaywallConfig,
  type PaywallMiddleware,
} from './middleware/paywall.js';

export { expressPaywall } from './middleware/express.js';
export { nextPaywall } from './middleware/next.js';

export { BuyerClient, type BuyerClientConfig } from './client/buyer.js';

export { UsageMeter, type UsageRecord, type MeterConfig } from './billing/meter.js';
export {
  createBillingPlan,
  type BillingPlan,
  type PricingModel,
  type PerRequestPricing,
  type PerSecondPricing,
  type PerJobPricing,
} from './billing/plans.js';

export { GatewayClient, type GatewayClientConfig } from './gateway/client.js';

export { ARC_TESTNET, ARC_MAINNET, USDC_DECIMALS } from './constants.js';

export type {
  PaymentRequirements,
  PaymentPayload,
  PaymentResult,
  X402Version,
  NetworkConfig,
} from './types.js';
