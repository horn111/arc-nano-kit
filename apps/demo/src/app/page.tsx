'use client';

import { useEffect, useMemo, useState } from 'react';

type EndpointResult = {
  status?: number;
  statusText?: string;
  timeMs?: number;
  data?: unknown;
  requirements?: unknown;
  error?: string;
};

type TimelineItem = {
  id: string;
  label: string;
  detail: string;
};

type ReceiptDemo = {
  generatedAt: string;
  mode: string;
  invoice: {
    id: string;
    status: string;
    amount: string;
    amountUnits: string;
    currency: string;
    network: string;
    payTo: string;
    memo: string;
    memoId?: string;
    memoData?: string;
    paymentUri: string;
    expiresAt?: number;
  };
  paymentRequest: {
    invoiceId: string;
    memoContract: string;
    target: string;
    payTo: string;
    amountUnits: string;
    memoId: string;
    memoData: string;
    callDataHash: string;
    txData: string;
  };
  watcher: {
    network: string;
    event: string;
    memoContract: string;
    confirmationBlocks: number;
    pollIntervalMs: number;
  };
  receipt: {
    id: string;
    invoiceId: string;
    status: string;
    amount: string;
    amountUnits: string;
    currency: string;
    network: string;
    payTo: string;
    payer?: string;
    txHash?: string;
    memo: string;
    createdAt: number;
    metadata?: Record<string, unknown>;
  };
  webhook: {
    eventId: string;
    type: string;
    signatureHeader: string;
    target: string;
  };
  timeline: TimelineItem[];
};

const endpointCards = [
  {
    path: '/api/joke',
    label: 'Developer joke',
    price: '$0.001 USDC',
    note: 'Per-request paid API check',
  },
  {
    path: '/api/weather?city=NYC',
    label: 'Weather data',
    price: '$0.005 USDC',
    note: 'Higher-value paid API check',
  },
];

const pendingTimeline: TimelineItem[] = [
  { id: 'invoice', label: 'invoice.created', detail: 'Waiting for local demo run' },
  { id: 'request', label: 'memo.payment_request_built', detail: 'Memo-wrapped USDC calldata will appear here' },
  { id: 'watch', label: 'watcher.poll', detail: 'Arc Testnet memo watcher not started yet' },
  { id: 'receipt', label: 'receipt.generated', detail: 'Receipt state will be shown after payment match' },
];

export default function HomePage() {
  const [receiptDemo, setReceiptDemo] = useState<ReceiptDemo | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [endpointResult, setEndpointResult] = useState<EndpointResult | null>(null);
  const [endpointLoading, setEndpointLoading] = useState<string | null>(null);

  const timeline = receiptDemo?.timeline ?? pendingTimeline;
  const terminalState = useMemo(() => {
    if (receiptLoading) {
      return 'watching local flow';
    }

    if (receiptDemo) {
      return 'receipt generated';
    }

    return 'ready';
  }, [receiptDemo, receiptLoading]);

  const runReceiptDemo = async () => {
    setReceiptLoading(true);

    try {
      const response = await fetch('/api/receipts', { cache: 'no-store' });
      const data = (await response.json()) as ReceiptDemo;
      setReceiptDemo(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown receipt demo error';
      setEndpointResult({ error: message });
    } finally {
      setReceiptLoading(false);
    }
  };

  const testEndpoint = async (url: string) => {
    setEndpointLoading(url);
    setEndpointResult(null);

    try {
      const startTime = Date.now();
      const response = await fetch(url);
      const data = await response.json();
      const endTime = Date.now();

      const paymentRequired =
        response.headers.get('x-payment-requirements')
        ?? response.headers.get('x-payment-required');
      let requirements: unknown = null;

      if (paymentRequired) {
        try {
          requirements = JSON.parse(atob(paymentRequired));
        } catch {
          requirements = 'Unable to decode X-Payment-Required header';
        }
      }

      setEndpointResult({
        status: response.status,
        statusText: response.statusText,
        timeMs: endTime - startTime,
        data,
        requirements,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown endpoint error';
      setEndpointResult({ error: message });
    } finally {
      setEndpointLoading(null);
    }
  };

  useEffect(() => {
    void runReceiptDemo();
  }, []);

  return (
    <main className="demo-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">arc-nano-kit demo</p>
          <h1>Arc Receipts watcher</h1>
        </div>
        <a className="repo-link" href="https://github.com/horn111/arc-nano-kit">
          Star repo
        </a>
      </header>

      <section className="workspace">
        <div className="panel terminal-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">local payment ops</p>
              <h2>Invoice to signed webhook</h2>
            </div>
            <button className="primary-button" onClick={runReceiptDemo} disabled={receiptLoading}>
              {receiptLoading ? 'Running...' : 'Run flow'}
            </button>
          </div>

          <div className="terminal">
            <div className="terminal-bar">
              <span className="dot dot-violet" />
              <span className="dot dot-blue" />
              <span className="dot dot-slate" />
              <span className="terminal-state">{terminalState}</span>
            </div>
            <div className="command-line">
              <span>$</span>
              <code>arc receipts watch --network arc-testnet --memo</code>
            </div>

            <ol className="timeline">
              {timeline.map((item, index) => (
                <li key={item.id}>
                  <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="panel memo-panel">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Memo payment request</p>
              <h2>USDC transfer wrapped in Memo.memo</h2>
            </div>
          </div>

          <dl className="facts">
            <div>
              <dt>Invoice</dt>
              <dd>{receiptDemo?.invoice.id ?? 'pending'}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>
                {receiptDemo
                  ? `${receiptDemo.invoice.amount} ${receiptDemo.invoice.currency}`
                  : 'pending'}
              </dd>
            </div>
            <div>
              <dt>Memo contract</dt>
              <dd>{truncate(receiptDemo?.paymentRequest.memoContract)}</dd>
            </div>
            <div>
              <dt>Memo id</dt>
              <dd>{truncate(receiptDemo?.paymentRequest.memoId, 14, 10)}</dd>
            </div>
            <div>
              <dt>Call data hash</dt>
              <dd>{truncate(receiptDemo?.paymentRequest.callDataHash, 14, 10)}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="data-grid">
        <div className="panel">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">receipt artifact</p>
              <h2>Generated receipt</h2>
            </div>
          </div>
          <JsonBlock
            data={
              receiptDemo
                ? {
                    id: receiptDemo.receipt.id,
                    status: receiptDemo.receipt.status,
                    txHash: receiptDemo.receipt.txHash,
                    payer: receiptDemo.receipt.payer,
                    memo: receiptDemo.receipt.memo,
                  }
                : { status: 'pending' }
            }
          />
        </div>

        <div className="panel">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">webhook delivery</p>
              <h2>Signed event</h2>
            </div>
          </div>
          <JsonBlock
            data={
              receiptDemo
                ? {
                    eventId: receiptDemo.webhook.eventId,
                    type: receiptDemo.webhook.type,
                    target: receiptDemo.webhook.target,
                    signature: receiptDemo.webhook.signatureHeader,
                  }
                : { status: 'pending' }
            }
          />
        </div>
      </section>

      <section className="panel endpoint-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">existing module</p>
            <h2>Paid endpoint probe</h2>
          </div>
        </div>

        <div className="endpoint-grid">
          {endpointCards.map((endpoint) => (
            <button
              key={endpoint.path}
              className="endpoint-button"
              onClick={() => testEndpoint(endpoint.path)}
              disabled={endpointLoading !== null}
            >
              <span>
                <code>GET {endpoint.path}</code>
                <small>{endpoint.note}</small>
              </span>
              <strong>{endpointLoading === endpoint.path ? 'Testing...' : endpoint.price}</strong>
            </button>
          ))}
        </div>

        {endpointResult && (
          <div className="response-console">
            <div className="response-head">
              {endpointResult.error ? (
                <strong className="danger">Request error</strong>
              ) : (
                <>
                  <strong className={endpointResult.status === 402 ? 'warn' : 'ok'}>
                    HTTP {endpointResult.status} {endpointResult.statusText}
                  </strong>
                  <span>{endpointResult.timeMs}ms</span>
                </>
              )}
            </div>

            {endpointResult.requirements ? (
              <JsonBlock label="Parsed x-payment-requirements" data={endpointResult.requirements} />
            ) : null}
            <JsonBlock
              label="Response body"
              data={endpointResult.error ? { error: endpointResult.error } : endpointResult.data}
            />
          </div>
        )}
      </section>

      <style jsx>{`
        :global(body) {
          background: #07090f;
          color: #e7edf7;
        }

        .demo-shell {
          min-height: 100vh;
          padding: 24px;
          background:
            linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            #07090f;
          background-size: 42px 42px;
        }

        .topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          max-width: 1180px;
          margin: 0 auto 18px;
        }

        h1,
        h2,
        p {
          margin: 0;
        }

        h1 {
          font-size: clamp(32px, 5vw, 56px);
          line-height: 1;
          letter-spacing: 0;
          color: #f6f8ff;
        }

        h2 {
          font-size: 18px;
          line-height: 1.25;
          color: #f6f8ff;
        }

        .eyebrow {
          margin-bottom: 8px;
          color: #7dd3fc;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .repo-link,
        .primary-button {
          min-height: 40px;
          border: 1px solid rgba(125, 211, 252, 0.34);
          border-radius: 8px;
          background: #101827;
          color: #e7edf7;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        .repo-link {
          display: inline-flex;
          align-items: center;
          padding: 0 14px;
        }

        .primary-button {
          padding: 0 16px;
          background: #2563eb;
          border-color: #3b82f6;
        }

        .primary-button:disabled,
        .endpoint-button:disabled {
          cursor: wait;
          opacity: 0.7;
        }

        .workspace,
        .data-grid,
        .endpoint-panel {
          max-width: 1180px;
          margin-left: auto;
          margin-right: auto;
        }

        .workspace {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
          gap: 16px;
          align-items: stretch;
        }

        .data-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .panel {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #1d2637;
          border-radius: 8px;
          background: rgba(9, 13, 22, 0.94);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.32);
        }

        .terminal-panel,
        .memo-panel,
        .endpoint-panel,
        .data-grid .panel {
          padding: 18px;
        }

        .panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .panel-head.compact {
          margin-bottom: 12px;
        }

        .terminal {
          overflow: hidden;
          border: 1px solid #243047;
          border-radius: 8px;
          background: #03050a;
        }

        .terminal-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 14px;
          border-bottom: 1px solid #1d2637;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot-violet {
          background: #8b5cf6;
        }

        .dot-blue {
          background: #2563eb;
        }

        .dot-slate {
          background: #334155;
        }

        .terminal-state {
          margin-left: auto;
          color: #93c5fd;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .command-line {
          display: flex;
          gap: 10px;
          min-width: 0;
          padding: 16px 16px 4px;
          color: #c4b5fd;
          font-size: 14px;
          white-space: nowrap;
          overflow-x: auto;
        }

        .command-line span {
          color: #7dd3fc;
        }

        .timeline {
          display: grid;
          gap: 12px;
          margin: 0;
          padding: 16px;
          list-style: none;
        }

        .timeline li {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 12px;
          min-height: 60px;
          padding: 12px;
          border: 1px solid #1d2637;
          border-radius: 8px;
          background: #080d16;
        }

        .step-index {
          color: #22c55e;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
        }

        .timeline strong {
          display: block;
          margin-bottom: 5px;
          color: #eef2ff;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .timeline p,
        .facts dd,
        .facts dt,
        .response-head,
        small {
          color: #9aa8bd;
        }

        .timeline p {
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .facts {
          display: grid;
          gap: 10px;
          margin: 0;
        }

        .facts div {
          padding: 12px;
          border: 1px solid #1d2637;
          border-radius: 8px;
          background: #080d16;
        }

        .facts dt {
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .facts dd {
          margin: 0;
          color: #e7edf7;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .json-block {
          box-sizing: border-box;
          max-width: 100%;
          margin: 0;
          overflow-x: auto;
          overflow-wrap: anywhere;
          border: 1px solid #1d2637;
          border-radius: 8px;
          background: #03050a;
          padding: 14px;
          color: #dbeafe;
          font-size: 12px;
          line-height: 1.55;
        }

        .json-label {
          display: block;
          margin: 0 0 8px;
          color: #7dd3fc;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .endpoint-panel {
          margin-top: 16px;
        }

        .endpoint-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .endpoint-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          min-height: 86px;
          padding: 14px;
          border: 1px solid #243047;
          border-radius: 8px;
          background: #080d16;
          color: #e7edf7;
          cursor: pointer;
          text-align: left;
        }

        .endpoint-button code {
          display: block;
          margin-bottom: 8px;
          color: #bfdbfe;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .endpoint-button strong {
          flex: 0 0 auto;
          color: #86efac;
          font-size: 13px;
        }

        .response-console {
          margin-top: 14px;
          display: grid;
          gap: 10px;
        }

        .response-head {
          display: flex;
          gap: 12px;
          align-items: center;
          min-height: 28px;
          font-size: 13px;
        }

        .ok {
          color: #86efac;
        }

        .warn {
          color: #facc15;
        }

        .danger {
          color: #fca5a5;
        }

        @media (max-width: 900px) {
          .demo-shell {
            padding: 18px;
          }

          .topbar,
          .workspace,
          .data-grid,
          .endpoint-grid {
            grid-template-columns: 1fr;
          }

          .topbar {
            display: grid;
            align-items: start;
          }

          .repo-link {
            width: fit-content;
          }

          .endpoint-button {
            align-items: flex-start;
            flex-direction: column;
          }

          .command-line {
            white-space: normal;
            overflow-wrap: anywhere;
          }

          .json-block {
            white-space: pre-wrap;
          }
        }
      `}</style>
    </main>
  );
}

function JsonBlock({ data, label }: { data: unknown; label?: string }) {
  return (
    <pre className="json-block">
      {label ? <span className="json-label">{label}</span> : null}
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function truncate(value?: string, start = 10, end = 8) {
  if (!value) {
    return 'pending';
  }

  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}
