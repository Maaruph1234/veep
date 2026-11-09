'use client'
import { useState } from 'react'
import { Header, Footer } from '@/components/Chrome'
import { supabaseBrowser } from '@/lib/supabase/client'
export default function AdminLogin() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    const sb = supabaseBrowser()
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw })
    if (error || !data.user) return setErr('Invalid credentials')
    const { data: p } = await sb.from('profiles').select('role,status').eq('id', data.user.id).maybeSingle()
    if (p?.role !== 'admin' || p.status !== 'active') { await sb.auth.signOut(); return setErr('Invalid credentials') }
    await sb.rpc('log_event', { p_action: 'admin_login' })
    location.href = '/admin'
  }
  return (
    <div className="min-h-screen bg-slate-50"><Header />
      <main className="mx-auto max-w-md px-4 pt-12">
        <form onSubmit={submit} className="card space-y-4 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-navy">Administrator login</h1>
          <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} required />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full">Log in</button>
        </form>
      </main><Footer />
    </div>
  )
}
