import { redirect } from 'next/navigation'
import { getMeUser } from '@/utilities/getMeUser'
import { DashboardClient } from './page.client'

export default async function DashboardPage() {
  // Redirect to login if not authenticated
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <DashboardClient user={user} />
}
