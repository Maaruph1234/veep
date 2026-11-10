'use client'
import { useState } from 'react'
import { Header, Footer, Tagline } from '@/components/Chrome'
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
    <div className="hero-bg flex min-h-screen flex-col">
      <Header dark />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-10">
        <Tagline />
        <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4 rounded-3xl bg-white p-7 shadow-2xl">
          <span className="block-red text-sm font-bold">Super Administrator</span>
          <h1 className="text-2xl font-extrabold text-navy">Administrator login</h1>
          <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} required />
          {err && <p className="text-sm font-medium text-apcred">{err}</p>}
          <button className="btn-green w-full">Log in</button>
        </form>
      </main>
      <Footer dark />
    </div>
  )
}
