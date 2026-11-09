'use client'
export const APP = 'APC VOTER ENGAGEMENT & VOTE PROTECTION PROJECT (VEEP 2027)'
export function Header({ who, logoutUrl = '/' }: { who?: string; logoutUrl?: string }) {
  return (
    <header className="bg-navy text-white border-b-4 border-green-600">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="text-xs font-semibold leading-tight tracking-wide sm:text-sm">{APP}</div>
        {who && (
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <span className="hidden sm:inline">{who}</span>
            <button className="rounded border border-white/40 px-3 py-1 hover:bg-white/10"
              onClick={async () => { await fetch('/api/logout', { method: 'POST' }); location.href = logoutUrl }}>Log out</button>
          </div>
        )}
      </div>
    </header>
  )
}
export function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 py-5 text-center text-xs text-slate-500">
      Powered by <span className="font-semibold text-navy">DIRECTORATE FOR ELECTION PLANNING &amp; MONITORING (EPM) KEBBI STATE</span>
      <div className="mt-1"><a className="underline" href="/privacy">Privacy notice</a></div>
    </footer>
  )
}
