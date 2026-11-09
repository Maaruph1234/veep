import 'server-only'
import { createClient } from '@supabase/supabase-js'
// Service role client. Server only. Bypasses RLS, so use only after checking the caller.
export const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
