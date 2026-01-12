import { getMeUser } from '@/utilities/getMeUser'
import { MyItemsClient } from './page.client'

export default async function MyItemsPage() {
  // Redirect to login if not authenticated
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <MyItemsClient user={user} />
}
