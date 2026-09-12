import './globals.css';

export const metadata = {
  title: 'GOV.AX — Live AI Audit Playground',
  description:
    'Real-time AI model compliance auditing against India\'s DPDP Act 2023 and PSA Techno-Legal AI Governance Framework 2024. Open-source, fully client-side, zero data retention.',
  keywords: [
    'AI governance',
    'DPDP Act',
    'PSA framework',
    'compliance',
    'Hugging Face',
    'audit',
    'open source',
  ],
  openGraph: {
    title: 'GOV.AX — Live AI Audit Playground',
    description:
      'Audit any Hugging Face AI model against sovereign data privacy frameworks in real-time.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        {/* Preload monospace font for cyberpunk aesthetic */}
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
      <body className="min-h-screen bg-[#0B0F19] text-gray-100">
        {/* ━━ Navigation Bar ━━ */}
        <nav className="border-b border-[#1E293B] bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label="scales">
                  ⚖️
                </span>
                <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  <span className="text-emerald-400">GOV</span>
                  <span className="text-gray-600">.</span>
                  <span className="text-gray-100">AX</span>
                </span>
                <span className="hidden sm:inline-flex text-[10px] text-gray-600 border border-[#1E293B] px-2 py-0.5 rounded-full font-mono">
                  v1.0.0
                </span>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-5">
                <a
                  href="https://github.com/YOUR_USERNAME/live-ai-audit-playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="hidden sm:inline">Source</span>
                </a>
                <a
                  href="https://www.psa.gov.in/psa-prod/publication/PSA-AI-Guidelines-2024.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1.5"
                >
                  <span aria-hidden="true">📄</span>
                  <span className="hidden sm:inline">PSA Framework</span>
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* ━━ Main Content ━━ */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {children}
        </main>

        {/* ━━ Footer ━━ */}
        <footer className="border-t border-[#1E293B] py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
            <p className="text-xs text-gray-600 font-mono">
              ⚖️ GOV.AX — Open-Source AI Governance Tooling
            </p>
            <p className="text-[10px] text-gray-700">
              Zero Data Retention · Fully Client-Side · Rules based on India
              DPDP Act 2023 &amp; PSA Techno-Legal AI Framework 2024
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
