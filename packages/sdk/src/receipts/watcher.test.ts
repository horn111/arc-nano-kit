import { describe, expect, it, vi } from 'vitest';
import {
  encodeAbiParameters,
  encodeEventTopics,
  parseAbiItem,
} from 'viem';
import { ARC_TESTNET_CONTRACTS } from '../constants.js';
import { ReceiptLedger } from './ledger.js';
import { ARC_MEMO_ABI, createMemoPaymentRequest } from './memo-payment.js';
import { ArcReceiptWatcher } from './watcher.js';

const seller = '0x1111111111111111111111111111111111111111' as const;
const buyer = '0x2222222222222222222222222222222222222222' as const;
const txHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;
const blockHash = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const;
const transferEvent = parseAbiItem('event Transfer(address indexed from,address indexed to,uint256 value)');
const memoEvent = ARC_MEMO_ABI.find((item) => item.type === 'event' && item.name === 'Memo');

describe('ArcReceiptWatcher', () => {
  it('creates a receipt when it sees matching Memo and ERC-20 Transfer logs', async () => {
    const ledger = new ReceiptLedger();
    const invoice = ledger.createInvoice({ id: 'inv_watch', amount: '19.00', payTo: seller });
    const request = createMemoPaymentRequest(invoice);
    const onReceipt = vi.fn();
    const publicClient = createMockClient({
      memoLogs: [memoLog(request)],
      receiptLogs: [transferLog({ value: 19_000_000n })],
    });
    const watcher = new ArcReceiptWatcher({ ledger, publicClient, onReceipt });

    watcher.watchInvoice(invoice, { fromBlock: 10n });
    const receipts = await watcher.pollOnce();

    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.invoiceId).toBe(invoice.id);
    expect(receipts[0]?.txHash).toBe(txHash);
    expect(receipts[0]?.amountUnits).toBe('19000000');
    expect(receipts[0]?.onchainProof).toMatchObject({
      chainId: 5042002,
      txHash,
      memoContract: request.memoContract,
      memoIndex: '1',
      memoId: request.memoId,
      callDataHash: request.callDataHash,
      payer: buyer,
      payTo: seller,
      target: request.target,
      amountUnits: '19000000',
    });
    expect(ledger.getInvoice(invoice.id)?.status).toBe('paid');
    expect(onReceipt).toHaveBeenCalledOnce();
  });

  it('ignores native USDC system Transfer logs to avoid double-counting', async () => {
    const ledger = new ReceiptLedger();
    const invoice = ledger.createInvoice({ id: 'inv_native_only', amount: '19.00', payTo: seller });
    const request = createMemoPaymentRequest(invoice);
    const publicClient = createMockClient({
      memoLogs: [memoLog(request)],
      receiptLogs: [transferLog({
        address: ARC_TESTNET_CONTRACTS.nativeUsdcSystemEmitter,
        value: 19_000_000_000_000_000_000n,
      })],
    });
    const watcher = new ArcReceiptWatcher({ ledger, publicClient });

    watcher.watchInvoice(invoice, { fromBlock: 10n });
    const receipts = await watcher.pollOnce();

    expect(receipts).toHaveLength(0);
    expect(ledger.getInvoice(invoice.id)?.status).toBe('open');
  });

  it('ignores memo logs with the wrong calldata hash', async () => {
    const ledger = new ReceiptLedger();
    const invoice = ledger.createInvoice({ id: 'inv_wrong_hash', amount: '19.00', payTo: seller });
    const request = createMemoPaymentRequest(invoice);
    const publicClient = createMockClient({
      memoLogs: [memoLog({
        ...request,
        callDataHash: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as `0x${string}`,
      })],
      receiptLogs: [transferLog({ value: 19_000_000n })],
    });
    const watcher = new ArcReceiptWatcher({ ledger, publicClient });

    watcher.watchInvoice(invoice, { fromBlock: 10n });
    const receipts = await watcher.pollOnce();

    expect(receipts).toHaveLength(0);
  });
});

function createMockClient(params: { memoLogs: unknown[]; receiptLogs: unknown[] }) {
  return {
    getBlockNumber: vi.fn().mockResolvedValue(12n),
    getLogs: vi.fn().mockResolvedValue(params.memoLogs),
    getTransactionReceipt: vi.fn().mockResolvedValue({
      status: 'success',
      blockNumber: 10n,
      transactionIndex: 0,
      logs: [
        ...params.memoLogs.map((log) => memoReceiptLog((log as ReturnType<typeof memoLog>).args)),
        ...params.receiptLogs,
      ],
    }),
  } as any;
}

function memoLog(request: {
  target: `0x${string}`;
  memoId: `0x${string}`;
  memoData: `0x${string}`;
  callDataHash: `0x${string}`;
}) {
  return {
    address: ARC_TESTNET_CONTRACTS.memo,
    transactionHash: txHash,
    blockNumber: 10n,
    args: {
      sender: buyer,
      target: request.target,
      callDataHash: request.callDataHash,
      memoId: request.memoId,
      memo: request.memoData,
      memoIndex: 1n,
    },
  };
}

function memoReceiptLog(args: {
  target?: `0x${string}`;
  memoId?: `0x${string}`;
  memo?: `0x${string}`;
  callDataHash?: `0x${string}`;
  memoIndex?: bigint;
}) {
  if (!memoEvent || !args.target || !args.memoId || !args.memo || !args.callDataHash) {
    throw new Error('Invalid memo log fixture');
  }

  const topics = encodeEventTopics({
    abi: [memoEvent],
    eventName: 'Memo',
    args: { sender: buyer, target: args.target, memoId: args.memoId },
  });

  return {
    address: ARC_TESTNET_CONTRACTS.memo,
    topics,
    data: encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'bytes' }, { type: 'uint256' }],
      [args.callDataHash, args.memo, args.memoIndex ?? 1n],
    ),
    blockNumber: 10n,
    blockHash,
    transactionHash: txHash,
    transactionIndex: 0,
    logIndex: 1,
    removed: false,
  };
}

function transferLog(params: { address?: `0x${string}`; value: bigint }) {
  const topics = encodeEventTopics({
    abi: [transferEvent],
    eventName: 'Transfer',
    args: { from: buyer, to: seller },
  });

  return {
    address: params.address ?? ARC_TESTNET_CONTRACTS.usdc,
    topics,
    data: encodeAbiParameters([{ type: 'uint256' }], [params.value]),
    blockNumber: 10n,
    blockHash,
    transactionHash: txHash,
    transactionIndex: 0,
    logIndex: 0,
    removed: false,
  };
}
