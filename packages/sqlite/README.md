# @arc-nano-kit/sqlite

Optional SQLite receipt store for `arc-nano-kit`.

```ts
import { PersistentReceiptLedger } from '@arc-nano-kit/sdk/receipts';
import { createSqliteReceiptStore } from '@arc-nano-kit/sqlite';

const store = createSqliteReceiptStore({
  path: '.arc-nano-kit/receipts.sqlite',
});

const ledger = new PersistentReceiptLedger({ store });
```

This package stores invoices, receipts, webhook events, webhook delivery attempts, and watcher cursors.

## Requirements

- Node 24+
- Local filesystem access

The package uses Node's built-in `node:sqlite` module. It is optional so the core SDK remains free of SQLite runtime requirements.
