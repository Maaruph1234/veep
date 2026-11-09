import './globals.css'
export const metadata = { title: 'VEEP 2027', description: 'APC Voter Engagement & Vote Protection Project, Kebbi State' }
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body>{children}</body></html>)
}
