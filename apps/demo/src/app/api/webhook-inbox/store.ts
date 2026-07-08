import { join } from 'node:path';
import {
  InMemoryReceiptStore,
  PersistentReceiptLedger,
  PersistentWebhookInbox,
  type ReceiptStore,
} from '@arc-nano-kit/sdk/receipts';

export const DEMO_WEBHOOK_SECRET = 'arc_receipts_demo_secret';
export const DEMO_WEBHOOK_TARGET = 'https://seller.app/webhooks/arc';

const globalWebhookInbox = globalThis as typeof globalThis & {
  __arcNanoKitReceiptStore?: ReceiptStore;
  __arcNanoKitReceiptStoreMode?: DemoReceiptStoreMode;
  __arcNanoKitWebhookInbox?: PersistentWebhookInbox;
};

export type DemoReceiptStoreMode = 'memory' | 'sqlite';

export type DemoReceiptStoreSummary = {
  mode: DemoReceiptStoreMode;
  persistent: boolean;
  invoiceCount: number;
  receiptCount: number;
  webhookDeliveryCount: number;
  watcherCursorCount: number;
};

export async function getDemoReceiptStore(): Promise<ReceiptStore> {
  if (globalWebhookInbox.__arcNanoKitReceiptStore) {
    return globalWebhookInbox.__arcNanoKitReceiptStore;
  }

  const mode = getDemoReceiptStoreMode();
  globalWebhookInbox.__arcNanoKitReceiptStoreMode = mode;

  if (mode === 'sqlite') {
    const { createSqliteReceiptStore } = await import('@arc-nano-kit/sqlite');
    const store = createSqliteReceiptStore({
      path: process.env.ARC_RECEIPTS_SQLITE_PATH
        ?? join(process.cwd(), '.arc-nano-kit', 'receipts.sqlite'),
    });
    globalWebhookInbox.__arcNanoKitReceiptStore = store;
    return store;
  }

  const store = new InMemoryReceiptStore();
  globalWebhookInbox.__arcNanoKitReceiptStore = store;
  return store;
}

export async function getDemoReceiptLedger(): Promise<PersistentReceiptLedger> {
  return new PersistentReceiptLedger({ store: await getDemoReceiptStore() });
}

export async function getDemoWebhookInbox(): Promise<PersistentWebhookInbox> {
  if (globalWebhookInbox.__arcNanoKitWebhookInbox) {
    return globalWebhookInbox.__arcNanoKitWebhookInbox;
  }

  globalWebhookInbox.__arcNanoKitWebhookInbox = new PersistentWebhookInbox({
    store: await getDemoReceiptStore(),
  });
  return globalWebhookInbox.__arcNanoKitWebhookInbox;
}

export async function getDemoReceiptStoreSummary(): Promise<DemoReceiptStoreSummary> {
  const store = await getDemoReceiptStore();
  const mode = globalWebhookInbox.__arcNanoKitReceiptStoreMode ?? getDemoReceiptStoreMode();

  return {
    mode,
    persistent: mode === 'sqlite',
    invoiceCount: (await store.listInvoices()).length,
    receiptCount: (await store.listReceipts()).length,
    webhookDeliveryCount: (await store.listWebhookDeliveries()).length,
    watcherCursorCount: (await store.listWatcherCursors()).length,
  };
}

function getDemoReceiptStoreMode(): DemoReceiptStoreMode {
  return process.env.ARC_RECEIPTS_STORE === 'sqlite' ? 'sqlite' : 'memory';
}
