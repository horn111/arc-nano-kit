'use client';

import { useState } from 'react';

export default function HomePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (url: string) => {
    setLoading(true);
    setResult(null);
    try {
      const startTime = Date.now();
      const res = await fetch(url);
      const data = await res.json();
      const endTime = Date.now();

      const paymentRequired = res.headers.get('x-payment-required');
      let requirements = null;
      if (paymentRequired) {
        try {
          requirements = JSON.parse(atob(paymentRequired));
        } catch (e) {}
      }

      setResult({
        status: res.status,
        statusText: res.statusText,
        timeMs: endTime - startTime,
        data,
        requirements,
      });
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '60px 24px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15))',
            border: '1px solid rgba(99,102,241,0.3)',
            fontSize: '13px',
            fontWeight: 500,
            color: '#818cf8',
            marginBottom: '24px',
          }}
        >
          🔬 Arc Testnet · Live Demo
        </div>

        <h1
          style={{
            fontSize: '48px',
            fontWeight: 800,
            lineHeight: 1.1,
            margin: '0 0 16px',
            background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          arc-nano-kit
        </h1>

        <p
          style={{
            fontSize: '20px',
            color: '#a1a1aa',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}
        >
          Usage-based billing and paid APIs on Arc.{' '}
          <span style={{ color: '#818cf8' }}>Powered by Circle Nanopayments.</span>
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a
            href="https://github.com/horn111/arc-nano-kit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '15px',
            }}
          >
            ★ GitHub
          </a>
        </div>
      </div>

      {/* Endpoints Section */}
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '24px',
          color: '#e4e4e7',
        }}
      >
        Paywalled Endpoints (Try it out!)
      </h2>

      <div style={{ display: 'grid', gap: '16px' }}>
        {/* Joke Endpoint */}
        <div
          style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(99,102,241,0.2)',
            background: 'rgba(15,15,25,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <code style={{ fontSize: '15px', color: '#c7d2fe', display: 'block', marginBottom: '8px' }}>GET /api/joke</code>
              <p style={{ margin: 0, color: '#71717a', fontSize: '14px' }}>
                Get a random developer joke. Demonstrates per-request billing.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(34,197,94,0.15)',
                  color: '#4ade80',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                $0.001 USDC
              </span>
              <button
                onClick={() => testEndpoint('/api/joke')}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Test Endpoint
              </button>
            </div>
          </div>
        </div>

        {/* Weather Endpoint */}
        <div
          style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(99,102,241,0.2)',
            background: 'rgba(15,15,25,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <code style={{ fontSize: '15px', color: '#c7d2fe', display: 'block', marginBottom: '8px' }}>GET /api/weather?city=NYC</code>
              <p style={{ margin: 0, color: '#71717a', fontSize: '14px' }}>
                Get weather data for a city. Demonstrates higher-value per-request billing.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(34,197,94,0.15)',
                  color: '#4ade80',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                $0.005 USDC
              </span>
              <button
                onClick={() => testEndpoint('/api/weather?city=NYC')}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Test Endpoint
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Console */}
      {result && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#e4e4e7', marginBottom: '12px' }}>Response Console</h3>
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#09090b',
              border: `1px solid ${result.status === 402 ? 'rgba(234,179,8,0.5)' : 'rgba(99,102,241,0.3)'}`,
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: result.status === 402 ? '#eab308' : '#4ade80', fontWeight: 'bold' }}>
                HTTP {result.status} {result.statusText}
              </span>
              <span style={{ color: '#71717a' }}>{result.timeMs}ms</span>
            </div>
            
            {result.requirements && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#a1a1aa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  // Parsed X-Payment-Required header
                </span>
                <pre style={{ margin: 0, color: '#c7d2fe', fontSize: '13px' }}>
                  {JSON.stringify(result.requirements, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <span style={{ color: '#a1a1aa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                // Response Body
              </span>
              <pre style={{ margin: 0, color: '#e4e4e7', fontSize: '13px' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
          
          {result.status === 402 && (
            <p style={{ fontSize: '14px', color: '#a1a1aa', marginTop: '16px', padding: '12px', background: 'rgba(234,179,8,0.1)', borderRadius: '8px', border: '1px solid rgba(234,179,8,0.2)' }}>
              ⚠️ <strong>Payment Required:</strong> The server successfully blocked the request. To view the data, your client needs to sign the authorization payload using our Buyer SDK.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
