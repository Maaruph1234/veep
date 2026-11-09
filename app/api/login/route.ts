import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabase/server'

const fail = () => NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 })

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (token.length < 20 || token.length > 200) return fail()
  const hash = createHash('sha256').update(token).digest('hex')
  const db = supabaseAdmin()
  const { data: t } = await db.from('access_tokens')
    .select('revoked_at, expires_at, sponsors(id, status)').eq('token_hash', hash).maybeSingle()
  const sp: any = t?.sponsors
  const ok = t && !t.revoked_at && (!t.expires_at || new Date(t.expires_at) > new Date()) && sp?.status === 'active'
  if (!ok) return fail()
  // The sponsor's Supabase Auth password IS the token, so the session is a normal Supabase session
  // and every query the sponsor makes is checked by Row Level Security.
  const sb = supabaseServer()
  const { data, error } = await sb.auth.signInWithPassword({ email: `${sp.id}@sponsors.veep.local`, password: token })
  if (error || !data.user) return fail()
  await db.from('audit_logs').insert({ actor_id: data.user.id, actor_role: 'sponsor', action: 'login' })
  return NextResponse.json({ ok: true })
}
