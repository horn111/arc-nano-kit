import { describe, expect, it } from 'vitest';
import { InMemoryReceiptStore } from './store.js';
import { PersistentReceiptLedger } from './persistent-ledger.js';

const seller = '0x1111111111111111111111111111111111111111' as const;
const buyer = '0x2222222222222222222222222222222222222222' as const;
const txHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;

describe('PersistentReceiptLedger', () => {
  it('records invoice, observed payment, paid receipt, and webhook events', async () => {
    const store = new InMemoryReceiptStore();
    const ledger = new PersistentReceiptLedger({ store });
    const invoice = await ledger.createInvoice({
      id: 'inv_persistent',
      amount: '3.50',
      payTo: seller,
      customerId: 'cus_123',
    });

    const receipt = await ledger.recordPayment(invoice.id, {
      txHash,
      from: buyer,
      to: seller,
      amount: '3.50',
      memo: invoice.memo,
      blockNumber: 42n,
    });

    expect((await ledger.getInvoice(invoice.id))?.status).toBe('paid');
    expect(await ledger.getReceipt(receipt.id)).toEqual(receipt);
    expect(await ledger.listInvoices({ customerId: 'cus_123' })).toHaveLength(1);
    expect((await ledger.listWebhookEvents()).map((event) => event.type)).toEqual([
      'invoice.created',
      'invoice.observed',
      'invoice.paid',
    ]);
  });

  it('returns existing receipt for duplicate invoice tx records', async () => {
    const ledger = new PersistentReceiptLedger({ store: new InMemoryReceiptStore() });
    const invoice = await ledger.createInvoice({ id: 'inv_dupe_persistent', amount: '1', payTo: seller });
    const payment = {
      txHash,
      from: buyer,
      to: seller,
      amount: '1',
      memo: invoice.memo,
    };

    const first = await ledger.recordPayment(invoice.id, payment);
    const second = await ledger.recordPayment(invoice.id, payment);

    expect(second).toEqual(first);
    expect(await ledger.listReceipts()).toHaveLength(1);
  });
});
