import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
export async function requireRole(role: 'admin' | 'sponsor') {
  const sb = supabaseServer()
  const home = role === 'admin' ? '/admin/login' : '/'
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect(home)
  const { data: p } = await sb.from('profiles').select('full_name, role, status').eq('id', user.id).maybeSingle()
  if (!p || p.role !== role || p.status !== 'active') { await sb.auth.signOut(); redirect(home) }
  return { name: p.full_name as string }
}
