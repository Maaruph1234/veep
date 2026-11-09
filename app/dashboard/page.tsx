import { requireRole } from '@/lib/auth'
import { Header, Footer } from '@/components/Chrome'
import Sheet from '@/components/Sheet'
export const dynamic = 'force-dynamic'
export default async function Dashboard() {
  const { name } = await requireRole('sponsor')
  return (<div className="min-h-screen"><Header who={name} />
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-navy">Welcome, {name}</h1>
      <Sheet />
    </main><Footer /></div>)
}
