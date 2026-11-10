'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import Sheet from './Sheet'
const sb = supabaseBrowser()

export default function AdminPanel() {
  const [tab, setTab] = useState<'sponsors' | 'records' | 'audit'>('sponsors')
  const [sponsors, setSponsors] = useState<any[]>([]); const [audit, setAudit] = useState<any[]>([]); const [stats, setStats] = useState<any>({})
  const [name, setName] = useState(''); const [days, setDays] = useState('180'); const [token, setToken] = useState<{ n: string; t: string } | null>(null); const [msg, setMsg] = useState('')
  const load = useCallback(async () => {
    const s = await sb.rpc('sponsor_overview'); setSponsors(s.data || [])
    const st = await sb.rpc('scope_stats'); setStats(st.data || {})
    const a = await sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100); setAudit(a.data || [])
  }, [])
  useEffect(() => { load() }, [load])
  async function act(body: any, label?: string) {
    setMsg('')
    try {
      const r = await fetch('/api/admin/sponsors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) return setMsg(j.error || `Request failed (${r.status})`)
      if (j.token) setToken({ n: label || body.name, t: j.token })
      setName(''); load()
    } catch { setMsg('Network error. Check your connection and try again.') }
  }
  const sName = (id: string) => sponsors.find(s => s.id === id)?.sponsor_name
  const T = (k: any, l: string) => <button key={k} className={`rounded-full px-5 py-2 text-sm ${tab === k ? 'bg-white font-bold text-navy shadow' : 'font-medium text-white/80 hover:text-white'}`} onClick={() => setTab(k)}>{l}</button>
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Sponsors', sponsors.length], ['Total records', stats.total], ['Male', stats.male], ['Female', stats.female]].map(([t, v]: any) => <div key={t} className="card border-t-4 border-t-green-600 p-4"><div className="text-xs text-slate-500">{t}</div><div className="text-3xl font-extrabold text-navy">{v ?? 0}</div></div>)}
      </div>
      <div className="inline-flex rounded-full bg-navy p-1.5">{T('sponsors', 'Sponsors')}{T('records', 'All records')}{T('audit', 'Audit log')}</div>
      {msg && <p className="text-sm text-apcred">{msg}</p>}
      {token && <div className="card border-green-600 bg-green-50 p-4 text-sm"><p className="font-semibold">Token for {token.n} (shown once, copy it now)</p>
        <code className="mt-2 block break-all rounded bg-white p-2">{token.t}</code>
        <div className="mt-2 flex gap-2"><button className="btn-primary" onClick={() => navigator.clipboard.writeText(token.t)}>Copy</button><button className="btn-ghost" onClick={() => setToken(null)}>Done</button></div></div>}
      {tab === 'sponsors' && <>
        <div className="card flex flex-wrap items-end gap-2 p-4">
          <label className="text-sm">Label (the sponsor enters their own name at first login)<input className="input mt-1" value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="text-sm">Token valid (days, 0 = no expiry)<input className="input mt-1" type="number" min={0} value={days} onChange={e => setDays(e.target.value)} /></label>
          <button className="btn-green" onClick={() => act({ action: 'create', name, expires_days: +days })}>Create sponsor and token</button>
        </div>
        <div className="card overflow-hidden overflow-x-auto"><table className="min-w-[700px] w-full text-sm"><thead><tr className="bg-green-50 text-left text-xs font-bold uppercase text-navy"><th className="p-3">Sponsor</th><th>Status</th><th>Position</th><th>Token</th><th>Progress</th><th>Created</th><th></th></tr></thead>
          <tbody>{sponsors.map(s => <tr key={s.id} className="border-t border-slate-100"><td className="p-3 font-medium">{s.sponsor_name}</td><td>{s.status}</td><td>{s.category || 'Not set up yet'}</td><td>{s.token_active ? 'Active' : 'None'}</td><td>{s.record_count}{s.quota ? ` / ${s.quota}` : ''}</td><td>{s.created_at?.slice(0, 10)}</td>
            <td className="space-x-3 whitespace-nowrap p-3 text-right">
              <button className="text-navy underline" onClick={() => act({ action: 'reset', sponsor_id: s.id, expires_days: +days }, s.sponsor_name)}>New token</button>
              <button className="text-navy underline" onClick={() => confirm('Revoke this sponsor’s token?') && act({ action: 'revoke', sponsor_id: s.id })}>Revoke</button>
              <button className="text-navy underline" onClick={() => act({ action: 'set_status', sponsor_id: s.id, status: s.status === 'active' ? 'inactive' : 'active' })}>{s.status === 'active' ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div></>}
      {tab === 'records' && <Sheet admin />}
      {tab === 'audit' && <div className="card overflow-hidden overflow-x-auto"><table className="min-w-[700px] w-full text-xs"><thead><tr className="bg-green-50 text-left font-bold uppercase text-navy"><th className="p-2">Time</th><th>Role</th><th>Action</th><th>Target</th><th>Sponsor</th></tr></thead>
        <tbody>{audit.map(a => <tr key={a.id} className="border-t border-slate-100"><td className="p-2">{new Date(a.created_at).toLocaleString()}</td><td>{a.actor_role}</td><td>{a.action}</td><td>{a.target_type}</td><td>{sName(a.details?.sponsor_id || a.target_id) || ''}</td></tr>)}</tbody></table></div>}
    </div>
  )
}
