import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'arc-nano-kit Demo - Arc Receipts',
  description:
    'Interactive demo of Arc Receipts, memo payment requests, signed webhooks, and paid API endpoints.',
  openGraph: {
    title: 'arc-nano-kit Demo - Arc Receipts',
    description: 'Arc Receipts and paid API operations on Arc',
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
          backgroundColor: '#07090f',
          color: '#e7edf7',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
