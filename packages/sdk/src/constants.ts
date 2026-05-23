/**
 * Arc network configuration constants.
 */

import type { NetworkConfig } from './types.js';

/** USDC uses 6 decimal places */
export const USDC_DECIMALS = 6;

/** Minimum payment amount in USDC */
export const MIN_PAYMENT = '0.000001';

/** x402 protocol header name */
export const X402_HEADER = 'x-payment';

/** x402 payment requirements header */
export const PAYMENT_REQUIRED_HEADER = 'x-payment-requirements';

/** HTTP 402 status code */
export const HTTP_402 = 402;

/** Arc Testnet configuration */
export const ARC_TESTNET: NetworkConfig = {
  chainId: 5042002,
  rpcUrl: 'https://rpc.testnet.arc.network',
  name: 'Arc Testnet',
  usdcAddress: '0x0000000000000000000000000000000000000001', // Native USDC
  explorerUrl: 'https://testnet.arcscan.app',
  cctpDomainId: 26,
} as const;

/** Arc Mainnet configuration (placeholder — launching Summer 2026) */
export const ARC_MAINNET: NetworkConfig = {
  chainId: 0, // TBD
  rpcUrl: '', // TBD
  name: 'Arc Mainnet',
  usdcAddress: '0x0000000000000000000000000000000000000000', // TBD
  explorerUrl: '', // TBD
} as const;

/** Default configuration values */
export const DEFAULTS = {
  network: 'arc-testnet',
  scheme: 'exact',
  x402Version: 2,
  /** Default payment validity window: 1 hour */
  paymentValiditySeconds: 3600,
  /** Default batch settlement interval: 5 minutes */
  batchIntervalMs: 300_000,
} as const;
