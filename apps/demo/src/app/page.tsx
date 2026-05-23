export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '60px 24px',
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
          <a
            href="https://github.com/horn111/arc-nano-kit/tree/main/docs/getting-started.md"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '10px',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#c7d2fe',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '15px',
              background: 'transparent',
            }}
          >
            Get Started →
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
        Paywalled Endpoints
      </h2>

      <div style={{ display: 'grid', gap: '16px' }}>
        {/* Joke Endpoint */}
        <div
          style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(99,102,241,0.2)',
            background: 'rgba(15,15,25,0.8)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <code style={{ fontSize: '15px', color: '#c7d2fe' }}>GET /api/joke</code>
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
          </div>
          <p style={{ margin: 0, color: '#71717a', fontSize: '14px' }}>
            Get a random developer joke. Demonstrates per-request billing.
          </p>
        </div>

        {/* Weather Endpoint */}
        <div
          style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(99,102,241,0.2)',
            background: 'rgba(15,15,25,0.8)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <code style={{ fontSize: '15px', color: '#c7d2fe' }}>GET /api/weather?city=NYC</code>
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
          </div>
          <p style={{ margin: 0, color: '#71717a', fontSize: '14px' }}>
            Get weather data for a city. Demonstrates higher-value per-request billing.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 700,
          margin: '48px 0 24px',
          color: '#e4e4e7',
        }}
      >
        How It Works
      </h2>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {[
          { step: '1', title: 'Request', desc: 'Client calls a protected API endpoint' },
          { step: '2', title: '402 Response', desc: 'Server returns payment requirements' },
          { step: '3', title: 'Sign & Pay', desc: 'Client signs EIP-3009 authorization' },
          { step: '4', title: 'Access', desc: 'Server verifies and returns data' },
        ].map((item) => (
          <div
            key={item.step}
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(99,102,241,0.15)',
              background: 'rgba(15,15,25,0.6)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {item.step}
            </div>
            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>{item.title}</div>
            <div style={{ color: '#71717a', fontSize: '13px' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: '80px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(99,102,241,0.15)',
          textAlign: 'center',
          color: '#52525b',
          fontSize: '13px',
        }}
      >
        <p>Built on Arc · Powered by Circle Nanopayments · x402 Protocol</p>
        <p style={{ marginTop: '8px' }}>
          <a href="https://github.com/horn111/arc-nano-kit" style={{ color: '#6366f1', textDecoration: 'none' }}>
            GitHub
          </a>
          {' · '}
          <a href="https://arc.network" style={{ color: '#6366f1', textDecoration: 'none' }}>
            Arc Network
          </a>
          {' · '}
          <a href="https://x402.org" style={{ color: '#6366f1', textDecoration: 'none' }}>
            x402.org
          </a>
        </p>
      </footer>
    </main>
  );
}
