'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function Onboarding({ categories }: { categories: { id: number; name: string; quota: number }[] }) {
  const router = useRouter()
  const [cat, setCat] = useState(''); const [name, setName] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function go(e: React.FormEvent) {
    e.preventDefault()
    if (!cat) return setErr('Choose your position')
    if (name.trim().length < 2) return setErr('Enter your full name')
    setBusy(true); setErr('')
    const { error } = await supabaseBrowser().rpc('complete_onboarding', { p_name: name.trim(), p_category: +cat })
    if (error) { setErr(error.message); setBusy(false) } else router.refresh()
  }
  return (
    <form onSubmit={go} className="mx-auto w-full max-w-md space-y-4 rounded-3xl bg-white p-7 shadow-2xl">
      <h1 className="text-2xl font-extrabold text-navy">Welcome</h1>
      <p className="text-sm text-slate-600">Tell us who you are. This is a one-time step, and it sets how many voters you will record.</p>
      <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">Your position</span>
        <select className="input" value={cat} onChange={e => setCat(e.target.value)} required>
          <option value="">Select position</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></label>
      <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">Your full name</span>
        <input className="input" maxLength={120} value={name} onChange={e => setName(e.target.value)} required /></label>
      {err && <p className="text-sm font-medium text-apcred">{err}</p>}
      <button className="btn-green w-full" disabled={busy}>{busy ? 'Saving...' : 'Continue'}</button>
    </form>
  )
}
