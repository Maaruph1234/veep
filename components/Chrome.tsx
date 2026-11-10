'use client'
import { usePathname } from 'next/navigation'
export const APP = 'APC VOTER ENGAGEMENT & VOTE PROTECTION PROJECT (VEEP 2027)'
export function Logo({ className = 'h-12' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/apc-logo.png" alt="APC" className={`${className} w-auto shrink-0 rounded-md bg-white object-contain p-0.5`} />
  )
}
export function Tagline() {
  const base = 'tile block w-full rounded-3xl px-5 py-5 text-center text-[2rem] font-black leading-[1.05] tracking-tight shadow-xl sm:py-6 sm:text-5xl'
  const d = (s: number, f: number) => ({ animationDelay: `${s}s, ${f}s` })
  return (
    <div className="space-y-3">
      <span style={d(0.1, 0.8)} className={`${base} bg-[#2da64e] text-white`}>Every Vote Matters.</span>
      <span style={d(0.35, 1.3)} className={`${base} bg-[#e31b23] text-white`}>Every Vote Counts.</span>
      <span style={d(0.6, 1.8)} className={`${base} bg-[#51c2e7] text-[#05341D]`}>Every Vote Must Be Protected.</span>
      <div className="mx-auto mt-5 h-1.5 w-24 rounded-full bg-[#2da64e]" />
      <p className="px-1 pt-2 text-center text-base leading-7 text-slate-700 sm:text-lg">
        The secure workspace for APC VOTER ENGAGEMENT &amp; VOTE PROTECTION PROJECT (VEEP 2027).
      </p>
    </div>
  )
}
function PillNav() {
  const path = usePathname()
  const link = (href: string, label: string, on: boolean) => (
    <a href={href} className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:text-sm ${on ? 'bg-[#2da64e] text-white' : 'text-[#05341D]'}`}>{label}</a>
  )
  return (
    <nav className="flex shrink-0 items-center gap-1 rounded-full bg-white p-1 ring-1 ring-[#2da64e]/40 shadow">
      {link('/', 'Sponsor', path === '/')}
      {link('/admin/login', 'Admin', path === '/admin/login')}
    </nav>
  )
}
export function Header({ who, logoutUrl = '/', dark = false }: { who?: string; logoutUrl?: string; dark?: boolean }) {
  return (
    <header className={dark ? 'text-[#05341D]' : 'border-b border-slate-200 bg-white/90 backdrop-blur'}>
      <div className="h-1.5 w-full bg-gradient-to-r from-green-600 via-white to-apcred" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <div className={`${dark ? "hidden sm:block" : ""} text-[11px] font-extrabold leading-tight tracking-wide sm:text-sm text-navy`}>{APP}</div>
        </div>
        {dark && !who && <PillNav />}
        {who && (
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <span className="hidden rounded-full bg-green-50 px-4 py-2 font-semibold text-navy sm:inline">{who}</span>
            <button className="btn-green"
              onClick={async () => { await fetch('/api/logout', { method: 'POST' }); location.href = logoutUrl }}>Log out</button>
          </div>
        )}
      </div>
    </header>
  )
}
export function Footer({ dark = false }: { dark?: boolean }) {
  return (
    <footer className={`mt-10 py-6 text-center text-xs ${dark ? 'text-slate-600' : 'border-t border-slate-200 text-slate-500'}`}>
      <div className="mb-3 flex justify-center"><Logo className="h-10" /></div>
      Powered by <span className={`font-bold text-navy`}>DIRECTORATE FOR ELECTION PLANNING &amp; MONITORING (EPM) KEBBI STATE</span>
      <div className="mt-1"><a className="underline" href="/privacy">Privacy notice</a></div>
    </footer>
  )
}
