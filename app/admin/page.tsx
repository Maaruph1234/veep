import { requireRole } from '@/lib/auth'
import { Header, Footer } from '@/components/Chrome'
import AdminPanel from '@/components/AdminPanel'
export const dynamic = 'force-dynamic'
export default async function Admin() {
  const { name } = await requireRole('admin')
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header who={name} logoutUrl="/admin/login" />
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        <section className="hero-bg rounded-3xl p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm font-semibold text-white/70">Super Administrator</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Control room</h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">Create sponsors, issue tokens and review activity.</p>
        </section>
        <AdminPanel />
      </main>
      <Footer />
    </div>
  )
}
