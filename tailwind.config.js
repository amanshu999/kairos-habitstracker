/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        term: {
          bg: 'var(--term-bg)',
          surface: 'var(--term-surface)',
          elevated: 'var(--term-elevated)',
          hover: 'var(--term-hover)',
          border: 'var(--term-border)',
          'border-strong': 'var(--term-border-strong)',
          text: 'var(--term-text)',
          'text-muted': 'var(--term-text-muted)',
          'text-dim': 'var(--term-text-dim)',
          accent: 'var(--term-accent)',
          'accent-dim': 'var(--term-accent-dim)',
          'accent-glow': 'var(--term-accent-glow)',
          cyan: 'var(--term-cyan)',
          amber: 'var(--term-amber)',
          red: 'var(--term-red)',
          purple: 'var(--term-purple)',
        }
      },
      animation: {
        'cursor-blink': 'blink 1s step-start infinite',
        'fade-in': 'fadeIn 0.15s ease-out forwards',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
