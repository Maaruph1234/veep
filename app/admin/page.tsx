import { requireRole } from '@/lib/auth'
import { Header, Footer } from '@/components/Chrome'
import AdminPanel from '@/components/AdminPanel'
export const dynamic = 'force-dynamic'
export default async function Admin() {
  const { name } = await requireRole('admin')
  return (<div className="min-h-screen"><Header who={name} logoutUrl="/admin/login" />
    <main className="mx-auto max-w-7xl px-4 py-6"><AdminPanel /></main><Footer /></div>)
}
