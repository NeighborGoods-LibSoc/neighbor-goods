import { getMeUser } from '@/utilities/getMeUser'
import { RequestClient } from './page.client'

export default async function RequestPage() {
  // Redirect to login if not authenticated
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <RequestClient user={user} />
}
