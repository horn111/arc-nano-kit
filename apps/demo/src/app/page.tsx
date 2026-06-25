'use client';

import { useState } from 'react';

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

type FlowBlockId = 'invoice' | 'request' | 'watch' | 'receipt';

type FlowBlock = {
  id: FlowBlockId;
  number: string;
  title: string;
  idleStatus: string;
  doneStatus: string;
};

const endpointCards = [
  {
    path: '/api/joke',
    price: '$0.001 USDC',
    note: 'Random developer joke',
  },
  {
    path: '/api/weather?city=NYC',
    price: '$0.005 USDC',
    note: 'NYC weather payload',
  },
];

const flowBlocks: FlowBlock[] = [
  { id: 'invoice', number: '01', title: 'Invoice Created', idleStatus: 'Idle', doneStatus: 'Created' },
  { id: 'request', number: '02', title: 'Memo Payment', idleStatus: 'Idle', doneStatus: 'Built' },
  { id: 'watch', number: '03', title: 'Watcher Poll', idleStatus: 'Idle', doneStatus: 'Matched' },
  { id: 'receipt', number: '04', title: 'Receipt Generated', idleStatus: 'Idle', doneStatus: 'Generated' },
];

const pendingTimeline: TimelineItem[] = [
  { id: 'invoice', label: 'invoice.created', detail: 'Waiting for flow initiation...' },
  { id: 'request', label: 'memo.payment_request_built', detail: 'Calldata parameters pending compilation.' },
  { id: 'watch', label: 'watcher.poll', detail: 'Watcher scanner inactive.' },
  { id: 'receipt', label: 'receipt.generated', detail: 'Awaiting transaction confirmations.' },
];

const factMap: Record<FlowBlockId, string[]> = {
  invoice: ['invoice', 'amount'],
  request: ['contract', 'memoId', 'hash'],
  watch: ['contract'],
  receipt: ['invoice', 'amount', 'memoId'],
};

export default function HomePage() {
  const [receiptDemo, setReceiptDemo] = useState<ReceiptDemo | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>(pendingTimeline);
  const [completedSteps, setCompletedSteps] = useState<FlowBlockId[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<FlowBlockId>('invoice');
  const [endpointResult, setEndpointResult] = useState<EndpointResult | null>(null);
  const [endpointLoading, setEndpointLoading] = useState<string | null>(null);

  const terminalState = receiptLoading
    ? 'Watching flow'
    : receiptDemo
      ? 'Receipt generated'
      : 'Ready';
  const highlightedFacts = receiptDemo
    ? ['invoice', 'amount', 'contract', 'memoId', 'hash']
    : [];

  const runReceiptDemo = async () => {
    setReceiptLoading(true);
    setEndpointResult(null);
    setReceiptDemo(null);
    setTimeline(pendingTimeline);
    setCompletedSteps([]);
    setSelectedBlock('invoice');

    try {
      const response = await fetch('/api/receipts', { cache: 'no-store' });
      const data = (await response.json()) as ReceiptDemo;
      setReceiptDemo(data);

      const stepOrder: FlowBlockId[] = ['invoice', 'request', 'watch', 'receipt'];
      const stepTimeline = [
        data.timeline[0],
        data.timeline[1],
        data.timeline[2],
        data.timeline[3] ?? data.timeline[4],
      ].filter(Boolean) as TimelineItem[];

      for (const [index, stepId] of stepOrder.entries()) {
        setSelectedBlock(stepId);
        setTimeline((current) => {
          const next = [...current];
          next[index] = stepTimeline[index];
          return next;
        });
        await delay(360);
        setCompletedSteps((current) => [...new Set([...current, stepId])]);
      }

      setTimeline(data.timeline);
      setSelectedBlock('receipt');
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
          requirements = 'Unable to decode payment requirements header';
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

  return (
    <main className="demo-shell">
      <div className="container">
        <header className="header">
          <div className="header-left">
            <h1>
              Arc Watcher <span className="header-tag">Nano Kit</span>
            </h1>
          </div>
          <a className="repo-link" href="https://github.com/horn111/arc-nano-kit">
            <svg aria-hidden="true" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Star Repo
          </a>
        </header>

        <section className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Local Ops</p>
                <h2 className="panel-title">Interactive Watcher Flow</h2>
              </div>
              <button className="btn-flow" onClick={runReceiptDemo} disabled={receiptLoading}>
                {receiptLoading ? 'Processing...' : receiptDemo ? 'Run Watcher Flow Again' : 'Run Watcher Flow'}
              </button>
            </div>

            <div className="pipeline-container">
              <div className="terminal-header">
                <div className="terminal-cmd">
                  <span>$</span> arc receipts watch --network arc-testnet --memo
                </div>
                <div className={`terminal-status ${receiptLoading ? 'status-active' : ''}`}>
                  {terminalState}
                </div>
              </div>

              <div className="flow-diagram">
                {flowBlocks.map((block, index) => {
                  const isCompleted = completedSteps.includes(block.id);
                  const isActive = selectedBlock === block.id;
                  return (
                    <div className="flow-piece" key={block.id}>
                      {index > 0 ? <div className="flow-connector">-&gt;</div> : null}
                      <button
                        className={`flow-block ${isCompleted ? 'success' : ''} ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedBlock(block.id)}
                      >
                        <span className="flow-block-num">{block.number}</span>
                        <span className="flow-block-title">{block.title}</span>
                        <span className="flow-block-status">
                          {isCompleted ? block.doneStatus : receiptLoading && isActive ? 'Running' : block.idleStatus}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <ol className="terminal-timeline">
                {timeline.map((item, index) => (
                  <li
                    className={`timeline-item ${index <= completedSteps.length ? 'active' : ''} ${
                      index < completedSteps.length ? 'success' : ''
                    }`}
                    key={`${item.id}-${index}`}
                  >
                    <span className="timeline-index">{String(index + 1).padStart(2, '0')}</span>
                    <div className="timeline-content">
                      <strong>{item.label}</strong>
                      <p>{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="panel">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Parameters</p>
                <h2 className="panel-title">Memo Payment Data</h2>
              </div>
            </div>

            <div className="facts-list">
              <FactCard
                id="invoice"
                label="Invoice ID"
                value={receiptDemo?.invoice.id ?? 'pending'}
                filled={Boolean(receiptDemo)}
                highlighted={highlightedFacts.includes('invoice')}
              />
              <FactCard
                id="amount"
                label="Amount"
                value={receiptDemo ? `${receiptDemo.invoice.amount} ${receiptDemo.invoice.currency}` : 'pending'}
                filled={Boolean(receiptDemo)}
                highlighted={highlightedFacts.includes('amount')}
              />
              <FactCard
                id="contract"
                label="Memo Contract"
                value={formatAddress(receiptDemo?.paymentRequest.memoContract)}
                filled={Boolean(receiptDemo)}
                highlighted={highlightedFacts.includes('contract')}
              />
              <FactCard
                id="memoId"
                label="Memo ID"
                value={formatAddress(receiptDemo?.paymentRequest.memoId)}
                filled={Boolean(receiptDemo)}
                highlighted={highlightedFacts.includes('memoId')}
              />
              <FactCard
                id="hash"
                label="Call Data Hash"
                value={formatAddress(receiptDemo?.paymentRequest.callDataHash)}
                filled={Boolean(receiptDemo)}
                highlighted={highlightedFacts.includes('hash')}
              />
            </div>
          </aside>
        </section>

        <section className="data-grid">
          <div className="panel">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Onchain Artifact</p>
                <h2 className="panel-title">Generated Receipt</h2>
              </div>
            </div>
            <JsonCode data={getReceiptPayload(receiptDemo)} />
          </div>

          <div className="panel">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Notification Hub</p>
                <h2 className="panel-title">Webhook Payload</h2>
              </div>
            </div>
            <JsonCode data={getWebhookPayload(receiptDemo)} />
          </div>
        </section>

        <section className="panel endpoint-panel">
          <div className="panel-header compact">
            <div>
              <p className="eyebrow">Developer Sandbox</p>
              <h2 className="panel-title">Paid API Route Probe</h2>
            </div>
          </div>

          <div className="endpoint-grid">
            {endpointCards.map((endpoint) => (
              <button
                className="btn-endpoint"
                key={endpoint.path}
                onClick={() => testEndpoint(endpoint.path)}
                disabled={endpointLoading !== null}
              >
                <span className="endpoint-details">
                  <span className="endpoint-uri">GET {endpoint.path}</span>
                  <span className="endpoint-desc">{endpoint.note}</span>
                </span>
                <span className="endpoint-price">
                  {endpointLoading === endpoint.path ? 'Testing...' : endpoint.price}
                </span>
              </button>
            ))}
          </div>

          {endpointResult ? (
            <div className="response-console">
              <div className="console-header">
                <div className="console-title">Sandbox HTTP Console</div>
                <div className={`console-status ${endpointResult.status === 200 ? 'status-200' : 'status-402'}`}>
                  {endpointResult.error
                    ? 'Request error'
                    : `HTTP ${endpointResult.status} ${endpointResult.statusText}`}
                  {endpointResult.timeMs ? ` - ${endpointResult.timeMs}ms` : ''}
                </div>
              </div>

              <div className="console-split">
                <div>
                  <div className="console-part-label">x-payment-requirements</div>
                  <JsonCode data={endpointResult.requirements ?? null} compact />
                </div>
                <div>
                  <div className="console-part-label">HTTP JSON Response</div>
                  <JsonCode
                    data={endpointResult.error ? { error: endpointResult.error } : endpointResult.data}
                    compact
                  />
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <style jsx>{`
        :global(body) {
          background: #0d0d0d;
          color: #f2f2f2;
        }

        .demo-shell {
          --bg-canvas: #0d0d0d;
          --bg-surface: #141414;
          --border-color: #262626;
          --text-main: #f2f2f2;
          --text-muted: #8a8a8a;
          --arc-navy: #1c2860;
          --arc-purple: #56237c;
          --arc-magenta: #ab2e67;
          --pale-red: #2a1215;
          --pale-red-text: #f28b82;
          --pale-blue: #121a2f;
          --pale-blue-text: #8ab4f8;
          --pale-green: #10241a;
          --pale-green-text: #81c995;
          --pale-yellow: #2b2311;
          --pale-yellow-text: #fde293;
          min-height: 100vh;
          padding: 48px 24px;
          background: var(--bg-canvas);
          color: var(--text-main);
          font-family: SF Pro Display, Geist Sans, Helvetica Neue, Arial, sans-serif;
          font-size: 15px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        .container {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 48px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border-color);
        }

        h1,
        h2,
        p {
          margin: 0;
        }

        h1 {
          color: var(--text-main);
          font-family: Newsreader, Playfair Display, Georgia, serif;
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 400;
          letter-spacing: 0;
          line-height: 1.1;
        }

        .header-tag {
          display: inline-flex;
          align-items: center;
          margin-left: 12px;
          padding: 3px 8px;
          border-radius: 4px;
          background: var(--pale-blue);
          color: var(--pale-blue-text);
          font-family: JetBrains Mono, Geist Mono, SFMono-Regular, Consolas, monospace;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0;
          vertical-align: middle;
        }

        .repo-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 18px;
          border-radius: 8px;
          background: var(--arc-magenta);
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .repo-link:hover {
          opacity: 0.86;
        }

        .dashboard-grid,
        .data-grid,
        .endpoint-grid,
        .console-split {
          display: grid;
          gap: 24px;
        }

        .dashboard-grid {
          grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
          margin-bottom: 24px;
        }

        .data-grid,
        .endpoint-grid,
        .console-split {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-bottom: 24px;
        }

        .panel {
          min-width: 0;
          padding: 32px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-surface);
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 32px;
        }

        .panel-header.compact {
          margin-bottom: 24px;
        }

        .eyebrow {
          margin-bottom: 8px;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .panel-title {
          color: var(--text-main);
          font-family: Newsreader, Playfair Display, Georgia, serif;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: 0;
          line-height: 1.2;
        }

        .btn-flow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          padding: 0 16px;
          border: 1px solid rgba(138, 180, 248, 0.42);
          border-radius: 8px;
          background: var(--pale-blue);
          color: var(--pale-blue-text);
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
          white-space: nowrap;
        }

        .btn-flow:hover:not(:disabled) {
          border-color: var(--pale-blue-text);
          background: #162346;
          transform: translateY(-1px);
        }

        .btn-flow:disabled,
        .btn-endpoint:disabled {
          cursor: wait;
          opacity: 0.68;
        }

        .pipeline-container,
        .json-wrapper,
        .response-console,
        .console-json {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-canvas);
        }

        .pipeline-container {
          padding: 24px;
          overflow-x: auto;
        }

        .terminal-header,
        .console-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .terminal-header {
          margin-bottom: 24px;
        }

        .terminal-cmd,
        .terminal-status,
        .flow-block-num,
        .fact-label,
        .fact-value,
        .json-code,
        .endpoint-uri,
        .endpoint-price,
        .console-status,
        .console-part-label {
          font-family: JetBrains Mono, Geist Mono, SFMono-Regular, Consolas, monospace;
        }

        .terminal-cmd {
          color: var(--text-main);
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .terminal-cmd span {
          color: var(--text-muted);
        }

        .terminal-status {
          flex: 0 0 auto;
          padding: 3px 10px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-surface);
          color: var(--text-muted);
          font-size: 12px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .terminal-status.status-active {
          border-color: transparent;
          background: var(--pale-blue);
          color: var(--pale-blue-text);
        }

        .flow-diagram {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          align-items: stretch;
        }

        .flow-piece {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 12px;
          min-width: 0;
          align-items: center;
        }

        .flow-piece:first-child {
          grid-template-columns: minmax(0, 1fr);
        }

        .flow-connector {
          color: var(--text-muted);
          opacity: 0.5;
          font-size: 14px;
        }

        .flow-block {
          display: flex;
          min-width: 0;
          min-height: 116px;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 16px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-surface);
          color: var(--text-main);
          cursor: pointer;
          text-align: left;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .flow-block.active {
          border-color: var(--arc-purple);
          background: var(--pale-blue);
        }

        .flow-block.success {
          border-color: rgba(129, 201, 149, 0.75);
          background: var(--pale-green);
        }

        .flow-block-num {
          margin-bottom: 7px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .flow-block.success .flow-block-num,
        .timeline-item.success .timeline-index {
          color: var(--pale-green-text);
        }

        .flow-block-title {
          max-width: 100%;
          margin-bottom: 4px;
          color: var(--text-main);
          font-size: 14px;
          font-weight: 500;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        .flow-block-status {
          color: var(--text-muted);
          font-size: 12px;
        }

        .flow-block.success .flow-block-status {
          color: var(--pale-green-text);
        }

        .terminal-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 24px 0 0;
          padding: 24px 0 0;
          border-top: 1px solid var(--border-color);
          list-style: none;
        }

        .timeline-item {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr);
          gap: 16px;
          align-items: start;
          opacity: 0.52;
          transition: opacity 0.2s ease;
        }

        .timeline-item.active {
          opacity: 1;
        }

        .timeline-index {
          padding: 1px 0;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-surface);
          color: var(--text-muted);
          font-size: 12px;
          text-align: center;
        }

        .timeline-item.success .timeline-index {
          border-color: transparent;
          background: var(--pale-green);
        }

        .timeline-content strong {
          display: block;
          margin-bottom: 3px;
          color: var(--text-main);
          font-size: 14px;
          font-weight: 500;
          overflow-wrap: anywhere;
        }

        .timeline-content p {
          color: var(--text-muted);
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .facts-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fact-card {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 13px 0;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s ease, border-color 0.2s ease, padding 0.2s ease;
        }

        .fact-card:last-child {
          border-bottom: 0;
        }

        .fact-card.filled {
          padding: 13px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: var(--bg-canvas);
        }

        .fact-card.highlighted {
          border-color: rgba(138, 180, 248, 0.32);
          background: var(--pale-blue);
        }

        .fact-label {
          color: var(--text-muted);
          font-size: 11px;
          text-transform: uppercase;
        }

        .fact-value {
          color: var(--text-main);
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .json-wrapper {
          height: 210px;
          padding: 24px;
          overflow: auto;
        }

        .json-wrapper.compact {
          height: 150px;
          padding: 16px;
          background: var(--bg-surface);
        }

        .json-code {
          margin: 0;
          color: var(--text-main);
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        :global(.fact-card) {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 13px 0;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s ease, border-color 0.2s ease, padding 0.2s ease;
        }

        :global(.fact-card:last-child) {
          border-bottom: 0;
        }

        :global(.fact-card.filled) {
          padding: 13px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: var(--bg-canvas);
        }

        :global(.fact-card.highlighted) {
          border-color: rgba(138, 180, 248, 0.32);
          background: var(--pale-blue);
        }

        :global(.fact-label) {
          color: var(--text-muted);
          font-family: JetBrains Mono, Geist Mono, SFMono-Regular, Consolas, monospace;
          font-size: 11px;
          text-transform: uppercase;
        }

        :global(.fact-value) {
          color: var(--text-main);
          font-family: JetBrains Mono, Geist Mono, SFMono-Regular, Consolas, monospace;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        :global(.json-wrapper) {
          height: 210px;
          padding: 24px;
          overflow: auto;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-canvas);
        }

        :global(.json-wrapper.compact) {
          height: 150px;
          padding: 16px;
          background: var(--bg-surface);
        }

        :global(.json-code) {
          margin: 0;
          color: var(--text-main);
          font-family: JetBrains Mono, Geist Mono, SFMono-Regular, Consolas, monospace;
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        :global(.json-key) {
          color: #a7b6ff;
        }

        :global(.json-string) {
          color: #d4a1f0;
        }

        :global(.json-number) {
          color: #f08eb9;
        }

        :global(.json-boolean) {
          color: var(--pale-blue-text);
        }

        :global(.json-null) {
          color: var(--pale-red-text);
        }

        .endpoint-panel {
          margin-bottom: 0;
        }

        .btn-endpoint {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-width: 0;
          min-height: 92px;
          padding: 20px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-surface);
          color: var(--text-main);
          cursor: pointer;
          text-align: left;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .btn-endpoint:hover:not(:disabled) {
          border-color: #353535;
          background: var(--bg-canvas);
        }

        .endpoint-details {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 5px;
        }

        .endpoint-uri {
          max-width: 100%;
          overflow: hidden;
          color: var(--text-main);
          font-size: 13px;
          font-weight: 500;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .endpoint-desc {
          color: var(--text-muted);
          font-size: 13px;
        }

        .endpoint-price {
          flex: 0 0 auto;
          padding: 3px 8px;
          border-radius: 4px;
          background: var(--pale-red);
          color: var(--pale-red-text);
          font-size: 12px;
          white-space: nowrap;
        }

        .response-console {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
          overflow-x: auto;
        }

        .console-header {
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .console-title {
          color: var(--text-main);
          font-size: 14px;
          font-weight: 500;
        }

        .console-status {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
        }

        .status-402 {
          background: var(--pale-yellow);
          color: var(--pale-yellow-text);
        }

        .status-200 {
          background: var(--pale-green);
          color: var(--pale-green-text);
        }

        .console-split {
          margin-bottom: 0;
          gap: 16px;
        }

        .console-part-label {
          margin-bottom: 8px;
          color: var(--text-muted);
          font-size: 11px;
          text-transform: uppercase;
        }

        @media (max-width: 991px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .flow-diagram {
            grid-template-columns: 1fr;
          }

          .flow-piece,
          .flow-piece:first-child {
            grid-template-columns: 1fr;
          }

          .flow-connector {
            display: none;
          }
        }

        @media (max-width: 767px) {
          .demo-shell {
            padding: 32px 18px;
          }

          .header {
            margin-bottom: 32px;
          }

          .data-grid,
          .endpoint-grid,
          .console-split {
            grid-template-columns: 1fr;
          }

          .panel {
            padding: 22px;
          }

          .panel-header,
          .terminal-header,
          .console-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .btn-flow,
          .btn-endpoint,
          .terminal-status,
          .console-status {
            width: 100%;
          }

          .btn-endpoint {
            align-items: flex-start;
            flex-direction: column;
          }

          .json-wrapper {
            height: auto;
            max-height: 260px;
          }
        }
      `}</style>
    </main>
  );
}

function FactCard({
  label,
  value,
  filled,
  highlighted,
}: {
  id: string;
  label: string;
  value: string;
  filled: boolean;
  highlighted: boolean;
}) {
  return (
    <div className={`fact-card ${filled ? 'filled' : ''} ${highlighted ? 'highlighted' : ''}`}>
      <span className="fact-label">{label}</span>
      <span className="fact-value">{value}</span>
    </div>
  );
}

function JsonCode({ data, compact = false }: { data: unknown; compact?: boolean }) {
  return (
    <div className={`json-wrapper ${compact ? 'compact' : ''}`}>
      <pre className="json-code" dangerouslySetInnerHTML={{ __html: syntaxHighlight(data) }} />
    </div>
  );
}

function getReceiptPayload(data: ReceiptDemo | null) {
  if (!data) {
    return { status: 'pending' };
  }

  return {
    id: data.receipt.id,
    status: data.receipt.status,
    txHash: data.receipt.txHash,
    payer: data.receipt.payer,
    memo: data.receipt.memo,
  };
}

function getWebhookPayload(data: ReceiptDemo | null) {
  if (!data) {
    return { status: 'pending' };
  }

  return {
    eventId: data.webhook.eventId,
    type: data.webhook.type,
    target: data.webhook.target,
    signature: data.webhook.signatureHeader,
  };
}

function syntaxHighlight(data: unknown) {
  const json = escapeHtml(JSON.stringify(data, null, 2));

  return json.replace(
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let className = 'json-number';

      if (match.startsWith('"')) {
        className = match.endsWith(':') ? 'json-key' : 'json-string';
      } else if (match === 'true' || match === 'false') {
        className = 'json-boolean';
      } else if (match === 'null') {
        className = 'json-null';
      }

      return `<span class="${className}">${match}</span>`;
    },
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatAddress(value?: string, start = 10, end = 8) {
  if (!value) {
    return 'pending';
  }

  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
