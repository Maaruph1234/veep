'use client'
export const APP = 'APC VOTER ENGAGEMENT & VOTE PROTECTION PROJECT (VEEP 2027)'
export function Logo() {
  // Put the APC logo at public/apc-logo.png. If it is missing, the badge below shows instead.
  return (
    <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-600 text-xs font-black text-white ring-2 ring-apcred/80">
      <span>APC</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/apc-logo.png" alt="" className="absolute inset-0 h-full w-full bg-white object-contain" onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />
    </span>
  )
}
export function Header({ who, logoutUrl = '/', dark = false }: { who?: string; logoutUrl?: string; dark?: boolean }) {
  return (
    <header className={dark ? 'text-white' : 'border-b border-slate-200 bg-white/90 backdrop-blur'}>
      <div className="h-1.5 w-full bg-gradient-to-r from-green-600 via-white to-apcred" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <div className={`text-[11px] font-extrabold leading-tight tracking-wide sm:text-sm ${dark ? 'text-white' : 'text-navy'}`}>{APP}</div>
        </div>
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
    <footer className={`mt-10 py-6 text-center text-xs ${dark ? 'text-white/70' : 'border-t border-slate-200 text-slate-500'}`}>
      Powered by <span className={`font-bold ${dark ? 'text-white' : 'text-navy'}`}>DIRECTORATE FOR ELECTION PLANNING &amp; MONITORING (EPM) KEBBI STATE</span>
      <div className="mt-1"><a className="underline" href="/privacy">Privacy notice</a></div>
    </footer>
  )
}
