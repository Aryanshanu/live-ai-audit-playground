import './globals.css';

export const metadata = {
  title: 'GOV.AX — India AI Audit Sandbox v2',
  description:
    'Frictionless client-side AI architecture compliance sandbox scanning raw technical descriptions against India\'s DPDP Act 2023 & IndiaAI 8 Foundational Principles.',
  keywords: [
    'AI governance',
    'DPDP Act',
    'IndiaAI',
    'PSA framework',
    'compliance sandbox',
    'audit engine',
    'open source',
  ],
  openGraph: {
    title: 'GOV.AX — India AI Audit Sandbox v2',
    description:
      'Real-time client-side technical architecture compliance auditing.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0B0F19] text-slate-100">
        {children}
      </body>
    </html>
  );
}
