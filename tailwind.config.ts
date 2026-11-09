import type { Config } from 'tailwindcss'
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { navy: '#0B2545', green: { 600: '#2E8B57', 50: '#EEF7F1' } } } }, plugins: [] } satisfies Config
