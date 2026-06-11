import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        ring: 'var(--ring)',
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        'primary-dark': 'var(--primary-dark)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      boxShadow: {
        'primary/5': '0 2px 20px rgba(183, 121, 31, 0.05)',
        'primary/20': '0 0 0 1px rgba(183, 121, 31, 0.2)',
        'primary/25': '0 20px 50px rgba(183, 121, 31, 0.20)',
        'primary/30': '0 24px 60px rgba(183, 121, 31, 0.24)',
      },
    },
  },
};

export default config;
