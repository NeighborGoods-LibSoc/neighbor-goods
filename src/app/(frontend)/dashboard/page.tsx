import { getMeUser } from '@/utilities/getMeUser'
import { DashboardClient } from './page.client'

type Args = {
  searchParams: Promise<{
    deleted?: string
  }>
}

export default async function DashboardPage({ searchParams: searchParamsPromise }: Args) {
  const { deleted } = await searchParamsPromise
  const showDeletedMessage = deleted === 'true'

  // Redirect to login if not authenticated
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <DashboardClient user={user} showDeletedMessage={showDeletedMessage} />
}
