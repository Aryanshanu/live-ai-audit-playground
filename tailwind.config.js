/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Facebook-inspired blue & white palette. Named `fb.*` rather than
        // reusing Tailwind's default blue scale so every usage in the
        // codebase is intentional and searchable, not an accidental
        // Tailwind default that happens to look similar.
        fb: {
          blue: '#1877F2',       // primary action color (Like/Share buttons, links)
          blueHover: '#166FE5',
          blueDark: '#0C63D4',
          blueLight: '#E7F3FF',  // light blue hover/selected backgrounds
          bg: '#F0F2F5',         // page background (Facebook's classic light gray)
          card: '#FFFFFF',
          border: '#DADDE1',
          divider: '#CED0D4',
          text: '#050505',       // primary text, near-black not pure black
          textSecondary: '#65676B',
          green: '#31A24C',      // Facebook's positive/success green
          red: '#FA383E',        // Facebook's destructive/error red
          amber: '#F7B928',
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
