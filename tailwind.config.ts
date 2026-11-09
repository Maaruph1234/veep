import type { Config } from 'tailwindcss'
// APC palette: deep green (navy slot), APC green, APC red.
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: {
    navy: '#05341D',
    apcred: '#E31B23',
    green: { 50: '#EAF6EE', 100: '#D3EDDB', 600: '#00873E', 700: '#006B31' },
  } } }, plugins: [] } satisfies Config
