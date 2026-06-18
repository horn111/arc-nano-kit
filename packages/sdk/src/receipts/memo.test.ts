import { describe, expect, it } from 'vitest';
import { createInvoiceMemo, parseInvoiceMemo } from './memo.js';

describe('invoice memos', () => {
  it('creates and parses Arc invoice memos', () => {
    const memo = createInvoiceMemo('inv_123', 'demo');

    expect(memo).toBe('demo:invoice:v1:inv_123');
    expect(parseInvoiceMemo(memo)).toEqual({
      namespace: 'demo',
      kind: 'invoice',
      version: 'v1',
      invoiceId: 'inv_123',
    });
  });

  it('rejects unsafe invoice ids and namespaces', () => {
    expect(() => createInvoiceMemo('bad:id')).toThrow(/Invoice id/);
    expect(() => createInvoiceMemo('ok', 'bad namespace')).toThrow(/namespace/);
  });

  it('returns null for unrelated memos', () => {
    expect(parseInvoiceMemo('hello world')).toBeNull();
  });
});
