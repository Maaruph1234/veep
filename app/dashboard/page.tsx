import { requireRole } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/server'
import { Header, Footer, Tagline } from '@/components/Chrome'
import Sheet from '@/components/Sheet'
import Onboarding from '@/components/Onboarding'
export const dynamic = 'force-dynamic'
export default async function Dashboard() {
  const { name } = await requireRole('sponsor')
  const sb = supabaseServer()
  const { data: sp } = await sb.from('sponsors').select('sponsor_name, onboarded_at, category_id, sponsor_categories(name, quota)').maybeSingle()
  const cat: any = sp?.sponsor_categories
  if (!sp?.onboarded_at || !cat) {
    const { data: cats } = await sb.from('sponsor_categories').select('id, name, quota').order('sort')
    return (
      <div className="hero-bg flex min-h-screen flex-col">
        <Header dark who={name} />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-10">
          <Tagline />
          <Onboarding categories={cats || []} />
        </main>
        <Footer dark />
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header who={sp.sponsor_name} />
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        <section className="hero-bg rounded-3xl p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm font-semibold text-white/70">{cat.name}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Welcome, {sp.sponsor_name}</h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">Your target is <b>{cat.quota} voters</b>. Add them below. Nobody else can see your records.</p>
        </section>
        <Sheet quota={cat.quota} />
      </main>
      <Footer />
    </div>
  )
}
