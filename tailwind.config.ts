import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Roboto','Lato','system-ui','sans-serif'] },
      screens: { sm:'360px', md:'768px', lg:'1024px', xl:'1280px' },
      colors: {
        primary: {
          300: 'var(--clr-primary-300)',
          600: 'var(--clr-primary-600)',
          700: 'var(--clr-primary-700)'
        },
        text: {
          DEFAULT: 'var(--clr-text)',
          muted: 'var(--clr-text-muted)'
        },
        border: 'var(--clr-border)'
      },
      borderRadius: {
        card: 'var(--radius-card)',
        modal: 'var(--radius-modal)',
        button: 'var(--radius-button)'
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)'
      }
    }
  }
}
export default config
