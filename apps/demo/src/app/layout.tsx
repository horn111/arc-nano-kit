import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'arc-nano-kit Demo — Paid APIs on Arc',
  description:
    'Interactive demo of usage-based billing and paywalled API endpoints powered by Circle Nanopayments on Arc.',
  openGraph: {
    title: 'arc-nano-kit Demo',
    description: 'Usage-based billing for APIs on Arc',
    url: 'https://arc-nano-kit.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: 'Inter, -apple-system, sans-serif',
          backgroundColor: '#0a0a0f',
          color: '#e4e4e7',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
