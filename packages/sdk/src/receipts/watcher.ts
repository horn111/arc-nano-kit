/**
 * Arc Testnet receipt watcher for Memo-wrapped USDC invoice payments.
 */

import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  parseAbiItem,
  parseEventLogs,
  type Log,
  type PublicClient,
} from 'viem';
import { ARC_TESTNET, USDC_DECIMALS } from '../constants.js';
import { createMemoPaymentRequest, ERC20_TRANSFER_ABI } from './memo-payment.js';
import { createMemoPaymentProofFromReceipt } from './proof.js';
import type { ReceiptLedger } from './ledger.js';
import type { ArcInvoice, ArcReceipt, MemoPaymentRequest, ObservedPayment } from './types.js';

const MEMO_EVENT = parseAbiItem(
  'event Memo(address indexed sender,address indexed target,bytes32 callDataHash,bytes32 indexed memoId,bytes memo,uint256 memoIndex)',
);

type ReceiptWatcherClient = Pick<
  PublicClient,
  'getBlockNumber' | 'getLogs' | 'getTransactionReceipt'
>;

type MemoLog = {
  transactionHash?: `0x${string}` | null;
  blockNumber?: bigint | null;
  args?: {
    sender?: `0x${string}`;
    target?: `0x${string}`;
    callDataHash?: `0x${string}`;
    memoId?: `0x${string}`;
    memo?: `0x${string}`;
    memoIndex?: bigint;
  };
};

export type ArcReceiptWatcherLifecycleEvent =
  | { type: 'watcher.started'; invoiceCount: number }
  | { type: 'watcher.stopped' }
  | { type: 'watcher.poll'; fromBlock: bigint; toBlock: bigint; invoiceCount: number }
  | { type: 'watcher.memo_seen'; invoiceId: string; txHash: `0x${string}`; blockNumber?: bigint }
  | { type: 'watcher.receipt_created'; invoiceId: string; receipt: ArcReceipt };

export interface ArcReceiptWatcherConfig {
  ledger: ReceiptLedger;
  rpcUrl?: string;
  publicClient?: ReceiptWatcherClient;
  fromBlock?: bigint;
  confirmations?: number;
  pollIntervalMs?: number;
  onReceipt?: (receipt: ArcReceipt, invoice: ArcInvoice) => void | Promise<void>;
  onEvent?: (event: ArcReceiptWatcherLifecycleEvent) => void | Promise<void>;
  onError?: (error: unknown) => void;
}

export class ArcReceiptWatcher {
  private readonly ledger: ReceiptLedger;
  private readonly client: ReceiptWatcherClient;
  private readonly confirmations: bigint;
  private readonly pollIntervalMs: number;
  private readonly fromBlock?: bigint;
  private readonly onReceipt?: ArcReceiptWatcherConfig['onReceipt'];
  private readonly onEvent?: ArcReceiptWatcherConfig['onEvent'];
  private readonly onError?: ArcReceiptWatcherConfig['onError'];
  private readonly invoices = new Map<string, ArcInvoice>();
  private readonly cursors = new Map<string, bigint>();
  private timer?: ReturnType<typeof setInterval>;

  constructor(config: ArcReceiptWatcherConfig) {
    this.ledger = config.ledger;
    this.client = config.publicClient ?? createPublicClient({
      transport: http(config.rpcUrl ?? ARC_TESTNET.rpcUrl),
    });
    this.confirmations = BigInt(config.confirmations ?? 1);
    this.pollIntervalMs = config.pollIntervalMs ?? 5_000;
    this.fromBlock = config.fromBlock;
    this.onReceipt = config.onReceipt;
    this.onEvent = config.onEvent;
    this.onError = config.onError;
  }

  watchInvoice(invoice: ArcInvoice, options: { fromBlock?: bigint } = {}): void {
    this.invoices.set(invoice.id, invoice);
    if (options.fromBlock !== undefined) {
      this.cursors.set(invoice.id, options.fromBlock);
    }
  }

  unwatchInvoice(invoiceId: string): void {
    this.invoices.delete(invoiceId);
    this.cursors.delete(invoiceId);
  }

  async pollOnce(): Promise<ArcReceipt[]> {
    if (this.invoices.size === 0) {
      return [];
    }

    const latestBlock = await this.client.getBlockNumber();
    const toBlock = latestBlock > this.confirmations
      ? latestBlock - this.confirmations
      : 0n;
    const receipts: ArcReceipt[] = [];

    for (const invoice of this.invoices.values()) {
      const fromBlock = this.cursors.get(invoice.id) ?? this.fromBlock ?? toBlock;
      if (fromBlock > toBlock) {
        continue;
      }

      await this.emit({
        type: 'watcher.poll',
        fromBlock,
        toBlock,
        invoiceCount: this.invoices.size,
      });

      const invoiceReceipts = await this.pollInvoice(invoice, fromBlock, toBlock);
      receipts.push(...invoiceReceipts);
      this.cursors.set(invoice.id, toBlock + 1n);
    }

    return receipts;
  }

  start(): void {
    if (this.timer) {
      return;
    }

    void this.emit({ type: 'watcher.started', invoiceCount: this.invoices.size });
    void this.pollOnce().catch((error) => this.handleError(error));
    this.timer = setInterval(() => {
      void this.pollOnce().catch((error) => this.handleError(error));
    }, this.pollIntervalMs);
  }

  stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;
    void this.emit({ type: 'watcher.stopped' });
  }

  private async pollInvoice(
    invoice: ArcInvoice,
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<ArcReceipt[]> {
    const request = createMemoPaymentRequest(invoice);
    const memoLogs = await this.client.getLogs({
      address: request.memoContract,
      event: MEMO_EVENT,
      args: { memoId: request.memoId },
      fromBlock,
      toBlock,
    }) as MemoLog[];

    const receipts: ArcReceipt[] = [];

    for (const memoLog of memoLogs) {
      const receipt = await this.processMemoLog(invoice, request, memoLog);
      if (receipt) {
        receipts.push(receipt);
      }
    }

    return receipts;
  }

  private async processMemoLog(
    invoice: ArcInvoice,
    request: MemoPaymentRequest,
    memoLog: MemoLog,
  ): Promise<ArcReceipt | null> {
    const txHash = memoLog.transactionHash;
    const args = memoLog.args;

    if (!txHash || !args?.sender || !args.target || !args.callDataHash || !args.memoId) {
      return null;
    }

    if (!sameAddress(args.target, request.target)) {
      return null;
    }

    if (args.memoId.toLowerCase() !== request.memoId.toLowerCase()) {
      return null;
    }

    if (args.callDataHash.toLowerCase() !== request.callDataHash.toLowerCase()) {
      return null;
    }

    if (this.ledger.getReceiptByTxHash(txHash, invoice.id)) {
      return null;
    }

    await this.emit({
      type: 'watcher.memo_seen',
      invoiceId: invoice.id,
      txHash,
      blockNumber: memoLog.blockNumber ?? undefined,
    });

    const txReceipt = await this.client.getTransactionReceipt({ hash: txHash });
    if (txReceipt.status !== 'success') {
      return null;
    }

    const transfer = extractMatchingTransfer(txReceipt.logs, request, args.sender);
    if (!transfer) {
      return null;
    }

    const onchainProof = createMemoPaymentProofFromReceipt({
      txHash,
      paymentRequest: request,
      txReceipt,
    });

    const observed: ObservedPayment = {
      txHash,
      from: transfer.from,
      to: transfer.to,
      amount: formatUnits(transfer.value, USDC_DECIMALS),
      currency: invoice.currency,
      network: invoice.network,
      memo: invoice.memo,
      memoId: request.memoId,
      callDataHash: request.callDataHash,
      blockNumber: txReceipt.blockNumber,
      onchainProof,
      observedAt: Date.now(),
      metadata: {
        source: 'arc-testnet-watcher',
        memoIndex: args.memoIndex?.toString(),
        explorerUrl: onchainProof.explorerUrl,
      },
    };

    const receipt = this.ledger.recordPayment(invoice.id, observed);
    await this.onReceipt?.(receipt, invoice);
    await this.emit({ type: 'watcher.receipt_created', invoiceId: invoice.id, receipt });
    return receipt;
  }

  private async emit(event: ArcReceiptWatcherLifecycleEvent): Promise<void> {
    await this.onEvent?.(event);
  }

  private handleError(error: unknown): void {
    if (this.onError) {
      this.onError(error);
      return;
    }

    throw error;
  }
}

function extractMatchingTransfer(
  logs: readonly Log[],
  request: MemoPaymentRequest,
  expectedFrom: `0x${string}`,
): { from: `0x${string}`; to: `0x${string}`; value: bigint } | null {
  const erc20Logs = logs.filter((log) => sameAddress(log.address, request.target));
  const parsedLogs = parseEventLogs({
    abi: ERC20_TRANSFER_ABI,
    eventName: 'Transfer',
    logs: erc20Logs,
    strict: false,
  });

  for (const parsedLog of parsedLogs) {
    const args = parsedLog.args as {
      from?: `0x${string}`;
      to?: `0x${string}`;
      value?: bigint;
    };

    if (!args.from || !args.to || args.value === undefined) {
      continue;
    }

    if (!sameAddress(args.from, expectedFrom)) {
      continue;
    }

    if (!sameAddress(args.to, request.payTo)) {
      continue;
    }

    if (args.value < BigInt(request.amountUnits)) {
      continue;
    }

    return {
      from: args.from,
      to: args.to,
      value: args.value,
    };
  }

  return null;
}

function sameAddress(a: `0x${string}`, b: `0x${string}`): boolean {
  return getAddress(a) === getAddress(b);
}
