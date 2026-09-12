/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'var(--bg-primary)',
          surface: 'var(--bg-surface)',
          card: 'var(--bg-surface)',
          'card-alt': 'var(--bg-surface-alt)',
          sidebar: 'var(--bg-sidebar)',
          border: 'var(--border)',
          accent: 'var(--accent)',
          'accent-dark': 'var(--accent-dark)',
          'accent-bg': 'var(--accent-bg)',
          text: 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
          500: 'var(--accent)',
          600: 'var(--accent-dark)',
        },
        status: {
          agendado: 'var(--status-agendado-text)',
          'agendado-bg': 'var(--status-agendado-bg)',
          em_atendimento: 'var(--status-em-atendimento-text)',
          'em_atendimento-bg': 'var(--status-em-atendimento-bg)',
          concluido: 'var(--status-concluido-text)',
          'concluido-bg': 'var(--status-concluido-bg)',
          cancelado: 'var(--status-cancelado-text)',
          'cancelado-bg': 'var(--status-cancelado-bg)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        oswald: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        anton: ['Anton', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': 'var(--shadow-card)',
        'card': 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
}
