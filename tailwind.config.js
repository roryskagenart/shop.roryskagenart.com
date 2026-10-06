const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      /*
       * Skagen Light / Dark palette — synced from live design panel.
       * CSS vars so dark-mode class and future palette overrides
       * propagate to every brand-* utility automatically.
       */
      colors: {
        brand: {
          bg: 'var(--brand-bg)',
          'bg-card': 'var(--brand-bg-card)',
          surface: 'var(--brand-surface)',
          'surface-deep': 'var(--brand-surface-deep)',
          fg: 'var(--brand-fg)',
          'fg-muted': 'var(--brand-fg-muted)',
          border: 'var(--brand-border)',
          line: 'var(--brand-border)',
          'line-strong': 'var(--brand-line-strong)',
          accent: 'var(--brand-accent)',
          'accent-fg': 'var(--brand-accent-fg)',
          ring: 'var(--brand-ring)',
          destructive: 'var(--brand-destructive)',
          'nav-bg': 'var(--brand-nav-bg)'
        },
        /* Map standard semantic names to brand tokens so existing
           bg-primary/text-primary-foreground/etc. work without changes. */
        primary: {
          DEFAULT: 'var(--brand-fg)',
          foreground: 'var(--brand-bg)'
        },
        /* Neutral scale — kept for existing hardcoded refs (gradual migration) */
        neutral: {
          50: '#f0f2f5',
          100: '#e2e6ec',
          200: '#c2c9d1',
          300: '#9aa3ae',
          400: '#7a8696',
          500: '#5f6875',
          600: '#4a5565',
          700: '#3a4454',
          800: '#2f3a47',
          900: '#1c2836',
          950: '#10181f'
        }
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'var(--font-geist-sans)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        display: [
          'Plus Jakarta Sans',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        blink: {
          '0%': { opacity: 0.2 },
          '20%': { opacity: 1 },
          '100%': { opacity: 0.2 }
        }
      },
      animation: {
        fadeIn: 'fadeIn  .3s ease-in-out',
        carousel: 'marquee 60s linear infinite',
        blink: 'blink 1.4s both infinite'
      }
    }
  },
  future: {
    hoverOnlyWhenSupported: true
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography'),
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'animation-delay': (value) => {
            return {
              'animation-delay': value
            };
          }
        },
        {
          values: theme('transitionDelay')
        }
      );
    })
  ]
};
