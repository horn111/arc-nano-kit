/**
 * Read-only Arc Testnet proof verification for Memo-wrapped receipt payments.
 */

import {
  createPublicClient,
  getAddress,
  http,
  parseEventLogs,
  type Log,
} from 'viem';
import { ARC_TESTNET } from '../constants.js';
import { ARC_MEMO_ABI, ERC20_TRANSFER_ABI } from './memo-payment.js';
import type { ArcReceiptOnchainProof, MemoPaymentRequest } from './types.js';

type ProofClient = {
  getTransactionReceipt: (params: { hash: `0x${string}` }) => Promise<ProofTransactionReceipt | null>;
};

type ProofTransactionReceipt = {
  status: string;
  blockNumber: bigint;
  transactionIndex?: number;
  logs: readonly Log[];
};

export type VerifyMemoPaymentProofFailureReason =
  | 'tx_not_found'
  | 'tx_reverted'
  | 'wrong_memo_contract'
  | 'missing_memo_event'
  | 'memo_id_mismatch'
  | 'target_mismatch'
  | 'call_data_hash_mismatch'
  | 'missing_transfer'
  | 'recipient_mismatch'
  | 'amount_mismatch';

export class MemoPaymentProofError extends Error {
  readonly reason: VerifyMemoPaymentProofFailureReason;

  constructor(reason: VerifyMemoPaymentProofFailureReason, message: string) {
    super(message);
    this.name = 'MemoPaymentProofError';
    this.reason = reason;
  }
}

export interface VerifyMemoPaymentProofInput {
  txHash: `0x${string}`;
  paymentRequest: MemoPaymentRequest;
  rpcUrl?: string;
  publicClient?: ProofClient;
  verifiedAt?: number;
}

export interface VerifyMemoPaymentProofResult {
  proof: ArcReceiptOnchainProof;
}

export async function verifyMemoPaymentProof(
  input: VerifyMemoPaymentProofInput,
): Promise<ArcReceiptOnchainProof> {
  const client = input.publicClient ?? createPublicClient({
    transport: http(input.rpcUrl ?? ARC_TESTNET.rpcUrl),
  });

  let txReceipt: ProofTransactionReceipt | null;
  try {
    txReceipt = await client.getTransactionReceipt({ hash: input.txHash });
  } catch {
    throw new MemoPaymentProofError(
      'tx_not_found',
      `Transaction ${input.txHash} was not found on Arc Testnet`,
    );
  }

  if (!txReceipt) {
    throw new MemoPaymentProofError(
      'tx_not_found',
      `Transaction ${input.txHash} was not found on Arc Testnet`,
    );
  }

  return createMemoPaymentProofFromReceipt({
    txHash: input.txHash,
    paymentRequest: input.paymentRequest,
    txReceipt,
    verifiedAt: input.verifiedAt,
  });
}

export function createMemoPaymentProofFromReceipt(params: {
  txHash: `0x${string}`;
  paymentRequest: MemoPaymentRequest;
  txReceipt: ProofTransactionReceipt;
  verifiedAt?: number;
}): ArcReceiptOnchainProof {
  const { paymentRequest, txHash, txReceipt } = params;

  if (txReceipt.status !== 'success') {
    throw new MemoPaymentProofError(
      'tx_reverted',
      `Transaction ${txHash} did not succeed`,
    );
  }

  const memoLogs = txReceipt.logs.filter((log) => sameAddress(log.address, paymentRequest.memoContract));
  if (memoLogs.length === 0) {
    throw new MemoPaymentProofError(
      'wrong_memo_contract',
      `Transaction ${txHash} has no logs from Memo contract ${paymentRequest.memoContract}`,
    );
  }

  const parsedMemoLogs = parseEventLogs({
    abi: ARC_MEMO_ABI,
    eventName: 'Memo',
    logs: memoLogs,
    strict: false,
  });

  if (parsedMemoLogs.length === 0) {
    throw new MemoPaymentProofError(
      'missing_memo_event',
      `Transaction ${txHash} has no Memo event`,
    );
  }

  const memoById = parsedMemoLogs.find((log) => {
    const args = log.args as {
      memoId?: `0x${string}`;
    };
    return args.memoId?.toLowerCase() === paymentRequest.memoId.toLowerCase();
  });

  if (!memoById) {
    throw new MemoPaymentProofError(
      'memo_id_mismatch',
      `Transaction ${txHash} does not contain memoId ${paymentRequest.memoId}`,
    );
  }

  const memoArgs = memoById.args as {
    sender?: `0x${string}`;
    target?: `0x${string}`;
    callDataHash?: `0x${string}`;
    memoId?: `0x${string}`;
    memoIndex?: bigint;
  };

  if (!memoArgs.sender || !memoArgs.target || !memoArgs.callDataHash || !memoArgs.memoId) {
    throw new MemoPaymentProofError(
      'missing_memo_event',
      `Transaction ${txHash} has an incomplete Memo event`,
    );
  }

  if (!sameAddress(memoArgs.target, paymentRequest.target)) {
    throw new MemoPaymentProofError(
      'target_mismatch',
      `Memo target ${memoArgs.target} does not match ${paymentRequest.target}`,
    );
  }

  if (memoArgs.callDataHash.toLowerCase() !== paymentRequest.callDataHash.toLowerCase()) {
    throw new MemoPaymentProofError(
      'call_data_hash_mismatch',
      `Memo callDataHash ${memoArgs.callDataHash} does not match ${paymentRequest.callDataHash}`,
    );
  }

  const transferLogs = txReceipt.logs.filter((log) => sameAddress(log.address, paymentRequest.target));
  const parsedTransferLogs = parseEventLogs({
    abi: ERC20_TRANSFER_ABI,
    eventName: 'Transfer',
    logs: transferLogs,
    strict: false,
  });

  if (parsedTransferLogs.length === 0) {
    throw new MemoPaymentProofError(
      'missing_transfer',
      `Transaction ${txHash} has no USDC Transfer event`,
    );
  }

  const payerTransfers = parsedTransferLogs.filter((log) => {
    const args = log.args as {
      from?: `0x${string}`;
    };
    return args.from !== undefined && sameAddress(args.from, memoArgs.sender as `0x${string}`);
  });

  if (payerTransfers.length === 0) {
    throw new MemoPaymentProofError(
      'missing_transfer',
      `Transaction ${txHash} has no USDC Transfer from memo sender ${memoArgs.sender}`,
    );
  }

  const recipientTransfers = payerTransfers.filter((log) => {
    const args = log.args as {
      to?: `0x${string}`;
    };
    return args.to !== undefined && sameAddress(args.to, paymentRequest.payTo);
  });

  if (recipientTransfers.length === 0) {
    throw new MemoPaymentProofError(
      'recipient_mismatch',
      `Transaction ${txHash} has no USDC Transfer to ${paymentRequest.payTo}`,
    );
  }

  const amountTransfer = recipientTransfers.find((log) => {
    const args = log.args as {
      value?: bigint;
    };
    return args.value?.toString() === paymentRequest.amountUnits;
  });

  if (!amountTransfer) {
    throw new MemoPaymentProofError(
      'amount_mismatch',
      `Transaction ${txHash} has no USDC Transfer for ${paymentRequest.amountUnits} units`,
    );
  }

  return {
    chainId: ARC_TESTNET.chainId,
    network: 'arc-testnet',
    txHash,
    blockNumber: txReceipt.blockNumber,
    transactionIndex: txReceipt.transactionIndex ?? numberOrUndefined(memoById.transactionIndex),
    logIndex: numberOrUndefined(memoById.logIndex),
    memoContract: paymentRequest.memoContract,
    memoIndex: memoArgs.memoIndex?.toString(),
    memoId: paymentRequest.memoId,
    callDataHash: paymentRequest.callDataHash,
    payer: getAddress(memoArgs.sender) as `0x${string}`,
    payTo: getAddress(paymentRequest.payTo) as `0x${string}`,
    target: getAddress(paymentRequest.target) as `0x${string}`,
    amountUnits: paymentRequest.amountUnits,
    explorerUrl: `${ARC_TESTNET.explorerUrl}/tx/${txHash}`,
    verifiedAt: params.verifiedAt ?? Date.now(),
  };
}

function sameAddress(left: `0x${string}` | string, right: `0x${string}` | string): boolean {
  return getAddress(left as `0x${string}`) === getAddress(right as `0x${string}`);
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}
