import { NextResponse } from 'next/server'
import { createHash, randomBytes, randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabase/server'

const newToken = () => 'VEEP-' + randomBytes(32).toString('base64url')
const hashOf = (t: string) => createHash('sha256').update(t).digest('hex')
const emailOf = (sponsorId: string) => `${sponsorId}@sponsors.veep.local`

async function adminUser() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const { data: p } = await sb.from('profiles').select('role,status').eq('id', user.id).maybeSingle()
  return p?.role === 'admin' && p.status === 'active' ? user : null
}

async function handle(req: Request) {
  const admin = await adminUser()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  const db = supabaseAdmin()
  const log = (action: string, sponsorId: string) =>
    db.from('audit_logs').insert({ actor_id: admin.id, actor_role: 'admin', action, target_type: 'sponsor', target_id: sponsorId })
  const days = Number.isFinite(+b.expires_days) && +b.expires_days > 0 ? Math.min(+b.expires_days, 3650) : null
  const expires = days ? new Date(Date.now() + days * 864e5).toISOString() : null

  if (b.action === 'create') {
    const name = String(b.name || '').trim()
    if (name.length < 2 || name.length > 120) return NextResponse.json({ error: 'Enter a sponsor name' }, { status: 400 })
    const id = randomUUID(), token = newToken()
    const { data: u, error } = await db.auth.admin.createUser({ email: emailOf(id), password: token, email_confirm: true })
    if (error || !u.user) return NextResponse.json({ error: 'Could not create account' }, { status: 500 })
    const uid = u.user.id
    const r1 = await db.from('profiles').insert({ id: uid, full_name: name, role: 'sponsor' })
    const r2 = await db.from('sponsors').insert({ id, user_id: uid, sponsor_name: name })
    const r3 = await db.from('access_tokens').insert({ sponsor_id: id, token_hash: hashOf(token), expires_at: expires })
    if (r1.error || r2.error || r3.error) { await db.auth.admin.deleteUser(uid); return NextResponse.json({ error: 'Could not save sponsor' }, { status: 500 }) }
    await log('create_sponsor', id)
    return NextResponse.json({ token })   // shown once, never stored in plain text
  }

  const { data: sp } = await db.from('sponsors').select('id,user_id,status').eq('id', b.sponsor_id).maybeSingle()
  if (!sp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const revokeAll = () => db.from('access_tokens').update({ revoked_at: new Date().toISOString() }).eq('sponsor_id', sp.id).is('revoked_at', null)

  if (b.action === 'reset') {
    const token = newToken()
    await revokeAll()
    await db.auth.admin.updateUserById(sp.user_id, { password: token })
    await db.from('access_tokens').insert({ sponsor_id: sp.id, token_hash: hashOf(token), expires_at: expires })
    await log('reset_token', sp.id)
    return NextResponse.json({ token })
  }
  if (b.action === 'revoke') {
    await revokeAll()
    await db.auth.admin.updateUserById(sp.user_id, { password: randomBytes(32).toString('hex') })
    await log('revoke_token', sp.id)
    return NextResponse.json({ ok: true })
  }
  if (b.action === 'set_status' && ['active', 'inactive'].includes(b.status)) {
    await db.from('sponsors').update({ status: b.status }).eq('id', sp.id)
    await db.from('profiles').update({ status: b.status }).eq('id', sp.user_id)
    await db.auth.admin.updateUserById(sp.user_id, { ban_duration: b.status === 'inactive' ? '876000h' : 'none' })
    await log(b.status === 'inactive' ? 'deactivate_sponsor' : 'activate_sponsor', sp.id)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Bad request' }, { status: 400 })
}

export async function POST(req: Request) {
  try { return await handle(req) }
  catch (e: any) { return NextResponse.json({ error: 'Server error: ' + (e?.message || 'unknown') }, { status: 500 }) }
}
