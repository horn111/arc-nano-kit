import {
  MemoPaymentProofError,
  createReceipt,
  findMemoPaymentProof,
  stablecoinUnitsToString,
  type ArcInvoice,
  type FindMemoPaymentProofResult,
  type MemoPaymentRequest,
} from '@arc-nano-kit/sdk/receipts';

export const dynamic = 'force-dynamic';

interface WatchProofRequest {
  invoice?: ArcInvoice;
  paymentRequest?: MemoPaymentRequest;
  fromBlock?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as WatchProofRequest;

  if (!body.invoice || !body.paymentRequest) {
    return Response.json(
      { error: 'Missing invoice or payment request', reason: 'missing_payment_request' },
      { status: 400 },
    );
  }

  try {
    const result = await findMemoPaymentProof({
      paymentRequest: body.paymentRequest,
      fromBlock: parseOptionalBlock(body.fromBlock),
    });

    if (result.status === 'pending') {
      return Response.json(toJsonSafe(result));
    }

    const receipt = createProofReceipt(body.invoice, result);
    return Response.json(toJsonSafe({ ...result, receipt }));
  } catch (error) {
    if (error instanceof MemoPaymentProofError) {
      return Response.json(
        { error: error.message, reason: error.reason },
        { status: 422 },
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown proof polling error';
    return Response.json(
      { error: message, reason: 'proof_polling_failed' },
      { status: 500 },
    );
  }
}

function createProofReceipt(invoice: ArcInvoice, result: Extract<FindMemoPaymentProofResult, { status: 'found' }>) {
  return createReceipt(invoice, {
    txHash: result.proof.txHash,
    from: result.proof.payer,
    to: result.proof.payTo,
    amount: stablecoinUnitsToString(BigInt(result.proof.amountUnits)),
    currency: invoice.currency,
    network: result.proof.network,
    memo: invoice.memo,
    memoId: result.proof.memoId,
    callDataHash: result.proof.callDataHash,
    blockNumber: result.proof.blockNumber,
    onchainProof: result.proof,
    metadata: {
      source: 'arc-testnet-proof-watch',
      memoContract: result.proof.memoContract,
      memoIndex: result.proof.memoIndex,
      explorerUrl: result.proof.explorerUrl,
    },
  });
}

function parseOptionalBlock(value?: string): bigint | undefined {
  if (!value) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    return undefined;
  }

  return BigInt(value);
}

function toJsonSafe(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafe(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, toJsonSafe(nested)]),
    );
  }

  return value;
}
