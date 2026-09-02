import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1e',
        surface: '#111827',
        surface2: '#1a2235',
        border: {
          DEFAULT: '#1e3a5f',
          strong: '#2d5a8e',
        },
        text: {
          DEFAULT: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#475569',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#60a5fa',
          subtle: '#1e3a5f',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: {
          DEFAULT: '#ef4444',
          subtle: '#450a0a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        glow: '0 0 0 1px #3b82f6',
      },
      fontSize: {
        base: ['14px', '1.6'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
