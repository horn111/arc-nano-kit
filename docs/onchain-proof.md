# Arc Testnet Onchain Proof

Arc Testnet Proof Mode adds a read-only verification step to Arc Receipts.

It lets a builder paste an Arc Testnet transaction hash and prove that a receipt is tied to a real Memo-wrapped USDC payment:

```text
tx hash
-> Arc Testnet receipt
-> Memo event
-> USDC Transfer
-> receipt onchainProof
-> Arcscan link
```

## What It Verifies

`verifyMemoPaymentProof()` checks the transaction receipt against a `MemoPaymentRequest`:

- the transaction exists on Arc Testnet;
- the transaction succeeded;
- the expected Arc Memo contract emitted a `Memo` event;
- `memoId` matches the invoice;
- `target` is the Arc USDC ERC-20 interface;
- `callDataHash` matches the generated transfer calldata;
- a USDC `Transfer` exists from the memo sender;
- recipient and amount match the invoice payment request.

The returned proof includes:

- `chainId`;
- `txHash`;
- `blockNumber`;
- `transactionIndex`;
- `logIndex`;
- `memoContract`;
- `memoIndex`;
- `memoId`;
- `callDataHash`;
- `payer`;
- `payTo`;
- `target`;
- `amountUnits`;
- `explorerUrl`.

## SDK Usage

```ts
import {
  createInvoice,
  createMemoPaymentRequest,
  verifyMemoPaymentProof,
} from '@arc-nano-kit/sdk/receipts';

const invoice = createInvoice({
  id: 'inv_arc_demo',
  amount: '19.00',
  payTo: '0x1111111111111111111111111111111111111111',
});

const paymentRequest = createMemoPaymentRequest(invoice);

const proof = await verifyMemoPaymentProof({
  txHash: '0x...',
  paymentRequest,
});

console.log(proof.explorerUrl);
```

## Demo Flow

The demo does not send transactions or ask for a private key.

To use the optional live proof path:

1. Run the local demo.
2. Click `Run Watcher Flow`.
3. Copy the generated memo payment request values.
4. From a funded Arc Testnet EOA, send USDC through Arc `Memo.memo(...)`.
5. Paste the resulting transaction hash into `Onchain Proof`.
6. Click `Verify Arc Testnet Tx`.

On success, the demo shows block/log proof and a `View on Arcscan` link.

## Current Limits

- Proof mode is read-only.
- It does not broadcast transactions.
- It does not store private keys.
- It does not persist proofs in a database.
- It does not replace a hosted indexer or production receipt store.
