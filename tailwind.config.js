/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Facebook-inspired blue & white palette. Named `fb.*` rather than
        // reusing Tailwind's default blue scale so every usage in the
        // codebase is intentional and searchable, not an accidental
        // Tailwind default that happens to look similar.
        // Driven by CSS variables (see globals.css) so a single `.dark`
        // class on <html> re-themes the entire app. Previously these were
        // hardcoded hex, which made dark mode impossible without rewriting
        // every component.
        fb: {
          blue: 'var(--fb-blue)',
          blueHover: 'var(--fb-blue-hover)',
          blueDark: 'var(--fb-blue-dark)',
          blueLight: 'var(--fb-blue-light)',
          bg: 'var(--fb-bg)',
          card: 'var(--fb-card)',
          border: 'var(--fb-border)',
          divider: 'var(--fb-divider)',
          text: 'var(--fb-text)',
          textSecondary: 'var(--fb-text-secondary)',
          green: 'var(--fb-green)',
          red: 'var(--fb-red)',
          amber: 'var(--fb-amber)',
        },
      },
      fontFamily: {
        // Facebook's actual system font stack — deliberately NOT monospace
        // as the default anymore. Monospace is now opt-in (font-mono) for
        // genuinely code-like content (YAML/JSON exports, rule IDs).
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // Facebook-style soft elevation instead of the old neon glows
        fbCard: '0 1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        fbCardHover: '0 2px 4px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'gauge-fill': 'gauge-fill 0.8s ease-out forwards',
        'skeleton-pulse': 'skeleton-pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        'gauge-fill': {
          from: { 'stroke-dashoffset': '503' },
        },
        'skeleton-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.9' },
        },
      },
    },
  },
  plugins: [],
};
