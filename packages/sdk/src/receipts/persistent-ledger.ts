import { createInvoice, createReceipt, isInvoiceExpired } from './invoice.js';
import type {
  ArcInvoice,
  ArcReceipt,
  CreateInvoiceInput,
  ObservedPayment,
  WebhookEvent,
} from './types.js';
import type { ReceiptStore, ReceiptStoreInvoiceFilter } from './store.js';
import { createWebhookEvent } from './webhooks.js';

export interface PersistentReceiptLedgerConfig {
  store: ReceiptStore;
}

export class PersistentReceiptLedger {
  private readonly store: ReceiptStore;

  constructor(config: PersistentReceiptLedgerConfig) {
    this.store = config.store;
  }

  async createInvoice(input: CreateInvoiceInput): Promise<ArcInvoice> {
    const invoice = createInvoice(input);
    await this.addInvoice(invoice);
    await this.saveWebhookEvent(createWebhookEvent('invoice.created', { invoice }));
    return invoice;
  }

  async addInvoice(invoice: ArcInvoice): Promise<void> {
    const existing = await this.store.getInvoice(invoice.id);
    if (existing) {
      throw new Error(`Invoice already exists: ${invoice.id}`);
    }

    await this.store.saveInvoice(invoice);
  }

  async getInvoice(id: string): Promise<ArcInvoice | undefined> {
    return this.store.getInvoice(id);
  }

  async listInvoices(filter?: ReceiptStoreInvoiceFilter): Promise<ArcInvoice[]> {
    return this.store.listInvoices(filter);
  }

  async recordPayment(invoiceId: string, payment: ObservedPayment): Promise<ArcReceipt> {
    const existingReceipt = payment.txHash
      ? await this.getReceiptByTxHash(payment.txHash, invoiceId)
      : undefined;
    if (existingReceipt) {
      return existingReceipt;
    }

    const invoice = await this.requireInvoice(invoiceId);
    const observedInvoice = await this.updateInvoice(invoice.id, { status: 'observed' });
    await this.saveWebhookEvent(createWebhookEvent('invoice.observed', {
      invoice: observedInvoice,
      payment,
    }));

    const receipt = createReceipt(observedInvoice, payment);
    await this.store.saveReceipt(receipt);
    const paidInvoice = await this.updateInvoice(invoice.id, { status: 'paid' });
    await this.saveWebhookEvent(createWebhookEvent('invoice.paid', { invoice: paidInvoice, receipt }));
    return receipt;
  }

  async markExpired(invoiceId: string, now = Date.now()): Promise<ArcInvoice> {
    const invoice = await this.requireInvoice(invoiceId);

    if (!isInvoiceExpired(invoice, now)) {
      throw new Error(`Invoice is not expired: ${invoiceId}`);
    }

    const expiredInvoice = await this.updateInvoice(invoiceId, { status: 'expired' });
    await this.saveWebhookEvent(createWebhookEvent('invoice.expired', { invoice: expiredInvoice }));
    return expiredInvoice;
  }

  async markRefunded(
    invoiceId: string,
    refund: { txHash?: `0x${string}`; refundedAt?: number } = {},
  ): Promise<ArcReceipt> {
    const invoice = await this.requireInvoice(invoiceId);
    const receipt = (await this.store.listReceipts())
      .find((item) => item.invoiceId === invoiceId);

    if (!receipt) {
      throw new Error(`Cannot refund invoice without a paid receipt: ${invoiceId}`);
    }

    const refundedReceipt: ArcReceipt = {
      ...receipt,
      id: `rfnd_${receipt.id}`,
      status: 'refunded',
      txHash: refund.txHash ?? receipt.txHash,
      createdAt: refund.refundedAt ?? Date.now(),
    };

    await this.store.saveReceipt(refundedReceipt);
    const refundedInvoice = await this.updateInvoice(invoice.id, { status: 'refunded' });
    await this.saveWebhookEvent(createWebhookEvent('invoice.refunded', {
      invoice: refundedInvoice,
      receipt: refundedReceipt,
    }));
    return refundedReceipt;
  }

  async getReceipt(id: string): Promise<ArcReceipt | undefined> {
    return this.store.getReceipt(id);
  }

  async getReceiptByTxHash(
    txHash: `0x${string}`,
    invoiceId?: string,
  ): Promise<ArcReceipt | undefined> {
    return this.store.getReceiptByTxHash(txHash, invoiceId);
  }

  async listReceipts(): Promise<ArcReceipt[]> {
    return this.store.listReceipts();
  }

  async listWebhookEvents(): Promise<WebhookEvent[]> {
    return this.store.listWebhookEvents();
  }

  private async saveWebhookEvent(event: WebhookEvent): Promise<void> {
    await this.store.saveWebhookEvent(event);
  }

  private async requireInvoice(id: string): Promise<ArcInvoice> {
    const invoice = await this.store.getInvoice(id);
    if (!invoice) {
      throw new Error(`Invoice not found: ${id}`);
    }

    return invoice;
  }

  private async updateInvoice(id: string, patch: Partial<ArcInvoice>): Promise<ArcInvoice> {
    const invoice = await this.requireInvoice(id);
    const next = { ...invoice, ...patch };
    await this.store.saveInvoice(next);
    return next;
  }
}
