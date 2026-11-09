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
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-md px-4 pt-12">
        <form onSubmit={submit} className="card space-y-4 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-navy">Sponsor login</h1>
          <p className="text-sm text-slate-600">Enter the access token given to you by the Directorate.</p>
          <input className="input" type="password" autoComplete="off" placeholder="Access token" value={token} onChange={e => setToken(e.target.value)} required />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Checking...' : 'Log in'}</button>
          <a href="/admin/login" className="block text-center text-xs text-slate-500 underline">Administrator login</a>
        </form>
      </main>
      <Footer />
    </div>
  )
}
