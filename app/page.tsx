'use client'
import { useState } from 'react'
import { Header, Footer } from '@/components/Chrome'
export default function Login() {
  const [token, setToken] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('')
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
    if (r.ok) location.href = '/dashboard'; else { setErr('Invalid or expired access token'); setBusy(false) }
  }
  return (
    <div className="hero-bg flex min-h-screen flex-col">
      <Header dark />
      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-4 py-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div><span className="block-dark text-4xl font-black tracking-tight sm:text-6xl">Engage.</span></div>
          <div><span className="block-red text-4xl font-black tracking-tight sm:text-6xl">Protect.</span></div>
          <div><span className="block-dark text-4xl font-black tracking-tight sm:text-6xl">Deliver.</span></div>
          <p className="max-w-lg pt-4 text-base leading-7 text-white/80">
            The secure workspace for APC sponsors in Kebbi State to record and manage their own voter engagement data. Each sponsor sees only their own records.
          </p>
        </div>
        <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4 rounded-3xl border border-white/20 bg-white p-7 shadow-2xl">
          <h1 className="text-2xl font-extrabold text-navy">Sponsor login</h1>
          <p className="text-sm text-slate-600">Enter the access token given to you by the Directorate.</p>
          <input className="input" type="password" autoComplete="off" placeholder="Access token" value={token} onChange={e => setToken(e.target.value)} required />
          {err && <p className="text-sm font-medium text-apcred">{err}</p>}
          <button className="btn-green w-full" disabled={busy}>{busy ? 'Checking...' : 'Log in'}</button>
          <a href="/admin/login" className="block text-center text-xs text-slate-500 underline">Administrator login</a>
        </form>
      </main>
      <Footer dark />
    </div>
  )
}
