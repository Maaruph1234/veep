'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

const sb = supabaseBrowser()
const GENDERS = ['Male', 'Female', 'Prefer not to say']
const DIS = ['Person with Disability', 'Non-disabled', 'Prefer not to say']
const PAGE = 25
const okDob = (d: string) => { const t = new Date(d), m = new Date(); m.setFullYear(m.getFullYear() - 18); return !isNaN(+t) && t <= m && t.getFullYear() >= 1900 }

function useOpts(table: string, col: string | null, parent: string) {
  const [o, setO] = useState<any[]>([])
  useEffect(() => {
    let on = true
    if (col && !parent) { setO([]); return }
    let q = sb.from(table).select('*').order('name').limit(1000)
    if (col) q = q.eq(col, parent)
    q.then(r => { if (on) setO(r.data || []) })
    return () => { on = false }
  }, [table, col, parent])
  return o
}

function RecordForm({ initial, onClose, onSaved }: { initial?: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>(initial ? { ...initial } : { full_name: '', lga_id: '', ward_id: '', polling_unit_id: '', gender: '', disability_status: '', date_of_birth: '', consent: false })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const lgas = useOpts('local_governments', null, ''), wards = useOpts('wards', 'lga_id', f.lga_id), pus = useOpts('polling_units', 'ward_id', f.ward_id)
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))
  const code = pus.find(p => p.id === f.polling_unit_id)?.delimitation_code || ''
  async function save() {
    if (f.full_name.trim().length < 2) return setErr('Enter the full name')
    if (!f.lga_id || !f.ward_id || !f.polling_unit_id) return setErr('Select LGA, ward and polling unit')
    if (!f.gender || !f.disability_status) return setErr('Select gender and disability status')
    if (!f.date_of_birth || !okDob(f.date_of_birth)) return setErr('Enter a valid date of birth (18 or older)')
    if (!f.consent) return setErr('Consent must be confirmed')
    setBusy(true); setErr('')
    const row = { full_name: f.full_name.trim(), lga_id: f.lga_id, ward_id: f.ward_id, polling_unit_id: f.polling_unit_id, gender: f.gender, disability_status: f.disability_status, date_of_birth: f.date_of_birth, consent_recorded: true }
    const { error } = initial ? await sb.from('supporter_records').update(row).eq('id', initial.id) : await sb.from('supporter_records').insert(row)
    if (error) { setErr(error.message); setBusy(false) } else { onSaved(); onClose() }
  }
  const L = ({ t, children }: any) => <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">{t}</span>{children}</label>
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="card w-full max-w-lg space-y-3 p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-navy">{initial ? 'Edit record' : 'Add record'}</h2>
        <L t="Full name"><input className="input" maxLength={150} value={f.full_name} onChange={e => set('full_name', e.target.value)} /></L>
        <L t="Local Government Area"><select className="input" value={f.lga_id} onChange={e => setF({ ...f, lga_id: e.target.value, ward_id: '', polling_unit_id: '' })}><option value="">Select</option>{lgas.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></L>
        <L t="Ward"><select className="input" value={f.ward_id} disabled={!f.lga_id} onChange={e => setF({ ...f, ward_id: e.target.value, polling_unit_id: '' })}><option value="">Select</option>{wards.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></L>
        <L t="Polling Unit"><select className="input" value={f.polling_unit_id} disabled={!f.ward_id} onChange={e => set('polling_unit_id', e.target.value)}><option value="">Select</option>{pus.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></L>
        <L t="Delimitation Code"><input className="input bg-slate-50" readOnly value={code || initial?.delimitation_code || ''} /></L>
        <div className="grid grid-cols-2 gap-3">
          <L t="Gender"><select className="input" value={f.gender} onChange={e => set('gender', e.target.value)}><option value="">Select</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</select></L>
          <L t="Disability status"><select className="input" value={f.disability_status} onChange={e => set('disability_status', e.target.value)}><option value="">Select</option>{DIS.map(g => <option key={g}>{g}</option>)}</select></L>
        </div>
        <L t="Date of birth"><input className="input" type="date" value={f.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></L>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.consent} onChange={e => set('consent', e.target.checked)} className="mt-1" />
          <span>This person gave this information voluntarily and agreed to its use after seeing the <a className="underline" href="/privacy" target="_blank">privacy notice</a>.</span></label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-green" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</button></div>
      </div>
    </div>
  )
}

function Cell({ r, field, type, opts, reload, setMsg }: any) {
  const [on, setOn] = useState(false); const [v, setV] = useState(r[field])
  async function commit(val: string) {
    setOn(false)
    if (val === r[field]) return
    if (field === 'full_name' && val.trim().length < 2) return setMsg('Name is too short')
    if (field === 'date_of_birth' && !okDob(val)) return setMsg('Invalid date of birth')
    const { error } = await sb.from('supporter_records').update({ [field]: val }).eq('id', r.id)
    if (error) setMsg(error.message); reload()
  }
  if (!on) return <span className="block min-h-[1.5rem] cursor-text" onClick={() => { setV(r[field]); setOn(true) }}>{r[field]}</span>
  if (opts) return <select autoFocus className="input py-1" value={v} onChange={e => commit(e.target.value)} onBlur={() => setOn(false)}>{opts.map((o: string) => <option key={o}>{o}</option>)}</select>
  return <input autoFocus className="input py-1" type={type} value={v} onChange={e => setV(e.target.value)} onBlur={() => commit(v)} onKeyDown={e => { if (e.key === 'Enter') commit(v); if (e.key === 'Escape') setOn(false) }} />
}

export default function Sheet({ admin = false }: { admin?: boolean }) {
  const [rows, setRows] = useState<any[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(0)
  const [sort, setSort] = useState({ col: 'created_at', asc: false })
  const [f, setF] = useState({ q: '', lga: '', ward: '', pu: '', gender: '', dis: '' })
  const [stats, setStats] = useState<any>({}); const [form, setForm] = useState<any>(null); const [msg, setMsg] = useState('')
  const lgas = useOpts('local_governments', null, ''), wards = useOpts('wards', 'lga_id', f.lga), pus = useOpts('polling_units', 'ward_id', f.ward)

  const query = useCallback(() => {
    let q = sb.from('supporter_records').select('*, local_governments(name), wards(name), polling_units(name), sponsors(sponsor_name)', { count: 'exact' })
    if (f.q.trim()) q = q.ilike('full_name', `%${f.q.trim().replace(/[%_,()]/g, ' ')}%`)
    if (f.lga) q = q.eq('lga_id', f.lga); if (f.ward) q = q.eq('ward_id', f.ward); if (f.pu) q = q.eq('polling_unit_id', f.pu)
    if (f.gender) q = q.eq('gender', f.gender); if (f.dis) q = q.eq('disability_status', f.dis)
    return q
  }, [f])
  const load = useCallback(async () => {
    const { data, count, error } = await query().order(sort.col, { ascending: sort.asc }).range(page * PAGE, page * PAGE + PAGE - 1)
    if (error) setMsg(error.message); else { setRows(data || []); setTotal(count || 0) }
    const s = await sb.rpc('scope_stats'); if (s.data) setStats(s.data)
  }, [query, sort, page])
  useEffect(() => { load() }, [load])
  const flt = (k: string, v: string) => { setPage(0); setF(p => ({ ...p, [k]: v, ...(k === 'lga' ? { ward: '', pu: '' } : {}), ...(k === 'ward' ? { pu: '' } : {}) })) }
  const th = (label: string, col?: string) => <th key={label} className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-600">
    {col ? <button onClick={() => setSort(s => ({ col, asc: s.col === col ? !s.asc : true }))}>{label}{sort.col === col ? (sort.asc ? ' ▲' : ' ▼') : ''}</button> : label}</th>

  async function del(r: any) {
    if (!confirm(`Delete the record for ${r.full_name}? This cannot be undone.`)) return
    const { error } = await sb.from('supporter_records').delete().eq('id', r.id)
    if (error) setMsg(error.message); load()
  }
  async function exportAs(kind: 'csv' | 'xlsx') {
    setMsg('Preparing export...')
    let all: any[] = []
    for (let i = 0; ; i += 1000) {
      const { data, error } = await query().order('created_at').range(i, i + 999)
      if (error) return setMsg(error.message)
      all = all.concat(data || []); if (!data || data.length < 1000) break
    }
    await sb.rpc('log_event', { p_action: 'export', p_details: { format: kind, rows: all.length } })
    const safe = (v: any) => { const s = String(v ?? ''); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s }
    const head = [...(admin ? ['Sponsor'] : []), 'S/N', 'Full Name', 'Local Government Area', 'Ward', 'Polling Unit', 'Delimitation Code', 'Gender', 'Disability Status', 'Date of Birth', 'Date Added']
    const data = all.map((r, i) => [...(admin ? [r.sponsors?.sponsor_name] : []), i + 1, r.full_name, r.local_governments?.name, r.wards?.name, r.polling_units?.name, r.delimitation_code, r.gender, r.disability_status, r.date_of_birth, r.created_at?.slice(0, 10)].map(safe))
    if (kind === 'csv') {
      const csv = [head, ...data].map(a => a.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' })); a.download = 'veep-records.csv'; a.click()
    } else {
      const X = await import('xlsx'); const ws = X.utils.aoa_to_sheet([head, ...data]); const wb = X.utils.book_new()
      X.utils.book_append_sheet(wb, ws, 'Records'); X.writeFile(wb, 'veep-records.xlsx')
    }
    setMsg('')
  }
  const card = (t: string, v: any) => <div key={t} className="card border-l-4 border-l-green-600 p-3"><div className="text-xs text-slate-500">{t}</div><div className="text-2xl font-semibold text-navy">{v ?? 0}</div></div>
  const pages = Math.max(1, Math.ceil(total / PAGE))
  return (
    <div className="space-y-4">
      {!admin && <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{card('Total records', stats.total)}{card('Male', stats.male)}{card('Female', stats.female)}{card('With disability', stats.pwd)}{card('Without disability', stats.non_pwd)}</div>}
      <div className="flex flex-wrap items-center gap-2">
        {!admin && <button className="btn-green" onClick={() => setForm({})}>+ Add new record</button>}
        <input className="input max-w-xs" placeholder="Search by name" value={f.q} onChange={e => flt('q', e.target.value)} />
        <button className="btn-ghost" onClick={() => exportAs('xlsx')}>Export Excel</button>
        <button className="btn-ghost" onClick={() => exportAs('csv')}>Export CSV</button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <select className="input" value={f.lga} onChange={e => flt('lga', e.target.value)}><option value="">All LGAs</option>{lgas.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <select className="input" value={f.ward} disabled={!f.lga} onChange={e => flt('ward', e.target.value)}><option value="">All wards</option>{wards.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <select className="input" value={f.pu} disabled={!f.ward} onChange={e => flt('pu', e.target.value)}><option value="">All polling units</option>{pus.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <select className="input" value={f.gender} onChange={e => flt('gender', e.target.value)}><option value="">All genders</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</select>
        <select className="input" value={f.dis} onChange={e => flt('dis', e.target.value)}><option value="">All disability status</option>{DIS.map(g => <option key={g}>{g}</option>)}</select>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <div className="card overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm">
          <thead><tr>{[...(admin ? [th('Sponsor')] : []), th('S/N'), th('Full Name', 'full_name'), th('LGA'), th('Ward'), th('Polling Unit'), th('Delim. Code', 'delimitation_code'), th('Gender', 'gender'), th('Disability Status', 'disability_status'), th('Date of Birth', 'date_of_birth'), th('Date Added', 'created_at'), th('')]}</tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.id} className="border-b border-slate-100 hover:bg-green-50/50">
              {admin && <td className="px-3 py-2">{r.sponsors?.sponsor_name}</td>}
              <td className="px-3 py-2 text-slate-500">{page * PAGE + i + 1}</td>
              <td className="px-3 py-2"><Cell r={r} field="full_name" type="text" reload={load} setMsg={setMsg} /></td>
              <td className="px-3 py-2">{r.local_governments?.name}</td><td className="px-3 py-2">{r.wards?.name}</td><td className="px-3 py-2">{r.polling_units?.name}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.delimitation_code}</td>
              <td className="px-3 py-2"><Cell r={r} field="gender" opts={GENDERS} reload={load} setMsg={setMsg} /></td>
              <td className="px-3 py-2"><Cell r={r} field="disability_status" opts={DIS} reload={load} setMsg={setMsg} /></td>
              <td className="px-3 py-2"><Cell r={r} field="date_of_birth" type="date" reload={load} setMsg={setMsg} /></td>
              <td className="px-3 py-2 text-slate-500">{r.created_at?.slice(0, 10)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right"><button className="mr-3 text-navy underline" onClick={() => setForm(r)}>Edit</button><button className="text-red-600 underline" onClick={() => del(r)}>Delete</button></td>
            </tr>))}
            {!rows.length && <tr><td colSpan={12} className="px-3 py-8 text-center text-slate-500">No records yet</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>{total} records</span>
        <div className="flex items-center gap-2"><button className="btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} of {pages}</span><button className="btn-ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</button></div>
      </div>
      {form && <RecordForm initial={form.id ? form : undefined} onClose={() => setForm(null)} onSaved={load} />}
    </div>
  )
}
