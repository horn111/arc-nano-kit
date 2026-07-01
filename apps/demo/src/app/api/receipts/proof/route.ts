import {
  MemoPaymentProofError,
  createReceipt,
  stablecoinUnitsToString,
  verifyMemoPaymentProof,
  type ArcInvoice,
  type MemoPaymentRequest,
} from '@arc-nano-kit/sdk/receipts';

export const dynamic = 'force-dynamic';

interface ProofRequest {
  txHash?: string;
  invoice?: ArcInvoice;
  paymentRequest?: MemoPaymentRequest;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ProofRequest;

  if (!body.txHash || !isTxHash(body.txHash)) {
    return Response.json(
      { error: 'Missing or invalid Arc Testnet tx hash', reason: 'invalid_tx_hash' },
      { status: 400 },
    );
  }

  if (!body.invoice || !body.paymentRequest) {
    return Response.json(
      { error: 'Missing invoice or payment request', reason: 'missing_payment_request' },
      { status: 400 },
    );
  }

  try {
    const proof = await verifyMemoPaymentProof({
      txHash: body.txHash,
      paymentRequest: body.paymentRequest,
    });
    const receipt = createReceipt(body.invoice, {
      txHash: proof.txHash,
      from: proof.payer,
      to: proof.payTo,
      amount: stablecoinUnitsToString(BigInt(proof.amountUnits)),
      currency: body.invoice.currency,
      network: proof.network,
      memo: body.invoice.memo,
      memoId: proof.memoId,
      callDataHash: proof.callDataHash,
      blockNumber: proof.blockNumber,
      onchainProof: proof,
      metadata: {
        source: 'arc-testnet-proof',
        memoContract: proof.memoContract,
        memoIndex: proof.memoIndex,
        explorerUrl: proof.explorerUrl,
      },
    });

    return Response.json(toJsonSafe({ proof, receipt }));
  } catch (error) {
    if (error instanceof MemoPaymentProofError) {
      return Response.json(
        { error: error.message, reason: error.reason },
        { status: 422 },
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown proof verification error';
    return Response.json(
      { error: message, reason: 'proof_verification_failed' },
      { status: 500 },
    );
  }
}

function isTxHash(value: string): value is `0x${string}` {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
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
